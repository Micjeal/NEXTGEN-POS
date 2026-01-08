"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Clock,
  Calendar,
  Users,
  Search,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogIn,
  LogOut
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import Link from "next/link"

interface AttendanceRecord {
  id: string
  employee_id: string
  attendance_date: string
  clock_in_time: string
  clock_out_time: string | null
  clock_in_location: string | null
  clock_out_location: string | null
  clock_in_method: string
  clock_out_method: string | null
  status: string
  total_hours: number | null
  late_minutes: number
  employee: {
    first_name: string
    last_name: string
    employee_id: string
    designation: string
  }
}

export default function EmployeeAttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("today")

  const fetchAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      let dateParam = today
      if (dateFilter === 'week') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        dateParam = weekAgo.toISOString().split('T')[0]
      }
      
      const response = await fetch(`/api/employee-attendance?date=${dateParam}`)
      const data = await response.json()
      setAttendance(data.attendance || [])
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendance()
  }, [dateFilter])

  const filteredAttendance = attendance.filter(record => {
    const matchesSearch = 
      record.employee?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employee?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employee?.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || record.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-500">Present</Badge>
      case 'late':
        return <Badge className="bg-yellow-500">Late</Badge>
      case 'absent':
        return <Badge className="bg-red-500">Absent</Badge>
      case 'early_departure':
        return <Badge className="bg-orange-500">Early Departure</Badge>
      case 'overtime':
        return <Badge className="bg-blue-500">Overtime</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatTime = (time: string | null) => {
    if (!time) return '--:--'
    const [hours, minutes] = time.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${minutes} ${ampm}`
  }

  // Calculate statistics
  const stats = {
    total: attendance.length,
    present: attendance.filter(a => a.status === 'present').length,
    late: attendance.filter(a => a.status === 'late').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    averageHours: attendance.filter(a => a.total_hours).length > 0
      ? (attendance.filter(a => a.total_hours).reduce((sum, a) => sum + (a.total_hours || 0), 0) / attendance.filter(a => a.total_hours).length).toFixed(1)
      : '0'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
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
            Employee Attendance
          </h1>
          <p className="text-muted-foreground text-lg">
            Track employee attendance and time records
          </p>
        </div>
        <Link href="/employees">
          <Button variant="outline">
            <Users className="mr-2 h-4 w-4" />
            View Employees
          </Button>
        </Link>
      </div>

      {/* Attendance Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-blue-900">Total Records</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
            <p className="text-xs text-blue-700">Today's records</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-green-900">Present</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-green-900">{stats.present}</div>
            <p className="text-xs text-green-700">Clocked in</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-yellow-900">Late</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-yellow-900">{stats.late}</div>
            <p className="text-xs text-yellow-700">Arrived late</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-red-900">Absent</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-red-900">{stats.absent}</div>
            <p className="text-xs text-red-700">Not present</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-purple-900">Avg Hours</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-purple-900">{stats.averageHours}</div>
            <p className="text-xs text-purple-700">Per employee</p>
          </CardContent>
        </Card>
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
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="early_departure">Early Departure</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Records */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredAttendance.map((record) => (
          <Card key={record.id} className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900/50 shadow-md hover:shadow-lg transition-all">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {record.employee.first_name} {record.employee.last_name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{record.employee.employee_id}</p>
                  <p className="text-sm text-muted-foreground">{record.employee.designation}</p>
                </div>
                {getStatusBadge(record.status)}
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Date:</span>
                <span className="text-sm text-slate-900">
                  {new Date(record.attendance_date).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600 flex items-center gap-1">
                  <LogIn className="h-3 w-3" /> Clock In:
                </span>
                <span className="text-sm text-slate-900">{formatTime(record.clock_in_time)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600 flex items-center gap-1">
                  <LogOut className="h-3 w-3" /> Clock Out:
                </span>
                <span className="text-sm text-slate-900">{formatTime(record.clock_out_time)}</span>
              </div>

              {record.total_hours && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Total Hours:</span>
                  <span className="text-sm font-semibold text-slate-900">{record.total_hours.toFixed(2)} hrs</span>
                </div>
              )}

              {record.late_minutes > 0 && (
                <div className="pt-2 border-t">
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    Late by {record.late_minutes} min
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAttendance.length === 0 && (
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950/20 dark:to-slate-900/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              {searchTerm ? "No attendance records found" : "No attendance records yet"}
            </h3>
            <p className="text-muted-foreground text-center">
              {searchTerm
                ? `No records match "${searchTerm}". Try adjusting your search.`
                : "Employee attendance will appear here when they clock in."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
