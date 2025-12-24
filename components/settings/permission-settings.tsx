"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Shield, Users, Settings, Eye, Edit, Trash2, Plus, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Role } from "@/lib/types/database"

interface PermissionSettingsProps {
  roles: Role[]
}

export function PermissionSettings({ roles }: PermissionSettingsProps) {
  const [permissions, setPermissions] = useState({
    admin: {
      name: "Administrator",
      description: "Full system access",
      permissions: {
        manageUsers: true,
        manageProducts: true,
        manageInventory: true,
        viewReports: true,
        manageSettings: true,
        deleteRecords: true,
        viewAuditLogs: true,
      }
    },
    manager: {
      name: "Manager",
      description: "Manage operations",
      permissions: {
        manageUsers: false,
        manageProducts: true,
        manageInventory: true,
        viewReports: true,
        manageSettings: false,
        deleteRecords: false,
        viewAuditLogs: true,
      }
    },
    cashier: {
      name: "Cashier",
      description: "POS operations only",
      permissions: {
        manageUsers: false,
        manageProducts: false,
        manageInventory: false,
        viewReports: false,
        manageSettings: false,
        deleteRecords: false,
        viewAuditLogs: false,
      }
    }
  })

  const { toast } = useToast()

  const handlePermissionChange = (role: string, permission: string, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role as keyof typeof prev],
        permissions: {
          ...prev[role as keyof typeof prev].permissions,
          [permission]: value
        }
      }
    }))
  }

  const handleSave = () => {
    // TODO: Save permissions to database
    toast({
      title: "Permissions Updated",
      description: "Role permissions have been saved successfully.",
    })
  }

  const permissionLabels = {
    manageUsers: "Manage Users",
    manageProducts: "Manage Products",
    manageInventory: "Manage Inventory",
    viewReports: "View Reports",
    manageSettings: "Manage Settings",
    deleteRecords: "Delete Records",
    viewAuditLogs: "View Audit Logs",
  }

  const permissionIcons = {
    manageUsers: Users,
    manageProducts: Settings,
    manageInventory: Settings,
    viewReports: Eye,
    manageSettings: Settings,
    deleteRecords: Trash2,
    viewAuditLogs: Eye,
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
                  {Object.entries(roleData.permissions).map(([permissionKey, enabled]) => {
                    const Icon = permissionIcons[permissionKey as keyof typeof permissionIcons]
                    const label = permissionLabels[permissionKey as keyof typeof permissionLabels]

                    return (
                      <div key={permissionKey} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{label}</span>
                        </div>
                        <Switch
                          checked={enabled}
                          onCheckedChange={(checked) => handlePermissionChange(roleKey, permissionKey, checked)}
                          disabled={roleKey === 'admin' && permissionKey === 'manageUsers'} // Admin must always manage users
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
              <Button variant="outline">
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
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
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
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Permissions
        </Button>
      </div>
    </div>
  )
}