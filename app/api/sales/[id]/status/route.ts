import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user role - try profiles first, fallback to registered_customers
    let userRole = null
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, role:roles(*)')
      .eq('id', user.id)
      .single()

    if (profile) {
      userRole = profile.role?.name
    } else {
      // Check if user is a registered customer
      const { data: regCustomer } = await supabase
        .from('registered_customers')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (regCustomer) {
        userRole = 'customer'
      }
    }

    if (!['admin', 'manager'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Admin or Manager access required' }, { status: 403 })
    }

    const { status } = await request.json()
    const { id: saleId } = await params

    if (!status || !['pending', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // Update the sale status
    const { data: updatedSale, error: updateError } = await serviceClient
      .from('sales')
      .update({ status })
      .eq('id', saleId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating sale status:', updateError)
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
    }

    // If approving (status = completed), we might want to do additional processing
    // For now, just update the status

    return NextResponse.json({
      sale: updatedSale,
      message: `Order ${status === 'completed' ? 'approved' : 'rejected'} successfully`
    })

  } catch (error) {
    console.error('Update sale status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}