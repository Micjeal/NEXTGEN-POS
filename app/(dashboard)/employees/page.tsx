"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from "next/link"

interface Employee {
  id: string
  user_id: string
  employee_id: string | null
  first_name: string
  last_name: string
  email: string
  phone: string | null
  designation: string
  department: string | null
  branch_id: string | null
  salary: number | null
  is_active: boolean
  hire_date: string
  created_at: string
  branch?: {
    name: string
  } | null
  is_from_profile?: boolean
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      const data = await response.json()
      setEmployees(data.employees || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  const handleViewDetails = (employee: Employee) => {
    setSelectedEmployee(employee)
    setIsViewDialogOpen(true)
  }

  const handleEditEmployee = (employee: Employee) => {
    if (employee.is_from_profile) {
      alert("Profile-only users cannot be edited from this page. Manage them through user settings.")
      return
    }
    setSelectedEmployee(employee)
    setIsEditDialogOpen(true)
  }

  const handleUpdateEmployee = async () => {
    if (!selectedEmployee) return

    setIsUpdating(true)
    try {
      const updateData: any = {
        first_name: selectedEmployee.first_name || '',
        last_name: selectedEmployee.last_name || '',
        email: selectedEmployee.email || '',
        designation: selectedEmployee.designation || '',
      }

      // Only include optional fields if they have values
      if (selectedEmployee.phone) {
        updateData.phone = selectedEmployee.phone
      }

      if (selectedEmployee.department) {
        updateData.department = selectedEmployee.department
      }

      if (selectedEmployee.salary !== null && selectedEmployee.salary !== undefined) {
        updateData.salary = selectedEmployee.salary
      }

      const response = await fetch(`/api/employees/${selectedEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        setIsEditDialogOpen(false)
        setSelectedEmployee(null)
        fetchEmployees() // Refresh the list
        alert("Employee updated successfully")
      } else {
        const errorData = await response.json()
        alert(`Failed to update employee: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating employee:', error)
      alert("Failed to update employee")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeactivateEmployee = async (employee: Employee) => {
    if (!employee.is_from_profile) {
      // Only allow deactivation of formal employees
      setSelectedEmployee(employee)
      setIsDeactivateDialogOpen(true)
    } else {
      alert("Profile-only users cannot be deactivated from this page. Manage them through user settings.")
    }
  }

  const confirmDeactivate = async () => {
    if (!selectedEmployee) return

    try {
      const response = await fetch(`/api/employees/${selectedEmployee.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setIsDeactivateDialogOpen(false)
        setSelectedEmployee(null)
        fetchEmployees() // Refresh the list
        alert("Employee deactivated successfully")
      } else {
        alert("Failed to deactivate employee")
      }
    } catch (error) {
      console.error('Error deactivating employee:', error)
      alert("Failed to deactivate employee")
    }
  }

  const filteredEmployees = employees.filter(employee =>
    employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.designation.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="pt-0">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-muted-foreground text-lg">
            Track all registered users and manage employee information
          </p>
        </div>
        <Link href="/users/add">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:shadow-lg">
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950/20 dark:to-slate-900/20">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="sm:w-auto">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Employee Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{employees.length}</div>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Registered users
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Formal Employees</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {employees.filter(e => !e.is_from_profile).length}
            </div>
            <p className="text-xs text-green-700 dark:text-green-300">
              In employee records
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">Departments</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {new Set(employees.filter(e => !e.is_from_profile).map(e => e.department).filter(Boolean)).size}
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-300">
              Different departments
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">Avg Salary</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              UGX {employees.filter(e => !e.is_from_profile && e.salary).length > 0 ? Math.round(employees.filter(e => !e.is_from_profile && e.salary).reduce((sum, e) => sum + (e.salary || 0), 0) / employees.filter(e => !e.is_from_profile && e.salary).length).toLocaleString() : 0}
            </div>
            <p className="text-xs text-orange-700 dark:text-orange-300">
              Monthly average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Employees Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id} className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900/50 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {employee.first_name} {employee.last_name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{employee.email}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewDetails(employee)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditEmployee(employee)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Employee
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDeactivateEmployee(employee)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Deactivate
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">ID:</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {employee.is_from_profile ? 'Profile' : (employee.employee_id || 'Not set')}
                  </Badge>
                  {employee.is_from_profile && (
                    <Badge variant="secondary" className="text-xs">Profile Only</Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Role:</span>
                <Badge variant="secondary">{employee.designation}</Badge>
              </div>

              {employee.department && !employee.is_from_profile && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Department:</span>
                  <span className="text-sm text-slate-900 dark:text-slate-100">{employee.department}</span>
                </div>
              )}

              {employee.salary && !employee.is_from_profile && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Salary:</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    UGX {employee.salary.toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Status:</span>
                <Badge variant={employee.is_active ? "default" : "secondary"}>
                  {employee.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Hired: {new Date(employee.hire_date).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950/20 dark:to-slate-900/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              {searchTerm ? "No employees found" : "No employees yet"}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm
                ? "Try adjusting your search terms or filters."
                : "Get started by adding your first employee to the system."
              }
            </p>
            {!searchTerm && (
              <Link href="/users/add">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Employee
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-sm">{selectedEmployee.first_name} {selectedEmployee.last_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm">{selectedEmployee.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Employee ID</label>
                  <p className="text-sm">{selectedEmployee.employee_id || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Role</label>
                  <p className="text-sm">{selectedEmployee.designation}</p>
                </div>
                {selectedEmployee.department && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Department</label>
                    <p className="text-sm">{selectedEmployee.department}</p>
                  </div>
                )}
                {selectedEmployee.salary && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Salary</label>
                    <p className="text-sm">UGX {selectedEmployee.salary.toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="text-sm">{selectedEmployee.is_active ? 'Active' : 'Inactive'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Hire Date</label>
                  <p className="text-sm">{new Date(selectedEmployee.hire_date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_first_name">First Name</Label>
                  <Input
                    id="edit_first_name"
                    value={selectedEmployee.first_name}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, first_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_last_name">Last Name</Label>
                  <Input
                    id="edit_last_name"
                    value={selectedEmployee.last_name}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, last_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_email">Email</Label>
                  <Input
                    id="edit_email"
                    type="email"
                    value={selectedEmployee.email}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_phone">Phone</Label>
                  <Input
                    id="edit_phone"
                    value={selectedEmployee.phone || ''}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_designation">Designation</Label>
                  <Input
                    id="edit_designation"
                    value={selectedEmployee.designation}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, designation: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_department">Department</Label>
                  <Input
                    id="edit_department"
                    value={selectedEmployee.department || ''}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, department: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit_salary">Salary (UGX)</Label>
                  <Input
                    id="edit_salary"
                    type="number"
                    value={selectedEmployee.salary || ''}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, salary: e.target.value ? parseFloat(e.target.value) : null})}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateEmployee} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate {selectedEmployee?.first_name} {selectedEmployee?.last_name}?
              This will mark them as inactive and they will no longer be able to access the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeactivate} className="bg-red-600 hover:bg-red-700">
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}