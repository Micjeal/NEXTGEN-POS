import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// POST /api/inventory/adjust - Adjust inventory and check for low stock alerts
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user role - inventory adjustments require manager/admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, role:roles(*)')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role?.name
    if (!['admin', 'manager'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Admin or Manager access required' }, { status: 403 })
    }

    const { product_id, adjustment_type, quantity_change, reason } = await request.json()

    if (!product_id || !adjustment_type || quantity_change === undefined) {
      return NextResponse.json({
        error: 'Product ID, adjustment type, and quantity change are required'
      }, { status: 400 })
    }

    // Validate adjustment type
    const validTypes = ['add', 'remove', 'set', 'sale', 'return', 'manual', 'purchase', 'adjustment']
    if (!validTypes.includes(adjustment_type)) {
      return NextResponse.json({
        error: 'Invalid adjustment type'
      }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // Get current inventory
    const { data: currentInventory, error: inventoryError } = await serviceClient
      .from('inventory')
      .select('*')
      .eq('product_id', product_id)
      .single()

    if (inventoryError || !currentInventory) {
      return NextResponse.json({ error: 'Product inventory not found' }, { status: 404 })
    }

    const quantityBefore = currentInventory.quantity
    let quantityAfter: number

    // Calculate new quantity
    switch (adjustment_type) {
      case 'add':
      case 'purchase':
      case 'return':
        quantityAfter = quantityBefore + Math.abs(quantity_change)
        break
      case 'remove':
      case 'sale':
        quantityAfter = Math.max(0, quantityBefore - Math.abs(quantity_change))
        break
      case 'set':
      case 'manual':
      case 'adjustment':
        // For these types, quantity_change represents the absolute new quantity
        quantityAfter = Math.max(0, quantity_change)
        break
      default:
        quantityAfter = quantityBefore
    }

    // Update inventory
    const { error: updateError } = await serviceClient
      .from('inventory')
      .update({
        quantity: quantityAfter,
        updated_at: new Date().toISOString()
      })
      .eq('product_id', product_id)

    if (updateError) {
      console.error('Error updating inventory:', updateError)
      return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 })
    }

    // Log the adjustment
    const { error: logError } = await serviceClient
      .from('inventory_adjustments')
      .insert({
        product_id,
        user_id: user.id,
        adjustment_type,
        quantity_change: quantity_change,
        quantity_before: quantityBefore,
        quantity_after: quantityAfter,
        reason: reason || null
      })

    if (logError) {
      console.error('Error logging adjustment:', logError)
      // Don't fail the request for logging errors
    }

    // Check for alerts and trigger them
    if (quantityAfter === 0) {
      try {
        // Trigger out-of-stock alert asynchronously
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/emails/out-of-stock-alert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({})
        }).catch(error => {
          console.error('Failed to send out-of-stock alert:', error)
        })
      } catch (emailError) {
        console.error('Error triggering out-of-stock alert:', emailError)
        // Don't fail the inventory adjustment if email fails
      }
    } else if (quantityAfter <= currentInventory.min_stock_level) {
      try {
        // Trigger low stock alert asynchronously
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/emails/low-stock-alert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({})
        }).catch(error => {
          console.error('Failed to send low stock alert:', error)
        })
      } catch (emailError) {
        console.error('Error triggering low stock alert:', emailError)
        // Don't fail the inventory adjustment if email fails
      }
    }

    return NextResponse.json({
      success: true,
      inventory: {
        product_id,
        quantity_before: quantityBefore,
        quantity_after: quantityAfter,
        adjustment_type,
        quantity_change
      }
    })
  } catch (error) {
    console.error('Inventory adjustment error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}