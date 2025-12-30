import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/utils/permissions"

// POST /api/suppliers - Create a new supplier
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check user role - supplier management requires manager/admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, role:roles(*)')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role?.name
    if (userRole !== 'admin' && userRole !== 'manager') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { name, contact_person, phone, email, address, city, country, tax_id, payment_terms, credit_limit, supplier_category, rating, notes, is_active } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Supplier name is required" }, { status: 400 })
    }

    // Check if supplier with this name already exists
    const { data: existingSupplier } = await supabase
      .from("suppliers")
      .select("id")
      .eq("name", name.trim())
      .single()

    if (existingSupplier) {
      return NextResponse.json({ error: "Supplier with this name already exists" }, { status: 400 })
    }

    // Create supplier
    const supplierData = {
      name: name.trim(),
      contact_person: contact_person?.trim() || null,
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      address: address?.trim() || null,
      city: city?.trim() || null,
      country: country?.trim() || 'Uganda',
      tax_id: tax_id?.trim() || null,
      payment_terms: payment_terms?.trim() || null,
      credit_limit: Number.parseFloat(credit_limit) || 0,
      supplier_category: supplier_category || 'local',
      rating: Number.parseFloat(rating) || 3.0,
      notes: notes?.trim() || null,
      is_active: is_active ?? true,
    }

    const serviceClient = createServiceClient()
    const { data: supplier, error: insertError } = await serviceClient
      .from("suppliers")
      .insert(supplierData)
      .select()
      .single()

    if (insertError) {
      console.error("Database insert error:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      supplier
    })
  } catch (error) {
    console.error("Create supplier error:", error)
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// GET /api/suppliers - Get all suppliers (with optional search)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check user role - supplier management requires manager/admin
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
    const search = searchParams.get('search')

    const serviceClient = createServiceClient()
    let query = serviceClient
      .from("suppliers")
      .select("*")
      .order("created_at", { ascending: false })

    if (search) {
      query = query.or(`name.ilike.%${search}%,contact_person.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: suppliers, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ suppliers: suppliers || [] })
  } catch (error) {
    console.error("Get suppliers error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/suppliers - Update a supplier
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check user role - supplier management requires manager/admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, role:roles(*)')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role?.name
    if (userRole !== 'admin' && userRole !== 'manager') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id, name, contact_person, phone, email, address, city, country, tax_id, payment_terms, credit_limit, supplier_category, rating, notes, is_active } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Supplier ID is required" }, { status: 400 })
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Supplier name is required" }, { status: 400 })
    }

    // Check if another supplier with this name exists
    const { data: existingSupplier } = await supabase
      .from("suppliers")
      .select("id")
      .eq("name", name.trim())
      .neq("id", id)
      .single()

    if (existingSupplier) {
      return NextResponse.json({ error: "Another supplier with this name already exists" }, { status: 400 })
    }

    // Update supplier
    const supplierData = {
      name: name.trim(),
      contact_person: contact_person?.trim() || null,
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      address: address?.trim() || null,
      city: city?.trim() || null,
      country: country?.trim() || null,
      tax_id: tax_id?.trim() || null,
      payment_terms: payment_terms?.trim() || null,
      credit_limit: Number.parseFloat(credit_limit) || 0,
      supplier_category: supplier_category || 'local',
      rating: Number.parseFloat(rating) || 3.0,
      notes: notes?.trim() || null,
      is_active: is_active ?? true,
      updated_at: new Date().toISOString(),
    }

    const serviceClient = createServiceClient()
    const { data: supplier, error: updateError } = await serviceClient
      .from("suppliers")
      .update(supplierData)
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      console.error("Database update error:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      supplier
    })
  } catch (error) {
    console.error("Update supplier error:", error)
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// DELETE /api/suppliers - Delete a supplier
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "Supplier ID is required" }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // Perform cascade deletion - delete related records first
    // Get all purchase order IDs for this supplier
    const { data: purchaseOrders, error: fetchOrdersError } = await serviceClient
      .from("purchase_orders")
      .select("id")
      .eq("supplier_id", id)

    if (fetchOrdersError) {
      console.error("Error fetching purchase orders:", fetchOrdersError)
      return NextResponse.json({ error: "Failed to fetch associated purchase orders" }, { status: 500 })
    }

    // Delete purchase order items for these orders (due to foreign key constraints)
    if (purchaseOrders && purchaseOrders.length > 0) {
      const orderIds = purchaseOrders.map(order => order.id)
      const { error: deleteOrderItemsError } = await serviceClient
        .from("purchase_order_items")
        .delete()
        .in("purchase_order_id", orderIds)

      if (deleteOrderItemsError) {
        console.error("Error deleting purchase order items:", deleteOrderItemsError)
        return NextResponse.json({ error: "Failed to delete associated purchase order items" }, { status: 500 })
      }

      // Delete purchase orders
      const { error: deleteOrdersError } = await serviceClient
        .from("purchase_orders")
        .delete()
        .eq("supplier_id", id)

      if (deleteOrdersError) {
        console.error("Error deleting purchase orders:", deleteOrdersError)
        return NextResponse.json({ error: "Failed to delete associated purchase orders" }, { status: 500 })
      }
    }

    // Delete supplier products
    const { error: deleteSupplierProductsError } = await serviceClient
      .from("supplier_products")
      .delete()
      .eq("supplier_id", id)

    if (deleteSupplierProductsError) {
      console.error("Error deleting supplier products:", deleteSupplierProductsError)
      return NextResponse.json({ error: "Failed to delete associated supplier products" }, { status: 500 })
    }

    // Finally delete the supplier
    const { error: deleteError } = await serviceClient
      .from("suppliers")
      .delete()
      .eq("id", id)

    if (deleteError) {
      console.error("Database delete error:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Supplier deleted successfully"
    })
  } catch (error) {
    console.error("Delete supplier error:", error)
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}