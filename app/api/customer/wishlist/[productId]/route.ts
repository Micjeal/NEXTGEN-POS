import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// DELETE /api/customer/wishlist/[productId] - Remove product from wishlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { productId } = await params

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
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

    // Remove from wishlist
    const { error } = await supabase
      .from("customer_wishlists")
      .delete()
      .eq("customer_id", customer.id)
      .eq("product_id", productId)

    if (error) {
      if (error.code === '42P01') { // relation does not exist
        return NextResponse.json({
          error: "Wishlist functionality not yet available. Please contact support."
        }, { status: 503 })
      }
      console.error("Error removing from wishlist:", error)
      return NextResponse.json({ error: "Failed to remove from wishlist" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Product removed from wishlist"
    })

  } catch (error) {
    console.error("Error in wishlist DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/customer/wishlist/[productId] - Check if product is in wishlist
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { productId } = await params

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
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

    // Check if product is in wishlist
    const { data: wishlistItem, error } = await supabase
      .from("customer_wishlists")
      .select("id, added_at")
      .eq("customer_id", customer.id)
      .eq("product_id", productId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      if (error.code === '42P01') { // relation does not exist
        return NextResponse.json({
          success: true,
          inWishlist: false,
          wishlistItem: null,
          message: "Wishlist functionality not yet available"
        })
      }
      console.error("Error checking wishlist:", error)
      return NextResponse.json({ error: "Failed to check wishlist" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      inWishlist: !!wishlistItem,
      wishlistItem: wishlistItem || null
    })

  } catch (error) {
    console.error("Error in wishlist GET [productId]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}