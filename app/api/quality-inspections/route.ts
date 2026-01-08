import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const batchId = searchParams.get('batch_id')
    const productId = searchParams.get('product_id')

    let query = supabase
      .from("quality_inspections")
      .select(`
        *,
        batch:product_batches(id, batch_number, product:products(name)),
        product:products(id, name, barcode),
        inspector:profiles(id, full_name)
      `)
      .order("inspection_date", { ascending: false })

    if (batchId) {
      query = query.eq("batch_id", batchId)
    }

    if (productId) {
      query = query.eq("product_id", productId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching quality inspections:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ inspections: data })
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
      batch_id,
      product_id,
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
      requires_followup = false
    } = body

    // Validate required fields
    if (!product_id || !inspection_type || !inspection_date) {
      return NextResponse.json(
        { error: "Missing required fields: product_id, inspection_type, inspection_date" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("quality_inspections")
      .insert({
        batch_id,
        product_id,
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
      .select(`
        *,
        batch:product_batches(id, batch_number, product:products(name)),
        product:products(id, name, barcode),
        inspector:profiles(id, full_name)
      `)
      .single()

    if (error) {
      console.error("Error creating quality inspection:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ inspection: data }, { status: 201 })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}