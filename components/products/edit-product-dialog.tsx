"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import type { Product, Category } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
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
    const [isUploading, setIsUploading] = useState(false)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
   const [formData, setFormData] = useState({
     name: "",
     barcode: "",
     category_id: "",
     price: "",
     cost_price: "",
     tax_rate: "",
     is_active: true,
     expiry_date: "",
     image_url: "",
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
         image_url: product.image_url || "",
       })
       setImagePreview(product.image_url || null)
     } else {
       // Reset form when no product is selected
       setFormData({
         name: "",
         barcode: "",
         category_id: "",
         price: "",
         cost_price: "",
         tax_rate: "",
         is_active: true,
         expiry_date: "",
         image_url: "",
       })
       setImagePreview(null)
       if (fileInputRef.current) {
         fileInputRef.current.value = ""
       }
     }
   }, [product])

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      const supabase = createClient()

      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets()
      if (listError) {
        console.error('Error listing buckets:', listError)
        throw new Error('Unable to access storage. Please check your configuration.')
      }

      console.log('Available buckets:', buckets.map(b => b.name))
      const bucketExists = buckets.some(bucket => bucket.name === 'products')
      if (!bucketExists) {
        console.warn('Products bucket does not exist. Available buckets:', buckets.map(b => b.name))
        toast({
          title: "Storage Not Configured",
          description: "Image upload is not available. Product will be updated without an image.",
          variant: "default",
        })
        return
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `products/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath)

      setImagePreview(publicUrl)
      setFormData({ ...formData, image_url: publicUrl })
    } catch (error) {
      console.error('Image upload error:', error)
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setImagePreview(null)
    setFormData({ ...formData, image_url: "" })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return
    setIsLoading(true)

    try {
      const supabase = createClient()

      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('You must be logged in to edit products')
      }

      // Check user role
      const { data: profile, error: roleError } = await supabase
        .from('profiles')
        .select('*, role:roles(*)')
        .eq('id', user.id)
        .single()

      console.log('User profile check:', { profile, roleError })

      if (roleError || !profile) {
        console.error('Profile fetch error:', roleError)
        throw new Error('Unable to verify user permissions')
      }

      const userRole = profile.role?.name
      console.log('User role:', userRole)

      if (!['admin', 'manager'].includes(userRole || '')) {
        throw new Error(`Insufficient permissions to edit products. User role: ${userRole}`)
      }

      console.log('Updating product with data:', {
        id: product.id,
        name: formData.name,
        barcode: formData.barcode || null,
        category_id: formData.category_id || null,
        price: Number.parseFloat(formData.price),
        cost_price: Number.parseFloat(formData.cost_price) || 0,
        tax_rate: Number.parseFloat(formData.tax_rate) || 0,
        is_active: formData.is_active,
        expiry_date: formData.expiry_date || null,
      })

      const updateData: any = {
        name: formData.name,
        barcode: formData.barcode || null,
        category_id: formData.category_id || null,
        price: Number.parseFloat(formData.price),
        cost_price: Number.parseFloat(formData.cost_price) || 0,
        tax_rate: Number.parseFloat(formData.tax_rate) || 0,
        is_active: formData.is_active,
        image_url: formData.image_url || null,
      }

      // Only include expiry_date if it's not empty
      if (formData.expiry_date && formData.expiry_date.trim() !== '') {
        updateData.expiry_date = formData.expiry_date
      } else {
        updateData.expiry_date = null
      }

      console.log('Final update data:', updateData)

      const { error } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", product.id)

      if (error) {
        console.error('Database update error details:', JSON.stringify(error, null, 2))
        throw new Error(`Database error: ${error?.message || error?.details || 'Unknown error'}`)
      }

      toast({
        title: "Product Updated",
        description: `${formData.name} has been updated successfully`,
      })

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating product:', error)
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

            <div className="grid gap-2">
              <Label>Product Image</Label>
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  aria-label="Upload product image"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Choose Image"
                  )}
                </Button>
                {imagePreview && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemoveImage}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                )}
              </div>
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="max-w-32 max-h-32 object-cover rounded border"
                  />
                </div>
              )}
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
