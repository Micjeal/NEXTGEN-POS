import { createClient } from "@/lib/supabase/server"
import { SuppliersTable } from "@/components/suppliers/suppliers-table"
import { AddSupplierDialog } from "@/components/suppliers/add-supplier-dialog"
import type { Supplier } from "@/lib/types/database"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

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
  console.log('User role:', userRole)
  if (userRole !== 'admin') {
    redirect("/dashboard")
  }

  let suppliers: Supplier[] = []

  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/suppliers`, {
    headers: {
      cookie: (await cookies()).toString()
    }
  })

  if (!response.ok) {
    console.error("API response not ok:", response.status, response.statusText)
  } else {
    const data = await response.json()
    suppliers = data.suppliers || []
    console.log("Fetched suppliers via API:", suppliers.length, suppliers)
  }

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