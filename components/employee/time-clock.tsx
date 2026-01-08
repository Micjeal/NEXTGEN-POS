"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, LogIn, LogOut, MapPin, Calendar, User, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"

interface TimeClockProps {
  employeeId: string
  employeeName: string
}

interface AttendanceRecord {
  id: string
  clock_in_time: string
  clock_out_time: string | null
  total_hours: number | null
  status: string
}

export default function TimeClock({ employeeId, employeeName }: TimeClockProps) {
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [attendanceRecord, setAttendanceRecord] = useState<AttendanceRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [location, setLocation] = useState<string | null>(null)

  useEffect(() => {
    fetchTodayAttendance()
    
    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // Get location if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`)
        },
        () => {
          setLocation("Location unavailable")
        }
      )
    }

    return () => clearInterval(timer)
  }, [employeeId])

  const fetchTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/employee-attendance?employee_id=${employeeId}&date=${today}`)
      const data = await response.json()
      
      if (data.attendance && data.attendance.length > 0) {
        const record = data.attendance[0]
        setAttendanceRecord(record)
        setIsClockedIn(!record.clock_out_time)
      } else {
        setAttendanceRecord(null)
        setIsClockedIn(false)
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClockIn = async () => {
    try {
      const clockInTime = currentTime.toTimeString().split(' ')[0]
      
      const response = await fetch('/api/employee-attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: employeeId,
          clock_in_time: clockInTime,
          clock_in_location: location,
          clock_in_method: 'geolocation'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAttendanceRecord(data.attendance)
        setIsClockedIn(true)
        toast.success("Clocked in successfully!")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to clock in")
      }
    } catch (error) {
      console.error('Error clocking in:', error)
      toast.error("Failed to clock in")
    }
  }

  const handleClockOut = async () => {
    if (!attendanceRecord) return

    try {
      const clockOutTime = currentTime.toTimeString().split(' ')[0]
      
      const response = await fetch('/api/employee-attendance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: attendanceRecord.id,
          clock_out_time: clockOutTime,
          clock_out_location: location,
          clock_out_method: 'geolocation'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAttendanceRecord(data.attendance)
        setIsClockedIn(false)
        toast.success("Clocked out successfully!")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to clock out")
      }
    } catch (error) {
      console.error('Error clocking out:', error)
      toast.error("Failed to clock out")
    }
  }

  const formatTime = (time: string) => {
    if (!time) return '--:--'
    const [hours, minutes] = time.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${minutes} ${ampm}`
  }

  const getStatusBadge = () => {
    if (!attendanceRecord) return null
    
    switch (attendanceRecord.status) {
      case 'present':
        return <Badge className="bg-green-500">Present</Badge>
      case 'late':
        return <Badge className="bg-yellow-500">Late</Badge>
      case 'absent':
        return <Badge className="bg-red-500">Absent</Badge>
      default:
        return <Badge variant="secondary">{attendanceRecord.status}</Badge>
    }
  }

  return (
    <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900/50 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Clock className="h-5 w-5 text-blue-600" />
          Time Clock
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Time Display */}
        <div className="text-center py-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg">
          <div className="text-4xl font-bold text-slate-900 dark:text-slate-100">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Employee Info */}
        <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <User className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{employeeName}</p>
            <p className="text-xs text-muted-foreground">Employee ID: {employeeId}</p>
          </div>
        </div>

        {/* Location */}
        {location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{location}</span>
          </div>
        )}

        {/* Clock Status */}
        {attendanceRecord && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <LogIn className="h-4 w-4" />
                Clock In
              </div>
              <p className="text-lg font-semibold">{formatTime(attendanceRecord.clock_in_time)}</p>
            </div>
            
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <LogOut className="h-4 w-4" />
                Clock Out
              </div>
              <p className="text-lg font-semibold">
                {attendanceRecord.clock_out_time ? formatTime(attendanceRecord.clock_out_time) : '--:--'}
              </p>
            </div>
          </div>
        )}

        {/* Total Hours */}
        {attendanceRecord?.total_hours && (
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Total Hours Today</span>
            </div>
            <span className="text-lg font-bold text-green-600">
              {attendanceRecord.total_hours.toFixed(2)} hrs
            </span>
          </div>
        )}

        {/* Status Badge */}
        {attendanceRecord && (
          <div className="flex justify-center">
            {getStatusBadge()}
          </div>
        )}

        {/* Clock In/Out Button */}
        <div className="pt-2">
          {isClockedIn ? (
            <Button
              onClick={handleClockOut}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
              size="lg"
            >
              <LogOut className="mr-2 h-5 w-5" />
              Clock Out
            </Button>
          ) : (
            <Button
              onClick={handleClockIn}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              size="lg"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Clock In
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
