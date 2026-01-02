import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET /api/customer/orders/[orderId] - Get detailed order information
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orderId } = await params

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    // Get customer data
    const { data: registeredCustomer } = await supabase
      .from("registered_customers")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!registeredCustomer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("registered_customer_id", registeredCustomer.id)
      .single()

    if (!customer) {
      return NextResponse.json({ error: "Customer record not found" }, { status: 404 })
    }

    // Get detailed order information
    const { data: order, error } = await supabase
      .from("sales")
      .select(`
        id,
        invoice_number,
        total,
        tax_amount,
        discount_amount,
        status,
        created_at,
        payment_method,
        notes,
        sale_items (
          id,
          quantity,
          unit_price,
          line_total,
          products (
            id,
            name,
            image_url
          )
        )
      `)
      .eq("id", orderId)
      .eq("customer_id", customer.id)
      .single()

    if (error) {
      console.error("Error fetching order:", error)
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }
      return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 })
    }

    // Calculate order summary
    const subtotal = order.total - (order.tax_amount || 0)
    const orderSummary = {
      subtotal,
      tax: order.tax_amount || 0,
      discount: order.discount_amount || 0,
      total: order.total
    }

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        orderSummary
      }
    })

  } catch (error) {
    console.error("Error in order details GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}