import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET /api/customer/wishlist - Get customer's wishlist items
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

    // Get wishlist items with product details
    console.log("Fetching wishlist for customer:", customer.id)
    const query = supabase
      .from("customer_wishlists")
      .select(`
        id,
        added_at,
        products (
          id,
          name,
          price,
          sku,
          image_url,
          is_active
        )
      `)
      .eq("customer_id", customer.id)
      .order("added_at", { ascending: false })

    console.log("Wishlist query:", query)
    const { data: wishlistItems, error } = await query

    if (error) {
      console.error("Error fetching wishlist:", error)
      // If table doesn't exist yet, return empty wishlist
      if (error.code === '42P01') { // relation does not exist
        return NextResponse.json({
          success: true,
          wishlist: [],
          message: "Wishlist table not yet created"
        })
      }
      return NextResponse.json({ error: "Failed to fetch wishlist" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      wishlist: wishlistItems || []
    })

  } catch (error) {
    console.error("Error in wishlist GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/customer/wishlist - Add product to wishlist
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { productId } = await request.json()

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

    // Check if product exists and is active
    const { data: product } = await supabase
      .from("products")
      .select("id, name")
      .eq("id", productId)
      .eq("is_active", true)
      .single()

    if (!product) {
      return NextResponse.json({ error: "Product not found or inactive" }, { status: 404 })
    }

    // Add to wishlist (will fail if already exists due to unique constraint)
    const { data: wishlistItem, error } = await supabase
      .from("customer_wishlists")
      .insert({
        customer_id: customer.id,
        product_id: productId
      })
      .select(`
        id,
        added_at,
        products (
          id,
          name,
          price,
          image_url
        )
      `)
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({
          error: "Product already in wishlist",
          alreadyExists: true
        }, { status: 409 })
      }
      if (error.code === '42P01') { // relation does not exist
        return NextResponse.json({
          error: "Wishlist functionality not yet available. Please contact support."
        }, { status: 503 })
      }
      console.error("Error adding to wishlist:", error)
      return NextResponse.json({ error: "Failed to add to wishlist" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Product added to wishlist",
      wishlistItem
    })

  } catch (error) {
    console.error("Error in wishlist POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}