"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ShoppingCart, Search, Calendar, DollarSign, Package, Receipt, Filter } from "lucide-react"

interface Sale {
  id: string
  invoice_number: string
  total: number
  status: string
  created_at: string
  customer: {
    id: string
    full_name: string
  } | null
  items: Array<{
    quantity: number
    unit_price: number
    product: {
      name: string
    }
  }>
}

interface Customer {
  id: string
  full_name: string
  phone: string
  email: string | null
}

interface CustomerPurchaseHistoryProps {
  sales: Sale[]
  customers: Customer[]
}

export function CustomerPurchaseHistory({ sales, customers }: CustomerPurchaseHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState("all")
  const [dateFilter, setDateFilter] = useState("")

  // Filter sales based on search and filters
  const filteredSales = sales.filter(sale => {
    const matchesSearch = !searchTerm ||
      sale.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.customer?.full_name.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCustomer = !selectedCustomer || selectedCustomer === "all" || sale.customer?.id === selectedCustomer

    const matchesDate = !dateFilter ||
      new Date(sale.created_at).toISOString().split('T')[0] === dateFilter

    return matchesSearch && matchesCustomer && matchesDate
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  // Calculate some stats
  const totalSales = filteredSales.length
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0)
  const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0
  const uniqueCustomers = new Set(filteredSales.map(sale => sale.customer?.id).filter(Boolean)).size

  return (
    <div className="space-y-6">
      {/* Purchase Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <Receipt className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{totalSales}</div>
            <p className="text-xs text-muted-foreground">Transactions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">UGX {totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From filtered sales</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <ShoppingCart className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">UGX {Math.round(avgOrderValue).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{uniqueCustomers}</div>
            <p className="text-xs text-muted-foreground">Made purchases</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950/20 dark:to-slate-900/20">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by invoice or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Purchase History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No purchase history found
                  </TableCell>
                </TableRow>
              ) : (
                filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{sale.invoice_number}</div>
                        <div className="text-xs text-muted-foreground">ID: {sale.id.slice(0, 8)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {sale.customer ? (
                        <div>
                          <div className="font-medium">{sale.customer.full_name}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Walk-in Customer</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(sale.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(sale.created_at).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {sale.items.slice(0, 2).map((item, index) => (
                          <div key={index} className="text-sm">
                            {item.quantity}x {item.product.name}
                          </div>
                        ))}
                        {sale.items.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{sale.items.length - 2} more items
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">UGX {sale.total.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(sale.status)}>
                        {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}