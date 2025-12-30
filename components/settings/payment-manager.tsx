"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Settings, Plus, Edit, Save, X, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { getUserPermissions } from "@/lib/utils"
import type { PaymentMethod } from "@/lib/types/database"

interface PaymentManagerProps {
  paymentMethods: PaymentMethod[]
}

export function PaymentManager({ paymentMethods: initialPaymentMethods }: PaymentManagerProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(initialPaymentMethods)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [formData, setFormData] = useState({ name: "", is_active: true })
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    const loadPermissions = async () => {
      const permissions = await getUserPermissions()
      setUserPermissions(permissions)
      setIsLoadingPermissions(false)
    }
    loadPermissions()
  }, [])

  const hasPermission = userPermissions.includes('manage_settings')

  if (isLoadingPermissions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Payment Methods
          </CardTitle>
          <CardDescription>Configure available payment options</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading permissions...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!hasPermission) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Payment Methods
          </CardTitle>
          <CardDescription>Configure available payment options</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">You don't have permission to manage payment methods.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const resetForm = () => {
    setFormData({ name: "", is_active: true })
    setEditingMethod(null)
  }

  const handleAdd = () => {
    resetForm()
    setIsAddDialogOpen(true)
  }

  const handleEdit = (method: PaymentMethod) => {
    setFormData({ name: method.name, is_active: method.is_active })
    setEditingMethod(method)
    setIsAddDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Payment method name is required",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingMethod) {
        // Update existing payment method
        const { error } = await supabase
          .from("payment_methods")
          .update({
            name: formData.name.trim(),
            is_active: formData.is_active,
          })
          .eq("id", editingMethod.id)

        if (error) throw error

        setPaymentMethods(prev => prev.map(method =>
          method.id === editingMethod.id
            ? { ...method, name: formData.name.trim(), is_active: formData.is_active }
            : method
        ))

        toast({
          title: "Success",
          description: "Payment method updated successfully",
        })
      } else {
        // Add new payment method
        const { data, error } = await supabase
          .from("payment_methods")
          .insert({
            name: formData.name.trim(),
            is_active: formData.is_active,
          })
          .select()
          .single()

        if (error) throw error

        setPaymentMethods(prev => [...prev, data])

        toast({
          title: "Success",
          description: "Payment method added successfully",
        })
      }

      setIsAddDialogOpen(false)
      resetForm()
    } catch (error: any) {
      console.error('Payment method operation failed:', error)
      toast({
        title: "Error",
        description: error?.message || "Failed to save payment method",
        variant: "destructive",
      })
    }
  }

  const handleToggleActive = async (method: PaymentMethod) => {
    try {
      const { error } = await supabase
        .from("payment_methods")
        .update({ is_active: !method.is_active })
        .eq("id", method.id)

      if (error) throw error

      setPaymentMethods(prev => prev.map(m =>
        m.id === method.id ? { ...m, is_active: !m.is_active } : m
      ))

      toast({
        title: "Success",
        description: `Payment method ${!method.is_active ? 'enabled' : 'disabled'}`,
      })
    } catch (error: any) {
      console.error('Toggle payment method failed:', error)
      toast({
        title: "Error",
        description: error?.message || "Failed to update payment method",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Payment Methods
            </CardTitle>
            <CardDescription>Configure available payment options</CardDescription>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Method
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${method.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <div>
                    <p className="font-semibold">{method.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {method.is_active ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(method)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Switch
                    checked={method.is_active}
                    onCheckedChange={() => handleToggleActive(method)}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? "Edit Payment Method" : "Add New Payment Method"}
            </DialogTitle>
            <DialogDescription>
              {editingMethod ? "Update payment method information" : "Create a new payment option"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Payment Method Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter payment method name"
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Active</Label>
                <p className="text-sm text-muted-foreground">Enable this payment method</p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false)
                  resetForm()
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                {editingMethod ? "Update" : "Create"} Payment Method
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}