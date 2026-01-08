import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from 'uuid'

// POST: Redeem a reward
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const serviceClient = createServiceClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { rewardId } = body

    if (!rewardId) {
      return NextResponse.json({ error: "Reward ID is required" }, { status: 400 })
    }

    // Get registered customer
    const { data: registeredCustomer } = await serviceClient
      .from("registered_customers")
      .select("id, full_name")
      .eq("user_id", user.id)
      .single()

    if (!registeredCustomer) {
      return NextResponse.json({ error: "Customer profile not found" }, { status: 404 })
    }

    // Get customer and loyalty account
    const { data: customer } = await serviceClient
      .from("customers")
      .select("id, full_name")
      .eq("registered_customer_id", registeredCustomer.id)
      .single()

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    const { data: loyaltyAccount } = await serviceClient
      .from("customer_loyalty_accounts")
      .select(`
        *,
        tier:loyalty_tiers(tier_name, min_tier_name, tier_discount_percent)
      `)
      .eq("customer_id", customer.id)
      .eq("is_active", true)
      .single()

    if (!loyaltyAccount) {
      return NextResponse.json({ error: "No loyalty account found" }, { status: 404 })
    }

    // Get reward details
    const { data: reward } = await serviceClient
      .from("rewards")
      .select("*")
      .eq("id", rewardId)
      .eq("is_active", true)
      .single()

    if (!reward) {
      return NextResponse.json({ error: "Reward not found or inactive" }, { status: 404 })
    }

    // Check reward validity
    const now = new Date()
    if (reward.valid_from && new Date(reward.valid_from) > now) {
      return NextResponse.json({ error: "Reward is not yet available" }, { status: 400 })
    }
    if (reward.valid_until && new Date(reward.valid_until) < now) {
      return NextResponse.json({ error: "Reward has expired" }, { status: 400 })
    }

    // Check stock
    if (reward.stock_quantity !== null && reward.stock_quantity <= 0) {
      return NextResponse.json({ error: "Reward is out of stock" }, { status: 400 })
    }

    // Check tier eligibility
    if (reward.min_tier_name) {
      const tierHierarchy = ['bronze', 'silver', 'gold', 'platinum']
      const currentTierIndex = tierHierarchy.indexOf(loyaltyAccount.tier)
      const requiredTierIndex = tierHierarchy.indexOf(reward.min_tier_name)
      
      if (currentTierIndex < requiredTierIndex) {
        return NextResponse.json({ 
          error: `This reward requires ${reward.min_tier_name} tier or higher`,
          required_tier: reward.min_tier_name
        }, { status: 403 })
      }
    }

    // Check points balance
    if (loyaltyAccount.current_points < reward.points_cost) {
      return NextResponse.json({ 
        error: "Insufficient points",
        required: reward.points_cost,
        available: loyaltyAccount.current_points
      }, { status: 400 })
    }

    // Check redemption limit per customer
    if (reward.redemption_limit_per_customer > 0) {
      const { count } = await serviceClient
        .from("reward_redemptions")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", customer.id)
        .eq("reward_id", rewardId)
        .eq("redemption_status", "completed")

      if (count && count >= reward.redemption_limit_per_customer) {
        return NextResponse.json({ error: "Redemption limit reached for this reward" }, { status: 400 })
      }
    }

    // Generate redemption code
    const redemptionCode = `RWD-${uuidv4().slice(0, 8).toUpperCase()}`

    // Start transaction - deduct points and create redemption record
    // Note: In production, use proper transaction handling
    
    // 1. Create redemption record
    const { data: redemption, error: redemptionError } = await serviceClient
      .from("reward_redemptions")
      .insert({
        customer_id: customer.id,
        reward_id: rewardId,
        loyalty_account_id: loyaltyAccount.id,
        points_spent: reward.points_cost,
        redemption_code: redemptionCode,
        redemption_status: 'pending',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days expiry
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (redemptionError) {
      console.error("Error creating redemption:", redemptionError)
      return NextResponse.json({ error: "Failed to create redemption" }, { status: 500 })
    }

    // 2. Update loyalty account - deduct points
    const newPointsBalance = loyaltyAccount.current_points - reward.points_cost
    const { error: pointsError } = await serviceClient
      .from("customer_loyalty_accounts")
      .update({
        current_points: newPointsBalance,
        total_points_redeemed: loyaltyAccount.total_points_redeemed + reward.points_cost,
        updated_at: new Date().toISOString()
      })
      .eq("id", loyaltyAccount.id)

    if (pointsError) {
      console.error("Error deducting points:", pointsError)
      // Rollback redemption
      await serviceClient
        .from("reward_redemptions")
        .delete()
        .eq("id", redemption.id)
      return NextResponse.json({ error: "Failed to deduct points" }, { status: 500 })
    }

    // 3. Create loyalty transaction record
    await serviceClient
      .from("loyalty_transactions")
      .insert({
        customer_loyalty_account_id: loyaltyAccount.id,
        transaction_type: 'redeem',
        points: -reward.points_cost,
        points_balance_before: loyaltyAccount.current_points,
        points_balance_after: newPointsBalance,
        description: `Redeemed: ${reward.name}`,
        performed_by: user.id,
        created_at: new Date().toISOString()
      })

    // 4. Update reward stock if applicable
    if (reward.stock_quantity !== null) {
      await serviceClient
        .from("rewards")
        .update({ stock_quantity: reward.stock_quantity - 1 })
        .eq("id", rewardId)
    }

    return NextResponse.json({
      success: true,
      message: "Reward redeemed successfully",
      redemption: {
        id: redemption.id,
        redemption_code: redemptionCode,
        reward_name: reward.name,
        points_spent: reward.points_cost,
        remaining_points: newPointsBalance,
        status: redemption.redemption_status,
        expires_at: redemption.expires_at
      }
    })

  } catch (error) {
    console.error("Error in redeem POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET: Get customer's redemption history
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const serviceClient = createServiceClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    // Get registered customer
    const { data: registeredCustomer } = await serviceClient
      .from("registered_customers")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!registeredCustomer) {
      return NextResponse.json({ error: "Customer profile not found" }, { status: 404 })
    }

    // Get customer
    const { data: customer } = await serviceClient
      .from("customers")
      .select("id")
      .eq("registered_customer_id", registeredCustomer.id)
      .single()

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    let query = serviceClient
      .from("reward_redemptions")
      .select(`
        *,
        reward:rewards(
          id, name, description, reward_type, discount_percent, discount_fixed_amount
        )
      `)
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("redemption_status", status)
    }

    const { data: redemptions, error } = await query

    if (error) {
      console.error("Error fetching redemptions:", error)
      return NextResponse.json({ error: "Failed to fetch redemptions" }, { status: 500 })
    }

    return NextResponse.json({ redemptions: redemptions || [] })

  } catch (error) {
    console.error("Error in redeem GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
