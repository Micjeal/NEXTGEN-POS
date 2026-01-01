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

    // Get user profile
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get customer data
    const { data: customer, error: customerError } = await serviceClient
      .from('customers')
      .select('*')
      .eq('id', user.id)
      .single()

    if (customerError) {
      console.error('Error fetching customer:', customerError)
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 })
    }

    return NextResponse.json({
      profile,
      customer
    })

  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}