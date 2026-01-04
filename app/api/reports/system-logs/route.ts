import { createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const serviceClient = createServiceClient()

    const { data: logs, error } = await serviceClient
      .from("system_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching system logs:", error)
      return NextResponse.json({ error: "Failed to fetch system logs" }, { status: 500 })
    }

    return NextResponse.json({ logs: logs || [] })
  } catch (error) {
    console.error("System logs API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}