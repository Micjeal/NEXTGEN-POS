import { createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const serviceClient = createServiceClient()
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    // Generate chart data for the last N days
    const chartData = []
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]

      const { data: daySales, error } = await serviceClient
        .from("sales")
        .select("total")
        .eq("status", "completed")
        .gte("created_at", `${dateStr}T00:00:00.000Z`)
        .lt("created_at", `${dateStr}T23:59:59.999Z`)

      if (error) {
        console.error("Error fetching sales for date:", dateStr, error)
        continue
      }

      const total = daySales?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0
      const count = daySales?.length || 0

      chartData.push({
        date: dateStr,
        total,
        count
      })
    }

    return NextResponse.json(chartData)
  } catch (error) {
    console.error("Sales chart error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}