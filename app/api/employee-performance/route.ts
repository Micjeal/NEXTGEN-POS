import { createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const serviceClient = createServiceClient()

    const { data: performances, error } = await serviceClient
      .from("employee_performance")
      .select(`
        *,
        employee:employees(first_name, last_name, employee_id, designation)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Employee performance fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch employee performance" }, { status: 500 })
    }

    // Also fetch all employees from both employees and profiles tables for dropdowns
    const { data: employees } = await serviceClient
      .from("employees")
      .select("id, first_name, last_name, employee_id, user_id")
      .eq("is_active", true)

    const { data: profiles } = await serviceClient
      .from("profiles")
      .select("id, full_name, role_id")
      .eq("is_active", true)

    return NextResponse.json({
      performances: performances || [],
      total: performances?.length || 0,
      employees: employees || [],
      profiles: profiles || []
    })
  } catch (error) {
    console.error("Employee performance API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const serviceClient = createServiceClient()
    const body = await request.json()

    const {
      employee_id,
      review_period_start,
      review_period_end,
      reviewer_id,
      rating,
      goals_achievement,
      customer_satisfaction,
      sales_performance,
      punctuality,
      teamwork,
      comments,
      improvement_areas
    } = body

    if (!employee_id || !review_period_start || !review_period_end) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: performance, error } = await serviceClient
      .from("employee_performance")
      .insert({
        employee_id,
        review_period_start,
        review_period_end,
        reviewer_id,
        rating,
        goals_achievement,
        customer_satisfaction,
        sales_performance,
        punctuality,
        teamwork,
        comments,
        improvement_areas
      })
      .select(`
        *,
        employee:employees(first_name, last_name, employee_id, designation)
      `)
      .single()

    if (error) {
      console.error("Employee performance creation error:", error)
      return NextResponse.json({ error: "Failed to create employee performance record" }, { status: 500 })
    }

    return NextResponse.json({ performance }, { status: 201 })
  } catch (error) {
    console.error("Employee performance POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}