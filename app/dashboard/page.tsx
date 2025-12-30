import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/auth/login")
  }

  // Check user role to determine which dashboard to show
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, role:roles(*)")
    .eq("id", user.id)
    .single()

  // Check if user is a registered customer
  const { data: registeredCustomer } = await supabase
    .from("registered_customers")
    .select("id")
    .eq("user_id", user.id)
    .single()

  // If user is a registered customer, redirect to customer dashboard
  if (registeredCustomer) {
    redirect("/customer/dashboard")
  }

  // Otherwise, check staff role
  const userRole = profile?.role?.name

  if (userRole === 'admin' || userRole === 'manager' || userRole === 'cashier') {
    redirect("/home")
  }

  // Default fallback
  redirect("/auth/login")
}