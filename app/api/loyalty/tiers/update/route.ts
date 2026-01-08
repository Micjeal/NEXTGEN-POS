import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// POST: Update customer tier based on points/spending (manual trigger)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const serviceClient = createServiceClient()
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
      return NextResponse.json({ error: "Admin or manager access required" }, { status: 403 })
    }

    const body = await request.json()
    const { customerId, recalculate } = body

    if (!customerId && !recalculate) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 })
    }

    // Get customer loyalty accounts
    let query = serviceClient
      .from("customer_loyalty_accounts")
      .select(`
        *,
        customer:customers(id, full_name, total_spent)
      `)
      .eq("is_active", true)

    if (customerId) {
      query = query.eq("customer_id", customerId)
    }

    const { data: accounts, error: accountsError } = await query

    if (accountsError) {
      console.error("Error fetching accounts:", accountsError)
      return NextResponse.json({ error: "Failed to fetch loyalty accounts" }, { status: 500 })
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ error: "No loyalty accounts found" }, { status: 404 })
    }

    // Get all active tiers
    const { data: tiers } = await serviceClient
      .from("loyalty_tiers")
      .select("*")
      .eq("is_active", true)
      .order("min_points", { ascending: true })

    if (!tiers || tiers.length === 0) {
      return NextResponse.json({ error: "No active tiers configured" }, { status: 500 })
    }

    // Update each account's tier
    const updates = []
    const errors = []

    for (const account of accounts) {
      const currentPoints = account.current_points
      const totalSpent = account.customer?.total_spent || 0

      // Find appropriate tier
      let newTier = 'bronze'
      
      for (const tier of tiers) {
        // Check points first
        if (currentPoints >= tier.min_points && 
            (tier.max_points === null || currentPoints <= tier.max_points)) {
          newTier = tier.tier_name
        }
        // Also check spending if tier matches
        if (totalSpent >= tier.min_spending && 
            (tier.max_spending === null || totalSpent <= tier.max_spending)) {
          newTier = tier.tier_name
        }
      }

      // Update if tier changed
      if (account.tier !== newTier) {
        const { error: updateError } = await serviceClient
          .from("customer_loyalty_accounts")
          .update({
            tier: newTier,
            updated_at: new Date().toISOString()
          })
          .eq("id", account.id)

        if (updateError) {
          errors.push({ customer: account.customer?.full_name, error: updateError })
        } else {
          // Record tier change
          await serviceClient
            .from("tier_history")
            .insert({
              customer_id: account.customer_id,
              loyalty_account_id: account.id,
              previous_tier: account.tier,
              new_tier: newTier,
              trigger_type: recalculate ? 'scheduled' : 'manual',
              trigger_points: currentPoints,
              trigger_spending: totalSpent,
              reason: recalculate ? 'Recalculation triggered' : 'Manual tier update'
            })

          // Update customer table
          await serviceClient
            .from("customers")
            .update({
              membership_tier: newTier,
              updated_at: new Date().toISOString()
            })
            .eq("id", account.customer_id)

          updates.push({
            customer: account.customer?.full_name,
            previous_tier: account.tier,
            new_tier: newTier
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updates.length} tier(s)`,
      updated: updates,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error("Error in tier update POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET: Get tier history for a customer
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const serviceClient = createServiceClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get("customerId")

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 })
    }

    // Check if user has access (admin/manager or own customer)
    const { data: registeredCustomer } = await serviceClient
      .from("registered_customers")
      .select("id")
      .eq("user_id", user.id)
      .single()

    let hasAccess = false
    if (registeredCustomer) {
      const { data: customer } = await serviceClient
        .from("customers")
        .select("id")
        .eq("registered_customer_id", registeredCustomer.id)
        .eq("id", customerId)
        .single()
      
      if (customer) hasAccess = true
    }

    // Check for admin/manager role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role_id")
      .eq("id", user.id)
      .single()

    if (profile) {
      const { data: role } = await supabase
        .from("roles")
        .select("name")
        .eq("id", profile.role_id)
        .single()
      
      if (role && ['admin', 'manager'].includes(role.name)) {
        hasAccess = true
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { data: history, error } = await serviceClient
      .from("tier_history")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching tier history:", error)
      return NextResponse.json({ error: "Failed to fetch tier history" }, { status: 500 })
    }

    return NextResponse.json({ history: history || [] })

  } catch (error) {
    console.error("Error in tier history GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
