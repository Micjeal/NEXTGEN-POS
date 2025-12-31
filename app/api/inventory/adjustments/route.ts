import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/inventory/adjustments - Get inventory adjustment history
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user role
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
    const productId = searchParams.get('product_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('inventory_adjustments')
      .select(`
        *,
        product:products(name, barcode),
        user:profiles(full_name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (productId) {
      query = query.eq('product_id', productId)
    }

    const { data: adjustments, error } = await query

    if (error) {
      console.error('Error fetching inventory adjustments:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ adjustments: adjustments || [] })
  } catch (error) {
    console.error('Get inventory adjustments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}