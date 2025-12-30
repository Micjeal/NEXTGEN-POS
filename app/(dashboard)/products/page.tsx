import { createClient, createServiceClient } from "@/lib/supabase/server"
import { ProductsTable } from "@/components/products/products-table"
import { AddProductDialog } from "@/components/products/add-product-dialog"
import type { Product, Category, Supplier } from "@/lib/types/database"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

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

  // Fetch products via API
  const productsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/products`, {
    headers: {
      cookie: (await cookies()).toString()
    }
  })

  let products: Product[] = []
  if (productsResponse.ok) {
    const data = await productsResponse.json()
    products = data.products || []
  }

  // Fetch categories via API (assuming we create one)
  const categoriesResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/categories`, {
    headers: {
      cookie: (await cookies()).toString()
    }
  })

  let categories: Category[] = []
  if (categoriesResponse.ok) {
    const data = await categoriesResponse.json()
    categories = data.categories || []
  }

  // Fetch suppliers via API
  const suppliersResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/suppliers`, {
    headers: {
      cookie: (await cookies()).toString()
    }
  })

  let suppliers: Supplier[] = []
  if (suppliersResponse.ok) {
    const data = await suppliersResponse.json()
    suppliers = data.suppliers || []
  }

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
