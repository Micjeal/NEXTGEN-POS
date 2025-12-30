import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { emailService } from '@/lib/email/service'

// POST /api/emails/transaction-receipt - Send transaction receipt to customer
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

    // Get sale details with customer and items
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select(`
        *,
        customer:customers(*),
        items:sale_items(*, product:products(*)),
        payments(*, payment_method:payment_methods(*))
      `)
      .eq('id', saleId)
      .single()

    if (saleError || !sale) {
      console.error('Error fetching sale:', saleError)
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    // Only send receipt if customer has email
    if (!sale.customer?.email) {
      return NextResponse.json({ message: 'Customer has no email address' })
    }

    // Get transaction receipt template
    console.log('Fetching transaction receipt templates...')
    const templates = await emailService.getTemplatesByCategory('receipts')
    console.log('Found receipt templates:', templates.map(t => t.name))
    const receiptTemplate = templates.find(t => t.name === 'Transaction Receipt')
    console.log('Receipt template found:', !!receiptTemplate)

    if (!receiptTemplate) {
      console.error('Transaction receipt template not found in DB')
      return NextResponse.json({ error: 'Transaction receipt template not found' }, { status: 500 })
    }

    // Format items for template
    const itemsList = sale.items?.map(item =>
      `${item.product_name} x${item.quantity} - $${item.line_total?.toFixed(2)}`
    ).join('\n') || ''

    const variables = {
      customer_name: sale.customer.full_name,
      invoice_number: sale.invoice_number,
      transaction_date: new Date(sale.created_at).toLocaleDateString(),
      items: itemsList,
      subtotal: sale.subtotal.toFixed(2),
      tax_amount: sale.tax_amount.toFixed(2),
      discount_amount: sale.discount_amount?.toFixed(2) || '0.00',
      total: sale.total.toFixed(2),
      payment_method: sale.payments?.[0]?.payment_method?.name || 'Unknown',
      store_name: 'SMMS POS System',
      store_address: 'Your Store Address',
      store_phone: 'Your Store Phone'
    }

    const result = await emailService.sendEmail(
      receiptTemplate.id,
      sale.customer.email,
      sale.customer.full_name,
      variables
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Transaction receipt sent successfully'
      })
    } else {
      console.error('Failed to send receipt:', result.error)
      return NextResponse.json({
        error: 'Failed to send receipt',
        details: result.error
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Transaction receipt error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}