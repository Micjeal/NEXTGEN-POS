import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// This endpoint creates test users for development
// Only works with the service role key which has admin privileges

export async function POST() {
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const testUsers = [
    { email: "admin@store.com", password: "admin123", role: "admin", fullName: "System Administrator" },
    { email: "manager@store.com", password: "manager123", role: "manager", fullName: "Store Manager" },
    { email: "cashier@store.com", password: "cashier123", role: "cashier", fullName: "John Cashier" },
  ]

  const results = []

  for (const user of testUsers) {
    try {
      // Create user in auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-confirm email
      })

      if (authError) {
        // User might already exist
        results.push({ email: user.email, status: "skipped", error: authError.message })
        continue
      }

      if (authData.user) {
        // Get role ID
        const { data: roleData } = await supabaseAdmin.from("roles").select("id").eq("name", user.role).single()

        // Update profile with role
        if (roleData) {
          await supabaseAdmin
            .from("profiles")
            .update({
              role_id: roleData.id,
              full_name: user.fullName,
            })
            .eq("id", authData.user.id)
        }

        results.push({ email: user.email, status: "created" })
      }
    } catch (error) {
      results.push({ email: user.email, status: "error", error: String(error) })
    }
  }

  return NextResponse.json({ success: true, results })
}
