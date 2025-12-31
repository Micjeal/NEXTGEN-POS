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
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profiles.length}</div>
            <p className="text-xs text-muted-foreground">{activeUsers} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Managers</CardTitle>
            <UserCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{managerCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cashiers</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cashierCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Users
            </CardTitle>
            <div className="flex items-center gap-4">
              <Button onClick={() => router.push('/users/add')}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Role</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredProfiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.full_name}</TableCell>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getRoleBadgeVariant(profile.role?.name)} className="capitalize">
                        {profile.role?.name || "No Role"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={profile.is_active ? "default" : "secondary"}>
                        {profile.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{profile.created_at}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditUser(profile)}>Edit User</DropdownMenuItem>
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
                          >
                            {profile.is_active ? 'Disable User' : 'Enable User'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/users/${profile.id}/sales`)}>View Sales</DropdownMenuItem>
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
