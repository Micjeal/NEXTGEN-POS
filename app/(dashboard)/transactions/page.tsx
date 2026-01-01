"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Receipt, Search, Filter, Download, Eye, Loader2 } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils/cart"
import type { Sale } from "@/lib/types/database"

export default function TransactionsPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [filteredSales, setFilteredSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all")
  const [dateRangeFilter, setDateRangeFilter] = useState("all")
  const [orderTypeFilter, setOrderTypeFilter] = useState("all")
  const [userRole, setUserRole] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        // First, get user profile to determine role
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          setError("Unauthorized")
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*, role:roles(*)')
          .eq('id', user.id)
          .single()

        const role = profile?.role?.name || null
        setUserRole(role)

        // Fetch sales with related data via API
        const params = new URLSearchParams({ limit: '1000' })
        if (orderTypeFilter !== 'all') {
          params.set('order_type', orderTypeFilter)
        }
        const response = await fetch(`/api/sales?${params.toString()}`)
        if (!response.ok) {
          const errorText = await response.text()
          console.error("API request failed:", response.status, errorText)
          setError(`Failed to load transactions: ${response.status}`)
          return
        }
        const apiData = await response.json()
        const salesData = apiData.sales

        const salesArray = (salesData || []) as Sale[]
        setSales(salesArray)
        setFilteredSales(salesArray)
      } catch (err) {
        console.error("Unexpected error:", err)
        setError("Failed to load transactions")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, orderTypeFilter])

  // Filter sales based on search and filter criteria
  useEffect(() => {
    let filtered = [...sales]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(sale =>
        sale.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customer?.phone?.includes(searchTerm) ||
        sale.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Payment method filter
    if (paymentMethodFilter !== "all") {
      filtered = filtered.filter(sale => {
        const paymentMethods = sale.payments?.map(p => p.payment_method?.name?.toLowerCase()).filter(Boolean) || []
        return paymentMethods.some(method => method && method.includes(paymentMethodFilter.toLowerCase()))
      })
    }

    // Date range filter
    if (dateRangeFilter !== "all") {
      const now = new Date()
      let startDate: Date

      switch (dateRangeFilter) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        default:
          startDate = new Date(0) // All time
      }

      if (dateRangeFilter !== "all") {
        filtered = filtered.filter(sale => new Date(sale.created_at) >= startDate)
      }
    }

    setFilteredSales(filtered)
  }, [sales, searchTerm, paymentMethodFilter, dateRangeFilter])

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {userRole === 'cashier' ? 'My Transactions' : 'All Transactions'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {userRole === 'cashier'
                ? 'History of your sales transactions'
                : 'Complete history of all sales and transactions'
              }
            </p>
          </div>
        </div>

        {/* Loading State */}
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading transactions...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {userRole === 'cashier' ? 'My Transactions' : 'All Transactions'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {userRole === 'cashier'
                ? 'History of your sales transactions'
                : 'Complete history of all sales and transactions'
              }
            </p>
          </div>
        </div>

        {/* Error State */}
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-red-500 mb-2">Failed to load transactions</div>
              <div className="text-sm text-muted-foreground">{error}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {userRole === 'cashier' ? 'My Transactions' : 'All Transactions'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {userRole === 'cashier'
              ? 'History of your sales transactions'
              : 'Complete history of all sales and transactions'
            }
          </p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Order Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="in-store">In-Store</SelectItem>
                <SelectItem value="online">Online</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="mobile">Mobile Money</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredSales.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Sale</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(sales.length > 0 ? sales.reduce((sum, sale) => sum + (sale.total || 0), 0) / sales.length : 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredSales.reduce((sum, sale) => sum + (sale.items?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Order Type</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">
                        {sale.invoice_number}
                      </TableCell>
                      <TableCell>
                        {new Date(sale.created_at).toLocaleDateString()}
                        <div className="text-xs text-muted-foreground">
                          {new Date(sale.created_at).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {sale.customer?.full_name || "Walk-in Customer"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={sale.order_type === 'online' ? 'default' : 'secondary'}>
                          {sale.order_type === 'online' ? 'Online' : 'In-Store'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sale.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} items
                      </TableCell>
                      <TableCell>
                        {sale.payments?.map(p => p.payment_method?.name).join(', ') || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(sale.total || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          {sale.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/pos/summary?invoice=${sale.invoice_number}`}>
                            <Eye className="h-4 w-4" />
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}