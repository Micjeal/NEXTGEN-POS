import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { emailService } from '@/lib/email/service'

// POST /api/emails/customer-welcome - Send welcome email to new customer
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { customerId } = await request.json()

    if (!customerId) {
      return NextResponse.json({
        error: 'Customer ID is required'
      }, { status: 400 })
    }

    // Get customer details
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single()

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    if (!customer.email) {
      return NextResponse.json({ message: 'Customer has no email address' })
    }

    // Get welcome email template
    const templates = await emailService.getTemplatesByCategory('welcome')
    const welcomeTemplate = templates.find(t => t.name === 'Customer Welcome')

    if (!welcomeTemplate) {
      return NextResponse.json({ error: 'Customer welcome template not found' }, { status: 500 })
    }

    // Get store name from environment or default
    const storeName = process.env.STORE_NAME || 'SMMS Supermarket'

    const variables = {
      store_name: storeName,
      customer_name: customer.full_name,
      customer_phone: customer.phone || 'N/A',
      membership_tier: customer.membership_tier
    }

    const result = await emailService.sendEmail(
      welcomeTemplate.id,
      customer.email,
      customer.full_name,
      variables
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        customer: customer.full_name
      })
    } else {
      return NextResponse.json({
        error: result.error
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Customer welcome email error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}