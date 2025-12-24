"use client"

import type React from "react"

import { useState, useMemo } from "react"
import type { Product } from "@/lib/types/database"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Barcode, Search, Package } from "lucide-react"
import { formatCurrency } from "@/lib/utils/cart"

interface ProductSearchProps {
  products: Product[]
  barcodeInput: string
  setBarcodeInput: (value: string) => void
  onBarcodeSubmit: (e: React.FormEvent) => void
  onProductSelect: (product: Product) => void
  barcodeRef: React.RefObject<HTMLInputElement | null>
}

export function ProductSearch({
  products,
  barcodeInput,
  setBarcodeInput,
  onBarcodeSubmit,
  onProductSelect,
  barcodeRef,
}: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products.slice(0, 12)
    const query = searchQuery.toLowerCase()
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.barcode?.toLowerCase().includes(query) ||
        p.category?.name.toLowerCase().includes(query),
    )
  }, [products, searchQuery])

  return (
    <Card className="flex-1">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="h-5 w-5" />
          Product Selection
        </CardTitle>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <form onSubmit={onBarcodeSubmit} className="relative">
            <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={barcodeRef}
              placeholder="Scan barcode..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="pl-9"
            />
          </form>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filteredProducts.map((product) => {
              const stock = product.inventory?.quantity || 0
              const isLowStock = stock < 10
              const isOutOfStock = stock === 0

              return (
                <div
                  key={product.id}
                  className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                    isOutOfStock
                      ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20 opacity-60'
                      : 'border-slate-200 hover:border-blue-300 hover:shadow-lg bg-white dark:border-slate-700 dark:bg-slate-800'
                  }`}
                  onClick={() => !isOutOfStock && onProductSelect(product)}
                >
                  {/* Product Image Placeholder */}
                  <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
                    <Package className="h-12 w-12 text-blue-500 dark:text-blue-400" />
                  </div>

                  {/* Product Info */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 text-sm leading-tight">
                        {product.name}
                      </h3>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-lg font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(product.price)}
                        </span>
                        {product.category?.name && (
                          <Badge variant="secondary" className="text-xs">
                            {product.category.name}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Stock Status */}
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={isOutOfStock ? "destructive" : isLowStock ? "secondary" : "default"}
                        className="text-xs"
                      >
                        {isOutOfStock ? "Out of Stock" : `${stock} in stock`}
                      </Badge>
                      {product.barcode && (
                        <span className="text-xs text-muted-foreground font-mono">
                          {product.barcode}
                        </span>
                      )}
                    </div>

                    {/* Hover Overlay */}
                    {!isOutOfStock && (
                      <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <div className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium text-sm">
                          Add to Cart
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
