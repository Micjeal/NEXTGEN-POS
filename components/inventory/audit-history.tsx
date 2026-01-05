"use client"

import { useState, useEffect } from "react"
import type { InventoryAdjustment } from "@/lib/types/database"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { History, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"

interface AuditHistoryProps {
  productId?: string
}

export function AuditHistory({ productId }: AuditHistoryProps) {
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 20

  const fetchAdjustments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: ((currentPage - 1) * itemsPerPage).toString(),
      })

      if (productId) {
        params.append('product_id', productId)
      }

      const response = await fetch(`/api/inventory/adjustments?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAdjustments(data.adjustments || [])
        // Calculate total pages (simplified - in real app you'd get total count from API)
        setTotalPages(Math.ceil((data.adjustments?.length || 0) / itemsPerPage) || 1)
      }
    } catch (error) {
      console.error('Error fetching audit history:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdjustments()
  }, [currentPage, productId])

  const filteredAdjustments = adjustments.filter(
    (adjustment) => {
      const matchesSearch = adjustment.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
        adjustment.user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        adjustment.reason?.toLowerCase().includes(search.toLowerCase())

      const matchesType = typeFilter === "all" || !typeFilter || adjustment.adjustment_type === typeFilter

      return matchesSearch && matchesType
    }
  )

  const getAdjustmentTypeColor = (type: string) => {
    switch (type) {
      case 'add':
      case 'purchase':
      case 'return':
        return 'default'
      case 'remove':
      case 'sale':
        return 'destructive'
      case 'set':
      case 'manual':
      case 'adjustment':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const formatAdjustmentType = (type: string) => {
    switch (type) {
      case 'add':
        return 'Stock Added'
      case 'remove':
        return 'Stock Removed'
      case 'set':
        return 'Stock Set'
      case 'sale':
        return 'Sale'
      case 'return':
        return 'Return'
      case 'manual':
        return 'Manual Adjustment'
      case 'purchase':
        return 'Purchase'
      case 'adjustment':
        return 'General Adjustment'
      default:
        return type.charAt(0).toUpperCase() + type.slice(1)
    }
  }

  return (
    <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
      <CardHeader className="pb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
              <History className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Inventory Audit History
            </span>
          </CardTitle>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search adjustments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value === "all" ? "" : value)}>
                <SelectTrigger className="w-40 border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="border-slate-200 dark:border-slate-600 shadow-lg">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="add">Stock Added</SelectItem>
                  <SelectItem value="remove">Stock Removed</SelectItem>
                  <SelectItem value="set">Stock Set</SelectItem>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                  <SelectItem value="manual">Manual Adjustment</SelectItem>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="adjustment">General Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-b border-slate-200 dark:border-slate-600">
                  <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">Date & Time</th>
                  <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">Product</th>
                  <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">User</th>
                  <th className="text-center p-4 font-semibold text-slate-700 dark:text-slate-300">Type</th>
                  <th className="text-right p-4 font-semibold text-slate-700 dark:text-slate-300">Before</th>
                  <th className="text-right p-4 font-semibold text-slate-700 dark:text-slate-300">Change</th>
                  <th className="text-right p-4 font-semibold text-slate-700 dark:text-slate-300">After</th>
                  <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">Reason</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-slate-600 dark:text-slate-400">Loading audit history...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredAdjustments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                          <History className="h-8 w-8 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-slate-900 dark:text-white">No audit records found</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {search || typeFilter ? 'Try adjusting your filters' : 'No inventory adjustments have been made yet'}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAdjustments.map((adjustment, index) => (
                    <tr 
                      key={adjustment.id} 
                      className={`border-b border-slate-100 dark:border-slate-700 transition-colors duration-150 ${
                        index % 2 === 0 ? 'bg-white dark:bg-slate-800/50' : 'bg-slate-50/50 dark:bg-slate-800/30'
                      } hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10`}
                    >
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-sm text-slate-900 dark:text-white">
                            {format(new Date(adjustment.created_at), 'MMM dd, yyyy')}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {format(new Date(adjustment.created_at), 'HH:mm:ss')}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                            {adjustment.product?.name?.charAt(0).toUpperCase() || 'P'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{adjustment.product?.name || 'Unknown Product'}</p>
                            {adjustment.product?.barcode && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                {adjustment.product.barcode}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                              {adjustment.user?.full_name?.charAt(0).toUpperCase() || 'S'}
                            </span>
                          </div>
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {adjustment.user?.full_name || 'System'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <Badge 
                          variant={getAdjustmentTypeColor(adjustment.adjustment_type)}
                          className={`font-medium px-3 py-1 ${
                            adjustment.adjustment_type === 'add' || adjustment.adjustment_type === 'purchase' || adjustment.adjustment_type === 'return' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800'
                              : adjustment.adjustment_type === 'remove' || adjustment.adjustment_type === 'sale'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          {formatAdjustmentType(adjustment.adjustment_type)}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-mono text-sm text-slate-600 dark:text-slate-400">
                          {adjustment.quantity_before}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className={`font-mono text-sm font-bold ${
                            adjustment.quantity_change > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {adjustment.quantity_change > 0 ? '+' : ''}{adjustment.quantity_change}
                          </span>
                          <div className={`w-1 h-1 rounded-full ${
                            adjustment.quantity_change > 0 ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                          {adjustment.quantity_after}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="max-w-xs">
                          <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                            {adjustment.reason || '-'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Showing page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  const pageNum = i + 1
                  const isActive = pageNum === currentPage
                  return (
                    <Button
                      key={pageNum}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 p-0 ${
                        isActive 
                          ? 'bg-indigo-500 hover:bg-indigo-600 text-white border-0' 
                          : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                      } transition-all duration-200`}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
                {totalPages > 5 && (
                  <>
                    <span className="px-2 text-slate-400">...</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      className="w-8 h-8 p-0 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200"
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}