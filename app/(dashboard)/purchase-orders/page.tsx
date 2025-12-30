import { createClient, createServiceClient } from "@/lib/supabase/server"
import { PurchaseOrdersTable } from "@/components/purchase-orders/purchase-orders-table"
import { AddPurchaseOrderDialog } from "@/components/purchase-orders/add-purchase-order-dialog"
import type { PurchaseOrder, Supplier } from "@/lib/types/database"
import { redirect } from "next/navigation"

export default async function PurchaseOrdersPage() {
  // Use user client for authentication
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/auth/login")
  }

  // Check user role - admin and manager can manage purchase orders
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

  // Use service client for data fetching (bypasses RLS)
  const serviceClient = createServiceClient()

  // Fetch purchase orders with related data
  const { data: purchaseOrders } = await serviceClient
    .from("purchase_orders")
    .select(`
      *,
      supplier:suppliers(*),
      creator:profiles!created_by(*),
      approver:profiles!approved_by(*)
    `)
    .order("created_at", { ascending: false })

  // Fetch active suppliers
  const { data: suppliers } = await serviceClient
    .from("suppliers")
    .select("*")
    .eq("is_active", true)
    .order("name")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage supplier purchase orders and inventory replenishment</p>
        </div>
        <AddPurchaseOrderDialog suppliers={(suppliers as Supplier[]) || []} />
      </div>

      <PurchaseOrdersTable
        purchaseOrders={(purchaseOrders as PurchaseOrder[]) || []}
        suppliers={(suppliers as Supplier[]) || []}
      />
    </div>
  )
}