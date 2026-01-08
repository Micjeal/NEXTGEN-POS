"use client"

import { useState } from "react"
import type { Product, ProductBatch, QualityInspection } from "@/lib/types/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Package, Calendar, DollarSign, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react"
import { formatCurrency } from "@/lib/utils/cart"
import Link from "next/link"
import { ProductBatchesTable } from "@/components/products/product-batches-table"
import { QualityInspectionsTable } from "@/components/products/quality-inspections-table"
import { AddBatchDialog } from "@/components/products/add-batch-dialog"
import { AddInspectionDialog } from "@/components/products/add-inspection-dialog"

interface ProductDetailsClientProps {
  product: Product
  batches: ProductBatch[]
  inspections: QualityInspection[]
}

export function ProductDetailsClient({ product, batches, inspections }: ProductDetailsClientProps) {
  const [showAddBatch, setShowAddBatch] = useState(false)
  const [showAddInspection, setShowAddInspection] = useState(false)

  const totalStock = product.inventory?.quantity || 0
  const activeBatches = batches.filter(b => b.is_active).length
  const pendingInspections = inspections.filter(i => !i.overall_rating).length

  const getQualityStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100 dark:bg-green-900/30'
      case 'rejected': return 'text-red-600 bg-red-100 dark:bg-red-900/30'
      case 'quarantined': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
      default: return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-900 dark:to-purple-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/products">
            <Button variant="outline" size="icon" className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              {product.name}
            </h1>
            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
              <span>Barcode: {product.barcode || 'N/A'}</span>
              <span>•</span>
              <span>Category: {product.category?.name || 'Uncategorized'}</span>
            </div>
          </div>
        </div>

        {/* Product Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStock}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Total available stock
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Selling Price</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(product.price)}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Cost: {formatCurrency(product.cost_price)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quality Inspections</CardTitle>
              <CheckCircle className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inspections.length}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {pendingInspections} pending
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              {product.is_active ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Badge variant={product.is_active ? "default" : "secondary"}>
                  {product.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Tax Rate: {product.tax_rate}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="batches" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shadow-inner">
              <TabsTrigger
                value="batches"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
              >
                Product Batches ({batches.length})
              </TabsTrigger>
              <TabsTrigger
                value="inspections"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
              >
                Quality Inspections ({inspections.length})
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <AddBatchDialog
                product={product}
                open={showAddBatch}
                onOpenChange={setShowAddBatch}
              />
              <AddInspectionDialog
                product={product}
                batches={batches}
                open={showAddInspection}
                onOpenChange={setShowAddInspection}
              />
            </div>
          </div>

          <TabsContent value="batches" className="animate-fade-in">
            <ProductBatchesTable batches={batches} productId={product.id} />
          </TabsContent>

          <TabsContent value="inspections" className="animate-fade-in">
            <QualityInspectionsTable inspections={inspections} productId={product.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}