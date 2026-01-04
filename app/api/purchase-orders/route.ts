import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// POST /api/purchase-orders - Create a new purchase order
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check user role - purchase orders require manager/admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, role:roles(*)')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role?.name
    if (userRole !== 'admin' && userRole !== 'manager') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { supplier_id, order_number, status, total_amount, tax_amount, discount_amount, shipping_amount, expected_delivery_date, payment_terms, notes } = await request.json()

    if (!supplier_id || !order_number) {
      return NextResponse.json({ error: "Supplier and order number are required" }, { status: 400 })
    }

    // Use service client for data operations (bypasses RLS)
    const serviceClient = createServiceClient()

    // Check if order number already exists
    const { data: existingOrder } = await serviceClient
      .from("purchase_orders")
      .select("id")
      .eq("order_number", order_number.trim())

    if (existingOrder && existingOrder.length > 0) {
      return NextResponse.json({ error: "Purchase order with this number already exists" }, { status: 400 })
    }

    // Create purchase order
    const orderData = {
      supplier_id,
      order_number: order_number.trim(),
      status: status || 'draft',
      total_amount: Number.parseFloat(total_amount) || 0,
      tax_amount: Number.parseFloat(tax_amount) || 0,
      discount_amount: Number.parseFloat(discount_amount) || 0,
      shipping_amount: Number.parseFloat(shipping_amount) || 0,
      expected_delivery_date: expected_delivery_date || null,
      payment_terms: payment_terms?.trim() || null,
      notes: notes?.trim() || null,
      created_by: user.id,
    }

    const { data: order, error: insertError } = await serviceClient
      .from("purchase_orders")
      .insert(orderData)
      .select()
      .single()

    if (insertError) {
      console.error("Database insert error:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      order
    })
  } catch (error) {
    console.error("Create purchase order error:", error)
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// GET /api/purchase-orders - Get all purchase orders (with optional search)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    // Use service client for data operations (bypasses RLS)
    const serviceClient = createServiceClient()

    let query = serviceClient
      .from("purchase_orders")
      .select(`
        *,
        supplier:suppliers(*),
        creator:profiles!created_by(*),
        approver:profiles!approved_by(*)
      `)
      .order("created_at", { ascending: false })

    if (search) {
      query = query.or(`order_number.ilike.%${search}%,supplier.name.ilike.%${search}%,creator.full_name.ilike.%${search}%`)
    }

    const { data: orders, error } = await query

    console.log('API GET purchase orders result:', { data: orders, error, count: orders?.length })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ orders: orders || [] })
  } catch (error) {
    console.error("Get purchase orders error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/purchase-orders - Update a purchase order
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check user role - purchase orders require manager/admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, role:roles(*)')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role?.name
    if (userRole !== 'admin' && userRole !== 'manager') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id, supplier_id, order_number, status, total_amount, tax_amount, discount_amount, shipping_amount, expected_delivery_date, actual_delivery_date, payment_terms, notes, approved_by } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Purchase order ID is required" }, { status: 400 })
    }

    if (!supplier_id || !order_number) {
      return NextResponse.json({ error: "Supplier and order number are required" }, { status: 400 })
    }

    // Use service client for data operations (bypasses RLS)
    const serviceClient = createServiceClient()

    // Check if the order exists
    const { data: existingOrderCheck } = await serviceClient
      .from("purchase_orders")
      .select("id")
      .eq("id", id)
      .single()

    if (!existingOrderCheck) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 })
    }

    // Check if another order with this number exists
    const { data: existingOrder } = await serviceClient
      .from("purchase_orders")
      .select("id")
      .eq("order_number", order_number.trim())
      .neq("id", id)

    if (existingOrder && existingOrder.length > 0) {
      return NextResponse.json({ error: "Another purchase order with this number already exists" }, { status: 400 })
    }

    // Update purchase order
    const orderData = {
      supplier_id,
      order_number: order_number.trim(),
      status: status || 'draft',
      total_amount: Number.parseFloat(total_amount) || 0,
      tax_amount: Number.parseFloat(tax_amount) || 0,
      discount_amount: Number.parseFloat(discount_amount) || 0,
      shipping_amount: Number.parseFloat(shipping_amount) || 0,
      expected_delivery_date: expected_delivery_date || null,
      actual_delivery_date: actual_delivery_date || null,
      payment_terms: payment_terms?.trim() || null,
      notes: notes?.trim() || null,
      approved_by: approved_by || null,
      updated_at: new Date().toISOString(),
    }

    const { data: order, error: updateError } = await serviceClient
      .from("purchase_orders")
      .update(orderData)
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      console.error("Database update error:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      order
    })
  } catch (error) {
    console.error("Update purchase order error:", error)
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// DELETE /api/purchase-orders - Delete a purchase order
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check user role - purchase orders require manager/admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, role:roles(*)')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role?.name
    if (userRole !== 'admin' && userRole !== 'manager') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "Purchase order ID is required" }, { status: 400 })
    }

    // Use service client for data operations (bypasses RLS)
    const serviceClient = createServiceClient()

    // Check if order has items
    const { data: orderItems } = await serviceClient
      .from("purchase_order_items")
      .select("id")
      .eq("purchase_order_id", id)
      .limit(1)

    if (orderItems && orderItems.length > 0) {
      return NextResponse.json({ error: "Cannot delete purchase order with associated items" }, { status: 400 })
    }

    const { error: deleteError } = await serviceClient
      .from("purchase_orders")
      .delete()
      .eq("id", id)

    if (deleteError) {
      console.error("Database delete error:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Purchase order deleted successfully"
    })
  } catch (error) {
    console.error("Delete purchase order error:", error)
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}