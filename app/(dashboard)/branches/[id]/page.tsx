import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { BranchDetails } from "./branch-details"

interface PageProps {
  params: {
    id: string
  }
}

export default async function BranchDetailsPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    notFound()
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, role:roles(*)")
    .eq("id", user.id)
    .single()

  if (!["admin", "manager"].includes(profile?.role?.name || "")) {
    notFound()
  }

  // Fetch branch details
  const { data: branch, error } = await supabase
    .from("branches")
    .select(`
      *,
      manager:employees!manager_id(first_name, last_name, phone, email)
    `)
    .eq("id", id)
    .single()

  if (error || !branch) {
    notFound()
  }

  // Fetch branch employees
  const { data: employees } = await supabase
    .from("employees")
    .select("id, first_name, last_name, designation, phone, email, hire_date")
    .eq("branch_id", id)
    .eq("is_active", true)
    .order("first_name")

  // Fetch branch inventory summary
  const { data: inventory } = await supabase
    .from("branch_inventory")
    .select("product_id, quantity, products(name)")
    .eq("branch_id", id)

  return (
    <BranchDetails
      branch={branch}
      employees={employees || []}
      inventory={inventory || []}
    />
  )
}