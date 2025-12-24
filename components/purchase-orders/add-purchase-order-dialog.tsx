"use client"

import type React from "react"
import { useState } from "react"
import type { PurchaseOrder, Supplier } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface AddPurchaseOrderDialogProps {
  suppliers: Supplier[]
  onOrderAdded?: (order: PurchaseOrder) => void
}

export function AddPurchaseOrderDialog({ suppliers, onOrderAdded }: AddPurchaseOrderDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    supplier_id: "",
    order_number: "",
    status: "draft",
    total_amount: "",
    tax_amount: "",
    discount_amount: "",
    shipping_amount: "",
    expected_delivery_date: "",
    payment_terms: "",
    notes: "",
  })
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!formData.supplier_id || !formData.order_number.trim()) {
      toast({
        title: "Validation Error",
        description: "Supplier and order number are required",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const orderData = {
        supplier_id: formData.supplier_id,
        order_number: formData.order_number.trim(),
        status: formData.status,
        total_amount: formData.total_amount ? Number.parseFloat(formData.total_amount) : 0,
        tax_amount: formData.tax_amount ? Number.parseFloat(formData.tax_amount) : 0,
        discount_amount: formData.discount_amount ? Number.parseFloat(formData.discount_amount) : 0,
        shipping_amount: formData.shipping_amount ? Number.parseFloat(formData.shipping_amount) : 0,
        expected_delivery_date: formData.expected_delivery_date || null,
        payment_terms: formData.payment_terms.trim() || null,
        notes: formData.notes.trim() || null,
      }

      const response = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to create purchase order: ${response.status}`)
      }

      const { order } = await response.json()

      toast({
        title: "Success",
        description: `Purchase order ${formData.order_number} has been created`,
      })

      // Reset form
      setOpen(false)
      setFormData({
        supplier_id: "",
        order_number: "",
        status: "draft",
        total_amount: "",
        tax_amount: "",
        discount_amount: "",
        shipping_amount: "",
        expected_delivery_date: "",
        payment_terms: "",
        notes: "",
      })

      // Notify parent component
      if (onOrderAdded) {
        onOrderAdded(order)
      }

      // Refresh the page to show the new order
      router.refresh()
    } catch (error) {
      console.error('Error creating purchase order:', error)
      toast({
        title: "Error Creating Purchase Order",
        description: error instanceof Error ? error.message : "Failed to create purchase order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Purchase Order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">Add New Purchase Order</DialogTitle>
              <DialogDescription>
                Create a new purchase order for a supplier
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6">
            {/* Basic Information */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-md">
                  <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold">Basic Information</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="supplier_id">Supplier *</Label>
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
                  <Label htmlFor="order_number">Order Number *</Label>
                  <Input
                    id="order_number"
                    value={formData.order_number}
                    onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
                    placeholder="Enter order number"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
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
                  <Label htmlFor="expected_delivery_date">Expected Delivery Date</Label>
                  <Input
                    id="expected_delivery_date"
                    type="date"
                    value={formData.expected_delivery_date}
                    onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Financial Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="total_amount">Total Amount (UGX)</Label>
                  <Input
                    id="total_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.total_amount}
                    onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="tax_amount">Tax Amount (UGX)</Label>
                  <Input
                    id="tax_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.tax_amount}
                    onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="discount_amount">Discount Amount (UGX)</Label>
                  <Input
                    id="discount_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discount_amount}
                    onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="shipping_amount">Shipping Amount (UGX)</Label>
                  <Input
                    id="shipping_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.shipping_amount}
                    onChange={(e) => setFormData({ ...formData, shipping_amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="payment_terms">Payment Terms</Label>
                  <Input
                    id="payment_terms"
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    placeholder="e.g., Net 30, COD"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about the purchase order"
                  rows={3}
                />
              </div>
            </div>

            {/* Form Footer */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Purchase Order
                    </>
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