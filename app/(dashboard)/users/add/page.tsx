import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AddUserForm } from "./add-user-form"

export default async function AddUserPage() {
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

  const { data: roles } = await supabase.from("roles").select("*").order("name")

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Add New User</h1>
      <AddUserForm roles={roles || []} />
    </div>
  )
}