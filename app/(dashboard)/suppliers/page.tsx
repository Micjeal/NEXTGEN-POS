import { createClient, createServiceClient } from "@/lib/supabase/server"
import { SuppliersTable } from "@/components/suppliers/suppliers-table"
import { AddSupplierDialog } from "@/components/suppliers/add-supplier-dialog"
import { PurchaseOrdersTable } from "@/components/purchase-orders/purchase-orders-table"
import { AddPurchaseOrderDialog } from "@/components/purchase-orders/add-purchase-order-dialog"
import { SupplierPaymentsTable } from "@/components/suppliers/supplier-payments-table"
import type { Supplier, PurchaseOrder } from "@/lib/types/database"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, FileText, CreditCard, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

  // Use service client for data fetching
  const serviceClient = createServiceClient()

  // Fetch suppliers
  const { data: suppliers } = await serviceClient
    .from("suppliers")
    .select("*")
    .order("name")

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

  // Fetch supplier payments/invoices
  const { data: supplierInvoices } = await serviceClient
    .from("supplier_invoices")
    .select(`
      *,
      supplier:suppliers(*),
      purchase_order:purchase_orders(*),
      payments:supplier_payments(*)
    `)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Supplier Management
          </h1>
          <p className="text-muted-foreground">Comprehensive supplier relationship and procurement management</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Suppliers</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{suppliers?.length || 0}</div>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Active partners
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Purchase Orders</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">{purchaseOrders?.length || 0}</div>
            <p className="text-xs text-green-700 dark:text-green-300">
              This month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">Pending Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {supplierInvoices?.filter(inv => inv.status === 'pending').length || 0}
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-300">
              Outstanding invoices
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              UGX {(supplierInvoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0).toLocaleString()}
            </div>
            <p className="text-xs text-orange-700 dark:text-orange-300">
              This year
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="suppliers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="suppliers" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Suppliers
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Purchase Orders
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Status
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-6">
          <div className="flex justify-end">
            <AddSupplierDialog />
          </div>
          <SuppliersTable suppliers={(suppliers as Supplier[]) || []} />
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <div className="flex justify-end">
            <AddPurchaseOrderDialog suppliers={(suppliers as Supplier[]) || []} />
          </div>
          <PurchaseOrdersTable
            purchaseOrders={(purchaseOrders as PurchaseOrder[]) || []}
            suppliers={(suppliers as Supplier[]) || []}
          />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <SupplierPaymentsTable invoices={(supplierInvoices as any[]) || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}