"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Shield, Users, Settings, Eye, Edit, Trash2, Plus, Save, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import type { Role, Permission } from "@/lib/types/database"

interface PermissionSettingsProps {
  roles: Role[]
}

export function PermissionSettings({ roles }: PermissionSettingsProps) {
  const [permissions, setPermissions] = useState<Record<string, any>>({})
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUsingFallback, setIsUsingFallback] = useState(false)
  const [showAddRoleDialog, setShowAddRoleDialog] = useState(false)
  const [showEditRoleDialog, setShowEditRoleDialog] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [roleForm, setRoleForm] = useState({ name: "", description: "" })
  const { toast } = useToast()

  useEffect(() => {
    loadPermissions()
  }, [])

  const loadPermissions = async () => {
    try {
      const response = await fetch("/api/permissions")
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to load permissions")
      }

      const data = await response.json()
      setAvailablePermissions(data.permissions || [])

      // Transform roles data into the expected format
      const rolePermissions: Record<string, any> = {}
      data.roles?.forEach((role: any) => {
        const permissionMap: Record<string, boolean> = {}
        data.permissions?.forEach((perm: Permission) => {
          permissionMap[perm.name] = role.permissions?.includes(perm.name) || false
        })

        rolePermissions[role.name] = {
          name: role.name.charAt(0).toUpperCase() + role.name.slice(1),
          description: role.description || "",
          permissions: permissionMap
        }
      })

      setPermissions(rolePermissions)
    } catch (error) {
      console.error("Error loading permissions:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load permissions. Please ensure database tables are created.",
        variant: "destructive",
      })

      // Fallback to hardcoded permissions if database is not set up
      setIsUsingFallback(true)
      setAvailablePermissions([
        { id: "1", name: "manage_users", description: "Can create, edit, and delete user accounts", created_at: new Date().toISOString() },
        { id: "2", name: "manage_products", description: "Can create, edit, and delete products", created_at: new Date().toISOString() },
        { id: "3", name: "manage_inventory", description: "Can adjust inventory levels and view inventory reports", created_at: new Date().toISOString() },
        { id: "4", name: "view_reports", description: "Can view sales and other system reports", created_at: new Date().toISOString() },
        { id: "5", name: "manage_settings", description: "Can modify system settings and configurations", created_at: new Date().toISOString() },
        { id: "6", name: "delete_records", description: "Can delete sales records and other data", created_at: new Date().toISOString() },
        { id: "7", name: "view_audit_logs", description: "Can view system audit logs", created_at: new Date().toISOString() },
      ])

      // Fallback permissions
      setPermissions({
        admin: {
          name: "Administrator",
          description: "Full system access",
          permissions: {
            manage_users: true,
            manage_products: true,
            manage_inventory: true,
            view_reports: true,
            manage_settings: true,
            delete_records: true,
            view_audit_logs: true,
          }
        },
        manager: {
          name: "Manager",
          description: "Manage operations",
          permissions: {
            manage_users: false,
            manage_products: true,
            manage_inventory: true,
            view_reports: true,
            manage_settings: false,
            delete_records: false,
            view_audit_logs: true,
          }
        },
        cashier: {
          name: "Cashier",
          description: "POS operations only",
          permissions: {
            manage_users: false,
            manage_products: false,
            manage_inventory: false,
            view_reports: false,
            manage_settings: false,
            delete_records: false,
            view_audit_logs: false,
          }
        }
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePermissionChange = (role: string, permission: string, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        permissions: {
          ...prev[role].permissions,
          [permission]: value
        }
      }
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ permissions }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save permissions")
      }

      toast({
        title: "Permissions Updated",
        description: "Role permissions have been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving permissions:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save permissions.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getPermissionLabel = (name: string) => {
    const labels: Record<string, string> = {
      manage_users: "Manage Users",
      manage_products: "Manage Products",
      manage_inventory: "Manage Inventory",
      view_reports: "View Reports",
      manage_settings: "Manage Settings",
      delete_records: "Delete Records",
      view_audit_logs: "View Audit Logs",
    }
    return labels[name] || name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getPermissionIcon = (name: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      manage_users: Users,
      manage_products: Settings,
      manage_inventory: Settings,
      view_reports: Eye,
      manage_settings: Settings,
      delete_records: Trash2,
      view_audit_logs: Eye,
    }
    return icons[name] || Settings
  }

  const handleAddRole = () => {
    setRoleForm({ name: "", description: "" })
    setShowAddRoleDialog(true)
  }

  const handleEditRole = (role: Role) => {
    setEditingRole(role)
    setRoleForm({ name: role.name, description: role.description || "" })
    setShowEditRoleDialog(true)
  }

  const handleSaveRole = async () => {
    try {
      const supabase = createClient()

      if (editingRole) {
        // Update existing role
        const { error } = await supabase
          .from("roles")
          .update({
            name: roleForm.name,
            description: roleForm.description,
          })
          .eq("id", editingRole.id)

        if (error) throw error

        toast({
          title: "Role Updated",
          description: "Role has been updated successfully.",
        })
      } else {
        // Create new role
        const { error } = await supabase
          .from("roles")
          .insert({
            name: roleForm.name,
            description: roleForm.description,
            permissions: [],
          })

        if (error) throw error

        toast({
          title: "Role Created",
          description: "New role has been created successfully.",
        })
      }

      // Close dialogs and refresh
      setShowAddRoleDialog(false)
      setShowEditRoleDialog(false)
      setEditingRole(null)
      setRoleForm({ name: "", description: "" })

      // Refresh the page to reload roles
      window.location.reload()
    } catch (error) {
      console.error("Error saving role:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save role",
        variant: "destructive",
      })
    }
  }

  const handleDeleteRole = async (role: Role) => {
    if (!confirm(`Are you sure you want to delete the "${role.name}" role? This action cannot be undone.`)) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("roles")
        .delete()
        .eq("id", role.id)

      if (error) throw error

      toast({
        title: "Role Deleted",
        description: "Role has been deleted successfully.",
      })

      // Refresh the page to reload roles
      window.location.reload()
    } catch (error) {
      console.error("Error deleting role:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete role",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Role-Based Permissions
            </CardTitle>
            <CardDescription>Configure what each role can access and modify</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading permissions...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role-Based Permissions
          </CardTitle>
          <CardDescription>Configure what each role can access and modify</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(permissions).map(([roleKey, roleData]) => (
              <div key={roleKey} className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold capitalize">{roleData.name}</h3>
                    <p className="text-sm text-muted-foreground">{roleData.description}</p>
                  </div>
                  <Badge variant={roleKey === 'admin' ? 'destructive' : roleKey === 'manager' ? 'default' : 'secondary'}>
                    {roleKey.toUpperCase()}
                  </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {availablePermissions.map((permission) => {
                    const enabled = roleData.permissions[permission.name] || false
                    const Icon = getPermissionIcon(permission.name)
                    const label = getPermissionLabel(permission.name)

                    return (
                      <div key={permission.name} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{label}</span>
                        </div>
                        <Switch
                          checked={enabled}
                          onCheckedChange={(checked) => handlePermissionChange(roleKey, permission.name, checked)}
                        />
                      </div>
                    )
                  })}
                </div>

                {roleKey !== 'cashier' && <Separator />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Role Management
          </CardTitle>
          <CardDescription>Manage user roles and assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Available Roles</h4>
                <p className="text-sm text-muted-foreground">Current system roles</p>
              </div>
              <Button variant="outline" onClick={handleAddRole}>
                <Plus className="h-4 w-4 mr-2" />
                Add Role
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {roles.map((role) => (
                <div key={role.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium capitalize">{role.name}</p>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditRole(role)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    {role.name !== 'admin' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRole(role)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>Configure security and access control</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Strong Passwords</Label>
              <p className="text-sm text-muted-foreground">Enforce password complexity rules</p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
            </div>
            <Switch />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Session Timeout</Label>
              <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || isUsingFallback}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSaving ? "Saving..." : "Save Permissions"}
        </Button>
      </div>

      {/* Add Role Dialog */}
      <Dialog open={showAddRoleDialog} onOpenChange={setShowAddRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Role</DialogTitle>
            <DialogDescription>Create a new user role with custom permissions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="role-name">Role Name</Label>
              <Input
                id="role-name"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                placeholder="e.g., supervisor, auditor"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role-description">Description</Label>
              <Input
                id="role-description"
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                placeholder="Brief description of the role"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRole} disabled={!roleForm.name.trim()}>
              Create Role
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={showEditRoleDialog} onOpenChange={setShowEditRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Update role information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-role-name">Role Name</Label>
              <Input
                id="edit-role-name"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                placeholder="e.g., supervisor, auditor"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role-description">Description</Label>
              <Input
                id="edit-role-description"
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                placeholder="Brief description of the role"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRole} disabled={!roleForm.name.trim()}>
              Update Role
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}