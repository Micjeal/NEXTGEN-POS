import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')

    let query = supabase
      .from("product_batches")
      .select(`
        *,
        product:products(id, name, barcode),
        supplier:suppliers(id, name),
        purchase_order:purchase_orders(id, order_number),
        quality_inspections(*)
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (productId) {
      query = query.eq("product_id", productId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching product batches:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ batches: data })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      batch_number,
      product_id,
      supplier_id,
      purchase_order_id,
      manufacturing_date,
      expiry_date,
      received_date,
      initial_quantity,
      unit_cost,
      storage_location,
      quality_status = 'pending',
      quality_notes
    } = body

    // Validate required fields
    if (!batch_number || !product_id || !received_date || !initial_quantity) {
      return NextResponse.json(
        { error: "Missing required fields: batch_number, product_id, received_date, initial_quantity" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("product_batches")
      .insert({
        batch_number,
        product_id,
        supplier_id,
        purchase_order_id,
        manufacturing_date,
        expiry_date,
        received_date,
        initial_quantity,
        current_quantity: initial_quantity,
        unit_cost,
        storage_location,
        quality_status,
        quality_notes
      })
      .select(`
        *,
        product:products(id, name, barcode),
        supplier:suppliers(id, name),
        purchase_order:purchase_orders(id, order_number)
      `)
      .single()

    if (error) {
      console.error("Error creating product batch:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ batch: data }, { status: 201 })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}