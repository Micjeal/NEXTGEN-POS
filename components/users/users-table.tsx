"use client"

import { useState } from "react"
import type { Profile, Role } from "@/lib/types/database"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Shield, Search, Users, UserCheck, UserX, Plus } from "lucide-react"
import { EditUserDialog } from "./edit-user-dialog"
import { useRouter } from "next/navigation"

interface UsersTableProps {
  profiles: Profile[]
  roles: Role[]
}

export function UsersTable({ profiles, roles }: UsersTableProps) {
  const [search, setSearch] = useState("")
  const [editUser, setEditUser] = useState<Profile | null>(null)
  const router = useRouter()

  const filteredProfiles = profiles.filter(
    (p) =>
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.role?.name.toLowerCase().includes(search.toLowerCase()),
  )

  const activeUsers = profiles.filter((p) => p.is_active).length
  const adminCount = profiles.filter((p) => p.role?.name === "admin").length
  const managerCount = profiles.filter((p) => p.role?.name === "manager").length
  const cashierCount = profiles.filter((p) => p.role?.name === "cashier").length

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "manager":
        return "default"
      case "cashier":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-blue-900 dark:text-blue-100">Total Users</CardTitle>
            <div className="p-2 bg-blue-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <Users className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{profiles.length}</div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">{activeUsers} active now</p>
            <div className="mt-3 h-1 bg-blue-200 dark:bg-blue-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${profiles.length > 0 ? (activeUsers / profiles.length) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-red-900 dark:text-red-100">Admins</CardTitle>
            <div className="p-2 bg-red-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <Shield className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900 dark:text-red-100">{adminCount}</div>
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">System administrators</p>
            <div className="mt-3 flex gap-1">
              {[...Array(Math.min(adminCount, 4))].map((_, i) => (
                <div key={i} className="w-2 h-2 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Managers</CardTitle>
            <div className="p-2 bg-emerald-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <UserCheck className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{managerCount}</div>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">Branch managers</p>
            <div className="mt-3 flex gap-1">
              {[...Array(Math.min(managerCount, 4))].map((_, i) => (
                <div key={i} className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-purple-900 dark:text-purple-100">Cashiers</CardTitle>
            <div className="p-2 bg-purple-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <UserX className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{cashierCount}</div>
            <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">Front desk staff</p>
            <div className="mt-3 flex gap-1">
              {[...Array(Math.min(cashierCount, 4))].map((_, i) => (
                <div key={i} className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <CardHeader className="pb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                All Users
              </span>
              <Badge variant="secondary" className="ml-2">
                {filteredProfiles.length} of {profiles.length}
              </Badge>
            </CardTitle>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Button 
                onClick={() => router.push('/users/add')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search users by name, email, or role..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-300">User</TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Contact</TableHead>
                  <TableHead className="text-center font-semibold text-slate-700 dark:text-slate-300">Role</TableHead>
                  <TableHead className="text-center font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Joined</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                          <Search className="h-8 w-8 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-slate-900 dark:text-white">No users found</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {search ? 'Try adjusting your search terms' : 'No users have been added yet'}
                          </p>
                        </div>
                        {!search && (
                          <Button 
                            onClick={() => router.push('/users/add')}
                            variant="outline"
                            className="mt-2"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add your first user
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProfiles.map((profile) => (
                    <TableRow 
                      key={profile.id} 
                      className="border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold shadow-sm">
                            {profile.full_name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{profile.full_name}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">ID: {profile.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <a href={`mailto:${profile.email}`} className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                            {profile.email}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={getRoleBadgeVariant(profile.role?.name)} 
                          className="capitalize font-medium px-3 py-1"
                        >
                          {profile.role?.name || "No Role"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${profile.is_active ? 'bg-green-500' : 'bg-slate-400'} animate-pulse`} />
                          <Badge 
                            variant={profile.is_active ? "default" : "secondary"}
                            className={profile.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800' : ''}
                          >
                            {profile.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-900 dark:text-white">{profile.created_at}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(profile.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-slate-200 dark:border-slate-700 shadow-lg">
                            <DropdownMenuItem 
                              onClick={() => setEditUser(profile)}
                              className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={async () => {
                                try {
                                  const response = await fetch('/api/auth/update-user', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      userId: profile.id,
                                      is_active: !profile.is_active
                                    })
                                  })
                                  if (response.ok) {
                                    window.location.reload()
                                  }
                                } catch (error) {
                                  console.error('Failed to toggle user status:', error)
                                }
                              }}
                              className={`cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 ${profile.is_active ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}
                            >
                              {profile.is_active ? (
                                <>
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                  </svg>
                                  Disable User
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Enable User
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => router.push(`/users/${profile.id}/sales`)}
                              className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              View Sales
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <EditUserDialog
        profile={editUser}
        roles={roles}
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
      />
    </>
  )
}
