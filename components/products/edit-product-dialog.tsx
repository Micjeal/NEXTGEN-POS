"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Product, Category } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface EditProductDialogProps {
  product: Product | null
  categories: Category[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditProductDialog({ product, categories, open, onOpenChange }: EditProductDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    barcode: "",
    category_id: "",
    price: "",
    cost_price: "",
    tax_rate: "",
    is_active: true,
    expiry_date: "",
  })
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        barcode: product.barcode || "",
        category_id: product.category_id || "",
        price: product.price.toString(),
        cost_price: product.cost_price.toString(),
        tax_rate: product.tax_rate.toString(),
        is_active: product.is_active,
        expiry_date: product.expiry_date ? product.expiry_date.split('T')[0] : "",
      })
    }
  }, [product])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return
    setIsLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("products")
        .update({
          name: formData.name,
          barcode: formData.barcode || null,
          category_id: formData.category_id || null,
          price: Number.parseFloat(formData.price),
          cost_price: Number.parseFloat(formData.cost_price) || 0,
          tax_rate: Number.parseFloat(formData.tax_rate) || 0,
          is_active: formData.is_active,
          expiry_date: formData.expiry_date || null,
        })
        .eq("id", product.id)

      if (error) throw error

      toast({
        title: "Product Updated",
        description: `${formData.name} has been updated`,
      })

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update product",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>Update product information</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Product Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-barcode">Barcode</Label>
                <Input
                  id="edit-barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-expiry">Expiry Date</Label>
                <Input
                  id="edit-expiry"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-price">Selling Price *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-cost">Cost Price</Label>
                <Input
                  id="edit-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-tax">Tax Rate (%)</Label>
                <Input
                  id="edit-tax"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="edit-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="edit-active">Active</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
