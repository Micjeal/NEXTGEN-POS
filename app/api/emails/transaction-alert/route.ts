import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { emailService } from '@/lib/email/service'

// POST /api/emails/transaction-alert - Send transaction alerts to staff
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { saleId } = await request.json()

    if (!saleId) {
      return NextResponse.json({ error: 'Sale ID is required' }, { status: 400 })
    }

    // Get sale details
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select(`
        *,
        customer:customers(*),
        items:sale_items(*, product:products(*)),
        payments(*, payment_method:payment_methods(*)),
        user:profiles!sales_user_id_fkey(full_name)
      `)
      .eq('id', saleId)
      .single()

    if (saleError || !sale) {
      console.error('Error fetching sale:', saleError)
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    // Get staff who have transaction alerts enabled
    const { data: staff, error: staffError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        email_settings!inner(enabled)
      `)
      .eq('email_settings.email_type', 'transaction_alert')
      .eq('email_settings.enabled', true)

    if (staffError) {
      console.error('Error fetching staff:', staffError)
      return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
    }

    if (!staff || staff.length === 0) {
      return NextResponse.json({ message: 'No staff have transaction alert notifications enabled' })
    }

    // Get transaction alert template
    console.log('Fetching transaction alert templates...')
    const templates = await emailService.getTemplatesByCategory('alerts')
    console.log('Found alert templates:', templates.map(t => t.name))
    const alertTemplate = templates.find(t => t.name === 'Transaction Alert')
    console.log('Transaction alert template found:', !!alertTemplate)

    if (!alertTemplate) {
      console.error('Transaction alert template not found in DB')
      return NextResponse.json({ error: 'Transaction alert template not found' }, { status: 500 })
    }

    // Format items for template
    const itemsList = sale.items?.map(item =>
      `${item.product_name} x${item.quantity} - $${item.line_total?.toFixed(2)}`
    ).join('\n') || ''

    let sentCount = 0
    let failedCount = 0

    // Send alerts to each staff member
    for (const staffMember of staff) {
      const variables = {
        staff_name: staffMember.full_name,
        invoice_number: sale.invoice_number,
        transaction_date: new Date(sale.created_at).toLocaleDateString(),
        customer_name: sale.customer?.full_name || 'Walk-in Customer',
        items: itemsList,
        subtotal: sale.subtotal.toFixed(2),
        tax_amount: sale.tax_amount.toFixed(2),
        discount_amount: sale.discount_amount?.toFixed(2) || '0.00',
        total: sale.total.toFixed(2),
        payment_method: sale.payments?.[0]?.payment_method?.name || 'Unknown',
        cashier_name: sale.user?.full_name || 'Unknown'
      }

      const result = await emailService.sendEmail(
        alertTemplate.id,
        staffMember.email,
        staffMember.full_name,
        variables
      )

      if (result.success) {
        sentCount++
      } else {
        failedCount++
        console.error(`Failed to send transaction alert to ${staffMember.email}:`, result.error)
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      total_staff: staff.length
    })
  } catch (error) {
    console.error('Transaction alert error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}