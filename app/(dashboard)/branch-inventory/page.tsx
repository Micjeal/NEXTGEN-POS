"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Package,
  Search,
  Filter,
  Edit,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Plus
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface BranchInventoryItem {
  id: string
  branch_id: string
  product_id: string
  quantity: number
  min_stock_level: number
  max_stock_level: number
  last_updated: string
  product_name: string
  product_barcode: string
  category_name: string
  branch_name: string
  branch_code: string
}

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
}

export default function BranchInventoryPage() {
  const [inventory, setInventory] = useState<BranchInventoryItem[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBranch, setSelectedBranch] = useState("all")
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editQuantity, setEditQuantity] = useState("")
  const [editMinStock, setEditMinStock] = useState("")
  const [editMaxStock, setEditMaxStock] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState("")
  const [addQuantity, setAddQuantity] = useState("")
  const [addMinStock, setAddMinStock] = useState("")
  const [addMaxStock, setAddMaxStock] = useState("")
  const { toast } = useToast()

  const fetchInventory = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedBranch) params.append('branchId', selectedBranch)

      const response = await fetch(`/api/branch-inventory?${params}`)
      const data = await response.json()
      setInventory(data.inventory || [])
    } catch (error) {
      console.error('Error fetching branch inventory:', error)
    }
  }

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/branches')
      const data = await response.json()
      setBranches(data.branches || [])
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  useEffect(() => {
    fetchBranches()
    fetchProducts()
  }, [])

  useEffect(() => {
    fetchInventory()
    setLoading(false)
  }, [selectedBranch])

  const filteredInventory = inventory.filter(item =>
    item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product_barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEdit = (item: BranchInventoryItem) => {
    setEditingItem(item.id)
    setEditQuantity(item.quantity.toString())
    setEditMinStock(item.min_stock_level.toString())
    setEditMaxStock(item.max_stock_level.toString())
  }

  const handleSave = async (item: BranchInventoryItem) => {
    try {
      const response = await fetch('/api/branch-inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          branch_id: item.branch_id,
          product_id: item.product_id,
          quantity: parseInt(editQuantity) || 0,
          min_stock_level: parseInt(editMinStock) || 0,
          max_stock_level: parseInt(editMaxStock) || 0,
        }),
      })

      if (response.ok) {
        toast({
          title: "Inventory Updated",
          description: "Branch inventory has been updated successfully.",
        })
        setEditingItem(null)
        fetchInventory()
      } else {
        toast({
          title: "Update Failed",
          description: "Failed to update inventory.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating inventory:', error)
      toast({
        title: "Update Failed",
        description: "An error occurred while updating inventory.",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    setEditingItem(null)
    setEditQuantity("")
    setEditMinStock("")
    setEditMaxStock("")
  }

  const handleAddProduct = async () => {
    if (!selectedProduct || !selectedBranch || selectedBranch === "all") {
      toast({
        title: "Invalid Selection",
        description: "Please select a product and a specific branch.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/branch-inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          branch_id: selectedBranch,
          product_id: selectedProduct,
          quantity: parseInt(addQuantity) || 0,
          min_stock_level: parseInt(addMinStock) || 10,
          max_stock_level: parseInt(addMaxStock) || 1000,
        }),
      })

      if (response.ok) {
        toast({
          title: "Product Added",
          description: "Product has been added to branch inventory successfully.",
        })
        setShowAddDialog(false)
        setSelectedProduct("")
        setAddQuantity("")
        setAddMinStock("")
        setAddMaxStock("")
        fetchInventory()
      } else {
        const data = await response.json()
        toast({
          title: "Add Failed",
          description: data.error || "Failed to add product to inventory.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error adding product:', error)
      toast({
        title: "Add Failed",
        description: "An error occurred while adding the product.",
        variant: "destructive",
      })
    }
  }

  const getStockStatus = (item: BranchInventoryItem) => {
    if (item.quantity <= item.min_stock_level) {
      return { status: "Low Stock", color: "destructive", icon: TrendingDown }
    } else if (item.quantity >= item.max_stock_level) {
      return { status: "Overstock", color: "secondary", icon: AlertTriangle }
    } else {
      return { status: "Good", color: "default", icon: CheckCircle }
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="pt-0">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Branch Inventory Management
          </h1>
          <p className="text-muted-foreground text-lg">
            Monitor and manage inventory levels across all branches
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Product to Branch Inventory</DialogTitle>
                <DialogDescription>
                  Add a new product to the selected branch's inventory.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="product" className="text-right">
                    Product
                  </label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.barcode}) - {product.category?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="quantity" className="text-right">
                    Quantity
                  </label>
                  <Input
                    id="quantity"
                    type="number"
                    value={addQuantity}
                    onChange={(e) => setAddQuantity(e.target.value)}
                    placeholder="0"
                    className="col-span-3"
                    min="0"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="minStock" className="text-right">
                    Min Stock
                  </label>
                  <Input
                    id="minStock"
                    type="number"
                    value={addMinStock}
                    onChange={(e) => setAddMinStock(e.target.value)}
                    placeholder="10"
                    className="col-span-3"
                    min="0"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="maxStock" className="text-right">
                    Max Stock
                  </label>
                  <Input
                    id="maxStock"
                    type="number"
                    value={addMaxStock}
                    onChange={(e) => setAddMaxStock(e.target.value)}
                    placeholder="1000"
                    className="col-span-3"
                    min="0"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddProduct}>
                  Add Product
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Link href="/stock-transfers/add">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="mr-2 h-4 w-4" />
              Transfer Stock
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950/20 dark:to-slate-900/20">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="All branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name} ({branch.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="sm:w-auto">
              <Filter className="mr-2 h-4 w-4" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-red-200 dark:border-red-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-red-900 dark:text-red-100">Low Stock Items</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-red-900 dark:text-red-100">
              {filteredInventory.filter(item => item.quantity <= item.min_stock_level).length}
            </div>
            <p className="text-xs text-red-700 dark:text-red-300">
              Need replenishment
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Good Stock</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {filteredInventory.filter(item => item.quantity > item.min_stock_level && item.quantity < item.max_stock_level).length}
            </div>
            <p className="text-xs text-green-700 dark:text-green-300">
              Optimal levels
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Overstock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
              {filteredInventory.filter(item => item.quantity >= item.max_stock_level).length}
            </div>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              Excess inventory
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Items</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {filteredInventory.length}
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Across all branches
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Branch Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Min Level</TableHead>
                <TableHead>Max Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.map((item) => {
                const stockStatus = getStockStatus(item)
                const StatusIcon = stockStatus.icon

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.product_name}</div>
                        <div className="text-sm text-muted-foreground">{item.product_barcode}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.branch_name}</div>
                        <div className="text-sm text-muted-foreground">{item.branch_code}</div>
                      </div>
                    </TableCell>
                    <TableCell>{item.category_name}</TableCell>
                    <TableCell>
                      {editingItem === item.id ? (
                        <Input
                          type="number"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(e.target.value)}
                          className="w-20"
                          min="0"
                        />
                      ) : (
                        item.quantity
                      )}
                    </TableCell>
                    <TableCell>
                      {editingItem === item.id ? (
                        <Input
                          type="number"
                          value={editMinStock}
                          onChange={(e) => setEditMinStock(e.target.value)}
                          className="w-20"
                          min="0"
                        />
                      ) : (
                        item.min_stock_level
                      )}
                    </TableCell>
                    <TableCell>
                      {editingItem === item.id ? (
                        <Input
                          type="number"
                          value={editMaxStock}
                          onChange={(e) => setEditMaxStock(e.target.value)}
                          className="w-20"
                          min="0"
                        />
                      ) : (
                        item.max_stock_level
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={stockStatus.color as any} className="flex items-center gap-1 w-fit">
                        <StatusIcon className="h-3 w-3" />
                        {stockStatus.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {editingItem === item.id ? (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSave(item)}>
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancel}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {filteredInventory.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No inventory items found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}