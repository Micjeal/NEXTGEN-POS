import { createClient, createServiceClient } from "@/lib/supabase/server"
import { ProductsTable } from "@/components/products/products-table"
import { AddProductDialog } from "@/components/products/add-product-dialog"
import { ProductExportButtons } from "@/components/products/export-buttons"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

  // Fetch all products via API
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

  // Fetch online products via API
  const onlineProductsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/products?online_only=true`, {
    headers: {
      cookie: (await cookies()).toString()
    }
  })

  let onlineProducts: Product[] = []
  if (onlineProductsResponse.ok) {
    const data = await onlineProductsResponse.json()
    onlineProducts = data.products || []
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-900 dark:to-purple-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10"></div>
          <div className="relative px-8 py-12">
            <div className="flex items-center justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                      Product Catalog Management
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-lg mt-2">
                      Manage your product catalog, pricing, and supplier information
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
                  <p className="text-sm text-slate-500 dark:text-slate-400">Online Products</p>
                  <p className="text-3xl font-bold text-blue-500">{onlineProducts.length}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Categories</p>
                  <p className="text-3xl font-bold text-purple-500">{categories.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Product Management</h2>
          </div>
          <div className="flex items-center gap-4">
            <ProductExportButtons products={(products as Product[]) || []} />
            <AddProductDialog categories={(categories as Category[]) || []} suppliers={(suppliers as Supplier[]) || []} />
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="all" className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shadow-inner">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                All Products
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="online" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 9c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                Online Products
              </div>
            </TabsTrigger>
          </TabsList>
          
          <div className="space-y-8">
            <TabsContent value="all" className="animate-fade-in">
              <ProductsTable products={(products as Product[]) || []} categories={(categories as Category[]) || []} />
            </TabsContent>
            <TabsContent value="online" className="animate-fade-in">
              <ProductsTable products={(onlineProducts as Product[]) || []} categories={(categories as Category[]) || []} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
