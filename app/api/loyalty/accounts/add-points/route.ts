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
    const { accountId, points, reason } = body

    if (!accountId || !points || points <= 0 || !reason) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    // Get current account balance
    const { data: account, error: accountError } = await supabase
      .from("customer_loyalty_accounts")
      .select("current_points, total_points_earned")
      .eq("id", accountId)
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: "Loyalty account not found" }, { status: 404 })
    }

    const newBalance = account.current_points + points
    const newTotalEarned = account.total_points_earned + points

    // Update account balance
    const { error: updateError } = await supabase
      .from("customer_loyalty_accounts")
      .update({
        current_points: newBalance,
        total_points_earned: newTotalEarned,
        last_activity_date: new Date().toISOString()
      })
      .eq("id", accountId)

    if (updateError) {
      console.error("Error updating account:", updateError)
      return NextResponse.json({ error: "Failed to update account" }, { status: 500 })
    }

    // Create loyalty transaction record
    const { error: transactionError } = await supabase
      .from("loyalty_transactions")
      .insert({
        customer_loyalty_account_id: accountId,
        transaction_type: "adjustment",
        points: points,
        points_balance_before: account.current_points,
        points_balance_after: newBalance,
        description: `Manual adjustment: ${reason}`,
        performed_by: user.id
      })

    if (transactionError) {
      console.error("Error creating transaction:", transactionError)
      // Don't fail the request if transaction logging fails
    }

    return NextResponse.json({
      success: true,
      message: "Points added successfully",
      new_balance: newBalance
    })

  } catch (error) {
    console.error("Error in add-points API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}