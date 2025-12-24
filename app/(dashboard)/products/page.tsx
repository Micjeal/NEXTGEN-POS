import { createClient } from "@/lib/supabase/server"
import { ProductsTable } from "@/components/products/products-table"
import { AddProductDialog } from "@/components/products/add-product-dialog"
import type { Product, Category, Supplier } from "@/lib/types/database"
import { redirect } from "next/navigation"

export default async function ProductsPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/auth/login")
  }

  // Check user role - admin and manager can manage products
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
    .order("name")

  const { data: categories } = await supabase.from("categories").select("*").order("name")

  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("*")
    .eq("is_active", true)
    .order("name")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <AddProductDialog categories={(categories as Category[]) || []} suppliers={(suppliers as Supplier[]) || []} />
      </div>

      <ProductsTable products={(products as Product[]) || []} categories={(categories as Category[]) || []} />
    </div>
  )
}
