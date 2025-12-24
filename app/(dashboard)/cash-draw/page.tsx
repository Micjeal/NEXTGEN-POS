import { createClient } from "@/lib/supabase/server"
import CashDrawerClient from "./cash-drawer-client"

export default async function CashDrawPage() {
  const supabase = await createClient()

  // Get current user for authentication check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return <div>Please log in to access cash drawer</div>
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cash Drawer Management</h1>
        <p className="text-muted-foreground">
          Track cash transactions and drawer balance for {profile?.full_name}
        </p>
      </div>

      <CashDrawerClient />
    </div>
  )
}