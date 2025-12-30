import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: programs, error } = await supabase
      .from("loyalty_programs")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching programs:", error)
      return NextResponse.json({ error: "Failed to fetch programs" }, { status: 500 })
    }

    return NextResponse.json({ programs: programs || [] })
  } catch (error) {
    console.error("Error in programs GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role_id")
      .eq("id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const { data: role } = await supabase
      .from("roles")
      .select("name")
      .eq("id", profile.role_id)
      .single()

    if (!role || role.name !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, points_per_currency, redemption_rate } = body

    if (!name || !points_per_currency) {
      return NextResponse.json({ error: "Name and points per currency are required" }, { status: 400 })
    }

    // Create new loyalty program
    const { data: program, error: programError } = await supabase
      .from("loyalty_programs")
      .insert({
        name,
        description: description || null,
        points_per_currency: parseFloat(points_per_currency),
        currency_to_points_rate: parseFloat(points_per_currency),
        redemption_rate: parseFloat(redemption_rate || 0.01),
        minimum_points_for_redemption: 100,
        points_expiry_months: 24,
        is_active: true
      })
      .select()
      .single()

    if (programError) {
      console.error("Error creating program:", programError)
      return NextResponse.json({ error: "Failed to create program" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Program created successfully",
      program
    })

  } catch (error) {
    console.error("Error in programs POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}