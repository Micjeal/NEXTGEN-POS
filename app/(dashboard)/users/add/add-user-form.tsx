"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { Role } from "@/lib/types/database"

interface AddUserFormProps {
  roles: Role[]
}

export function AddUserForm({ roles }: AddUserFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    password: "",
    role_id: "",
    // Employee fields
    first_name: "",
    last_name: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    address: "",
    city: "",
    hire_date: "",
    designation: "",
    department: "",
    branch_id: "",
    salary: "",
    hourly_rate: "",
  })
  const router = useRouter()
  const supabase = createClient()

  const selectedRole = roles.find(role => role.id === formData.role_id)
  const isEmployeeRole = selectedRole && ['admin', 'manager', 'cashier'].includes(selectedRole.name)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to add user")
      }

      toast.success("User added successfully! They can now log in with their email and password.")
      router.push("/users")
    } catch (error: any) {
      toast.error(error.message || "Failed to add user")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add New User</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role_id} onValueChange={(value) => setFormData(prev => ({ ...prev, role_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isEmployeeRole && (
            <>
              <div className="border-t pt-4 mt-6">
                <h3 className="text-lg font-medium mb-4">Employee Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hire_date">Hire Date</Label>
                    <Input
                      id="hire_date"
                      type="date"
                      value={formData.hire_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, hire_date: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation</Label>
                    <Input
                      id="designation"
                      value={formData.designation}
                      onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                      placeholder="Cashier, Manager, etc."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="Sales, Operations, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="salary">Monthly Salary (UGX)</Label>
                    <Input
                      id="salary"
                      type="number"
                      value={formData.salary}
                      onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                      placeholder="500000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hourly_rate">Hourly Rate (UGX)</Label>
                    <Input
                      id="hourly_rate"
                      type="number"
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                      placeholder="15000"
                    />
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Street address"
                  />
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Kampala"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add User"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}