"use client"

import { useState, useMemo, useEffect } from "react"
import type { Sale, Product, Payment, Profile, Role, AuditLog } from "@/lib/types/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  DollarSign, 
  Receipt, 
  ShoppingCart, 
  Download, 
  Package, 
  BarChart2,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  RefreshCw
} from "lucide-react"
import { formatCurrency } from "@/lib/utils/cart"
import { formatDate } from "@/lib/utils/date"
import { SalesChart } from "./sales-chart"
import { createClient } from "@/lib/supabase/client"

interface SalesChartData {
  date: string;
  total: number;
  count: number;
}

interface ReportsDashboardProps {
  sales: Sale[];
  salesChartData: SalesChartData[];
  categories: any[];
  paymentMethods: any[];
}

export function ReportsDashboard({ sales, salesChartData, categories, paymentMethods }: ReportsDashboardProps) {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date()
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date.toISOString().split("T")[0]
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0])
  const [sortBy, setSortBy] = useState<'date' | 'total' | 'invoice'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [isLoading, setIsLoading] = useState(false)

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const saleDate = new Date(sale.created_at).toISOString().split("T")[0];
      
      // Check date range first
      if (saleDate < dateFrom || saleDate > dateTo) {
        return false;
      }

      // Filter by category if selected
      if (selectedCategory !== 'all') {
        const hasMatchingItem = sale.items?.some(item => 
          item.product?.category_id === selectedCategory
        );
        if (!hasMatchingItem) return false;
      }

      // Filter by payment method if selected
      if (selectedPaymentMethod !== 'all') {
        const hasMatchingPayment = sale.payments?.some(
          payment => payment.payment_method_id === selectedPaymentMethod
        );
        if (!hasMatchingPayment) return false;
      }

      // Filter by search query if provided
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesInvoice = sale.invoice_number?.toLowerCase().includes(query);
        const matchesCashier = sale.profile?.full_name?.toLowerCase().includes(query);
        const matchesItems = sale.items?.some(item => 
          item.product?.name?.toLowerCase().includes(query)
        );
        
        if (!matchesInvoice && !matchesCashier && !matchesItems) {
          return false;
        }
      }

      return true;
    });
  }, [sales, dateFrom, dateTo, selectedCategory, selectedPaymentMethod, searchQuery]);

  // Calculate summary statistics
  const totalSales = useMemo(() => 
    filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0), 
    [filteredSales]
  );
  
  const totalTransactions = filteredSales.length;
  const avgSale = totalTransactions > 0 ? totalSales / totalTransactions : 0;

  // Get recent transactions with sorting
  const recentTransactions = useMemo(() => {
    const sorted = [...filteredSales].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return sortOrder === 'desc' 
            ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'total':
          return sortOrder === 'desc' ? b.total - a.total : a.total - b.total
        case 'invoice':
          return sortOrder === 'desc' 
            ? (b.invoice_number || '').localeCompare(a.invoice_number || '')
            : (a.invoice_number || '').localeCompare(b.invoice_number || '')
        default:
          return 0
      }
    })
    return sorted.slice(0, 10)
  }, [filteredSales, sortBy, sortOrder])

  // Get top selling products
  const topProducts = useMemo(() => {
    const productMap = new Map();
    
    filteredSales.forEach(sale => {
      sale.items?.forEach(item => {
        const productId = item.product_id;
        const productName = item.product?.name || `Product ${productId}`;
        const current = productMap.get(productId) || { name: productName, quantity: 0, revenue: 0 };
        
        productMap.set(productId, {
          ...current,
          quantity: current.quantity + (item.quantity || 0),
          revenue: current.revenue + ((item.quantity || 0) * (item.unit_price || 0))
        });
      });
    });
    
    return Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredSales]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!salesChartData || !Array.isArray(salesChartData)) {
      console.error('Invalid salesChartData:', salesChartData);
      return [];
    }
    
    return salesChartData.map(item => ({
      date: item.date,
      total: Number(item.total) || 0,
      count: Number(item.count) || 0
    }));
  }, [salesChartData]);

  // Calculate growth metrics
  const growthMetrics = useMemo(() => {
    if (salesChartData.length < 2) return { revenueGrowth: 0, transactionGrowth: 0 }
    
    const recent = salesChartData.slice(-7)
    const previous = salesChartData.slice(-14, -7)
    
    if (previous.length === 0) return { revenueGrowth: 0, transactionGrowth: 0 }
    
    const recentRevenue = recent.reduce((sum, day) => sum + day.total, 0)
    const previousRevenue = previous.reduce((sum, day) => sum + day.total, 0)
    const recentTransactions = recent.reduce((sum, day) => sum + day.count, 0)
    const previousTransactions = previous.reduce((sum, day) => sum + day.count, 0)
    
    const revenueGrowth = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0
    const transactionGrowth = previousTransactions > 0 ? ((recentTransactions - previousTransactions) / previousTransactions) * 100 : 0
    
    return { revenueGrowth, transactionGrowth }
  }, [salesChartData])

  const handleSort = (field: 'date' | 'total' | 'invoice') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="date-from">From</Label>
          <Input
            id="date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full h-10"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date-to">To</Label>
          <Input
            id="date-to"
            type="date"
            value={dateTo}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full h-10"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Select category to filter sales"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="payment-method">Payment Method</Label>
          <select
            id="payment-method"
            value={selectedPaymentMethod}
            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
            aria-label="Select payment method to filter sales"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="all">All Methods</option>
            {paymentMethods.map((method) => (
              <option key={method.id} value={method.id}>
                {method.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search transactions..."
          className="w-full rounded-lg bg-background pl-8 md:w-[300px]"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart2 className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="transactions" disabled={sales.length === 0}>
            <Receipt className="mr-2 h-4 w-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="inventory" disabled>
            <Package className="mr-2 h-4 w-4" />
            Inventory
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Enhanced Summary Cards with Growth Indicators */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 dark:from-blue-950/30 dark:via-blue-900/30 dark:to-blue-800/30 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Filtered Revenue</CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-0 relative">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{formatCurrency(totalSales)}</div>
                  {growthMetrics.revenueGrowth !== 0 && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      growthMetrics.revenueGrowth > 0 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                    }`}>
                      {growthMetrics.revenueGrowth > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {Math.abs(growthMetrics.revenueGrowth).toFixed(1)}%
                    </div>
                  )}
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  {totalTransactions} transactions
                </p>
              </CardContent>
            </Card>
            
            <Card className="group relative overflow-hidden bg-gradient-to-br from-green-50 via-green-100 to-green-200 dark:from-green-950/30 dark:via-green-900/30 dark:to-green-800/30 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Avg. Order Value</CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                  <ShoppingCart className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-0 relative">
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">{formatCurrency(avgSale)}</div>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Per transaction
                </p>
              </CardContent>
            </Card>
            
            <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200 dark:from-purple-950/30 dark:via-purple-900/30 dark:to-purple-800/30 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">Total Transactions</CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                  <Receipt className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-0 relative">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{totalTransactions}</div>
                  {growthMetrics.transactionGrowth !== 0 && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      growthMetrics.transactionGrowth > 0 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                    }`}>
                      {growthMetrics.transactionGrowth > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {Math.abs(growthMetrics.transactionGrowth).toFixed(1)}%
                    </div>
                  )}
                </div>
                <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                  In selected period
                </p>
              </CardContent>
            </Card>
            
            <Card className="group relative overflow-hidden bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 dark:from-orange-950/30 dark:via-orange-900/30 dark:to-orange-800/30 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">Top Product</CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
                  <Package className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-0 relative">
                <div className="text-lg font-bold text-orange-900 dark:text-orange-100 truncate">
                  {topProducts.length > 0 ? topProducts[0].name : 'N/A'}
                </div>
                <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                  {topProducts.length > 0 ? `${topProducts[0].quantity} units sold` : 'No data'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Sales Chart */}
          <Card className="bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-800/50 shadow-xl border-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Daily Sales Trend</CardTitle>
                <p className="text-sm text-muted-foreground">Revenue performance over time</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <SalesChart data={chartData} />
              ) : (
                <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No sales data available for the selected period</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Top Products */}
          <Card className="bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-800/50 shadow-xl border-0">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Top Selling Products</CardTitle>
              <p className="text-sm text-muted-foreground">Best performing products by revenue</p>
            </CardHeader>
            <CardContent>
              {topProducts.length > 0 ? (
                <div className="space-y-4">
                  {topProducts.map((product, index) => (
                    <div key={index} className="group flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold shadow-lg">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{product.name}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {product.quantity} units sold
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-slate-900 dark:text-slate-100">{formatCurrency(product.revenue)}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No product data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card className="bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-800/50 shadow-xl border-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Recent Transactions</CardTitle>
                <p className="text-sm text-muted-foreground">Latest sales transactions with sorting options</p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={(value: 'date' | 'total' | 'invoice') => setSortBy(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="total">Amount</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="gap-2"
                >
                  {sortOrder === 'asc' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  {sortOrder === 'asc' ? 'Asc' : 'Desc'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleSort('invoice')}
                    >
                      <div className="flex items-center gap-2">
                        Invoice
                        {sortBy === 'invoice' && (
                          sortOrder === 'asc' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center gap-2">
                        Date & Time
                        {sortBy === 'date' && (
                          sortOrder === 'asc' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Cashier</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 transition-colors text-right"
                      onClick={() => handleSort('total')}
                    >
                      <div className="flex items-center gap-2 justify-end">
                        Total
                        {sortBy === 'total' && (
                          sortOrder === 'asc' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.slice(0, 50).map((sale) => (
                    <TableRow key={sale.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-mono font-medium">{sale.invoice_number}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">{new Date(sale.created_at).toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground">{new Date(sale.created_at).toLocaleTimeString()}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <Users className="h-3 w-3 text-white" />
                          </div>
                          {sale.profile?.full_name || "Unknown"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(sale.total)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(sale.subtotal)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(sale.tax_amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredSales.length === 0 && (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No transactions found for the selected criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
