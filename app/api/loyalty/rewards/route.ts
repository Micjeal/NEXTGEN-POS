import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET: Fetch all rewards
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const tierName = searchParams.get("tier")
    const featured = searchParams.get("featured")
    const activeOnly = searchParams.get("active") !== "false"

    let query = supabase
      .from("rewards")
      .select(`
        *,
        tier:min_tier_name(tier_name, display_name, tier_color)
      `)
      .order("is_featured", { ascending: false })
      .order("points_cost", { ascending: true })

    if (tierName) {
      query = query.or(`min_tier_name.is.null,min_tier_name.lte.${tierName}`)
    }
    
    if (featured === "true") {
      query = query.eq("is_featured", true)
    }
    
    if (activeOnly) {
      query = query.eq("is_active", true)
      query = query.or("valid_from.is.null,valid_from.lte.now()")
      query = query.or("valid_until.is.null,valid_until.gte.now()")
    }

    const { data: rewards, error } = await query

    if (error) {
      console.error("Error fetching rewards:", error)
      return NextResponse.json({ error: "Failed to fetch rewards" }, { status: 500 })
    }

    return NextResponse.json({ rewards: rewards || [] })
  } catch (error) {
    console.error("Error in rewards GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST: Create or update a reward
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
      return NextResponse.json({ error: "Admin or manager access required" }, { status: 403 })
    }

    const body = await request.json()
    const {
      id,
      name,
      description,
      points_cost,
      monetary_value,
      reward_type,
      discount_percent,
      discount_fixed_amount,
      product_id,
      category_id,
      image_url,
      stock_quantity,
      redemption_limit_per_customer,
      min_purchase_amount,
      min_tier_name,
      valid_from,
      valid_until,
      is_active,
      is_featured
    } = body

    if (!name || points_cost === undefined) {
      return NextResponse.json({ error: "Name and points cost are required" }, { status: 400 })
    }

    const rewardData = {
      name,
      description: description || null,
      points_cost: parseInt(points_cost),
      monetary_value: parseFloat(monetary_value) || 0,
      reward_type,
      discount_percent: parseFloat(discount_percent) || 0,
      discount_fixed_amount: parseFloat(discount_fixed_amount) || 0,
      product_id: product_id || null,
      category_id: category_id || null,
      image_url: image_url || null,
      stock_quantity: stock_quantity ? parseInt(stock_quantity) : null,
      redemption_limit_per_customer: redemption_limit_per_customer ? parseInt(redemption_limit_per_customer) : 0,
      min_purchase_amount: parseFloat(min_purchase_amount) || 0,
      min_tier_name: min_tier_name || null,
      valid_from: valid_from || null,
      valid_until: valid_until || null,
      is_active: is_active !== false,
      is_featured: is_featured === true,
      updated_at: new Date().toISOString()
    }

    let reward
    let error

    if (id) {
      // Update existing reward
      const result = await supabase
        .from("rewards")
        .update(rewardData)
        .eq("id", id)
        .select()
        .single()
      reward = result.data
      error = result.error
    } else {
      // Create new reward
      const result = await supabase
        .from("rewards")
        .insert(rewardData)
        .select()
        .single()
      reward = result.data
      error = result.error
    }

    if (error) {
      console.error("Error saving reward:", error)
      return NextResponse.json({ error: "Failed to save reward" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: id ? "Reward updated successfully" : "Reward created successfully",
      reward
    })

  } catch (error) {
    console.error("Error in rewards POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE: Delete a reward
export async function DELETE(request: NextRequest) {
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

    if (!role || !['admin', 'manager'].includes(role.name)) {
      return NextResponse.json({ error: "Admin or manager access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const rewardId = searchParams.get("id")

    if (!rewardId) {
      return NextResponse.json({ error: "Reward ID is required" }, { status: 400 })
    }

    // Soft delete - set is_active to false
    const { error } = await supabase
      .from("rewards")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", rewardId)

    if (error) {
      console.error("Error deleting reward:", error)
      return NextResponse.json({ error: "Failed to delete reward" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Reward deleted successfully"
    })

  } catch (error) {
    console.error("Error in rewards DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
