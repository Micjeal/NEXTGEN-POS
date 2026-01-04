"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

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
}

interface Manager {
  id: string
  first_name: string
  last_name: string
}

interface EditBranchFormProps {
  branch: Branch
  managers: Manager[]
}

export function EditBranchForm({ branch, managers }: EditBranchFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: branch.name,
    code: branch.code,
    address: branch.address,
    city: branch.city,
    phone: branch.phone || "",
    email: branch.email || "",
    manager_id: branch.manager_id || "",
    is_headquarters: branch.is_headquarters,
    is_active: branch.is_active,
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/branches", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: branch.id, ...formData }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update branch")
      }

      toast.success("Branch updated successfully!")
      router.push(`/branches/${branch.id}`)
    } catch (error: any) {
      toast.error(error.message || "Failed to update branch")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Edit Branch Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Branch Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Main Branch"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Branch Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="MAIN001"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="123 Main Street"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Kampala"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+256 700 000 000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="branch@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager">Branch Manager</Label>
            <Select value={formData.manager_id} onValueChange={(value) => setFormData(prev => ({ ...prev, manager_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a manager" />
              </SelectTrigger>
              <SelectContent>
                {managers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.first_name} {manager.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_headquarters"
              checked={formData.is_headquarters}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_headquarters: checked as boolean }))}
            />
            <Label htmlFor="is_headquarters">This is the headquarters</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked as boolean }))}
            />
            <Label htmlFor="is_active">Branch is active</Label>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Branch"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}