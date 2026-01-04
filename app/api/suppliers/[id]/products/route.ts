import { createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServiceClient()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const search = searchParams.get("search") || ""

    let query = supabase
      .from("supplier_products")
      .select(`
        *,
        product:products(*)
      `)
      .eq("supplier_id", id)
      .order("is_preferred_supplier", { ascending: false })
      .order("created_at", { ascending: false })

    if (search) {
      query = query.ilike("product.name", `%${search}%`)
    }

    // Get total count
    const { count } = await supabase
      .from("supplier_products")
      .select("*", { count: "exact", head: true })
      .eq("supplier_id", id)

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: products, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: products || [],
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}