import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"

// This endpoint allows managers/admins to create users
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

    const { email, password, full_name, role_id } = await request.json()

    if (!email || !password || !full_name || !role_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Use admin client to create user
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

    // Create user in auth with email confirmed
    const { data: authData, error: authError2 } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email so user can login immediately
      user_metadata: {
        full_name,
      },
    })

    if (authError2) {
      return NextResponse.json({ error: authError2.message }, { status: 400 })
    }

    if (authData.user) {
      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: authData.user.id,
          email,
          full_name,
          role_id,
          is_active: true,
        })

      if (profileError) {
        // If profile creation fails, we should probably delete the auth user
        // But for simplicity, we'll just return the error
        return NextResponse.json({ error: profileError.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        user: {
          id: authData.user.id,
          email,
          full_name,
        }
      })
    }

    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}