import { createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const serviceClient = createServiceClient()
    const { id } = await params

    const { data: employee, error } = await serviceClient
      .from("employees")
      .select(`
        *,
        branch:branches(name),
        user:profiles(full_name, email)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Employee fetch error:", error)
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    return NextResponse.json({ employee })
  } catch (error) {
    console.error("Employee API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const serviceClient = createServiceClient()
    const body = await request.json()
    const { id } = await params

    const { error } = await serviceClient
      .from("employees")
      .update(body)
      .eq("id", id)

    if (error) {
      console.error("Employee update error:", error)
      return NextResponse.json({ error: "Failed to update employee" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Employee update API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const serviceClient = createServiceClient()
    const { id } = await params

    const { error } = await serviceClient
      .from("employees")
      .update({ is_active: false })
      .eq("id", id)

    if (error) {
      console.error("Employee deactivate error:", error)
      return NextResponse.json({ error: "Failed to deactivate employee" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Employee deactivate API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}