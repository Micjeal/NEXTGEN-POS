import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { EditBranchForm } from "./edit-branch-form"

interface PageProps {
  params: {
    id: string
  }
}

export default async function EditBranchPage({ params }: PageProps) {
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
    .select("*")
    .eq("id", id)
    .single()

  if (error || !branch) {
    notFound()
  }

  // Fetch managers for the dropdown
  const { data: managers } = await supabase
    .from("employees")
    .select("id, first_name, last_name")
    .eq("is_active", true)
    .order("first_name")

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Edit Branch
        </h1>
        <p className="text-muted-foreground mt-2">
          Update branch information and settings
        </p>
      </div>
      <EditBranchForm branch={branch} managers={managers || []} />
    </div>
  )
}