"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  TrendingUp,
  Star,
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

interface EmployeePerformance {
  id: string
  employee_id: string
  review_period_start: string
  review_period_end: string
  reviewer_id: string | null
  rating: number | null
  goals_achievement: number | null
  customer_satisfaction: number | null
  sales_performance: number | null
  punctuality: number | null
  teamwork: number | null
  comments: string | null
  improvement_areas: string | null
  created_at: string
  employee: {
    first_name: string
    last_name: string
    employee_id: string
    designation: string
  }
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

export default function EmployeePerformancePage() {
  const [performances, setPerformances] = useState<EmployeePerformance[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    employee_id: "",
    review_period_start: "",
    review_period_end: "",
    reviewer_id: "",
    rating: "",
    goals_achievement: "",
    customer_satisfaction: "",
    sales_performance: "",
    punctuality: "",
    teamwork: "",
    comments: "",
    improvement_areas: ""
  })

  const fetchPerformances = async () => {
    try {
      const response = await fetch('/api/employee-performance')
      const data = await response.json()
      setPerformances(data.performances || [])
      setEmployees(data.employees || [])
      setProfiles(data.profiles || [])
    } catch (error) {
      console.error('Error fetching performances:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPerformances()
  }, [])

  const handleAddReview = async () => {
    if (!formData.employee_id || !formData.review_period_start || !formData.review_period_end) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      const submitData: any = {
        employee_id: formData.employee_id,
        review_period_start: formData.review_period_start,
        review_period_end: formData.review_period_end,
        rating: formData.rating ? parseFloat(formData.rating) : null,
        goals_achievement: formData.goals_achievement ? parseFloat(formData.goals_achievement) : null,
        customer_satisfaction: formData.customer_satisfaction ? parseFloat(formData.customer_satisfaction) : null,
        sales_performance: formData.sales_performance ? parseFloat(formData.sales_performance) : null,
        punctuality: formData.punctuality ? parseFloat(formData.punctuality) : null,
        teamwork: formData.teamwork ? parseFloat(formData.teamwork) : null,
        comments: formData.comments || null,
        improvement_areas: formData.improvement_areas || null,
      }

      // Only include reviewer_id if it's not empty
      if (formData.reviewer_id) {
        submitData.reviewer_id = formData.reviewer_id
      }

      const response = await fetch('/api/employee-performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        toast.success("Performance review added successfully")
        setIsAddDialogOpen(false)
        setFormData({
          employee_id: "",
          review_period_start: "",
          review_period_end: "",
          reviewer_id: "",
          rating: "",
          goals_achievement: "",
          customer_satisfaction: "",
          sales_performance: "",
          punctuality: "",
          teamwork: "",
          comments: "",
          improvement_areas: ""
        })
        fetchPerformances() // Refresh the list
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to add performance review")
      }
    } catch (error) {
      console.error('Error adding performance review:', error)
      toast.error("Failed to add performance review")
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredPerformances = performances.filter(performance => {
    if (!searchTerm.trim()) return true

    const term = searchTerm.toLowerCase().trim()
    const firstName = performance.employee?.first_name?.toLowerCase() || ''
    const lastName = performance.employee?.last_name?.toLowerCase() || ''
    const employeeId = performance.employee?.employee_id?.toLowerCase() || ''

    return firstName.includes(term) ||
           lastName.includes(term) ||
           employeeId.includes(term)
  })

  const getRatingColor = (rating: number | null) => {
    if (!rating) return "secondary"
    if (rating >= 4.0) return "default"
    if (rating >= 3.0) return "secondary"
    return "destructive"
  }

  const getRatingText = (rating: number | null) => {
    if (!rating) return "Not rated"
    if (rating >= 4.5) return "Excellent"
    if (rating >= 4.0) return "Very Good"
    if (rating >= 3.5) return "Good"
    if (rating >= 3.0) return "Satisfactory"
    return "Needs Improvement"
  }

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
            Employee Performance
          </h1>
          <p className="text-muted-foreground text-lg">
            Track and manage employee performance reviews and ratings
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
              Add Review
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Performance Review</DialogTitle>
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
                <Label htmlFor="period_start" className="text-right">
                  Period Start *
                </Label>
                <Input
                  id="period_start"
                  type="date"
                  value={formData.review_period_start}
                  onChange={(e) => setFormData({...formData, review_period_start: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="period_end" className="text-right">
                  Period End *
                </Label>
                <Input
                  id="period_end"
                  type="date"
                  value={formData.review_period_end}
                  onChange={(e) => setFormData({...formData, review_period_end: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reviewer" className="text-right">
                  Reviewer
                </Label>
                <Select value={formData.reviewer_id} onValueChange={(value) => setFormData({...formData, reviewer_id: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select reviewer (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No reviewer</SelectItem>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rating" className="text-right">
                  Overall Rating
                </Label>
                <Input
                  id="rating"
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={formData.rating}
                  onChange={(e) => setFormData({...formData, rating: e.target.value})}
                  className="col-span-3"
                  placeholder="1.0 - 5.0"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="goals" className="text-right">
                  Goals Achievement (%)
                </Label>
                <Input
                  id="goals"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.goals_achievement}
                  onChange={(e) => setFormData({...formData, goals_achievement: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customer_sat" className="text-right">
                  Customer Satisfaction
                </Label>
                <Input
                  id="customer_sat"
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={formData.customer_satisfaction}
                  onChange={(e) => setFormData({...formData, customer_satisfaction: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sales_perf" className="text-right">
                  Sales Performance (%)
                </Label>
                <Input
                  id="sales_perf"
                  type="number"
                  min="0"
                  value={formData.sales_performance}
                  onChange={(e) => setFormData({...formData, sales_performance: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="punctuality" className="text-right">
                  Punctuality
                </Label>
                <Input
                  id="punctuality"
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={formData.punctuality}
                  onChange={(e) => setFormData({...formData, punctuality: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="teamwork" className="text-right">
                  Teamwork
                </Label>
                <Input
                  id="teamwork"
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={formData.teamwork}
                  onChange={(e) => setFormData({...formData, teamwork: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="comments" className="text-right">
                  Comments
                </Label>
                <Textarea
                  id="comments"
                  value={formData.comments}
                  onChange={(e) => setFormData({...formData, comments: e.target.value})}
                  className="col-span-3"
                  placeholder="Performance comments..."
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="improvements" className="text-right">
                  Improvement Areas
                </Label>
                <Textarea
                  id="improvements"
                  value={formData.improvement_areas}
                  onChange={(e) => setFormData({...formData, improvement_areas: e.target.value})}
                  className="col-span-3"
                  placeholder="Areas for improvement..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddReview} disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Review"}
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

      {/* Performance Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Reviews</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{performances.length}</div>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Performance reviews
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {performances.length > 0 ? (performances.reduce((sum, p) => sum + (p.rating || 0), 0) / performances.filter(p => p.rating).length).toFixed(1) : 0}
            </div>
            <p className="text-xs text-green-700 dark:text-green-300">
              Out of 5.0
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">High Performers</CardTitle>
            <Star className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {performances.filter(p => p.rating && p.rating >= 4.0).length}
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-300">
              Rating 4.0+
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {performances.filter(p => {
                const reviewDate = new Date(p.created_at)
                const now = new Date()
                return reviewDate.getMonth() === now.getMonth() && reviewDate.getFullYear() === now.getFullYear()
              }).length}
            </div>
            <p className="text-xs text-orange-700 dark:text-orange-300">
              Reviews this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Reviews Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPerformances.map((performance) => (
          <Card key={performance.id} className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900/50 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {performance.employee.first_name} {performance.employee.last_name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{performance.employee.employee_id}</p>
                  <p className="text-sm text-muted-foreground">{performance.employee.designation}</p>
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
                      Edit Review
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Review
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Period:</span>
                <span className="text-sm text-slate-900 dark:text-slate-100">
                  {new Date(performance.review_period_start).toLocaleDateString()} - {new Date(performance.review_period_end).toLocaleDateString()}
                </span>
              </div>

              {performance.rating && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Overall Rating:</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={getRatingColor(performance.rating)}>
                      {performance.rating}/5.0
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {getRatingText(performance.rating)}
                    </span>
                  </div>
                </div>
              )}

              {performance.goals_achievement && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Goals Achievement:</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {performance.goals_achievement}%
                  </span>
                </div>
              )}

              {performance.customer_satisfaction && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Customer Satisfaction:</span>
                  <span className="text-sm text-slate-900 dark:text-slate-100">
                    {performance.customer_satisfaction}/5.0
                  </span>
                </div>
              )}

              {performance.sales_performance && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Sales Performance:</span>
                  <span className="text-sm text-slate-900 dark:text-slate-100">
                    {performance.sales_performance}%
                  </span>
                </div>
              )}

              {performance.comments && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {performance.comments}
                  </p>
                </div>
              )}

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Reviewed: {new Date(performance.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPerformances.length === 0 && (
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950/20 dark:to-slate-900/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              {searchTerm ? "No performance reviews found" : "No performance reviews yet"}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm
                ? `No reviews match "${searchTerm}". Try searching by employee name or ID.`
                : "Get started by conducting your first employee performance review."
              }
            </p>
            {!searchTerm && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Conduct First Review
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