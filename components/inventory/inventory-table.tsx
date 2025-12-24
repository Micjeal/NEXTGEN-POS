"use client"

import { useState } from "react"
import type { Product } from "@/lib/types/database"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Warehouse, AlertTriangle, Package } from "lucide-react"
import { AdjustInventoryDialog } from "./adjust-inventory-dialog"

interface InventoryTableProps {
  products: Product[]
}

export function InventoryTable({ products }: InventoryTableProps) {
  const [search, setSearch] = useState("")
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null)

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.name.toLowerCase().includes(search.toLowerCase()),
  )

  const lowStockProducts = filteredProducts.filter((p) => {
    const stock = p.inventory?.quantity || 0
    const minLevel = p.inventory?.min_stock_level || 10
    return stock < minLevel
  })

  const outOfStockProducts = filteredProducts.filter((p) => (p.inventory?.quantity || 0) === 0)

  const inStockProducts = filteredProducts.filter((p) => {
    const stock = p.inventory?.quantity || 0
    const minLevel = p.inventory?.min_stock_level || 10
    return stock >= minLevel
  })

  const renderTable = (items: Product[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Barcode</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-center">Current Stock</TableHead>
          <TableHead className="text-center">Min Level</TableHead>
          <TableHead className="text-center">Max Level</TableHead>
          <TableHead className="text-center">Status</TableHead>
          <TableHead className="w-24"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
              No products found
            </TableCell>
          </TableRow>
        ) : (
          items.map((product) => {
            const stock = product.inventory?.quantity || 0
            const minLevel = product.inventory?.min_stock_level || 10
            const maxLevel = product.inventory?.max_stock_level || 1000
            const isLowStock = stock < minLevel && stock > 0
            const isOutOfStock = stock === 0

            return (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="font-mono text-sm">{product.barcode || "-"}</TableCell>
                <TableCell>{product.category?.name || "-"}</TableCell>
                <TableCell className="text-center">
                  <span className={isOutOfStock ? "text-destructive font-bold" : isLowStock ? "text-orange-500" : ""}>
                    {stock}
                  </span>
                </TableCell>
                <TableCell className="text-center text-muted-foreground">{minLevel}</TableCell>
                <TableCell className="text-center text-muted-foreground">{maxLevel}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={isOutOfStock ? "destructive" : isLowStock ? "secondary" : "default"}>
                    {isOutOfStock ? "Out of Stock" : isLowStock ? "Low Stock" : "In Stock"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => setAdjustProduct(product)}>
                    Adjust
                  </Button>
                </TableCell>
              </TableRow>
            )
          })
        )}
      </TableBody>
    </Table>
  )

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{lowStockProducts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{outOfStockProducts.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              Inventory Management
            </CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search inventory..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All ({filteredProducts.length})</TabsTrigger>
              <TabsTrigger value="in-stock">In Stock ({inStockProducts.length})</TabsTrigger>
              <TabsTrigger value="low-stock">Low Stock ({lowStockProducts.length})</TabsTrigger>
              <TabsTrigger value="out-of-stock">Out of Stock ({outOfStockProducts.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="all">{renderTable(filteredProducts)}</TabsContent>
            <TabsContent value="in-stock">{renderTable(inStockProducts)}</TabsContent>
            <TabsContent value="low-stock">{renderTable(lowStockProducts)}</TabsContent>
            <TabsContent value="out-of-stock">{renderTable(outOfStockProducts)}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AdjustInventoryDialog
        product={adjustProduct}
        open={!!adjustProduct}
        onOpenChange={(open) => !open && setAdjustProduct(null)}
      />
    </>
  )
}
