import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET /api/loyalty/accounts - Get customer's loyalty account
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const serviceClient = createServiceClient()

    // First check if user is a registered customer
    const { data: registeredCustomer } = await serviceClient
      .from("registered_customers")
      .select("id, full_name, email, phone")
      .eq("user_id", user.id)
      .single()

    let customer = null
    let loyaltyAccount = null
    let recentTransactions = []

    if (registeredCustomer) {
      // User is a registered customer, check if they have a customer record
      const { data: customerRecord } = await serviceClient
        .from("customers")
        .select("id, full_name, email, phone, membership_tier, total_spent, total_visits")
        .eq("registered_customer_id", registeredCustomer.id)
        .single()

      if (customerRecord) {
        customer = customerRecord

        // Get loyalty account
        const { data: account } = await serviceClient
          .from("customer_loyalty_accounts")
          .select(`
            *,
            loyalty_program:loyalty_programs(*)
          `)
          .eq("customer_id", customer.id)
          .eq("is_active", true)
          .single()

        if (account) {
          loyaltyAccount = account

          // Get recent transactions
          const { data: transactions } = await serviceClient
            .from("loyalty_transactions")
            .select(`
              *,
              sale:sales(invoice_number, created_at)
            `)
            .eq("customer_loyalty_account_id", account.id)
            .order("created_at", { ascending: false })
            .limit(10)

          recentTransactions = transactions || []
        }
      } else {
        // Registered customer but no purchases yet
        customer = {
          ...registeredCustomer,
          membership_tier: 'none',
          total_spent: 0,
          total_visits: 0
        }
      }
    } else {
      // Fallback for existing customers not using registered customer system
      const { data: customerRecord } = await serviceClient
        .from("customers")
        .select("id, full_name, email, phone, membership_tier, total_spent, total_visits")
        .eq("email", user.email)
        .single()

      if (customerRecord) {
        customer = customerRecord

        // Get loyalty account
        const { data: account } = await serviceClient
          .from("customer_loyalty_accounts")
          .select(`
            *,
            loyalty_program:loyalty_programs(*)
          `)
          .eq("customer_id", customer.id)
          .eq("is_active", true)
          .single()

        if (account) {
          loyaltyAccount = account

          // Get recent transactions
          const { data: transactions } = await serviceClient
            .from("loyalty_transactions")
            .select(`
              *,
              sale:sales(invoice_number, created_at)
            `)
            .eq("customer_loyalty_account_id", account.id)
            .order("created_at", { ascending: false })
            .limit(10)

          recentTransactions = transactions || []
        }
      }
    }

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json({
      customer,
      loyaltyAccount,
      recentTransactions
    })

  } catch (error) {
    console.error("Get loyalty account error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/loyalty/accounts - Create loyalty account for customer
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const serviceClient = createServiceClient()

    // Get customer record
    const { data: customer } = await serviceClient
      .from("customers")
      .select("id")
      .eq("email", user.email)
      .single()

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // Check if loyalty account already exists
    const { data: existingAccount } = await serviceClient
      .from("customer_loyalty_accounts")
      .select("id")
      .eq("customer_id", customer.id)
      .eq("is_active", true)
      .single()

    if (existingAccount) {
      return NextResponse.json({ error: "Loyalty account already exists" }, { status: 400 })
    }

    // Get active loyalty program
    const { data: loyaltyProgram } = await serviceClient
      .from("loyalty_programs")
      .select("*")
      .eq("is_active", true)
      .single()

    if (!loyaltyProgram) {
      return NextResponse.json({ error: "No active loyalty program found" }, { status: 404 })
    }

    // Create loyalty account
    const { data: loyaltyAccount, error } = await serviceClient
      .from("customer_loyalty_accounts")
      .insert({
        customer_id: customer.id,
        loyalty_program_id: loyaltyProgram.id,
        current_points: 0,
        total_points_earned: 0,
        total_points_redeemed: 0,
        tier: 'bronze',
        join_date: new Date().toISOString(),
        is_active: true
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      loyaltyAccount
    })

  } catch (error) {
    console.error("Create loyalty account error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}