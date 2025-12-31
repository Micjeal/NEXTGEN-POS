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
        return 'default'
      case 'remove':
        return 'destructive'
      case 'set':
        return 'secondary'
      case 'sale':
        return 'outline'
      case 'return':
        return 'default'
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
      default:
        return type.charAt(0).toUpperCase() + type.slice(1)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Inventory Audit History
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search adjustments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value === "all" ? "" : value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="add">Stock Added</SelectItem>
                  <SelectItem value="remove">Stock Removed</SelectItem>
                  <SelectItem value="set">Stock Set</SelectItem>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Before</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="text-right">After</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading audit history...
                  </TableCell>
                </TableRow>
              ) : filteredAdjustments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No audit records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAdjustments.map((adjustment) => (
                  <TableRow key={adjustment.id}>
                    <TableCell className="font-mono text-sm">
                      {format(new Date(adjustment.created_at), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {adjustment.product?.name || 'Unknown Product'}
                      {adjustment.product?.barcode && (
                        <div className="text-xs text-muted-foreground">
                          {adjustment.product.barcode}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{adjustment.user?.full_name || 'System'}</TableCell>
                    <TableCell>
                      <Badge variant={getAdjustmentTypeColor(adjustment.adjustment_type)}>
                        {formatAdjustmentType(adjustment.adjustment_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {adjustment.quantity_before}
                    </TableCell>
                    <TableCell className={`text-right font-mono ${
                      adjustment.quantity_change > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {adjustment.quantity_change > 0 ? '+' : ''}{adjustment.quantity_change}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {adjustment.quantity_after}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {adjustment.reason || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}