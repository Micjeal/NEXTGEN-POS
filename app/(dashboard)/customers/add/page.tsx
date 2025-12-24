import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AddCustomerForm } from "../add-customer-form"

export default async function AddCustomerPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Add New Customer</h1>
      <AddCustomerForm />
    </div>
  )
}