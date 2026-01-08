"use client"

import { useState } from "react"
import type { ProductBatch } from "@/lib/types/database"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2, Package, Calendar, DollarSign, MapPin } from "lucide-react"
import { formatCurrency } from "@/lib/utils/cart"
import { EditBatchDialog } from "./edit-batch-dialog"
import { DeleteBatchDialog } from "./delete-batch-dialog"

interface ProductBatchesTableProps {
  batches: ProductBatch[]
  productId: string
}

export function ProductBatchesTable({ batches, productId }: ProductBatchesTableProps) {
  const [editBatch, setEditBatch] = useState<ProductBatch | null>(null)
  const [deleteBatch, setDeleteBatch] = useState<ProductBatch | null>(null)

  const getQualityStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'quarantined': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <>
      <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Product Batches
            </span>
            <Badge variant="secondary" className="ml-2">
              {batches.length} batches
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-b border-slate-200 dark:border-slate-600">
                    <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">Batch Number</th>
                    <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">Supplier</th>
                    <th className="text-center p-4 font-semibold text-slate-700 dark:text-slate-300">Received</th>
                    <th className="text-center p-4 font-semibold text-slate-700 dark:text-slate-300">Expiry</th>
                    <th className="text-right p-4 font-semibold text-slate-700 dark:text-slate-300">Quantity</th>
                    <th className="text-right p-4 font-semibold text-slate-700 dark:text-slate-300">Unit Cost</th>
                    <th className="text-center p-4 font-semibold text-slate-700 dark:text-slate-300">Quality Status</th>
                    <th className="text-center p-4 font-semibold text-slate-700 dark:text-slate-300">Location</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {batches.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-16">
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                            <Package className="h-8 w-8 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-lg font-medium text-slate-900 dark:text-white">No batches found</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              No product batches have been added yet
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    batches.map((batch, index) => (
                      <tr
                        key={batch.id}
                        className={`border-b border-slate-100 dark:border-slate-700 transition-colors duration-150 ${
                          index % 2 === 0 ? 'bg-white dark:bg-slate-800/50' : 'bg-slate-50/50 dark:bg-slate-800/30'
                        } hover:bg-blue-50/50 dark:hover:bg-blue-900/10`}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                              {batch.batch_number?.charAt(0).toUpperCase() || 'B'}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">{batch.batch_number}</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                ID: {batch.id.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                                {batch.supplier?.name?.charAt(0).toUpperCase() || 'S'}
                              </span>
                            </div>
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                              {batch.supplier?.name || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <span className="text-sm font-mono text-slate-700 dark:text-slate-300">
                              {formatDate(batch.received_date)}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-sm font-mono text-slate-700 dark:text-slate-300">
                              {batch.expiry_date ? formatDate(batch.expiry_date) : "-"}
                            </span>
                            {batch.expiry_date && new Date(batch.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                              <Badge variant="destructive" className="text-xs">Expiring Soon</Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {batch.current_quantity} / {batch.initial_quantity}
                            </span>
                            <div className={`w-1 h-1 rounded-full ${
                              batch.current_quantity < batch.initial_quantity * 0.2 ? 'bg-red-500' : 'bg-green-500'
                            }`} />
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-mono text-sm text-slate-600 dark:text-slate-400">
                            {batch.unit_cost ? formatCurrency(batch.unit_cost) : "-"}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <Badge className={getQualityStatusColor(batch.quality_status)}>
                            {batch.quality_status}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                              {batch.storage_location || "-"}
                            </span>
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
                                onClick={() => setEditBatch(batch)}
                                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Batch
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteBatch(batch)}
                                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Batch
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditBatchDialog
        batch={editBatch}
        open={!!editBatch}
        onOpenChange={(open) => !open && setEditBatch(null)}
      />

      <DeleteBatchDialog
        batch={deleteBatch}
        open={!!deleteBatch}
        onOpenChange={(open) => !open && setDeleteBatch(null)}
      />
    </>
  )
}