import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET /api/purchase-order-items - Get purchase order items
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("order_id")

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    const { data: items, error } = await serviceClient
      .from("purchase_order_items")
      .select(`
        *,
        product:products(id, name, barcode, category:categories(id, name))
      `)
      .eq("purchase_order_id", orderId)
      .order("created_at", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ items: items || [] })
  } catch (error) {
    console.error("Get purchase order items error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/purchase-order-items - Add item to purchase order
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*, role:roles(*)")
      .eq("id", user.id)
      .single()

    const userRole = profile?.role?.name
    if (userRole !== "admin" && userRole !== "manager") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { purchase_order_id, product_id, product_name, quantity_ordered, unit_price, tax_rate, discount_rate, notes } = await request.json()

    if (!purchase_order_id || !quantity_ordered || !unit_price) {
      return NextResponse.json({ error: "Order ID, quantity, and unit price are required" }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // Get order to check status
    const { data: order } = await serviceClient
      .from("purchase_orders")
      .select("id, status, total_amount, tax_amount")
      .eq("id", purchase_order_id)
      .single()

    if (!order) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 })
    }

    if (!["draft", "pending"].includes(order.status)) {
      return NextResponse.json({ error: "Cannot add items to an approved or processed order" }, { status: 400 })
    }

    const lineTotal = (Number(quantity_ordered) * Number(unit_price)) + 
      ((Number(quantity_ordered) * Number(unit_price) * (Number(tax_rate) || 0)) / 100) -
      ((Number(quantity_ordered) * Number(unit_price) * (Number(discount_rate) || 0)) / 100)

    const { data: item, error } = await serviceClient
      .from("purchase_order_items")
      .insert({
        purchase_order_id,
        product_id: product_id || null,
        product_name: product_name?.trim() || "Unknown Product",
        quantity_ordered: Number(quantity_ordered),
        quantity_received: 0,
        unit_price: Number(unit_price),
        tax_rate: Number(tax_rate) || 0,
        discount_rate: Number(discount_rate) || 0,
        notes: notes?.trim() || null
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update order total
    const { data: allItems } = await serviceClient
      .from("purchase_order_items")
      .select("line_total")
      .eq("purchase_order_id", purchase_order_id)

    const newTotal = allItems?.reduce((sum, i) => sum + (i.line_total || 0), 0) || 0

    await serviceClient
      .from("purchase_orders")
      .update({
        total_amount: newTotal,
        updated_at: new Date().toISOString()
      })
      .eq("id", purchase_order_id)

    return NextResponse.json({ success: true, item })
  } catch (error) {
    console.error("Create purchase order item error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/purchase-order-items - Update purchase order item
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*, role:roles(*)")
      .eq("id", user.id)
      .single()

    const userRole = profile?.role?.name
    if (userRole !== "admin" && userRole !== "manager") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { id, quantity_ordered, unit_price, tax_rate, discount_rate, notes, quantity_received } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    const { data: existingItem } = await serviceClient
      .from("purchase_order_items")
      .select("*, purchase_order:purchase_orders(status)")
      .eq("id", id)
      .single()

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    if (!["draft", "pending"].includes(existingItem.purchase_order?.status)) {
      return NextResponse.json({ error: "Cannot modify items on an approved or processed order" }, { status: 400 })
    }

    const qtyOrdered = quantity_ordered !== undefined ? Number(quantity_ordered) : existingItem.quantity_ordered
    const price = unit_price !== undefined ? Number(unit_price) : existingItem.unit_price
    const tax = tax_rate !== undefined ? Number(tax_rate) : existingItem.tax_rate
    const discount = discount_rate !== undefined ? Number(discount_rate) : existingItem.discount_rate

    const lineTotal = (qtyOrdered * price) + ((qtyOrdered * price * tax) / 100) - ((qtyOrdered * price * discount) / 100)

    const updateData: Record<string, any> = {
      quantity_ordered: qtyOrdered,
      unit_price: price,
      tax_rate: tax,
      discount_rate: discount,
      line_total: lineTotal
    }

    if (notes !== undefined) updateData.notes = notes?.trim() || null
    if (quantity_received !== undefined) updateData.quantity_received = quantity_received

    const { data: item, error } = await serviceClient
      .from("purchase_order_items")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update order total
    const { data: allItems } = await serviceClient
      .from("purchase_order_items")
      .select("line_total")
      .eq("purchase_order_id", existingItem.purchase_order_id)

    const newTotal = allItems?.reduce((sum, i) => sum + (i.line_total || 0), 0) || 0

    await serviceClient
      .from("purchase_orders")
      .update({
        total_amount: newTotal,
        updated_at: new Date().toISOString()
      })
      .eq("id", existingItem.purchase_order_id)

    return NextResponse.json({ success: true, item })
  } catch (error) {
    console.error("Update purchase order item error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/purchase-order-items - Delete purchase order item
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*, role:roles(*)")
      .eq("id", user.id)
      .single()

    const userRole = profile?.role?.name
    if (userRole !== "admin" && userRole !== "manager") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    const { data: item } = await serviceClient
      .from("purchase_order_items")
      .select("*, purchase_order:purchase_orders(status)")
      .eq("id", id)
      .single()

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    if (!["draft", "pending"].includes(item.purchase_order?.status)) {
      return NextResponse.json({ error: "Cannot delete items from an approved or processed order" }, { status: 400 })
    }

    const { error } = await serviceClient
      .from("purchase_order_items")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update order total
    const { data: allItems } = await serviceClient
      .from("purchase_order_items")
      .select("line_total")
      .eq("purchase_order_id", item.purchase_order_id)

    const newTotal = allItems?.reduce((sum, i) => sum + (i.line_total || 0), 0) || 0

    await serviceClient
      .from("purchase_orders")
      .update({
        total_amount: newTotal,
        updated_at: new Date().toISOString()
      })
      .eq("id", item.purchase_order_id)

    return NextResponse.json({ success: true, message: "Item deleted successfully" })
  } catch (error) {
    console.error("Delete purchase order item error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
