"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { X, Plus } from "lucide-react"
import { toast } from "sonner"

interface Branch {
  id: string
  name: string
  code: string
}

interface Product {
  id: string
  name: string
  barcode: string
  category: {
    name: string
  }
  inventory: {
    quantity: number
  }[]
}

interface TransferItem {
  product_id: string
  product_name: string
  quantity: number
  available_quantity: number
}

interface AddStockTransferFormProps {
  branches: Branch[]
}

export function AddStockTransferForm({ branches }: AddStockTransferFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    from_branch_id: "",
    to_branch_id: "",
    notes: "",
  })
  const [transferItems, setTransferItems] = useState<TransferItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [productQuantities, setProductQuantities] = useState<Record<string, string>>({})
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    if (formData.from_branch_id) {
      fetchProducts(formData.from_branch_id)
      // Clear transfer items when branch changes
      setTransferItems([])
      setProductQuantities({})
    } else {
      fetchProducts()
    }
  }, [formData.from_branch_id])

  const fetchProducts = async (branchId?: string) => {
    try {
      let url = `/api/products`
      if (branchId) {
        url = `/api/branch-inventory?branchId=${branchId}`
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      const data = await response.json()

      if (branchId) {
        // Transform branch inventory data to match product format
        const transformedProducts = data.inventory?.map((item: any) => ({
          id: item.product_id,
          name: item.product_name,
          barcode: item.product_barcode,
          category: { name: item.category_name },
          inventory: [{ quantity: item.quantity }]
        })) || []
        setProducts(transformedProducts)
      } else {
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
    }
  }

  const handleAddProduct = (productId: string, quantity: number) => {
    if (!quantity || quantity <= 0) {
      toast.error("Please enter a valid quantity")
      return
    }

    const product = products.find(p => p.id === productId)
    if (!product) return

    const availableQuantity = product.inventory?.[0]?.quantity || 0

    if (quantity > availableQuantity) {
      toast.error(`Cannot transfer more than available quantity (${availableQuantity})`)
      return
    }

    // Check if product already added
    if (transferItems.some(item => item.product_id === productId)) {
      toast.error("Product already added to transfer")
      return
    }

    const newItem: TransferItem = {
      product_id: productId,
      product_name: product.name,
      quantity,
      available_quantity: availableQuantity
    }

    setTransferItems([...transferItems, newItem])

    // Update the available quantity in products
    const updatedProducts = products.map(p =>
      p.id === productId ? { ...p, inventory: [{ ...p.inventory[0], quantity: p.inventory[0].quantity - quantity }] } : p
    )
    setProducts(updatedProducts)

    // Clear the quantity input
    setProductQuantities(prev => ({ ...prev, [productId]: "" }))
  }

  const handleRemoveProduct = (productId: string) => {
    const item = transferItems.find(i => i.product_id === productId)
    if (item) {
      // Add back the quantity to products
      const updatedProducts = products.map(p =>
        p.id === productId ? { ...p, inventory: [{ ...p.inventory[0], quantity: p.inventory[0].quantity + item.quantity }] } : p
      )
      setProducts(updatedProducts)
    }
    setTransferItems(transferItems.filter(item => item.product_id !== productId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.from_branch_id || !formData.to_branch_id) {
      toast.error("Please select both source and destination branches")
      return
    }

    if (formData.from_branch_id === formData.to_branch_id) {
      toast.error("Cannot transfer to the same branch")
      return
    }

    if (transferItems.length === 0) {
      toast.error("Please add at least one product to transfer")
      return
    }

    setIsLoading(true)

    try {
      const items = transferItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      }))

      const response = await fetch("/api/stock-transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          items
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create stock transfer")
      }

      toast.success("Stock transfer created successfully!")
      router.push("/stock-transfers")
    } catch (error: any) {
      toast.error(error.message || "Failed to create stock transfer")
    } finally {
      setIsLoading(false)
    }
  }

  const availableProducts = products.filter(product =>
    !transferItems.some(item => item.product_id === product.id)
  )

  const filteredProducts = availableProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Transfer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from_branch">From Branch *</Label>
                <Select
                  value={formData.from_branch_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, from_branch_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name} ({branch.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="to_branch">To Branch *</Label>
                <Select
                  value={formData.to_branch_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, to_branch_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name} ({branch.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional notes about the transfer"
                rows={3}
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Products to Transfer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Products */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Products</Label>
            <Input
              id="search"
              type="text"
              placeholder="Search by name or barcode"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Products Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Available Qty</TableHead>
                <TableHead>Transfer Qty</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.barcode}</TableCell>
                  <TableCell>{product.category?.name}</TableCell>
                  <TableCell>{product.inventory?.[0]?.quantity || 0}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={productQuantities[product.id] || ""}
                      onChange={(e) => setProductQuantities(prev => ({ ...prev, [product.id]: e.target.value }))}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      size="sm"
                      disabled={(product.inventory?.[0]?.quantity || 0) <= 0}
                      onClick={() => {
                        const qty = parseInt(productQuantities[product.id] || "0")
                        handleAddProduct(product.id, qty)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Transfer Items List */}
          {transferItems.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Selected Products:</h4>
              {transferItems.map((item) => (
                <div key={item.product_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity} (Available: {item.available_quantity})
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveProduct(item.product_id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {transferItems.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              No products added yet. Select products above to add them to the transfer.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={isLoading || transferItems.length === 0}
        >
          {isLoading ? "Creating..." : "Create Transfer"}
        </Button>
      </div>
    </div>
  )
}