import { createClient } from "@/lib/supabase/server"
import { InventoryTable } from "@/components/inventory/inventory-table"
import { AuditHistory } from "@/components/inventory/audit-history"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 dark:from-slate-900 dark:via-emerald-900 dark:to-teal-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-cyan-600/10"></div>
          <div className="relative px-8 py-12">
            <div className="flex items-center justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                      Inventory Management
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-lg mt-2">
                      Monitor stock levels, track adjustments, and manage product inventory
                    </p>
                  </div>
                </div>
              </div>
              <div className="hidden lg:flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Products</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{products.length}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Low Stock Alerts</p>
                  <p className="text-3xl font-bold text-orange-500">
                    {products.filter(p => (p.inventory?.quantity || 0) < (p.inventory?.min_stock_level || 10)).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <InventoryTable products={(products as Product[]) || []} />

        <AuditHistory />
      </div>
    </div>
  )
}
