import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET: Fetch all loyalty tiers
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: tiers, error } = await supabase
      .from("loyalty_tiers")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })

    if (error) {
      console.error("Error fetching tiers:", error)
      return NextResponse.json({ error: "Failed to fetch loyalty tiers" }, { status: 500 })
    }

    return NextResponse.json({ tiers: tiers || [] })
  } catch (error) {
    console.error("Error in tiers GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST: Create or update a loyalty tier
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
    const {
      tier_name,
      display_name,
      description,
      min_points,
      max_points,
      min_spending,
      max_spending,
      earning_multiplier,
      redemption_multiplier,
      tier_discount_percent,
      tier_color,
      benefits,
      sort_order
    } = body

    if (!tier_name || !display_name) {
      return NextResponse.json({ error: "Tier name and display name are required" }, { status: 400 })
    }

    // Check if tier exists for upsert
    const { data: existingTier } = await supabase
      .from("loyalty_tiers")
      .select("id")
      .eq("tier_name", tier_name)
      .single()

    const tierData = {
      tier_name,
      display_name,
      description: description || null,
      min_points: min_points || 0,
      max_points: max_points || null,
      min_spending: min_spending || 0,
      max_spending: max_spending || null,
      earning_multiplier: earning_multiplier || 1.0,
      redemption_multiplier: redemption_multiplier || 1.0,
      tier_discount_percent: tier_discount_percent || 0,
      tier_color: tier_color || '#888888',
      benefits: benefits || {},
      sort_order: sort_order || 0,
      updated_at: new Date().toISOString()
    }

    let tier
    let error

    if (existingTier) {
      // Update existing tier
      const result = await supabase
        .from("loyalty_tiers")
        .update(tierData)
        .eq("id", existingTier.id)
        .select()
        .single()
      tier = result.data
      error = result.error
    } else {
      // Create new tier
      const result = await supabase
        .from("loyalty_tiers")
        .insert(tierData)
        .select()
        .single()
      tier = result.data
      error = result.error
    }

    if (error) {
      console.error("Error saving tier:", error)
      return NextResponse.json({ error: "Failed to save tier" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: existingTier ? "Tier updated successfully" : "Tier created successfully",
      tier
    })

  } catch (error) {
    console.error("Error in tiers POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE: Delete a loyalty tier (soft delete by setting is_active = false)
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

    if (!role || role.name !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const tierId = searchParams.get("id")

    if (!tierId) {
      return NextResponse.json({ error: "Tier ID is required" }, { status: 400 })
    }

    // Soft delete - set is_active to false
    const { error } = await supabase
      .from("loyalty_tiers")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", tierId)

    if (error) {
      console.error("Error deleting tier:", error)
      return NextResponse.json({ error: "Failed to delete tier" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Tier deleted successfully"
    })

  } catch (error) {
    console.error("Error in tiers DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
