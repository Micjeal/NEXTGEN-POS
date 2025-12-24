import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardShell } from "@/components/layout/dashboard-layout"
import type { Profile } from "@/lib/types/database"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch user profile with role
  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      *,
      role:roles(*)
    `)
    .eq("id", user.id)
    .single()

  return (
    <DashboardShell profile={profile as Profile | null}>
      {children}
    </DashboardShell>
  )
}
