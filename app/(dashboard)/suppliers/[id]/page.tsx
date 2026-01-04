import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import SupplierDetailsClient from "./supplier-details-client"

interface SupplierDetailsPageProps {
  params: Promise<{ id: string }>
}

export default async function SupplierDetailsPage({ params }: SupplierDetailsPageProps) {
  const { id } = await params
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

  return <SupplierDetailsClient supplierId={id} />
}