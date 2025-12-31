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
    console.log("Add points request body:", body)
    const { customerId, accountId, points, reason, description } = body

    // Support both customerId and accountId for backward compatibility
    let targetAccountId = accountId

    if (customerId && !accountId) {
      console.log("Looking for loyalty account for customer:", customerId)

      // First, verify the customer is registered
      const { data: customerRecord, error: customerCheckError } = await supabase
        .from("customers")
        .select("registered_customer_id, full_name")
        .eq("id", customerId)
        .single()

      if (customerCheckError || !customerRecord) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 })
      }

      if (!customerRecord.registered_customer_id) {
        return NextResponse.json({ error: "Points can only be added for registered customers" }, { status: 400 })
      }

      // Find the loyalty account for this customer (get the most recent/active one)
      const { data: customerAccounts, error: customerError } = await supabase
        .from("customer_loyalty_accounts")
        .select("id, is_active, created_at")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })

      console.log("Customer accounts lookup result:", { customerAccounts, customerError })

      let customerAccount = null
      if (customerAccounts && customerAccounts.length > 0) {
        // Use the most recent active account, or any account if none are active
        customerAccount = customerAccounts.find(acc => acc.is_active) || customerAccounts[0]
        console.log("Selected customer account:", customerAccount)
      }

      if (customerError || !customerAccount) {
        console.log("No loyalty account found, attempting to create one...")
        // Try to create a loyalty account for this customer
        let { data: loyaltyProgram } = await supabase
          .from("loyalty_programs")
          .select("id")
          .eq("is_active", true)
          .single()

        console.log("Loyalty program lookup result:", { loyaltyProgram })

        // If no active program exists, create a default one
        if (!loyaltyProgram) {
          console.log("Creating default loyalty program...")
          const { data: newProgram, error: programError } = await supabase
            .from("loyalty_programs")
            .insert({
              name: "Default Loyalty Program",
              description: "Automatically created default program",
              points_per_currency: 1.0,
              currency_to_points_rate: 1.0,
              redemption_rate: 0.01,
              minimum_points_for_redemption: 100,
              points_expiry_months: 24,
              is_active: true
            })
            .select("id")
            .single()

          console.log("Default program creation result:", { newProgram, programError })

          if (programError || !newProgram) {
            console.error("Failed to create default loyalty program:", programError)
            return NextResponse.json({ error: "Failed to create loyalty program" }, { status: 500 })
          }

          loyaltyProgram = newProgram
        }

        if (loyaltyProgram) {
          const { data: newAccount, error: createError } = await supabase
            .from("customer_loyalty_accounts")
            .insert({
              customer_id: customerId,
              loyalty_program_id: loyaltyProgram.id,
              current_points: 0,
              total_points_earned: 0,
              total_points_redeemed: 0,
              tier: 'bronze',
              join_date: new Date().toISOString().split('T')[0],
              is_active: true
            })
            .select("id")
            .single()

          console.log("New account creation result:", { newAccount, createError })

          if (createError || !newAccount) {
            console.error("Failed to create loyalty account:", createError)
            return NextResponse.json({ error: "Failed to create loyalty account" }, { status: 500 })
          }

          targetAccountId = newAccount.id
        }
      } else {
        targetAccountId = customerAccount.id
      }
    }

    console.log("Target account ID:", targetAccountId)

    if (!targetAccountId || !points || points <= 0 || (!reason && !description)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    // Get current account balance
    const { data: account, error: accountError } = await supabase
      .from("customer_loyalty_accounts")
      .select("current_points, total_points_earned")
      .eq("id", targetAccountId)
      .single()

    console.log("Account lookup result:", { account, accountError })

    if (accountError || !account) {
      return NextResponse.json({ error: "Loyalty account not found" }, { status: 404 })
    }

    const newBalance = account.current_points + points
    const newTotalEarned = account.total_points_earned + points

    console.log("Calculated new balance:", newBalance, "new total earned:", newTotalEarned)

    // Update account balance
    console.log("Updating account with:", { current_points: newBalance, total_points_earned: newTotalEarned, last_activity_date: new Date().toISOString() })

    const { error: updateError } = await supabase
      .from("customer_loyalty_accounts")
      .update({
        current_points: newBalance,
        total_points_earned: newTotalEarned,
        last_activity_date: new Date().toISOString()
      })
      .eq("id", targetAccountId)

    console.log("Update result:", { updateError })

    if (updateError) {
      console.error("Error updating account:", updateError)
      return NextResponse.json({ error: "Failed to update account" }, { status: 500 })
    }

    // Create loyalty transaction record
    const { error: transactionError } = await supabase
      .from("loyalty_transactions")
      .insert({
        customer_loyalty_account_id: targetAccountId,
        transaction_type: "adjustment",
        points: points,
        points_balance_before: account.current_points,
        points_balance_after: newBalance,
        description: `Manual adjustment: ${reason || description}`,
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