import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { emailService } from '@/lib/email/service'
import { format } from 'date-fns'

// POST /api/emails/birthday-greeting - Send birthday greetings to customers
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get date parameter or default to today
    const { date } = await request.json()
    const targetDate = date ? new Date(date) : new Date()

    const month = targetDate.getMonth() + 1 // JavaScript months are 0-indexed
    const day = targetDate.getDate()

    // Find customers with birthdays today
    const { data: birthdayCustomers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .not('email', 'is', null)
      .not('date_of_birth', 'is', null)
      .eq('is_active', true)

    if (customersError) {
      console.error('Error fetching customers:', customersError)
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
    }

    // Filter customers whose birthday is today
    const todayBirthdays = (birthdayCustomers || []).filter(customer => {
      if (!customer.date_of_birth) return false
      const birthDate = new Date(customer.date_of_birth)
      return birthDate.getMonth() + 1 === month && birthDate.getDate() === day
    })

    if (todayBirthdays.length === 0) {
      return NextResponse.json({ message: 'No customers have birthdays today' })
    }

    // Get birthday greeting template
    const templates = await emailService.getTemplatesByCategory('marketing')
    const birthdayTemplate = templates.find(t => t.name === 'Birthday Greeting')

    if (!birthdayTemplate) {
      return NextResponse.json({ error: 'Birthday greeting template not found' }, { status: 500 })
    }

    // Get store name from environment or default
    const storeName = process.env.STORE_NAME || 'SMMS Supermarket'
    const birthdayDiscount = parseInt(process.env.BIRTHDAY_DISCOUNT || '20')

    let sentCount = 0
    let failedCount = 0

    // Send birthday greetings
    for (const customer of todayBirthdays) {
      const variables = {
        store_name: storeName,
        customer_name: customer.full_name,
        birthday_discount: birthdayDiscount.toString()
      }

      const result = await emailService.sendEmail(
        birthdayTemplate.id,
        customer.email!,
        customer.full_name,
        variables
      )

      if (result.success) {
        sentCount++
      } else {
        failedCount++
        console.error(`Failed to send birthday greeting to ${customer.email}:`, result.error)
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      customers: todayBirthdays.length,
      date: format(targetDate, 'PPP')
    })
  } catch (error) {
    console.error('Birthday greeting error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}