import { createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const serviceClient = createServiceClient()

    const { data: shifts, error } = await serviceClient
      .from("employee_shifts")
      .select(`
        *,
        employee:employees(first_name, last_name, employee_id),
        branch:branches(name)
      `)
      .order("shift_date", { ascending: false })
      .order("start_time", { ascending: false })

    if (error) {
      console.error("Employee shifts fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch employee shifts" }, { status: 500 })
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
      shifts: shifts || [],
      total: shifts?.length || 0,
      employees: employees || [],
      profiles: profiles || []
    })
  } catch (error) {
    console.error("Employee shifts API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const serviceClient = createServiceClient()
    const body = await request.json()

    const { employee_id, branch_id, shift_date, start_time, end_time, break_duration_minutes, notes } = body

    if (!employee_id || !shift_date || !start_time || !end_time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: shift, error } = await serviceClient
      .from("employee_shifts")
      .insert({
        employee_id,
        branch_id,
        shift_date,
        start_time,
        end_time,
        break_duration_minutes: break_duration_minutes || 30,
        notes
      })
      .select(`
        *,
        employee:employees(first_name, last_name, employee_id),
        branch:branches(name)
      `)
      .single()

    if (error) {
      console.error("Employee shift creation error:", error)
      return NextResponse.json({ error: "Failed to create employee shift" }, { status: 500 })
    }

    return NextResponse.json({ shift }, { status: 201 })
  } catch (error) {
    console.error("Employee shifts POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const serviceClient = createServiceClient()
    const body = await request.json()

    const {
      id,
      employee_id,
      branch_id,
      shift_date,
      start_time,
      end_time,
      break_duration_minutes,
      is_active,
      notes
    } = body

    if (!id) {
      return NextResponse.json({ error: "Missing shift ID" }, { status: 400 })
    }

    const { data: shift, error } = await serviceClient
      .from("employee_shifts")
      .update({
        employee_id,
        branch_id,
        shift_date,
        start_time,
        end_time,
        break_duration_minutes,
        is_active,
        notes
      })
      .eq("id", id)
      .select(`
        *,
        employee:employees(first_name, last_name, employee_id),
        branch:branches(name)
      `)
      .single()

    if (error) {
      console.error("Employee shift update error:", error)
      return NextResponse.json({ error: "Failed to update employee shift" }, { status: 500 })
    }

    return NextResponse.json({ shift })
  } catch (error) {
    console.error("Employee shifts PUT error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const serviceClient = createServiceClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing shift ID" }, { status: 400 })
    }

    const { error } = await serviceClient
      .from("employee_shifts")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Employee shift delete error:", error)
      return NextResponse.json({ error: "Failed to delete employee shift" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Employee shifts DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
