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

  const getPermissionIcon = (permission: string) => {
    const icons: Record<string, React.ReactNode> = {
      "manage_users": <Shield className="h-5 w-5 text-white" />,
      "manage_inventory": <Shield className="h-5 w-5 text-white" />,
      "manage_products": <Shield className="h-5 w-5 text-white" />,
      "manage_sales": <Shield className="h-5 w-5 text-white" />,
      "manage_reports": <Shield className="h-5 w-5 text-white" />,
      "manage_settings": <Shield className="h-5 w-5 text-white" />,
      "view_dashboard": <Shield className="h-5 w-5 text-white" />,
      "process_sales": <Shield className="h-5 w-5 text-white" />,
      "manage_customers": <Shield className="h-5 w-5 text-white" />,
      "manage_suppliers": <Shield className="h-5 w-5 text-white" />,
    }
    return icons[permission] || <Shield className="h-5 w-5 text-white" />
  }

  const getPermissionDescription = (permission: string) => {
    const descriptions: Record<string, string> = {
      "manage_users": "Manage user accounts and permissions",
      "manage_inventory": "Manage inventory and stock levels",
      "manage_products": "Manage products and pricing",
      "manage_sales": "Manage sales and orders",
      "manage_reports": "View and generate reports",
      "manage_settings": "Configure system settings",
      "view_dashboard": "View dashboard and key metrics",
      "process_sales": "Process sales and transactions",
      "manage_customers": "Manage customer information",
      "manage_suppliers": "Manage supplier information",
    }
    return descriptions[permission] || "No description available"
  }

  const hasPermission = (role: Role, permission: string) => {
    return role.permissions?.includes(permission) || false
  }

  return (
    <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Permission Matrix
          </span>
        </CardTitle>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Visual overview of role-based access control and permissions
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-b border-slate-200 dark:border-slate-600">
                  <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">Permission</th>
                  {roles.map((role, index) => (
                    <th key={role.id} className="text-center p-4 font-semibold">
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                          role.name === 'admin' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                          role.name === 'manager' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                          'bg-gradient-to-br from-blue-500 to-blue-600'
                        }`}>
                          {role.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="capitalize text-slate-700 dark:text-slate-300">
                          {role.name}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allPermissions.map((permission, permissionIndex) => (
                  <tr 
                    key={permission} 
                    className={`border-b border-slate-100 dark:border-slate-700 transition-colors duration-150 ${
                      permissionIndex % 2 === 0 ? 'bg-white dark:bg-slate-800/50' : 'bg-slate-50/50 dark:bg-slate-800/30'
                    } hover:bg-blue-50/50 dark:hover:bg-blue-900/10`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                          {getPermissionIcon(permission)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {getPermissionDisplayName(permission)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {getPermissionDescription(permission)}
                          </p>
                        </div>
                      </div>
                    </td>
                    {roles.map((role) => (
                      <td key={`${role.id}-${permission}`} className="text-center p-4">
                        <div className="flex justify-center">
                          {hasPermission(role, permission) ? (
                            <div className="group relative">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200">
                                <Check className="h-4 w-4 text-white" />
                              </div>
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                                Granted
                              </div>
                            </div>
                          ) : (
                            <div className="group relative">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200">
                                <X className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                              </div>
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                                Denied
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent flex-1" />
            <h4 className="font-semibold text-slate-900 dark:text-white px-4">Role Details & Capabilities</h4>
            <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent flex-1" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <div key={role.id} className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 p-6 hover:shadow-lg transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300" 
                  style={{
                    background: role.name === 'admin' ? 'from-red-500 to-red-600' :
                               role.name === 'manager' ? 'from-emerald-500 to-emerald-600' :
                               'from-blue-500 to-blue-600'
                  }}
                />
                <div className="relative">
                  <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg ${
                      role.name === 'admin' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                      role.name === 'manager' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                      'bg-gradient-to-br from-blue-500 to-blue-600'
                    }`}>
                      {role.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="capitalize font-semibold px-3 py-1">
                          {role.name}
                        </Badge>
                        <div className="flex gap-1">
                          {[...Array(Math.min(role.permissions?.length || 0, 5))].map((_, i) => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {role.description || `${role.name.charAt(0).toUpperCase() + role.name.slice(1)} role with standard permissions`}
                      </p>
                      <div className="mt-4">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Key Permissions:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {role.permissions?.slice(0, 4).map((permission) => (
                            <div key={permission} className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-md">
                              <div className="w-3 h-3 rounded-full bg-green-400" />
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                {getPermissionDisplayName(permission).split(' ')[0]}
                              </span>
                            </div>
                          ))}
                          {role.permissions && role.permissions.length > 4 && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-md">
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                +{role.permissions.length - 4} more
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">Total Permissions</span>
                          <span className="font-bold text-slate-900 dark:text-white">{role.permissions?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}