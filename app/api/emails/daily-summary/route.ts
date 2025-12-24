import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { emailService } from '@/lib/email/service'
import { format } from 'date-fns'

// POST /api/emails/daily-summary - Send daily sales summary to managers
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get date parameter or default to yesterday
    const { date } = await request.json()
    const targetDate = date ? new Date(date) : new Date()
    targetDate.setDate(targetDate.getDate() - 1) // Yesterday by default

    const dateStr = format(targetDate, 'yyyy-MM-dd')
    const displayDate = format(targetDate, 'PPP')

    // Get sales data for the target date
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select(`
        *,
        profiles:user_id (
          full_name
        ),
        sale_items (
          quantity,
          products (
            name
          )
        )
      `)
      .gte('created_at', `${dateStr}T00:00:00.000Z`)
      .lt('created_at', `${dateStr}T23:59:59.999Z`)
      .eq('status', 'completed')

    if (salesError) {
      console.error('Error fetching sales:', salesError)
      return NextResponse.json({ error: 'Failed to fetch sales data' }, { status: 500 })
    }

    if (!sales || sales.length === 0) {
      return NextResponse.json({ message: 'No sales data for the specified date' })
    }

    // Calculate summary statistics
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0)
    const transactionCount = sales.length
    const averageTransaction = totalSales / transactionCount

    // Find top product
    const productCounts: Record<string, number> = {}
    sales.forEach(sale => {
      sale.sale_items?.forEach((item: any) => {
        const productName = item.products?.name || 'Unknown'
        productCounts[productName] = (productCounts[productName] || 0) + item.quantity
      })
    })

    const topProduct = Object.entries(productCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'

    // Calculate cashier performance
    const cashierSales: Record<string, { total: number; count: number }> = {}
    sales.forEach(sale => {
      const cashierName = sale.profiles?.full_name || 'Unknown'
      if (!cashierSales[cashierName]) {
        cashierSales[cashierName] = { total: 0, count: 0 }
      }
      cashierSales[cashierName].total += sale.total
      cashierSales[cashierName].count += 1
    })

    const cashierPerformance = Object.entries(cashierSales)
      .map(([name, data]) => `${name}: UGX ${data.total.toLocaleString()} (${data.count} transactions)`)
      .join('\n')

    // Get managers who have daily sales alerts enabled
    const { data: managers, error: managersError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('role_id', (
        supabase.from('roles').select('id').eq('name', 'manager').single()
      ))

    if (managersError) {
      console.error('Error fetching managers:', managersError)
      return NextResponse.json({ error: 'Failed to fetch managers' }, { status: 500 })
    }

    // Get daily summary template
    const templates = await emailService.getTemplatesByCategory('reports')
    const summaryTemplate = templates.find(t => t.name === 'Daily Sales Summary')

    if (!summaryTemplate) {
      return NextResponse.json({ error: 'Daily sales summary template not found' }, { status: 500 })
    }

    let sentCount = 0
    let failedCount = 0

    // Send summary to each manager
    for (const manager of managers || []) {
      const variables = {
        date: displayDate,
        total_sales: totalSales.toLocaleString(),
        transaction_count: transactionCount,
        average_transaction: averageTransaction.toLocaleString(),
        top_product: topProduct,
        cashier_performance: cashierPerformance
      }

      const result = await emailService.sendEmail(
        summaryTemplate.id,
        manager.email,
        manager.full_name,
        variables
      )

      if (result.success) {
        sentCount++
      } else {
        failedCount++
        console.error(`Failed to send daily summary to ${manager.email}:`, result.error)
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      date: displayDate,
      summary: {
        totalSales,
        transactionCount,
        averageTransaction,
        topProduct
      }
    })
  } catch (error) {
    console.error('Daily summary error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}