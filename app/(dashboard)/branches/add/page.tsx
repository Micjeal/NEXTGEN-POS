import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AddBranchForm } from "./add-branch-form"

export default async function AddBranchPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, role:roles(*)")
    .eq("id", user.id)
    .single()

  if (!["admin", "manager"].includes(profile?.role?.name || "")) {
    redirect("/dashboard")
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
          Add New Branch
        </h1>
        <p className="text-muted-foreground mt-2">
          Create a new branch location for your supermarket
        </p>
      </div>
      <AddBranchForm managers={managers || []} />
    </div>
  )
}