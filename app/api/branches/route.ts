import { createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const serviceClient = createServiceClient()

    const { data: branches, error } = await serviceClient
      .from("branches")
      .select(`
        *,
        manager:employees!manager_id(first_name, last_name)
      `)
      .order("name")

    if (error) {
      console.error("Branches query error:", error)
      return NextResponse.json({ error: "Failed to fetch branches" }, { status: 500 })
    }

    // Transform the data
    const transformedBranches = branches?.map(branch => ({
      ...branch,
      manager_name: branch.manager ? `${branch.manager.first_name} ${branch.manager.last_name}` : null
    })) || []

    return NextResponse.json({ branches: transformedBranches })
  } catch (error) {
    console.error("Branches error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const serviceClient = createServiceClient()
    const body = await request.json()

    const { name, code, address, city, phone, email, manager_id, is_headquarters, is_active } = body

    const { data: branch, error } = await serviceClient
      .from("branches")
      .insert({
        name,
        code,
        address,
        city,
        phone,
        email,
        manager_id,
        is_headquarters: is_headquarters || false,
        is_active: is_active !== undefined ? is_active : true
      })
      .select(`
        *,
        manager:employees!manager_id(first_name, last_name)
      `)
      .single()

    if (error) {
      console.error("Branch creation error:", error)
      return NextResponse.json({ error: "Failed to create branch" }, { status: 500 })
    }

    const transformedBranch = {
      ...branch,
      manager_name: branch.manager ? `${branch.manager.first_name} ${branch.manager.last_name}` : null
    }

    return NextResponse.json({ branch: transformedBranch }, { status: 201 })
  } catch (error) {
    console.error("Branch creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const serviceClient = createServiceClient()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Branch ID is required" }, { status: 400 })
    }

    const { data: branch, error } = await serviceClient
      .from("branches")
      .update(updates)
      .eq("id", id)
      .select(`
        *,
        manager:employees!manager_id(first_name, last_name)
      `)
      .single()

    if (error) {
      console.error("Branch update error:", error)
      return NextResponse.json({ error: "Failed to update branch" }, { status: 500 })
    }

    const transformedBranch = {
      ...branch,
      manager_name: branch.manager ? `${branch.manager.first_name} ${branch.manager.last_name}` : null
    }

    return NextResponse.json({ branch: transformedBranch })
  } catch (error) {
    console.error("Branch update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const serviceClient = createServiceClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Branch ID is required" }, { status: 400 })
    }

    const { error } = await serviceClient
      .from("branches")
      .update({ is_active: false })
      .eq("id", id)

    if (error) {
      console.error("Branch deactivation error:", error)
      return NextResponse.json({ error: "Failed to deactivate branch" }, { status: 500 })
    }

    return NextResponse.json({ message: "Branch deactivated successfully" })
  } catch (error) {
    console.error("Branch deactivation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}