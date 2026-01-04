import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("products")
    .select(`id, name, barcode, category:categories(name), inventory(quantity, min_stock_level, max_stock_level)`)
    .eq("is_active", true)
    .order("name")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ products: data })
}