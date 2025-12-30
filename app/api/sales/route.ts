import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// GET /api/sales - Get sales data with optional limit
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, role:roles(*)')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role?.name
    if (!['admin', 'manager'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Admin or Manager access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '1000')

    const serviceClient = createServiceClient()
    const { data: sales, error } = await serviceClient
      .from('sales')
      .select(`
        *,
        profile:profiles(id, full_name),
        customer:customers(id, full_name, phone),
        items:sale_items(
          id,
          product_name,
          quantity,
          unit_price,
          line_total
        ),
        payments(
          id,
          amount,
          payment_method:payment_methods(name)
        )
      `)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching sales:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ sales: sales || [] })
  } catch (error) {
    console.error('Get sales error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}