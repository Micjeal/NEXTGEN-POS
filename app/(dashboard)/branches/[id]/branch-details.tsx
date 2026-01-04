"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  MapPin,
  Phone,
  Mail,
  User,
  Users,
  Package,
  Edit,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"

interface Branch {
  id: string
  name: string
  code: string
  address: string
  city: string
  phone: string
  email: string
  manager_id: string
  is_headquarters: boolean
  is_active: boolean
  manager?: {
    first_name: string
    last_name: string
    phone: string
    email: string
  }
}

interface Employee {
  id: string
  first_name: string
  last_name: string
  designation: string
  phone: string
  email: string
  hire_date: string
}

interface InventoryItem {
  product_id: string
  quantity: number
  products: {
    name: string
  }
}

interface BranchDetailsProps {
  branch: Branch
  employees: Employee[]
  inventory: InventoryItem[]
}

export function BranchDetails({ branch, employees, inventory }: BranchDetailsProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/branches">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Branches
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {branch.name}
            </h1>
            <p className="text-muted-foreground">Branch Code: {branch.code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/branches/${branch.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Branch
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex gap-2">
        <Badge variant={branch.is_active ? "default" : "secondary"}>
          {branch.is_active ? "Active" : "Inactive"}
        </Badge>
        {branch.is_headquarters && (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            Headquarters
          </Badge>
        )}
      </div>

      {/* Branch Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Address</p>
              <p className="text-lg">{branch.address}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">City</p>
              <p className="text-lg">{branch.city}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {branch.phone && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p className="text-lg">{branch.phone}</p>
              </div>
            )}
            {branch.email && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-lg">{branch.email}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manager Information */}
      {branch.manager && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Branch Manager
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-lg font-semibold">
                  {branch.manager.first_name} {branch.manager.last_name}
                </p>
                <div className="text-sm text-muted-foreground space-y-1">
                  {branch.manager.phone && <p>Phone: {branch.manager.phone}</p>}
                  {branch.manager.email && <p>Email: {branch.manager.email}</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employees */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Branch Employees ({employees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {employees.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {employees.map((employee) => (
                <div key={employee.id} className="p-4 border rounded-lg">
                  <p className="font-semibold">
                    {employee.first_name} {employee.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{employee.designation}</p>
                  <div className="text-xs text-muted-foreground mt-2">
                    {employee.phone && <p>Phone: {employee.phone}</p>}
                    {employee.email && <p>Email: {employee.email}</p>}
                    <p>Hired: {new Date(employee.hire_date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No employees assigned to this branch.</p>
          )}
        </CardContent>
      </Card>

      {/* Inventory Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Summary ({inventory.length} products)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inventory.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inventory.slice(0, 6).map((item) => (
                <div key={item.product_id} className="p-4 border rounded-lg">
                  <p className="font-semibold">{item.products.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Quantity: {item.quantity}
                  </p>
                </div>
              ))}
              {inventory.length > 6 && (
                <div className="p-4 border rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">
                    +{inventory.length - 6} more products
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No inventory data available for this branch.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}