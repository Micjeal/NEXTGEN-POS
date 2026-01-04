"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowRightLeft,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Eye,
  CheckCircle,
  Clock,
  Truck,
  Package,
  X
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface StockTransfer {
  id: string
  transfer_number: string
  from_branch_name: string
  to_branch_name: string
  status: string
  requested_by_name: string
  approved_by_name: string
  created_at: string
  shipped_at: string
  received_at: string
}

export default function StockTransfersPage() {
  const [transfers, setTransfers] = useState<StockTransfer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const fetchTransfers = async () => {
    try {
      const response = await fetch('/api/stock-transfers')
      const data = await response.json()
      setTransfers(data.transfers || [])
    } catch (error) {
      console.error('Error fetching stock transfers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransfers()
  }, [])

  const filteredTransfers = transfers.filter(transfer =>
    transfer.transfer_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transfer.from_branch_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transfer.to_branch_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleTransferAction = async (transferId: string, action: string) => {
    if (!confirm(`Are you sure you want to ${action} this transfer?`)) {
      return
    }

    try {
      const response = await fetch('/api/stock-transfers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: transferId, action }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} transfer`)
      }

      toast({
        title: "Transfer Updated",
        description: `Transfer has been ${action}d successfully.`,
      })
      fetchTransfers()
    } catch (error: any) {
      toast({
        title: "Action Failed",
        description: error.message || `Failed to ${action} transfer.`,
        variant: "destructive",
      })
    }
  }

  const getAvailableActions = (status: string) => {
    switch (status) {
      case 'pending':
        return [
          { label: 'Approve', action: 'approve', icon: CheckCircle },
          { label: 'Cancel', action: 'cancel', icon: X }
        ]
      case 'approved':
        return [
          { label: 'Ship', action: 'ship', icon: Truck },
          { label: 'Cancel', action: 'cancel', icon: X }
        ]
      case 'in_transit':
        return [
          { label: 'Receive', action: 'receive', icon: Package },
          { label: 'Cancel', action: 'cancel', icon: X }
        ]
      default:
        return []
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, icon: Clock, label: "Pending" },
      approved: { variant: "default" as const, icon: CheckCircle, label: "Approved" },
      in_transit: { variant: "outline" as const, icon: Truck, label: "In Transit" },
      received: { variant: "default" as const, icon: Package, label: "Received" },
      cancelled: { variant: "destructive" as const, icon: Clock, label: "Cancelled" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
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
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Stock Transfers
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage inventory transfers between branches
          </p>
        </div>
        <Link href="/stock-transfers/add">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:shadow-lg">
            <Plus className="mr-2 h-4 w-4" />
            New Transfer
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950/20 dark:to-slate-900/20">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search transfers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="sm:w-auto">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transfer Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20 border-yellow-200 dark:border-yellow-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
              {transfers.filter(t => t.status === 'pending').length}
            </div>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {transfers.filter(t => t.status === 'approved').length}
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Ready for shipping
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {transfers.filter(t => t.status === 'in_transit').length}
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-300">
              Being transported
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Completed</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {transfers.filter(t => t.status === 'received').length}
            </div>
            <p className="text-xs text-green-700 dark:text-green-300">
              Successfully received
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transfers Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTransfers.map((transfer) => (
          <Card key={transfer.id} className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900/50 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {transfer.transfer_number}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {transfer.from_branch_name} → {transfer.to_branch_name}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    {getAvailableActions(transfer.status).map((actionItem) => {
                      const Icon = actionItem.icon
                      return (
                        <DropdownMenuItem
                          key={actionItem.action}
                          onClick={() => handleTransferAction(transfer.id, actionItem.action)}
                          className={actionItem.action === 'cancel' ? 'text-red-600' : ''}
                        >
                          <Icon className="mr-2 h-4 w-4" />
                          {actionItem.label}
                        </DropdownMenuItem>
                      )
                    })}
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Transfer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Status:</span>
                {getStatusBadge(transfer.status)}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Requested by:</span>
                <span className="text-sm text-slate-900 dark:text-slate-100">{transfer.requested_by_name}</span>
              </div>

              {transfer.approved_by_name && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Approved by:</span>
                  <span className="text-sm text-slate-900 dark:text-slate-100">{transfer.approved_by_name}</span>
                </div>
              )}

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Created: {new Date(transfer.created_at).toLocaleDateString()}
                </p>
                {transfer.shipped_at && (
                  <p className="text-xs text-muted-foreground">
                    Shipped: {new Date(transfer.shipped_at).toLocaleDateString()}
                  </p>
                )}
                {transfer.received_at && (
                  <p className="text-xs text-muted-foreground">
                    Received: {new Date(transfer.received_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTransfers.length === 0 && (
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950/20 dark:to-slate-900/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ArrowRightLeft className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              {searchTerm ? "No transfers found" : "No stock transfers yet"}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm
                ? "Try adjusting your search terms or filters."
                : "Get started by creating your first stock transfer between branches."
              }
            </p>
            {!searchTerm && (
              <Link href="/stock-transfers/add">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Transfer
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}