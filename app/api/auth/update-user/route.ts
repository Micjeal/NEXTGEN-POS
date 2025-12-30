import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"

// This endpoint allows managers/admins to update user details
export async function POST(request: NextRequest) {
  try {
    // Check if the requester is authenticated and has permission
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or manager
    const { data: profile } = await supabase
      .from("profiles")
      .select("*, role:roles(*)")
      .eq("id", user.id)
      .single()

    if (!["admin", "manager"].includes(profile?.role?.name || "")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { userId, email, full_name, role_id, is_active, password } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Use admin client to update user
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Prepare auth updates
    const authUpdates: any = {}
    if (email !== undefined) authUpdates.email = email
    if (password !== undefined && password.length >= 6) authUpdates.password = password

    // Update auth user if there are auth fields to update
    if (Object.keys(authUpdates).length > 0) {
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, authUpdates)

      if (authUpdateError) {
        return NextResponse.json({ error: authUpdateError.message }, { status: 400 })
      }
    }

    // Prepare profile updates
    const profileUpdates: any = {}
    if (full_name !== undefined) profileUpdates.full_name = full_name
    if (role_id !== undefined) profileUpdates.role_id = role_id
    if (is_active !== undefined) profileUpdates.is_active = is_active
    if (email !== undefined) profileUpdates.email = email

    // Update profile if there are profile fields to update
    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update(profileUpdates)
        .eq("id", userId)

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully"
    })
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}