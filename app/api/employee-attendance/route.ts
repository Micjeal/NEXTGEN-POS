import { createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET - Fetch attendance records
export async function GET(request: NextRequest) {
  try {
    const serviceClient = createServiceClient()
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employee_id")
    const date = searchParams.get("date")
    const status = searchParams.get("status")

    let query = serviceClient
      .from("employee_attendance")
      .select(`
        *,
        employee:employees(first_name, last_name, employee_id, designation),
        branch:branches(name)
      `)
      .order("created_at", { ascending: false })

    if (employeeId) {
      query = query.eq("employee_id", employeeId)
    }
    if (date) {
      query = query.filter("created_at", "gte", `${date}T00:00:00`)
        .filter("created_at", "lt", `${date}T23:59:59`)
    }
    if (status) {
      query = query.eq("status", status)
    }

    const { data: attendance, error } = await query

    if (error) {
      console.error("Employee attendance fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch attendance records" }, { status: 500 })
    }

    // Also fetch all active employees for dropdowns
    const { data: employees } = await serviceClient
      .from("employees")
      .select("id, first_name, last_name, employee_id, user_id")
      .eq("is_active", true)

    return NextResponse.json({
      attendance: attendance || [],
      total: attendance?.length || 0,
      employees: employees || []
    })
  } catch (error) {
    console.error("Employee attendance API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Clock in / Create attendance record
export async function POST(request: NextRequest) {
  try {
    const serviceClient = createServiceClient()
    const body = await request.json()

    const {
      employee_id,
      shift_id,
      branch_id,
      attendance_date,
      clock_in_time,
      clock_in_location,
      clock_in_method,
      notes
    } = body

    if (!employee_id || !clock_in_time) {
      return NextResponse.json({ error: "Missing required fields: employee_id and clock_in_time are required" }, { status: 400 })
    }

    // Check if already clocked in today
    const { data: existingRecord } = await serviceClient
      .from("employee_attendance")
      .select("id")
      .eq("employee_id", employee_id)
      .is("check_out_time", null)
      .single()

    if (existingRecord) {
      return NextResponse.json({ error: "Employee already clocked in today. Please clock out first." }, { status: 400 })
    }

    const { data: attendance, error } = await serviceClient
      .from("employee_attendance")
      .insert({
        employee_id,
        shift_id,
        branch_id,
        check_in_time: clock_in_time ? new Date(`${new Date().toISOString().split('T')[0]}T${clock_in_time}`).toISOString() : new Date().toISOString(),
        check_out_time: null,
        break_start_time: null,
        break_end_time: null,
        clock_in_location,
        status: 'present',
        notes,
        recorded_by: null
      })
      .select(`
        *,
        employee:employees(first_name, last_name, employee_id),
        branch:branches(name)
      `)
      .single()

    if (error) {
      console.error("Employee attendance creation error:", error)
      return NextResponse.json({ error: "Failed to clock in" }, { status: 500 })
    }

    return NextResponse.json({ attendance }, { status: 201 })
  } catch (error) {
    console.error("Employee attendance POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Clock out / Update attendance record
export async function PUT(request: NextRequest) {
  try {
    const serviceClient = createServiceClient()
    const body = await request.json()

    const {
      id,
      clock_out_time,
      clock_out_location,
      clock_out_method,
      notes
    } = body

    if (!id || !clock_out_time) {
      return NextResponse.json({ error: "Missing required fields: id and clock_out_time are required" }, { status: 400 })
    }

    // Get the current record to calculate hours
    const { data: currentRecord, error: fetchError } = await serviceClient
      .from("employee_attendance")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError || !currentRecord) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 })
    }

    // Calculate total hours
    const clockIn = new Date(currentRecord.check_in_time)
    const clockOut = new Date(clock_out_time)
    const totalHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)

    const { data: attendance, error } = await serviceClient
      .from("employee_attendance")
      .update({
        check_out_time: clock_out_time ? new Date(`${new Date().toISOString().split('T')[0]}T${clock_out_time}`).toISOString() : null,
        notes: notes || currentRecord.notes,
        total_hours: Math.round(totalHours * 100) / 100
      })
      .eq("id", id)
      .select(`
        *,
        employee:employees(first_name, last_name, employee_id),
        branch:branches(name)
      `)
      .single()

    if (error) {
      console.error("Employee attendance update error:", error)
      return NextResponse.json({ error: "Failed to clock out" }, { status: 500 })
    }

    return NextResponse.json({ attendance })
  } catch (error) {
    console.error("Employee attendance PUT error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete attendance record
export async function DELETE(request: NextRequest) {
  try {
    const serviceClient = createServiceClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing attendance record ID" }, { status: 400 })
    }

    const { error } = await serviceClient
      .from("employee_attendance")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Employee attendance delete error:", error)
      return NextResponse.json({ error: "Failed to delete attendance record" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Employee attendance DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
