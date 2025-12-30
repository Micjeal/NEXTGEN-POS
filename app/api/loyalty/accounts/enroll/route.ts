import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or manager
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

    if (!role || !['admin', 'manager'].includes(role.name)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { customerId, programId } = body

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 })
    }

    // Check if customer exists
    const { data: customer } = await supabase
      .from("customers")
      .select("id, full_name")
      .eq("id", customerId)
      .single()

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // Check if customer already has a loyalty account
    const { data: existingAccount } = await supabase
      .from("customer_loyalty_accounts")
      .select("id")
      .eq("customer_id", customerId)
      .single()

    if (existingAccount) {
      return NextResponse.json({ error: "Customer is already enrolled in a loyalty program" }, { status: 400 })
    }

    // Get the specified loyalty program or default to active one
    let programQuery = supabase
      .from("loyalty_programs")
      .select("id, name")
      .eq("is_active", true)

    if (programId) {
      programQuery = supabase
        .from("loyalty_programs")
        .select("id, name")
        .eq("id", programId)
        .eq("is_active", true)
    }

    const { data: program, error: programError } = await programQuery.maybeSingle()

    if (programError) {
      console.error("Error fetching program:", programError)
      return NextResponse.json({ error: "Failed to fetch loyalty program" }, { status: 500 })
    }

    if (!program) {
      return NextResponse.json({
        error: programId
          ? "Specified loyalty program not found or inactive."
          : "No active loyalty program found. Please create a loyalty program first.",
        code: "NO_ACTIVE_PROGRAM"
      }, { status: 404 })
    }

    // Create loyalty account
    const { data: account, error: accountError } = await supabase
      .from("customer_loyalty_accounts")
      .insert({
        customer_id: customerId,
        loyalty_program_id: program.id,
        current_points: 0,
        total_points_earned: 0,
        total_points_redeemed: 0,
        tier: 'bronze',
        join_date: new Date().toISOString().split('T')[0],
        is_active: true
      })
      .select()
      .single()

    if (accountError) {
      console.error("Error creating loyalty account:", accountError)
      return NextResponse.json({ error: "Failed to create loyalty account" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Customer enrolled successfully",
      account
    })

  } catch (error) {
    console.error("Error in enroll API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}