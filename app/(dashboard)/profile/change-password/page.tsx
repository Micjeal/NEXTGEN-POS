import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ChangePasswordForm from "./change-password-form"

export default async function ChangePasswordPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  return <ChangePasswordForm />
}