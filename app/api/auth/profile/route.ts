import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = createServiceClient()

    // Get user profile (for admin/staff users)
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Get registered customer data
    const { data: registeredCustomer, error: regError } = await serviceClient
      .from('registered_customers')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (regError && profileError) {
      console.error('Error fetching profile:', profileError)
      console.error('Error fetching registered customer:', regError)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    let customer = null
    if (!regError && registeredCustomer) {
      // Get or create customer record
      let { data: customerData, error: customerError } = await serviceClient
        .from('customers')
        .select('*')
        .eq('registered_customer_id', registeredCustomer.id)
        .single()

      if (customerError && customerError.code === 'PGRST116') { // Not found
        // Create customer record if it doesn't exist
        const { data: newCustomer, error: createError } = await serviceClient
          .from('customers')
          .insert({
            phone: registeredCustomer.phone,
            email: registeredCustomer.email,
            full_name: registeredCustomer.full_name,
            date_of_birth: registeredCustomer.date_of_birth,
            gender: registeredCustomer.gender,
            address: registeredCustomer.address,
            city: registeredCustomer.city,
            country: registeredCustomer.country,
            registered_customer_id: registeredCustomer.id,
            first_visit_date: new Date().toISOString(),
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating customer:', createError)
          return NextResponse.json({ error: 'Failed to create customer profile' }, { status: 500 })
        }
        customerData = newCustomer
      } else if (customerError) {
        console.error('Error fetching customer:', customerError)
        return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 })
      }
      customer = customerData
    }

    return NextResponse.json({
      profile: profile || null,
      customer
    })

  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}