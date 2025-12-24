import { createClient } from "@/lib/supabase/server"
import { InventoryTable } from "@/components/inventory/inventory-table"
import type { Product } from "@/lib/types/database"
import { redirect } from "next/navigation"

export default async function InventoryPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/auth/login")
  }

  // Check user role - admin and manager can manage inventory
  const { data: profile, error: roleError } = await supabase
    .from('profiles')
    .select('*, role:roles(*)')
    .eq('id', user.id)
    .single()

  if (roleError || !profile) {
    redirect("/auth/login")
  }

  const userRole = profile.role?.name
  if (!['admin', 'manager'].includes(userRole || '')) {
    redirect("/dashboard")
  }

  const { data: products } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(*),
      inventory(*)
    `)
    .eq("is_active", true)
    .order("name")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inventory</h1>
        <p className="text-muted-foreground">Monitor and adjust stock levels</p>
      </div>

      <InventoryTable products={(products as Product[]) || []} />
    </div>
  )
}
