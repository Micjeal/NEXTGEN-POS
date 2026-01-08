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
      .from("quality_inspections")
      .select(`
        *,
        batch:product_batches(id, batch_number, product:products(name)),
        product:products(id, name, barcode),
        inspector:profiles(id, full_name)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching quality inspection:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Quality inspection not found" }, { status: 404 })
    }

    return NextResponse.json({ inspection: data })
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
      batch_id,
      inspection_type,
      inspector_id,
      inspection_date,
      temperature,
      humidity,
      visual_inspection,
      microbiological_test,
      chemical_test,
      overall_rating,
      comments,
      corrective_actions,
      requires_followup
    } = body

    const { data, error } = await supabase
      .from("quality_inspections")
      .update({
        batch_id,
        inspection_type,
        inspector_id,
        inspection_date,
        temperature,
        humidity,
        visual_inspection,
        microbiological_test,
        chemical_test,
        overall_rating,
        comments,
        corrective_actions,
        requires_followup
      })
      .eq("id", id)
      .select(`
        *,
        batch:product_batches(id, batch_number, product:products(name)),
        product:products(id, name, barcode),
        inspector:profiles(id, full_name)
      `)
      .single()

    if (error) {
      console.error("Error updating quality inspection:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Quality inspection not found" }, { status: 404 })
    }

    return NextResponse.json({ inspection: data })
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

    const { data, error } = await supabase
      .from("quality_inspections")
      .delete()
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error deleting quality inspection:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Quality inspection not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Quality inspection deleted successfully" })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}