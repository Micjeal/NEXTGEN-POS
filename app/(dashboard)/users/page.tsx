import { createClient } from "@/lib/supabase/server"
import { UsersTable } from "@/components/users/users-table"
import { PermissionMatrix } from "@/components/users/permission-matrix"
import type { Profile, Role } from "@/lib/types/database"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10"></div>
          <div className="relative px-8 py-12">
            <div className="flex items-center justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                      User & Role Management
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-lg mt-2">
                      Manage user accounts, roles, and permissions with advanced controls
                    </p>
                  </div>
                </div>
              </div>
              <div className="hidden lg:flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total System Users</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{profiles?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="users" className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shadow-inner">
            <TabsTrigger 
              value="users" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Users & Employees
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="roles" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Roles & Permissions
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-8 animate-fade-in">
            <UsersTable profiles={(formattedProfiles as Profile[]) || []} roles={(roles as Role[]) || []} />
          </TabsContent>

          <TabsContent value="roles" className="space-y-8 animate-fade-in">
            <PermissionMatrix roles={(roles as Role[]) || []} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
