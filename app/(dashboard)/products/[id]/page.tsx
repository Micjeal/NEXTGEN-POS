import { createClient, createServiceClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { cookies } from "next/headers"
import type { Product, ProductBatch, QualityInspection } from "@/lib/types/database"
import { ProductDetailsClient } from "./product-details-client"

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/auth/login")
  }

  // Check user role
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

  // Fetch product details
  const { data: product, error: productError } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(*),
      inventory(*),
      supplier_products(
        supplier:suppliers(*)
      )
    `)
    .eq("id", id)
    .single()

  if (productError || !product) {
    notFound()
  }

  // Fetch product batches
  const batchesResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/product-batches?product_id=${id}`, {
    headers: {
      cookie: (await cookies()).toString()
    }
  })

  let batches: ProductBatch[] = []
  if (batchesResponse.ok) {
    const data = await batchesResponse.json()
    batches = data.batches || []
  }

  // Fetch quality inspections for this product
  const inspectionsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/quality-inspections?product_id=${id}`, {
    headers: {
      cookie: (await cookies()).toString()
    }
  })

  let inspections: QualityInspection[] = []
  if (inspectionsResponse.ok) {
    const data = await inspectionsResponse.json()
    inspections = data.inspections || []
  }

  return (
    <ProductDetailsClient
      product={product as Product}
      batches={batches}
      inspections={inspections}
    />
  )
}