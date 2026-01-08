import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET /api/supplier-products - Get supplier products
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get("supplier_id")
    const productId = searchParams.get("product_id")
    const isPreferred = searchParams.get("preferred")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")

    const serviceClient = createServiceClient()

    let query = serviceClient
      .from("supplier_products")
      .select(`
        *,
        product:products(id, name, barcode, category_id, cost_price, is_active, category:categories(id, name)),
        supplier:suppliers(id, name, payment_terms, lead_time_days)
      `)

    if (supplierId) query = query.eq("supplier_id", supplierId)
    if (productId) query = query.eq("product_id", productId)
    if (isPreferred === "true") query = query.eq("is_preferred_supplier", true)
    if (search) query = query.ilike("product.name", `%${search}%`)

    const { count } = await serviceClient
      .from("supplier_products")
      .select("*", { count: "exact", head: true })
      .eq("supplier_id", supplierId || "")

    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.order("is_preferred_supplier", { ascending: false }).range(from, to)

    const { data: products, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      products: products || [],
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error("Get supplier products error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/supplier-products - Add product to supplier catalog
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

    const { supplier_id, product_id, supplier_product_code, supplier_price, minimum_order_quantity, lead_time_days, is_preferred_supplier } = await request.json()

    if (!supplier_id || !product_id) {
      return NextResponse.json({ error: "Supplier ID and Product ID are required" }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // Check if product already linked to supplier
    const { data: existing } = await serviceClient
      .from("supplier_products")
      .select("id")
      .eq("supplier_id", supplier_id)
      .eq("product_id", product_id)
      .single()

    if (existing) {
      return NextResponse.json({ error: "Product is already linked to this supplier" }, { status: 400 })
    }

    const { data: product, error } = await serviceClient
      .from("supplier_products")
      .insert({
        supplier_id,
        product_id,
        supplier_product_code: supplier_product_code?.trim() || null,
        supplier_price: supplier_price ? Number(supplier_price) : null,
        minimum_order_quantity: minimum_order_quantity || 1,
        lead_time_days: lead_time_days || 7,
        is_preferred_supplier: is_preferred_supplier || false
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, product })
  } catch (error) {
    console.error("Create supplier product error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/supplier-products - Update supplier product
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

    const { id, supplier_product_code, supplier_price, minimum_order_quantity, lead_time_days, is_preferred_supplier } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Supplier product ID is required" }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    const updateData: Record<string, any> = {}
    if (supplier_product_code !== undefined) updateData.supplier_product_code = supplier_product_code?.trim() || null
    if (supplier_price !== undefined) updateData.supplier_price = supplier_price ? Number(supplier_price) : null
    if (minimum_order_quantity !== undefined) updateData.minimum_order_quantity = minimum_order_quantity
    if (lead_time_days !== undefined) updateData.lead_time_days = lead_time_days
    if (is_preferred_supplier !== undefined) updateData.is_preferred_supplier = is_preferred_supplier

    const { data: product, error } = await serviceClient
      .from("supplier_products")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, product })
  } catch (error) {
    console.error("Update supplier product error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/supplier-products - Remove product from supplier
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
      return NextResponse.json({ error: "Supplier product ID is required" }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    const { error } = await serviceClient
      .from("supplier_products")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Product removed from supplier catalog" })
  } catch (error) {
    console.error("Delete supplier product error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
