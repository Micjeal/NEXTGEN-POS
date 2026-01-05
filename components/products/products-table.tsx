"use client"

import { useState, useEffect } from "react"
import type { Product, Category } from "@/lib/types/database"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoreHorizontal, Pencil, Trash2, Search, Package, Filter } from "lucide-react"
import { formatCurrency } from "@/lib/utils/cart"
import { EditProductDialog } from "./edit-product-dialog"
import { DeleteProductDialog } from "./delete-product-dialog"

interface ProductsTableProps {
  products: Product[]
  categories: Category[]
}

export function ProductsTable({ products, categories }: ProductsTableProps) {
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const filteredProducts = products.filter(
    (p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode?.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.name.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = categoryFilter === "all" || !categoryFilter || p.category_id === categoryFilter
      return matchesSearch && matchesCategory
    }
  )

  return (
    <>
      <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <CardHeader className="pb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Package className="h-5 w-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Product Catalog
              </span>
              <Badge variant="secondary" className="ml-2">
                {mounted ? filteredProducts.length : 0} items
              </Badge>
            </CardTitle>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search products by name, barcode, or category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <Select value={categoryFilter || "all"} onValueChange={(value) => setCategoryFilter(value === "all" ? "" : value)}>
                  <SelectTrigger className="w-48 border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 dark:border-slate-600 shadow-lg">
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-b border-slate-200 dark:border-slate-600">
                    <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">Product</th>
                    <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">Barcode</th>
                    <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">Category</th>
                    <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">Supplier</th>
                    <th className="text-center p-4 font-semibold text-slate-700 dark:text-slate-300">Image</th>
                    <th className="text-right p-4 font-semibold text-slate-700 dark:text-slate-300">Price</th>
                    <th className="text-right p-4 font-semibold text-slate-700 dark:text-slate-300">Cost</th>
                    <th className="text-right p-4 font-semibold text-slate-700 dark:text-slate-300">Tax %</th>
                    <th className="text-center p-4 font-semibold text-slate-700 dark:text-slate-300">Expiry</th>
                    <th className="text-center p-4 font-semibold text-slate-700 dark:text-slate-300">Stock</th>
                    <th className="text-center p-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="text-center py-16">
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                            <Package className="h-8 w-8 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-lg font-medium text-slate-900 dark:text-white">No products found</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              {search || categoryFilter ? 'Try adjusting your search or filters' : 'No products have been added yet'}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product, index) => {
                      const stock = product.inventory?.quantity || 0
                      const isLowStock = stock < (product.inventory?.min_stock_level || 10)
                      const supplier = product.supplier_products?.[0]?.supplier
                      const expiryDate = product.expiry_date ? new Date(product.expiry_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      }) : "-"

                      return (
                        <tr 
                          key={product.id} 
                          className={`border-b border-slate-100 dark:border-slate-700 transition-colors duration-150 ${
                            index % 2 === 0 ? 'bg-white dark:bg-slate-800/50' : 'bg-slate-50/50 dark:bg-slate-800/30'
                          } hover:bg-blue-50/50 dark:hover:bg-blue-900/10`}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                                {product.name?.charAt(0).toUpperCase() || 'P'}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white">{product.name}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">SKU: {product.sku || 'N/A'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm text-slate-700 dark:text-slate-300">{product.barcode || "-"}</span>
                              {product.barcode && (
                                <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="capitalize">
                              {product.category?.name || "Uncategorized"}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                                  {supplier?.name?.charAt(0).toUpperCase() || 'S'}
                                </span>
                              </div>
                              <span className="text-sm text-slate-700 dark:text-slate-300">
                                {supplier?.name || "-"}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            {product.image_url ? (
                              <div className="relative group">
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-600 mx-auto shadow-sm group-hover:scale-105 transition-transform duration-200"
                                />
                                <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </div>
                              </div>
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center mx-auto">
                                <Package className="h-6 w-6 text-slate-400" />
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(product.price)}</span>
                              <div className="w-1 h-1 rounded-full bg-green-500" />
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <span className="font-mono text-sm text-slate-600 dark:text-slate-400">{formatCurrency(product.cost_price)}</span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <span className="font-mono text-sm text-slate-700 dark:text-slate-300">{product.tax_rate}%</span>
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                product.tax_rate > 0 ? 'bg-orange-500' : 'bg-slate-300'
                              }`} />
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-sm font-mono text-slate-700 dark:text-slate-300">{expiryDate}</span>
                              {product.expiry_date && new Date(product.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                                <Badge variant="destructive" className="text-xs">Expiring Soon</Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                isLowStock ? 'bg-red-500' : 'bg-green-500'
                              } animate-pulse`} />
                              <Badge 
                                variant={isLowStock ? "destructive" : "secondary"}
                                className={isLowStock ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800'}
                              >
                                {stock}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                product.is_active ? 'bg-green-500' : 'bg-slate-400'
                              }`} />
                              <Badge 
                                variant={product.is_active ? "default" : "secondary"}
                                className={product.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800' : 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300 border-slate-200 dark:border-slate-800'}
                              >
                                {product.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="border-slate-200 dark:border-slate-600 shadow-lg">
                                <DropdownMenuItem 
                                  onClick={() => setEditProduct(product)}
                                  className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit Product
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeleteProduct(product)}
                                  className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-red-600 dark:text-red-400"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Product
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditProductDialog
        product={editProduct}
        categories={categories}
        open={!!editProduct}
        onOpenChange={(open) => !open && setEditProduct(null)}
      />

      <DeleteProductDialog
        product={deleteProduct}
        open={!!deleteProduct}
        onOpenChange={(open) => !open && setDeleteProduct(null)}
      />
    </>
  )
}
