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
import { Switch } from "@/components/ui/switch"
import { Plus, Loader2, Package, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface AddSupplierProductDialogProps {
  supplierId: string
  onProductAdded?: () => void
}

interface Product {
  id: string
  name: string
  barcode: string
  category?: { name: string }
}

export function AddSupplierProductDialog({ supplierId, onProductAdded }: AddSupplierProductDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    product_id: "",
    supplier_product_code: "",
    supplier_price: "",
    minimum_order_quantity: "1",
    lead_time_days: "7",
    is_preferred_supplier: false,
  })
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (open && searchTerm.length >= 2) {
      fetchProducts()
    }
  }, [open, searchTerm])

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/products?search=${encodeURIComponent(searchTerm)}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.product_id) {
      toast({
        title: "Validation Error",
        description: "Please select a product",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/supplier-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier_id: supplierId,
          product_id: formData.product_id,
          supplier_product_code: formData.supplier_product_code || null,
          supplier_price: formData.supplier_price || null,
          minimum_order_quantity: parseInt(formData.minimum_order_quantity),
          lead_time_days: parseInt(formData.lead_time_days),
          is_preferred_supplier: formData.is_preferred_supplier,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add product")
      }

      toast({
        title: "Success",
        description: "Product added to supplier catalog",
      })

      setOpen(false)
      setFormData({
        product_id: "",
        supplier_product_code: "",
        supplier_price: "",
        minimum_order_quantity: "1",
        lead_time_days: "7",
        is_preferred_supplier: false,
      })

      if (onProductAdded) {
        onProductAdded()
      } else {
        router.refresh()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add product",
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
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Product to Supplier</DialogTitle>
          <DialogDescription>
            Add a product to this supplier's catalog
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Product *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            {searchTerm.length >= 2 && products.length > 0 && (
              <Select
                value={formData.product_id}
                onValueChange={(value) => setFormData({ ...formData, product_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} {product.barcode && `(${product.barcode})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier_product_code">Supplier Product Code</Label>
              <Input
                id="supplier_product_code"
                value={formData.supplier_product_code}
                onChange={(e) => setFormData({ ...formData, supplier_product_code: e.target.value })}
                placeholder="e.g., SP-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier_price">Supplier Price (UGX)</Label>
              <Input
                id="supplier_price"
                type="number"
                step="0.01"
                value={formData.supplier_price}
                onChange={(e) => setFormData({ ...formData, supplier_price: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minimum_order_quantity">Min Order Qty</Label>
              <Input
                id="minimum_order_quantity"
                type="number"
                min="1"
                value={formData.minimum_order_quantity}
                onChange={(e) => setFormData({ ...formData, minimum_order_quantity: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead_time_days">Lead Time (Days)</Label>
              <Input
                id="lead_time_days"
                type="number"
                min="1"
                value={formData.lead_time_days}
                onChange={(e) => setFormData({ ...formData, lead_time_days: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_preferred_supplier"
              checked={formData.is_preferred_supplier}
              onCheckedChange={(checked) => setFormData({ ...formData, is_preferred_supplier: checked })}
            />
            <Label htmlFor="is_preferred_supplier">Preferred Supplier</Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-4 w-4" />
                  Add Product
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
