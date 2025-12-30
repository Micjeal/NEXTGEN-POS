import { createClient } from "@/lib/supabase/server"
import { InventoryTable } from "@/components/inventory/inventory-table"
import type { Product } from "@/lib/types/database"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

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

  // Fetch products via API
  const productsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/products?active=true`, {
    headers: {
      cookie: (await cookies()).toString()
    }
  })

  let products: Product[] = []
  if (productsResponse.ok) {
    const data = await productsResponse.json()
    products = data.products || []
  }

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
