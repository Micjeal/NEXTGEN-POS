"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { PurchaseOrder, Supplier } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface EditPurchaseOrderDialogProps {
  order: PurchaseOrder | null
  suppliers: Supplier[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditPurchaseOrderDialog({ order, suppliers, open, onOpenChange }: EditPurchaseOrderDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    supplier_id: "",
    order_number: "",
    status: "",
    total_amount: "",
    tax_amount: "",
    discount_amount: "",
    shipping_amount: "",
    expected_delivery_date: "",
    actual_delivery_date: "",
    payment_terms: "",
    notes: "",
  })
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (order) {
      setFormData({
        supplier_id: order.supplier_id,
        order_number: order.order_number,
        status: order.status,
        total_amount: order.total_amount.toString(),
        tax_amount: order.tax_amount.toString(),
        discount_amount: order.discount_amount.toString(),
        shipping_amount: order.shipping_amount.toString(),
        expected_delivery_date: order.expected_delivery_date || "",
        actual_delivery_date: order.actual_delivery_date || "",
        payment_terms: order.payment_terms || "",
        notes: order.notes || "",
      })
    }
  }, [order])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!order) return
    setIsLoading(true)

    try {
      const orderData = {
        id: order.id,
        supplier_id: formData.supplier_id,
        order_number: formData.order_number.trim(),
        status: formData.status,
        total_amount: Number.parseFloat(formData.total_amount) || 0,
        tax_amount: Number.parseFloat(formData.tax_amount) || 0,
        discount_amount: Number.parseFloat(formData.discount_amount) || 0,
        shipping_amount: Number.parseFloat(formData.shipping_amount) || 0,
        expected_delivery_date: formData.expected_delivery_date || null,
        actual_delivery_date: formData.actual_delivery_date || null,
        payment_terms: formData.payment_terms.trim() || null,
        notes: formData.notes.trim() || null,
      }

      const response = await fetch('/api/purchase-orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        let errorMessage = `Failed to update purchase order: ${response.status}`
        let shouldShowError = true
        
        try {
          const errorText = await response.text()
          const errorData = JSON.parse(errorText)
          
          if (response.status === 404) {
            // Close the dialog first
            onOpenChange(false)
            // Then refresh the page to get the latest data
            router.refresh()
            // Show a toast with the error message
            toast({
              title: "Purchase Order Not Found",
              description: "The purchase order could not be found. The page has been refreshed with the latest data.",
              variant: "destructive",
            })
            // Don't show the error again since we've already handled it
            shouldShowError = false
          } else {
            errorMessage = errorData.error || errorMessage
          }
        } catch (parseError) {
          // If response is not JSON, use the raw text
          errorMessage = `Failed to update purchase order: ${response.status}`
        }
        
        if (shouldShowError) {
          throw new Error(errorMessage)
        } else {
          return // Exit the function early since we've handled the 404 case
        }
      }

      toast({
        title: "Purchase Order Updated",
        description: `${formData.order_number} has been updated`,
      })

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating purchase order:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update purchase order",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Purchase Order</DialogTitle>
          <DialogDescription>Update purchase order information</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6">
            {/* Basic Information */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="edit-supplier_id">Supplier *</Label>
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-order_number">Order Number *</Label>
                  <Input
                    id="edit-order_number"
                    value={formData.order_number}
                    onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="ordered">Ordered</SelectItem>
                      <SelectItem value="partially_received">Partially Received</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-expected_delivery_date">Expected Delivery Date</Label>
                  <Input
                    id="edit-expected_delivery_date"
                    type="date"
                    value={formData.expected_delivery_date}
                    onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-actual_delivery_date">Actual Delivery Date</Label>
                  <Input
                    id="edit-actual_delivery_date"
                    type="date"
                    value={formData.actual_delivery_date}
                    onChange={(e) => setFormData({ ...formData, actual_delivery_date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Financial Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="edit-total_amount">Total Amount (UGX)</Label>
                  <Input
                    id="edit-total_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.total_amount}
                    onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-tax_amount">Tax Amount (UGX)</Label>
                  <Input
                    id="edit-tax_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.tax_amount}
                    onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-discount_amount">Discount Amount (UGX)</Label>
                  <Input
                    id="edit-discount_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discount_amount}
                    onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-shipping_amount">Shipping Amount (UGX)</Label>
                  <Input
                    id="edit-shipping_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.shipping_amount}
                    onChange={(e) => setFormData({ ...formData, shipping_amount: e.target.value })}
                  />
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="edit-payment_terms">Payment Terms</Label>
                  <Input
                    id="edit-payment_terms"
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
              <div className="grid gap-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            {/* Form Footer */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}