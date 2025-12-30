import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET /api/loyalty/transactions - Get customer's loyalty transactions
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const serviceClient = createServiceClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    // First check if user is a registered customer
    const { data: registeredCustomer } = await serviceClient
      .from("registered_customers")
      .select("id")
      .eq("user_id", user.id)
      .single()

    let customerId = null

    if (registeredCustomer) {
      // Get customer record if it exists
      const { data: customer } = await serviceClient
        .from("customers")
        .select("id")
        .eq("registered_customer_id", registeredCustomer.id)
        .single()

      if (customer) {
        customerId = customer.id
      }
    } else {
      // Fallback for existing customers
      const { data: customer } = await serviceClient
        .from("customers")
        .select("id")
        .eq("email", user.email)
        .single()

      if (customer) {
        customerId = customer.id
      }
    }

    if (!customerId) {
      return NextResponse.json({ error: "No customer record found" }, { status: 404 })
    }

    // Get loyalty account
    const { data: loyaltyAccount } = await serviceClient
      .from("customer_loyalty_accounts")
      .select("id")
      .eq("customer_id", customerId)
      .eq("is_active", true)
      .single()

    if (!loyaltyAccount) {
      return NextResponse.json({ error: "Loyalty account not found" }, { status: 404 })
    }

    // Get transactions
    const { data: transactions, error } = await serviceClient
      .from("loyalty_transactions")
      .select(`
        *,
        sale:sales(invoice_number, created_at, total)
      `)
      .eq("customer_loyalty_account_id", loyaltyAccount.id)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      transactions: transactions || []
    })

  } catch (error) {
    console.error("Get loyalty transactions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/loyalty/transactions - Earn or redeem points (for POS/staff use)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to manage loyalty
    const serviceClient = createServiceClient()
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('*, role:roles(*)')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role?.name
    if (!['admin', 'manager', 'cashier'].includes(userRole || '')) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { customerId, transactionType, points, saleId, reason } = await request.json()

    if (!customerId || !transactionType || !points) {
      return NextResponse.json({ error: "Customer ID, transaction type, and points are required" }, { status: 400 })
    }

    // Get customer's loyalty account
    const { data: loyaltyAccount } = await serviceClient
      .from("customer_loyalty_accounts")
      .select("*")
      .eq("customer_id", customerId)
      .eq("is_active", true)
      .single()

    if (!loyaltyAccount) {
      return NextResponse.json({ error: "Customer loyalty account not found" }, { status: 404 })
    }

    // Calculate new balance
    let pointsBalanceAfter = loyaltyAccount.current_points
    if (transactionType === 'earn') {
      pointsBalanceAfter += points
    } else if (transactionType === 'redeem') {
      if (loyaltyAccount.current_points < points) {
        return NextResponse.json({ error: "Insufficient points balance" }, { status: 400 })
      }
      pointsBalanceAfter -= points
    } else {
      return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 })
    }

    // Create transaction record
    const { data: transaction, error: transactionError } = await serviceClient
      .from("loyalty_transactions")
      .insert({
        customer_loyalty_account_id: loyaltyAccount.id,
        transaction_type: transactionType,
        points: points,
        points_balance_after: pointsBalanceAfter,
        sale_id: saleId || null,
        reason: reason || null,
        created_by: user.id
      })
      .select()
      .single()

    if (transactionError) {
      return NextResponse.json({ error: transactionError.message }, { status: 500 })
    }

    // Update loyalty account balance
    const { error: updateError } = await serviceClient
      .from("customer_loyalty_accounts")
      .update({
        current_points: pointsBalanceAfter,
        total_points_earned: transactionType === 'earn'
          ? loyaltyAccount.total_points_earned + points
          : loyaltyAccount.total_points_earned,
        total_points_redeemed: transactionType === 'redeem'
          ? loyaltyAccount.total_points_redeemed + points
          : loyaltyAccount.total_points_redeemed,
        last_points_earned: transactionType === 'earn' ? new Date().toISOString() : loyaltyAccount.last_points_earned
      })
      .eq("id", loyaltyAccount.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      transaction,
      newBalance: pointsBalanceAfter
    })

  } catch (error) {
    console.error("Loyalty transaction error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}