import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { EditProfileForm } from "./edit-profile-form"

export default async function EditProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return <EditProfileForm profile={profile} />
}