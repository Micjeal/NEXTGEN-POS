import { createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const serviceClient = createServiceClient()

    const { data: employees, error } = await serviceClient
      .from("employees")
      .select(`
        *,
        branch:branches(name)
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Employees fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 })
    }

    return NextResponse.json({
      employees: employees || [],
      total: employees?.length || 0
    })
  } catch (error) {
    console.error("Employees API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}