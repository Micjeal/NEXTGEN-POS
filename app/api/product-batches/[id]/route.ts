import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

    const { data, error } = await supabase
      .from("product_batches")
      .select(`
        *,
        product:products(id, name, barcode),
        supplier:suppliers(id, name),
        purchase_order:purchase_orders(id, order_number),
        quality_inspections(*)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching product batch:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Product batch not found" }, { status: 404 })
    }

    return NextResponse.json({ batch: data })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params
    const body = await request.json()

    const {
      batch_number,
      supplier_id,
      purchase_order_id,
      manufacturing_date,
      expiry_date,
      received_date,
      initial_quantity,
      current_quantity,
      unit_cost,
      storage_location,
      quality_status,
      quality_notes,
      is_active
    } = body

    const { data, error } = await supabase
      .from("product_batches")
      .update({
        batch_number,
        supplier_id,
        purchase_order_id,
        manufacturing_date,
        expiry_date,
        received_date,
        initial_quantity,
        current_quantity,
        unit_cost,
        storage_location,
        quality_status,
        quality_notes,
        is_active
      })
      .eq("id", id)
      .select(`
        *,
        product:products(id, name, barcode),
        supplier:suppliers(id, name),
        purchase_order:purchase_orders(id, order_number)
      `)
      .single()

    if (error) {
      console.error("Error updating product batch:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Product batch not found" }, { status: 404 })
    }

    return NextResponse.json({ batch: data })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

    // Soft delete by setting is_active to false
    const { data, error } = await supabase
      .from("product_batches")
      .update({ is_active: false })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error deleting product batch:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Product batch not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Product batch deleted successfully" })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}