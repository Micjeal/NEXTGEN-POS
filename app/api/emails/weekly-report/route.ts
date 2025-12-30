import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { emailService } from '@/lib/email/service'

// POST /api/emails/weekly-report - Send weekly business performance reports
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // For cron jobs, allow without user auth (check for service role or special header)
    const authHeader = request.headers.get('authorization')
    const isCronJob = authHeader?.includes('service_role') || request.headers.get('x-cron-job') === 'true'

    if (!isCronJob) {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Calculate date range for the past week
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 7)

    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    // Get sales data for the past week
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select(`
        *,
        items:sale_items(*),
        customer:customers(*)
      `)
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr)
      .eq('status', 'completed')

    if (salesError) {
      console.error('Error fetching sales data:', salesError)
      return NextResponse.json({ error: 'Failed to fetch sales data' }, { status: 500 })
    }

    // Calculate metrics
    const totalSales = sales?.length || 0
    const totalRevenue = sales?.reduce((sum, sale) => sum + sale.total, 0) || 0
    const totalItems = sales?.reduce((sum, sale) => sum + (sale.items?.length || 0), 0) || 0
    const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0

    // Get top products
    const productSales = new Map()
    sales?.forEach(sale => {
      sale.items?.forEach(item => {
        const key = item.product_name
        const current = productSales.get(key) || { quantity: 0, revenue: 0 }
        productSales.set(key, {
          quantity: current.quantity + item.quantity,
          revenue: current.revenue + item.line_total
        })
      })
    })

    const topProducts = Array.from(productSales.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([name, data]) => `${name}: ${data.quantity} units ($${data.revenue.toFixed(2)})`)

    // Get managers who have weekly reports enabled
    const { data: managers, error: managersError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        email_settings!inner(enabled)
      `)
      .eq('email_settings.email_type', 'weekly_report')
      .eq('email_settings.enabled', true)
      .eq('role_id', (
        supabase.from('roles').select('id').eq('name', 'manager').single()
      ))

    if (managersError) {
      console.error('Error fetching managers:', managersError)
      return NextResponse.json({ error: 'Failed to fetch managers' }, { status: 500 })
    }

    if (!managers || managers.length === 0) {
      return NextResponse.json({ message: 'No managers have weekly report notifications enabled' })
    }

    // Get weekly report template
    console.log('Fetching weekly report templates...')
    const templates = await emailService.getTemplatesByCategory('reports')
    console.log('Found report templates:', templates.map(t => t.name))
    const weeklyReportTemplate = templates.find(t => t.name === 'Weekly Business Report')
    console.log('Weekly report template found:', !!weeklyReportTemplate)

    if (!weeklyReportTemplate) {
      console.error('Weekly business report template not found in DB')
      return NextResponse.json({ error: 'Weekly business report template not found' }, { status: 500 })
    }

    let sentCount = 0
    let failedCount = 0

    // Send reports to each manager
    for (const manager of managers) {
      const variables = {
        manager_name: manager.full_name,
        report_period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        total_sales: totalSales.toString(),
        total_revenue: totalRevenue.toFixed(2),
        total_items: totalItems.toString(),
        average_sale: averageSale.toFixed(2),
        top_products: topProducts.join('\n'),
        report_date: new Date().toLocaleDateString()
      }

      const result = await emailService.sendEmail(
        weeklyReportTemplate.id,
        manager.email,
        manager.full_name,
        variables
      )

      if (result.success) {
        sentCount++
      } else {
        failedCount++
        console.error(`Failed to send weekly report to ${manager.email}:`, result.error)
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      period: `${startDateStr} to ${endDateStr}`,
      metrics: {
        total_sales: totalSales,
        total_revenue: totalRevenue,
        total_items: totalItems,
        average_sale: averageSale
      }
    })
  } catch (error) {
    console.error('Weekly report error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}