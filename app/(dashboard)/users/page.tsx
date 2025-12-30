import { createClient } from "@/lib/supabase/server"
import { UsersTable } from "@/components/users/users-table"
import type { Profile, Role } from "@/lib/types/database"
import { redirect } from "next/navigation"

export default async function UsersPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/auth/login")
  }

  // Check user role - only admin can manage users
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

  const { data: profiles } = await supabase
    .from("profiles")
    .select(`
      *,
      role:roles(*)
    `)
    .order("created_at", { ascending: false })

  // Format dates consistently to avoid hydration mismatch
  const formattedProfiles = profiles?.map(profile => ({
    ...profile,
    created_at: new Date(profile.created_at).toISOString().split('T')[0] // YYYY-MM-DD format
  })) || []

  const { data: roles } = await supabase.from("roles").select("*").order("name")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage user accounts and roles</p>
      </div>

      <UsersTable profiles={(formattedProfiles as Profile[]) || []} roles={(roles as Role[]) || []} />
    </div>
  )
}
