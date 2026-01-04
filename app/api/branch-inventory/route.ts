import { createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const serviceClient = createServiceClient()
    const { searchParams } = new URL(request.url)

    const branchId = searchParams.get('branchId')

    let query = serviceClient
      .from("branch_inventory")
      .select(`
        *,
        product:products(name, barcode, category:categories(name)),
        branch:branches(name, code)
      `)

    if (branchId && branchId !== 'all') {
      query = query.eq("branch_id", branchId)
    }

    const { data: branchInventory, error } = await query

    if (error) {
      console.error("Branch inventory query error:", error)
      return NextResponse.json({ error: "Failed to fetch branch inventory" }, { status: 500 })
    }

    // Transform the data
    const transformedInventory = branchInventory?.map(item => ({
      ...item,
      product_name: item.product?.name,
      product_barcode: item.product?.barcode,
      category_name: item.product?.category?.name,
      branch_name: item.branch?.name,
      branch_code: item.branch?.code
    })) || []

    return NextResponse.json({ inventory: transformedInventory })
  } catch (error) {
    console.error("Branch inventory error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const serviceClient = createServiceClient()
    const body = await request.json()

    const { branch_id, product_id, quantity, min_stock_level, max_stock_level } = body

    if (!branch_id || !product_id) {
      return NextResponse.json({ error: "Branch ID and Product ID are required" }, { status: 400 })
    }

    // Check if branch inventory entry already exists
    const { data: existing } = await serviceClient
      .from("branch_inventory")
      .select("id")
      .eq("branch_id", branch_id)
      .eq("product_id", product_id)
      .single()

    let result
    if (existing) {
      // Update existing
      const { data, error } = await serviceClient
        .from("branch_inventory")
        .update({
          quantity: quantity || 0,
          min_stock_level: min_stock_level || 0,
          max_stock_level: max_stock_level || 0,
          last_updated: new Date().toISOString()
        })
        .eq("id", existing.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Create new
      const { data, error } = await serviceClient
        .from("branch_inventory")
        .insert({
          branch_id,
          product_id,
          quantity: quantity || 0,
          min_stock_level: min_stock_level || 0,
          max_stock_level: max_stock_level || 0
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json({ inventory: result })
  } catch (error) {
    console.error("Branch inventory update error:", error)
    return NextResponse.json({ error: "Failed to update branch inventory" }, { status: 500 })
  }
}