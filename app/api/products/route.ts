import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { name, barcode, category_id, price, cost_price, tax_rate, is_active, image_url, supplier_id, supplier_price, minimum_order_quantity, lead_time_days, is_preferred_supplier } = body

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 })
    }

    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      return NextResponse.json({ error: 'Valid price is required' }, { status: 400 })
    }

    // Validate numeric ranges
    const priceNum = Number.parseFloat(price)
    if (priceNum > 99999999.99) {
      return NextResponse.json({ error: 'Price cannot exceed 99,999,999.99' }, { status: 400 })
    }

    if (cost_price && (isNaN(Number(cost_price)) || Number(cost_price) > 99999999.99)) {
      return NextResponse.json({ error: 'Cost price cannot exceed 99,999,999.99' }, { status: 400 })
    }

    if (tax_rate && (isNaN(Number(tax_rate)) || Number(tax_rate) < 0 || Number(tax_rate) > 100)) {
      return NextResponse.json({ error: 'Tax rate must be between 0 and 100' }, { status: 400 })
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user role
    const { data: profile, error: roleError } = await supabase
      .from('profiles')
      .select('*, role:roles(*)')
      .eq('id', user.id)
      .single()

    if (roleError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 })
    }

    const userRole = profile.role?.name
    if (!['admin', 'manager'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Insert product
    const productData = {
      name: name.trim(),
      barcode: barcode?.trim() || null,
      category_id: category_id || null,
      price: Number.parseFloat(price),
      cost_price: cost_price ? Number.parseFloat(cost_price) : 0,
      tax_rate: tax_rate ? Number.parseFloat(tax_rate) : 0,
      is_active: is_active ?? true,
      image_url: image_url || null,
    }

    const { data: newProduct, error: insertError } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting product:', insertError)
      return NextResponse.json({ error: `Failed to create product: ${insertError.message}` }, { status: 500 })
    }

    // If supplier is selected, create supplier_product record
    if (supplier_id) {
      const supplierProductData = {
        supplier_id,
        product_id: newProduct.id,
        supplier_price: supplier_price ? Number.parseFloat(supplier_price) : null,
        minimum_order_quantity: Number.parseInt(minimum_order_quantity) || 1,
        lead_time_days: Number.parseInt(lead_time_days) || 7,
        is_preferred_supplier: is_preferred_supplier ?? false,
      }

      const { error: supplierError } = await supabase
        .from('supplier_products')
        .insert(supplierProductData)

      if (supplierError) {
        console.error('Error inserting supplier product:', supplierError)
        // Don't fail the whole request, just log it
      }
    }

    return NextResponse.json({ product: newProduct }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}