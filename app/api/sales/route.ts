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
    const isAdminOrManager = ['admin', 'manager'].includes(userRole || '')
    const isCashier = userRole === 'cashier'

    if (!isAdminOrManager && !isCashier) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '1000')
    const orderType = searchParams.get('order_type')
    const status = searchParams.get('status')

    const serviceClient = createServiceClient()
    // First get the sales data
    let query = serviceClient
      .from('sales')
      .select(`
        *,
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
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filter by status if specified, otherwise default to completed
    if (status) {
      query = query.eq('status', status)
    } else {
      query = query.eq('status', 'completed')
    }

    // Filter by order type if specified
    if (orderType) {
      query = query.eq('order_type', orderType)
    }

    // For cashiers, only show their own sales
    if (isCashier) {
      query = query.eq('user_id', user.id)
    }

    const { data: salesData, error: salesError } = await query

    if (salesError) {
      console.error('Error fetching sales:', salesError)
      return NextResponse.json({ error: salesError.message }, { status: 500 })
    }

    // Get unique user IDs from sales
    const userIds = [...new Set((salesData || []).map(sale => sale.user_id).filter(Boolean))]

    // Fetch profiles for these users (for admin/staff users)
    let profiles: Record<string, { id: string; full_name: string }> = {}
    if (userIds.length > 0) {
      const { data: profilesData } = await serviceClient
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds)

      if (profilesData) {
        profiles = profilesData.reduce((acc, userProfile) => {
          acc[userProfile.id] = userProfile
          return acc
        }, {} as Record<string, { id: string; full_name: string }>)
      }

      // For users without profiles (customers), try to get from registered_customers
      const profileLessUsers = userIds.filter(id => !profiles[id])
      if (profileLessUsers.length > 0) {
        const { data: regCustomers } = await serviceClient
          .from('registered_customers')
          .select('user_id, full_name')
          .in('user_id', profileLessUsers)

        if (regCustomers) {
          regCustomers.forEach(regCustomer => {
            profiles[regCustomer.user_id] = {
              id: regCustomer.user_id,
              full_name: regCustomer.full_name
            }
          })
        }
      }
    }

    // Combine sales with profile data
    const sales = (salesData || []).map(sale => ({
      ...sale,
      profile: profiles[sale.user_id] || null
    }))


    return NextResponse.json({ sales: sales || [] })
  } catch (error) {
    console.error('Get sales error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}