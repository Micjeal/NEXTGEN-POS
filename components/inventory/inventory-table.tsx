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
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Product</TableHead>
            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Barcode</TableHead>
            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Category</TableHead>
            <TableHead className="text-center font-semibold text-slate-700 dark:text-slate-300">Current Stock</TableHead>
            <TableHead className="text-center font-semibold text-slate-700 dark:text-slate-300">Min Level</TableHead>
            <TableHead className="text-center font-semibold text-slate-700 dark:text-slate-300">Max Level</TableHead>
            <TableHead className="text-center font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
            <TableHead className="w-24"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-16">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                    <Package className="h-8 w-8 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-slate-900 dark:text-white">No products found</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {search ? 'Try adjusting your search terms' : 'No products in this category'}
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            items.map((product) => {
              const stock = product.inventory?.quantity || 0
              const minLevel = product.inventory?.min_stock_level || 10
              const maxLevel = product.inventory?.max_stock_level || 1000
              const isLowStock = stock < minLevel && stock > 0
              const isOutOfStock = stock === 0
              const stockPercentage = maxLevel > 0 ? (stock / maxLevel) * 100 : 0

              return (
                <TableRow 
                  key={product.id} 
                  className="border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150"
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold shadow-sm">
                        {product.name?.charAt(0).toUpperCase() || 'P'}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{product.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">SKU: {product.sku || 'N/A'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-700 dark:text-slate-300">{product.barcode || "-"}</span>
                      {product.barcode && (
                        <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {product.category?.name || "Uncategorized"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`font-bold text-lg ${
                        isOutOfStock ? "text-red-600" : isLowStock ? "text-orange-500" : "text-green-600"
                      }`}>
                        {stock}
                      </span>
                      <div className="w-16 h-1 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOutOfStock ? 'bg-red-500' : isLowStock ? 'bg-orange-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-slate-600 dark:text-slate-400">{minLevel}</TableCell>
                  <TableCell className="text-center text-slate-600 dark:text-slate-400">{maxLevel}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        isOutOfStock ? 'bg-red-500' : isLowStock ? 'bg-orange-500' : 'bg-green-500'
                      } animate-pulse`} />
                      <Badge 
                        variant={isOutOfStock ? "destructive" : isLowStock ? "secondary" : "default"}
                        className={isOutOfStock ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800' : 
                               isLowStock ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800' :
                               'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800'}
                      >
                        {isOutOfStock ? "Out of Stock" : isLowStock ? "Low Stock" : "In Stock"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setAdjustProduct(product)}
                      className="border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                      Adjust
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Total Products</CardTitle>
            <div className="p-2 bg-emerald-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <Package className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{products.length}</div>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">Active inventory items</p>
            <div className="mt-3 flex gap-1">
              {[...Array(Math.min(products.length, 5))].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-orange-900 dark:text-orange-100">Low Stock Items</CardTitle>
            <div className="p-2 bg-orange-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">{lowStockProducts.length}</div>
            <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">Need restocking soon</p>
            <div className="mt-3 h-1 bg-orange-200 dark:bg-orange-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${products.length > 0 ? (lowStockProducts.length / products.length) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-red-900 dark:text-red-100">Out of Stock</CardTitle>
            <div className="p-2 bg-red-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900 dark:text-red-100">{outOfStockProducts.length}</div>
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">Require immediate attention</p>
            <div className="mt-3 flex gap-1">
              {outOfStockProducts.length > 0 && [...Array(Math.min(outOfStockProducts.length, 4))].map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-red-400 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <CardHeader className="pb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                <Warehouse className="h-5 w-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Inventory Management
              </span>
              <Badge variant="secondary" className="ml-2">
                {filteredProducts.length} items
              </Badge>
            </CardTitle>
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search products by name, barcode, or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <Tabs defaultValue="all" className="px-6">
            <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shadow-inner">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  All ({filteredProducts.length})
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="in-stock" 
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                  In Stock ({inStockProducts.length})
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="low-stock" 
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-orange-500" />
                  Low Stock ({lowStockProducts.length})
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="out-of-stock" 
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500" />
                  Out of Stock ({outOfStockProducts.length})
                </div>
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-6">
              <TabsContent value="all" className="animate-fade-in">{renderTable(filteredProducts)}</TabsContent>
              <TabsContent value="in-stock" className="animate-fade-in">{renderTable(inStockProducts)}</TabsContent>
              <TabsContent value="low-stock" className="animate-fade-in">{renderTable(lowStockProducts)}</TabsContent>
              <TabsContent value="out-of-stock" className="animate-fade-in">{renderTable(outOfStockProducts)}</TabsContent>
            </div>
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
