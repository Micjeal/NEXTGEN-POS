import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AddStockTransferForm } from "./add-stock-transfer-form"

export default async function AddStockTransferPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Check if user is admin or manager
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, role:roles(*)")
    .eq("id", user.id)
    .single()

  if (!["admin", "manager"].includes(profile?.role?.name || "")) {
    redirect("/dashboard")
  }

  // Fetch branches
  const { data: branches } = await supabase
    .from("branches")
    .select("id, name, code")
    .eq("is_active", true)
    .order("name")


  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Create Stock Transfer
        </h1>
        <p className="text-muted-foreground mt-2">
          Transfer inventory between branches
        </p>
      </div>
      <AddStockTransferForm
        branches={branches || []}
      />
    </div>
  )
}