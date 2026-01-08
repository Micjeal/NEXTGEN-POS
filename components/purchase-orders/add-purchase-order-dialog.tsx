"use client"

import { useState, useEffect } from "react"
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
import { Loader2, FileText, Plus, Trash2, Package, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface AddPurchaseOrderDialogProps {
  supplierId?: string
  suppliers: any[]
  products: any[]
  onOrderAdded?: () => void
}

interface OrderItem {
  product_id: string
  product_name: string
  quantity_ordered: number
  unit_price: number
  tax_rate: number
  discount_rate: number
}

export function AddPurchaseOrderDialog({ supplierId, suppliers, products, onOrderAdded }: AddPurchaseOrderDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    supplier_id: supplierId || "",
    order_number: "",
    expected_delivery_date: "",
    payment_terms: "",
    notes: "",
  })
  const [items, setItems] = useState<OrderItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState("")
  const [itemQuantity, setItemQuantity] = useState(1)
  const [itemPrice, setItemPrice] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (open && !supplierId) {
      // Generate order number
      const today = new Date()
      const orderNum = `PO-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}-${Date.now().toString(36).toUpperCase()}`
      setFormData(prev => ({ ...prev, order_number: orderNum }))
    }
  }, [open, supplierId])

  const addItem = () => {
    if (!selectedProduct) {
      toast({
        title: "Error",
        description: "Please select a product",
        variant: "destructive",
      })
      return
    }

    const product = products.find(p => p.id === selectedProduct)
    if (!product) return

    setItems(prev => [
      ...prev,
      {
        product_id: selectedProduct,
        product_name: product.name,
        quantity_ordered: itemQuantity,
        unit_price: parseFloat(itemPrice) || 0,
        tax_rate: 0,
        discount_rate: 0,
      },
    ])

    setSelectedProduct("")
    setItemQuantity(1)
    setItemPrice("")
  }

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const itemTotal = item.quantity_ordered * item.unit_price
      const tax = (itemTotal * item.tax_rate) / 100
      const discount = (itemTotal * item.discount_rate) / 100
      return sum + itemTotal + tax - discount
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.supplier_id || !formData.order_number) {
      toast({
        title: "Validation Error",
        description: "Supplier and order number are required",
        variant: "destructive",
      })
      return
    }

    if (items.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one item to the order",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Create order
      const response = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier_id: formData.supplier_id,
          order_number: formData.order_number,
          total_amount: calculateTotal(),
          expected_delivery_date: formData.expected_delivery_date || null,
          payment_terms: formData.payment_terms || null,
          notes: formData.notes || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create order")
      }

      const { order } = await response.json()

      // Add order items
      for (const item of items) {
        await fetch("/api/purchase-order-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            purchase_order_id: order.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity_ordered: item.quantity_ordered,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate,
            discount_rate: item.discount_rate,
          }),
        })
      }

      toast({
        title: "Success",
        description: `Purchase order ${formData.order_number} created successfully`,
      })

      setOpen(false)
      setFormData({
        supplier_id: supplierId || "",
        order_number: "",
        expected_delivery_date: "",
        payment_terms: "",
        notes: "",
      })
      setItems([])

      if (onOrderAdded) {
        onOrderAdded()
      } else {
        router.refresh()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create order",
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
          Create Order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
          <DialogDescription>
            Create a new purchase order for a supplier
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
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

            <div className="space-y-2">
              <Label htmlFor="order_number">Order Number *</Label>
              <Input
                id="order_number"
                value={formData.order_number}
                onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
                placeholder="e.g., PO-2024-001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_delivery_date">Expected Delivery</Label>
              <Input
                id="expected_delivery_date"
                type="date"
                value={formData.expected_delivery_date}
                onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_terms">Payment Terms</Label>
              <Input
                id="payment_terms"
                value={formData.payment_terms}
                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                placeholder="e.g., Net 30"
              />
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Order Items</Label>
              <span className="text-sm text-muted-foreground">{items.length} item(s)</span>
            </div>

            {/* Add Item Form */}
            <div className="grid grid-cols-5 gap-2 p-4 bg-muted rounded-lg">
              <div className="col-span-2">
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Input
                  type="number"
                  min="1"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                  placeholder="Qty"
                />
              </div>
              <div>
                <Input
                  type="number"
                  step="0.01"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  placeholder="Price"
                />
              </div>
              <Button type="button" variant="outline" size="icon" onClick={addItem}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Items List */}
            {items.length > 0 && (
              <div className="border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-left">Product</th>
                      <th className="p-3 text-right">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-3">{item.product_name}</td>
                        <td className="p-3 text-right">{item.quantity_ordered}</td>
                        <td className="p-3 text-right">UGX {item.unit_price.toLocaleString()}</td>
                        <td className="p-3 text-right">
                          UGX {(item.quantity_ordered * item.unit_price).toLocaleString()}
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted font-bold">
                    <tr>
                      <td colSpan={3} className="p-3 text-right">Total:</td>
                      <td className="p-3 text-right">UGX {calculateTotal().toLocaleString()}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes for the order"
              rows={3}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Create Order
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
