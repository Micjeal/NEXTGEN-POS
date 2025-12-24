import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

// This endpoint handles user sign-up with role assignment
export async function POST(request: NextRequest) {
  try {
    const { fullName, email, password } = await request.json()

    if (!fullName || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Use admin client to check existing users and create new user
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

    // Check if any profiles exist (meaning users have been created)
    const { data: existingProfiles, error: checkError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .limit(1)

    if (checkError) {
      console.error("Error checking existing profiles:", checkError)
      return NextResponse.json({ error: "Unable to verify account creation permissions" }, { status: 500 })
    }

    // If profiles exist, don't allow new sign-ups (only admins can create users)
    if (existingProfiles && existingProfiles.length > 0) {
      return NextResponse.json({
        error: "Account creation is restricted. Please contact your administrator to create new accounts."
      }, { status: 403 })
    }

    // Get admin role ID
    const { data: role, error: roleError } = await supabaseAdmin
      .from("roles")
      .select("id")
      .eq("name", "admin")
      .single()

    if (roleError || !role) {
      console.error("Admin role not found:", roleError)
      return NextResponse.json({ error: "System configuration error" }, { status: 500 })
    }

    // Create the user
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for first user
      user_metadata: { full_name: fullName }
    })

    if (signUpError) {
      console.error("Error creating user:", signUpError)
      return NextResponse.json({ error: signUpError.message }, { status: 400 })
    }

    // Create profile with admin role
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert([{
        id: authData.user.id,
        email,
        full_name: fullName,
        role_id: role.id,
        is_active: true
      }])

    if (profileError) {
      console.error("Error creating profile:", profileError)
      // Try to delete the created user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: "Failed to create account profile" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Account created successfully. You can now sign in.",
      userId: authData.user.id
    })
  } catch (error) {
    console.error("Sign-up error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}