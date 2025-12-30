import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// GET /api/products - Get all products (with optional search and filters)
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
    if (!['admin', 'manager', 'cashier'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Admin, Manager, or Cashier access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const active = searchParams.get('active')

    const serviceClient = createServiceClient()
    let query = serviceClient
      .from('products')
      .select(`
        *,
        category:categories(*),
        inventory(*)
      `)
      .order('name')

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    if (category) {
      query = query.eq('category_id', category)
    }

    if (active !== null) {
      query = query.eq('is_active', active === 'true')
    }

    const { data: products, error } = await query

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ products: products || [] })
  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    // Check user role from profiles table (allow all authenticated users to view products)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, role:roles(*)')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role?.name
    // All authenticated users can view products, no role restriction

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

    const serviceClient = createServiceClient()
    const { data: newProduct, error: insertError } = await serviceClient
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

      const { error: supplierError } = await serviceClient
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