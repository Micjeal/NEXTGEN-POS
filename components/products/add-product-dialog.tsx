"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import type { Category, Supplier } from "@/lib/types/database"
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
import { Plus, Upload, X, Loader2, Image as ImageIcon, Package, Building2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { v4 as uuidv4 } from "uuid"

interface AddProductDialogProps {
  categories: Category[]
  suppliers: Supplier[]
}

export function AddProductDialog({ categories, suppliers }: AddProductDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    barcode: "",
    category_id: "",
    price: "",
    cost_price: "",
    tax_rate: "0",
    is_active: true,
    image_url: "",
    expiry_date: "",
    // Supplier fields
    supplier_id: "",
    supplier_price: "",
    minimum_order_quantity: "1",
    lead_time_days: "7",
    is_preferred_supplier: false,
  })
  const router = useRouter()
  const { toast } = useToast()

  const handleImageUpload = async (file: File) => {
    if (!file) return null

    console.log('Starting image upload for file:', file.name, 'Size:', file.size, 'Type:', file.type)
    setIsUploading(true)
    const supabase = createClient()

    // Check authentication first
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Authentication error:', authError)
      throw new Error('You must be logged in to upload images')
    }
    console.log('User authenticated:', user.id)

    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = `product-images/${fileName}`

    try {
      // Validate file
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

      console.log('File validation:', {
        fileName: file.name,
        fileExt: fileExt,
        mimeType: file.type,
        allowedExtensions,
        allowedMimeTypes
      })

      // Check MIME type first (more reliable)
      if (!allowedMimeTypes.includes(file.type)) {
        throw new Error(`Invalid file type. Please upload image files (JPG, PNG, GIF, WebP). Detected MIME type: ${file.type}`)
      }

      // If file has extension, check it too (but don't fail if no extension)
      if (fileExt && !allowedExtensions.includes(fileExt)) {
        console.warn(`File extension '${fileExt}' not in allowed list, but MIME type is valid. Proceeding with upload.`)
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('File size too large. Please upload images smaller than 5MB.')
      }

      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets()
      if (listError) {
        console.error('Error listing buckets:', listError)
        throw new Error('Unable to access storage. Please check your configuration.')
      }

      const bucketExists = buckets.some(bucket => bucket.name === 'products')
      if (!bucketExists) {
        console.warn('Products bucket does not exist')
        toast({
          title: "Storage Not Configured",
          description: "Image upload is not available. Product will be created without an image.",
          variant: "default",
        })
        return null
      }

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error details:', uploadError)
        throw new Error(uploadError.message || 'Failed to upload image to storage')
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)

      const errorMessage = error instanceof Error ? error.message : "Failed to upload image"
      console.error('Final error message:', errorMessage)

      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      })
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Reset error state
    setError(null)

    // Basic validation
    if (!formData.name.trim()) {
      setError("Product name is required")
      return
    }

    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      setError("Please enter a valid price")
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        throw new Error(`Authentication error: ${userError.message}`)
      }
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Test database connection
      console.log('Testing Supabase connection...')
      const { data: testData, error: testError } = await supabase
        .from('categories')
        .select('id')
        .limit(1)

      if (testError) {
        console.error('Database connection test failed:', testError)
        throw new Error(`Database connection failed: ${testError.message}`)
      }

      console.log('Database connection OK, proceeding with product creation...')

      // Check user role
      console.log('Checking user role...')
      const { data: profile, error: roleError } = await supabase
        .from('profiles')
        .select('*, role:roles(*)')
        .eq('id', user.id)
        .single()

      console.log('User profile check:', { profile, error: roleError })

      if (roleError) {
        throw new Error(`Failed to get user profile: ${roleError.message}`)
      }

      if (!profile) {
        throw new Error('User profile not found')
      }

      const userRole = profile.role?.name
      console.log('User role:', userRole)

      if (!['admin', 'manager'].includes(userRole || '')) {
        throw new Error(`Insufficient permissions. User role: ${userRole}`)
      }

      let imageUrl = formData.image_url
      let uploadFailed = false

      // Handle image upload if there's a file selected
      if (fileInputRef.current?.files?.[0]) {
        const file = fileInputRef.current.files[0]
        const uploadedUrl = await handleImageUpload(file)
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        } else {
          uploadFailed = true
        }
      }

      // Create the product via API
      console.log('Creating product via API...')
      const productData = {
        name: formData.name.trim(),
        barcode: formData.barcode.trim() || null,
        category_id: formData.category_id || null,
        price: Number.parseFloat(formData.price),
        cost_price: formData.cost_price ? Number.parseFloat(formData.cost_price) : 0,
        tax_rate: formData.tax_rate ? Number.parseFloat(formData.tax_rate) : 0,
        is_active: formData.is_active,
        image_url: imageUrl || null,
        supplier_id: formData.supplier_id || null,
        supplier_price: formData.supplier_price ? Number.parseFloat(formData.supplier_price) : null,
        minimum_order_quantity: Number.parseInt(formData.minimum_order_quantity),
        lead_time_days: Number.parseInt(formData.lead_time_days),
        is_preferred_supplier: formData.is_preferred_supplier,
      }

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to create product: ${response.status}`)
      }

      const { product: newProduct } = await response.json()
      console.log('Product created successfully:', newProduct)

      if (uploadFailed) {
        toast({
          title: "Product Added",
          description: `${formData.name} has been added to the catalog, but image upload failed. Please try uploading the image again.`,
          variant: "default",
        })
      } else {
        toast({
          title: "Success",
          description: `${formData.name} has been added to the catalog${imageUrl ? ' with image' : ''}`,
        })
      }

      // Reset form
      setOpen(false)
      setError(null)
      setFormData({
        name: "",
        barcode: "",
        category_id: "",
        price: "",
        cost_price: "",
        tax_rate: "0",
        is_active: true,
        image_url: "",
        expiry_date: "",
        supplier_id: "",
        supplier_price: "",
        minimum_order_quantity: "1",
        lead_time_days: "7",
        is_preferred_supplier: false,
      })
      setImagePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      
      // Refresh the page to show the new product
      router.refresh()
    } catch (error) {
      console.error('Error creating product - Full error object:', error)
      console.error('Error type:', typeof error)
      console.error('Error keys:', error ? Object.keys(error) : 'No error object')
      console.error('Error toString:', error?.toString?.())
      console.error('Error constructor:', error?.constructor?.name)

      // Provide more specific error messages
      let errorMessage = "Failed to create product. Please try again."

      if (error && typeof error === 'object') {
        console.log('Error object contents:', JSON.stringify(error, null, 2))

        // Check for specific Supabase errors
        if ('code' in error) {
          const errorCode = (error as any).code
          console.log('Found error code:', errorCode)
          switch (errorCode) {
            case '23505':
              errorMessage = "A product with this barcode already exists."
              break
            case '23503':
              errorMessage = "Invalid category selected."
              break
            case '42501':
              errorMessage = "You don't have permission to add products."
              break
            default:
              errorMessage = `Database error (${errorCode}). Please try again.`
          }
        } else if ('message' in error && (error as any).message) {
            console.log('Found error message:', (error as any).message)
            const msg = (error as any).message
            // Provide user-friendly messages for common database errors
            if (msg.includes('duplicate key value violates unique constraint "products_barcode_key"')) {
              errorMessage = "A product with this barcode already exists. Please use a different barcode or leave it blank."
            } else if (msg.includes('duplicate key value violates unique constraint')) {
              errorMessage = "This information already exists in the system. Please check your entries and try again."
            } else {
              errorMessage = msg
            }
        } else if ('details' in error && (error as any).details) {
          console.log('Found error details:', (error as any).details)
          errorMessage = (error as any).details
        } else if ('hint' in error && (error as any).hint) {
          console.log('Found error hint:', (error as any).hint)
          errorMessage = (error as any).hint
        }
      } else if (error instanceof Error) {
        console.log('Standard Error instance:', error.message)
        errorMessage = error.message
      } else {
        console.log('Unknown error type:', error)
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Create image preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-slate-50 to-blue-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900/20">
        <DialogHeader className="pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">Add New Product</DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-400 mt-1">
                Create a new product in your catalog with supplier information
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">Product Creation Notice</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                aria-label="Dismiss notice"
              >
                <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6">
            {/* Product Information Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-md">
                  <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Product Information</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Left Column - Product Details */}
                <div className="space-y-4">
                  <div className="grid gap-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter product name"
                    required
                  />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
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
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="Scan or enter barcode"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="expiry_date">Expiry Date</Label>
                  <Input
                    id="expiry_date"
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  />
                </div>
              </div>

                {/* Right Column - Pricing & Image */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="price">Selling Price *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          min="0"
                          max="99999999.99"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="pl-8"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="cost_price">Cost Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          id="cost_price"
                          type="number"
                          step="0.01"
                          min="0"
                          max="99999999.99"
                          value={formData.cost_price}
                          onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                          className="pl-8"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                    <Input
                      id="tax_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.tax_rate}
                      onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Product Image</Label>
                    <div className="flex items-center gap-4">
                      <div className="relative h-24 w-24 overflow-hidden rounded-md border border-dashed border-gray-300 dark:border-gray-700">
                        {imagePreview ? (
                          <>
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={removeImage}
                              className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-white hover:bg-destructive/90"
                              aria-label="Remove image"
                              title="Remove image"
                            >
                              <X className="h-3 w-3" />
                              <span className="sr-only">Remove image</span>
                            </button>
                          </>
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                            <ImageIcon className="mb-1 h-6 w-6" />
                            <span className="text-xs">No image</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageChange}
                          accept="image/png, image/jpeg, image/gif, image/webp"
                          className="hidden"
                          id="product-image"
                          aria-label="Upload product image"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="mr-2 h-4 w-4" />
                          )}
                          {isUploading ? 'Uploading...' : 'Upload Image'}
                        </Button>
                        <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, GIF or WebP (max 5MB)</p>
                      </div>
                    </div>
                  </div>
                </div>
            </div>

            {/* Supplier Information Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-md">
                  <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Supplier Information</h3>
                <span className="text-sm text-slate-500 dark:text-slate-400">(Optional)</span>
              </div>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="supplier">Supplier</Label>
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
                    <Label htmlFor="supplier_price">Supplier Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="supplier_price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.supplier_price}
                        onChange={(e) => setFormData({ ...formData, supplier_price: e.target.value })}
                        className="pl-8"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="minimum_order_quantity">Min Order Quantity</Label>
                    <Input
                      id="minimum_order_quantity"
                      type="number"
                      min="1"
                      value={formData.minimum_order_quantity}
                      onChange={(e) => setFormData({ ...formData, minimum_order_quantity: e.target.value })}
                      placeholder="1"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="lead_time_days">Lead Time (Days)</Label>
                    <Input
                      id="lead_time_days"
                      type="number"
                      min="0"
                      value={formData.lead_time_days}
                      onChange={(e) => setFormData({ ...formData, lead_time_days: e.target.value })}
                      placeholder="7"
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
              </div>
            </div>

            {/* Form Footer */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active" className="text-sm font-medium">Active Product</Label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpen(false)
                      setError(null)
                      setImagePreview(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ""
                      }
                    }}
                    disabled={isLoading}
                    className="px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || isUploading}
                    className="px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Product
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
