"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye
} from "lucide-react"
import { Input } from "@/components/ui/input"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import Link from "next/link"

interface EmployeeShift {
  id: string
  employee_id: string
  branch_id: string | null
  shift_date: string
  start_time: string
  end_time: string
  break_duration_minutes: number
  is_active: boolean
  notes: string | null
  created_at: string
  employee: {
    first_name: string
    last_name: string
    employee_id: string
  }
  branch: {
    name: string
  } | null
}

interface Employee {
  id: string
  first_name: string
  last_name: string
  employee_id: string
  user_id: string | null
}

interface Profile {
  id: string
  full_name: string
  role_id: string | null
}

export default function EmployeeShiftsPage() {
  const [shifts, setShifts] = useState<EmployeeShift[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    employee_id: "",
    branch_id: "",
    shift_date: "",
    start_time: "",
    end_time: "",
    break_duration_minutes: "30",
    notes: ""
  })

  const fetchShifts = async () => {
    try {
      const response = await fetch('/api/employee-shifts')
      const data = await response.json()
      setShifts(data.shifts || [])
      setEmployees(data.employees || [])
      setProfiles(data.profiles || [])
    } catch (error) {
      console.error('Error fetching shifts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchShifts()
  }, [])

  const handleAddShift = async () => {
    if (!formData.employee_id || !formData.shift_date || !formData.start_time || !formData.end_time) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      const submitData: any = {
        employee_id: formData.employee_id,
        shift_date: formData.shift_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        break_duration_minutes: parseInt(formData.break_duration_minutes) || 30,
        notes: formData.notes || null,
      }

      // Only include branch_id if it's not empty
      if (formData.branch_id) {
        submitData.branch_id = formData.branch_id
      }

      const response = await fetch('/api/employee-shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        toast.success("Shift added successfully")
        setIsAddDialogOpen(false)
        setFormData({
          employee_id: "",
          branch_id: "",
          shift_date: "",
          start_time: "",
          end_time: "",
          break_duration_minutes: "30",
          notes: ""
        })
        fetchShifts() // Refresh the list
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to add shift")
      }
    } catch (error) {
      console.error('Error adding shift:', error)
      toast.error("Failed to add shift")
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredShifts = shifts.filter(shift => {
    if (!searchTerm.trim()) return true

    const term = searchTerm.toLowerCase().trim()
    const firstName = shift.employee?.first_name?.toLowerCase() || ''
    const lastName = shift.employee?.last_name?.toLowerCase() || ''
    const employeeId = shift.employee?.employee_id?.toLowerCase() || ''

    return firstName.includes(term) ||
           lastName.includes(term) ||
           employeeId.includes(term)
  })

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
            Employee Shifts
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage employee shift schedules and assignments
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
              Add Shift
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Shift</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="employee" className="text-right">
                  Employee *
                </Label>
                <Select value={formData.employee_id} onValueChange={(value) => setFormData({...formData, employee_id: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.first_name} {employee.last_name} ({employee.employee_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="shift_date" className="text-right">
                  Date *
                </Label>
                <Input
                  id="shift_date"
                  type="date"
                  value={formData.shift_date}
                  onChange={(e) => setFormData({...formData, shift_date: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="start_time" className="text-right">
                  Start Time *
                </Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="end_time" className="text-right">
                  End Time *
                </Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="branch" className="text-right">
                  Branch
                </Label>
                <Select value={formData.branch_id} onValueChange={(value) => setFormData({...formData, branch_id: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select branch (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No branch</SelectItem>
                    {/* Add branch options here if available */}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="break_duration" className="text-right">
                  Break (min)
                </Label>
                <Input
                  id="break_duration"
                  type="number"
                  value={formData.break_duration_minutes}
                  onChange={(e) => setFormData({...formData, break_duration_minutes: e.target.value})}
                  className="col-span-3"
                  min="0"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="col-span-3"
                  placeholder="Optional notes..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddShift} disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Shift"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950/20 dark:to-slate-900/20">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name or employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setSearchTerm("")}
                >
                  ×
                </Button>
              )}
            </div>
            <Button variant="outline" className="sm:w-auto">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Shift Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Shifts</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{shifts.length}</div>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Scheduled shifts
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Active Shifts</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {shifts.filter(s => s.is_active).length}
            </div>
            <p className="text-xs text-green-700 dark:text-green-300">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {shifts.filter(s => {
                const shiftDate = new Date(s.shift_date)
                const now = new Date()
                const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
                const weekEnd = new Date(weekStart)
                weekEnd.setDate(weekStart.getDate() + 6)
                return shiftDate >= weekStart && shiftDate <= weekEnd
              }).length}
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-300">
              Shifts this week
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">Avg Hours</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {shifts.length > 0 ? Math.round(shifts.reduce((sum, s) => {
                const start = new Date(`1970-01-01T${s.start_time}`)
                const end = new Date(`1970-01-01T${s.end_time}`)
                const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
                return sum + hours
              }, 0) / shifts.length * 10) / 10 : 0}
            </div>
            <p className="text-xs text-orange-700 dark:text-orange-300">
              Hours per shift
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Shifts Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredShifts.map((shift) => (
          <Card key={shift.id} className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900/50 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {shift.employee.first_name} {shift.employee.last_name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{shift.employee.employee_id}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Shift
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Shift
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Date:</span>
                <Badge variant="outline">{new Date(shift.shift_date).toLocaleDateString()}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Time:</span>
                <span className="text-sm text-slate-900 dark:text-slate-100">
                  {shift.start_time} - {shift.end_time}
                </span>
              </div>

              {shift.branch && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Branch:</span>
                  <span className="text-sm text-slate-900 dark:text-slate-100">{shift.branch.name}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Break:</span>
                <span className="text-sm text-slate-900 dark:text-slate-100">{shift.break_duration_minutes} min</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Status:</span>
                <Badge variant={shift.is_active ? "default" : "secondary"}>
                  {shift.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              {shift.notes && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    {shift.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredShifts.length === 0 && (
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950/20 dark:to-slate-900/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              {searchTerm ? "No shifts found" : "No shifts scheduled"}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm
                ? `No shifts match "${searchTerm}". Try searching by employee name or ID.`
                : "Get started by scheduling your first employee shift."
              }
            </p>
            {!searchTerm && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule First Shift
                  </Button>
                </DialogTrigger>
              </Dialog>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}