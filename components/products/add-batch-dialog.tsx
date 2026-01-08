"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Product, Supplier, PurchaseOrder } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Package } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AddBatchDialogProps {
  product: Product
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddBatchDialog({ product, open, onOpenChange }: AddBatchDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [formData, setFormData] = useState({
    batch_number: "",
    supplier_id: "",
    purchase_order_id: "",
    manufacturing_date: "",
    expiry_date: "",
    received_date: new Date().toISOString().split('T')[0],
    initial_quantity: "",
    unit_cost: "",
    storage_location: "",
    quality_status: "pending",
    quality_notes: ""
  })

  // Fetch suppliers and purchase orders when dialog opens
  const fetchData = async () => {
    try {
      const [suppliersRes, ordersRes] = await Promise.all([
        fetch('/api/suppliers'),
        fetch('/api/purchase-orders')
      ])

      if (suppliersRes.ok) {
        const suppliersData = await suppliersRes.json()
        setSuppliers(suppliersData.suppliers || [])
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json()
        setPurchaseOrders(ordersData.orders || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/product-batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          product_id: product.id,
          initial_quantity: parseInt(formData.initial_quantity),
          unit_cost: formData.unit_cost ? parseFloat(formData.unit_cost) : null,
          supplier_id: formData.supplier_id || null,
          purchase_order_id: formData.purchase_order_id || null,
          manufacturing_date: formData.manufacturing_date || null,
          expiry_date: formData.expiry_date || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create batch')
      }

      toast({
        title: "Success",
        description: "Product batch created successfully",
      })

      onOpenChange(false)
      setFormData({
        batch_number: "",
        supplier_id: "",
        purchase_order_id: "",
        manufacturing_date: "",
        expiry_date: "",
        received_date: new Date().toISOString().split('T')[0],
        initial_quantity: "",
        unit_cost: "",
        storage_location: "",
        quality_status: "pending",
        quality_notes: ""
      })

      router.refresh()
    } catch (error) {
      console.error('Error creating batch:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create batch",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg">
          <Plus className="mr-2 h-4 w-4" />
          Add Batch
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Add Product Batch
          </DialogTitle>
          <DialogDescription>
            Create a new batch for {product.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="batch_number">Batch Number *</Label>
              <Input
                id="batch_number"
                value={formData.batch_number}
                onChange={(e) => setFormData(prev => ({ ...prev, batch_number: e.target.value }))}
                placeholder="e.g., BATCH-2024-001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="received_date">Received Date *</Label>
              <Input
                id="received_date"
                type="date"
                value={formData.received_date}
                onChange={(e) => setFormData(prev => ({ ...prev, received_date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier_id">Supplier</Label>
              <Select value={formData.supplier_id} onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}>
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

            <div className="space-y-2">
              <Label htmlFor="purchase_order_id">Purchase Order</Label>
              <Select value={formData.purchase_order_id} onValueChange={(value) => setFormData(prev => ({ ...prev, purchase_order_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select purchase order" />
                </SelectTrigger>
                <SelectContent>
                  {purchaseOrders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.order_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manufacturing_date">Manufacturing Date</Label>
              <Input
                id="manufacturing_date"
                type="date"
                value={formData.manufacturing_date}
                onChange={(e) => setFormData(prev => ({ ...prev, manufacturing_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry_date">Expiry Date</Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="initial_quantity">Initial Quantity *</Label>
              <Input
                id="initial_quantity"
                type="number"
                min="1"
                value={formData.initial_quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, initial_quantity: e.target.value }))}
                placeholder="e.g., 100"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_cost">Unit Cost</Label>
              <Input
                id="unit_cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_cost}
                onChange={(e) => setFormData(prev => ({ ...prev, unit_cost: e.target.value }))}
                placeholder="e.g., 10.50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="storage_location">Storage Location</Label>
              <Input
                id="storage_location"
                value={formData.storage_location}
                onChange={(e) => setFormData(prev => ({ ...prev, storage_location: e.target.value }))}
                placeholder="e.g., Warehouse A, Shelf 3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quality_status">Quality Status</Label>
              <Select value={formData.quality_status} onValueChange={(value) => setFormData(prev => ({ ...prev, quality_status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="quarantined">Quarantined</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quality_notes">Quality Notes</Label>
            <Textarea
              id="quality_notes"
              value={formData.quality_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, quality_notes: e.target.value }))}
              placeholder="Any initial quality observations..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Batch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}