"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Check, X } from "lucide-react"
import type { Role } from "@/lib/types/database"

interface PermissionMatrixProps {
  roles: Role[]
}

export function PermissionMatrix({ roles }: PermissionMatrixProps) {
  // Define all possible permissions
  const allPermissions = [
    "manage_users",
    "manage_inventory",
    "manage_products",
    "manage_sales",
    "manage_reports",
    "manage_settings",
    "view_dashboard",
    "process_sales",
    "manage_customers",
    "manage_suppliers"
  ]

  const getPermissionDisplayName = (permission: string) => {
    const names: Record<string, string> = {
      "manage_users": "Manage Users",
      "manage_inventory": "Manage Inventory",
      "manage_products": "Manage Products",
      "manage_sales": "Manage Sales",
      "manage_reports": "View Reports",
      "manage_settings": "System Settings",
      "view_dashboard": "View Dashboard",
      "process_sales": "Process Sales",
      "manage_customers": "Manage Customers",
      "manage_suppliers": "Manage Suppliers"
    }
    return names[permission] || permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const hasPermission = (role: Role, permission: string) => {
    return role.permissions?.includes(permission) || false
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Permission Matrix
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold">Permission</th>
                {roles.map((role) => (
                  <th key={role.id} className="text-center p-3 font-semibold capitalize">
                    {role.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allPermissions.map((permission) => (
                <tr key={permission} className="border-b hover:bg-muted/50">
                  <td className="p-3 font-medium">
                    {getPermissionDisplayName(permission)}
                  </td>
                  {roles.map((role) => (
                    <td key={`${role.id}-${permission}`} className="text-center p-3">
                      {hasPermission(role, permission) ? (
                        <div className="flex justify-center">
                          <Check className="h-5 w-5 text-green-600" />
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <X className="h-5 w-5 text-red-400" />
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 space-y-4">
          <h4 className="font-semibold text-sm">Role Descriptions:</h4>
          {roles.map((role) => (
            <div key={role.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <Badge variant="outline" className="capitalize mt-0.5">
                {role.name}
              </Badge>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  {role.description || `${role.name.charAt(0).toUpperCase() + role.name.slice(1)} role with standard permissions`}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {role.permissions?.slice(0, 3).map((permission) => (
                    <Badge key={permission} variant="secondary" className="text-xs">
                      {getPermissionDisplayName(permission)}
                    </Badge>
                  ))}
                  {role.permissions && role.permissions.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{role.permissions.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}