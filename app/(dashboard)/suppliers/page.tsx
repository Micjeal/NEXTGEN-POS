import { createClient } from "@/lib/supabase/server"
import { SuppliersTable } from "@/components/suppliers/suppliers-table"
import { AddSupplierDialog } from "@/components/suppliers/add-supplier-dialog"
import type { Supplier } from "@/lib/types/database"
import { redirect } from "next/navigation"

export default async function SuppliersPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/auth/login")
  }

  // Check user role - only admin can access suppliers
  const { data: profile, error: roleError } = await supabase
    .from('profiles')
    .select('*, role:roles(*)')
    .eq('id', user.id)
    .single()

  if (roleError || !profile) {
    redirect("/auth/login")
  }

  const userRole = profile.role?.name
  if (userRole !== 'admin') {
    redirect("/dashboard")
  }

  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Supplier Management</h1>
          <p className="text-muted-foreground">Manage suppliers and purchase orders</p>
        </div>
        <AddSupplierDialog />
      </div>

      <SuppliersTable suppliers={(suppliers as Supplier[]) || []} />
    </div>
  )
}