import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { rewardType, pointsRequired } = await request.json()

    if (!rewardType || !pointsRequired) {
      return NextResponse.json({ error: "Reward type and points required" }, { status: 400 })
    }

    // Get customer data
    const { data: registeredCustomer } = await supabase
      .from("registered_customers")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!registeredCustomer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("registered_customer_id", registeredCustomer.id)
      .single()

    if (!customer) {
      return NextResponse.json({ error: "Customer record not found" }, { status: 404 })
    }

    // Get loyalty account
    const { data: account } = await supabase
      .from("customer_loyalty_accounts")
      .select("*")
      .eq("customer_id", customer.id)
      .eq("is_active", true)
      .single()

    if (!account) {
      return NextResponse.json({ error: "Loyalty account not found" }, { status: 404 })
    }

    // Check if customer has enough points
    if (account.current_points < pointsRequired) {
      return NextResponse.json({ error: "Insufficient points" }, { status: 400 })
    }

    // Deduct points and create transaction
    const newBalance = account.current_points - pointsRequired

    // Update account
    const { error: updateError } = await supabase
      .from("customer_loyalty_accounts")
      .update({
        current_points: newBalance,
        total_points_redeemed: account.total_points_redeemed + pointsRequired,
        updated_at: new Date().toISOString()
      })
      .eq("id", account.id)

    if (updateError) {
      console.error("Error updating account:", updateError)
      return NextResponse.json({ error: "Failed to update account" }, { status: 500 })
    }

    // Create transaction record
    const { error: transactionError } = await supabase
      .from("loyalty_transactions")
      .insert({
        customer_loyalty_account_id: account.id,
        transaction_type: 'redeem',
        points: pointsRequired,
        points_balance_before: account.current_points,
        points_balance_after: newBalance,
        description: `Redeemed ${rewardType}`,
        performed_by: user.id
      })

    if (transactionError) {
      console.error("Error creating transaction:", transactionError)
      // Don't fail the request if transaction logging fails
    }

    return NextResponse.json({
      success: true,
      message: "Reward redeemed successfully",
      newBalance,
      redeemedReward: rewardType
    })

  } catch (error) {
    console.error("Error in redeem API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}