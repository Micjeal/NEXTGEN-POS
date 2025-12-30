"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, ShoppingCart, Package, AlertTriangle, Clock, TrendingUp, TrendingDown, BarChart3, Users, CheckCircle, ArrowUpRight, ArrowDownRight, RefreshCw, Filter, Download, Calendar } from "lucide-react"
import { formatCurrency } from "@/lib/utils/cart"
import { format, subDays, isToday, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"
import { ExportButtons } from "@/components/dashboard/export-buttons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { useSettings } from "@/lib/hooks/use-settings"

export default function DashboardPage() {
  const { settings } = useSettings()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 12),
    to: new Date(),
  })

  useEffect(() => {
    fetchDashboardData()
  }, [dateRange])

  const fetchDashboardData = async () => {
    try {
      const params = new URLSearchParams()
      if (dateRange?.from) {
        params.append('dateFrom', dateRange.from.toISOString())
      }
      if (dateRange?.to) {
        params.append('dateTo', dateRange.to.toISOString())
      }

      const response = await fetch(`/api/dashboard?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const dashboardData = await response.json()
        setData(dashboardData)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !data) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  const {
    todayTotal,
    todayCount,
    productCount,
    lowStockCount,
    lowStock,
    recentProducts,
    salesData,
    granularity,
    topProducts,
    productPerformance,
    salesChange,
    yesterdayTotal,
    userRole,
    greeting
  } = data

  const isCashier = userRole === "cashier"
  const profile = { full_name: 'User' }
  const isSalesUp = salesChange >= 0


  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            {greeting}, User! 👋
          </h1>
          <p className="text-muted-foreground">
            {isToday(new Date()) ? "Here's what's happening today" : "Here's your performance overview"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButtons />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
              <div className="p-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDateRange({
                      from: subMonths(new Date(), 12),
                      to: new Date(),
                    })}
                  >
                    Last 12 Months
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDateRange({
                      from: startOfMonth(new Date()),
                      to: endOfMonth(new Date()),
                    })}
                  >
                    This Month
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" className="gap-2" onClick={fetchDashboardData}>
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Sales Card */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Today's Sales</CardTitle>
            <div className="p-2 rounded-lg bg-blue-100/50 dark:bg-blue-900/30">
              <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-white">{formatCurrency(todayTotal, settings.currency)}</div>
            <div className="flex items-center mt-2 text-sm">
              {isSalesUp ? (
                <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={isSalesUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                {Math.abs(Math.round(salesChange))}% {isSalesUp ? 'increase' : 'decrease'} from yesterday
              </span>
            </div>
            <div className="mt-2">
              <Progress value={Math.min(100, (todayCount / 50) * 100)} className="h-2 bg-blue-200/50 dark:bg-blue-900/30" />
              <p className="text-xs text-muted-foreground mt-1">{todayCount} {isCashier ? 'your transactions' : 'total transactions'} today</p>
            </div>
          </CardContent>
        </Card>

        {/* Products Card */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-900/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Active Products</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-100/50 dark:bg-emerald-900/30">
              <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900 dark:text-white">{productCount || 0}</div>
            <div className="mt-2">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">In Stock</span>
                <span className="font-medium">{productCount > 0 ? Math.floor(((productCount - lowStockCount) / productCount) * 100) : 0}%</span>
              </div>
              <Progress value={productCount > 0 ? ((productCount - lowStockCount) / productCount) * 100 : 0} className="h-2 bg-emerald-200/50 dark:bg-emerald-900/30" />
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Card */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-900/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">Low Stock Items</CardTitle>
            <div className="p-2 rounded-lg bg-amber-100/50 dark:bg-amber-900/30">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-amber-900 dark:text-white">{lowStockCount}</div>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                Needs Attention
              </Badge>
            </div>
            <div className="mt-2">
              {lowStockCount > 0 ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Top item:</span>
                  <span className="font-medium truncate">
                    {lowStock?.[0]?.name || 'Unknown'} ({lowStock?.[0]?.inventory?.[0]?.quantity || 0} left)
                  </span>
                </div>
              ) : (
                <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span>All items are well-stocked</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Card */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-900/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Recent Activity</CardTitle>
            <div className="p-2 rounded-lg bg-purple-100/50 dark:bg-purple-900/30">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentProducts?.slice(0, 2).map((product: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Added {format(new Date(product.created_at), 'MMM d')} • {product.category?.name || 'No category'}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    {product.inventory?.[0]?.quantity || 0} in stock
                  </Badge>
                </div>
              ))}
              {recentProducts?.length === 0 && (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCount}</div>
            <p className="text-xs text-muted-foreground">
              {isCashier ? "Sales completed by you today" : "Sales completed today"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productCount || 0}</div>
            <p className="text-xs text-muted-foreground">Products in catalog</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Items need restocking</p>
          </CardContent>
        </Card>
      </div>

      {lowStockCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Low Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStock?.slice(0, 5).map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-sm text-destructive">{item.inventory?.[0]?.quantity || 0} units left</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recently Added Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentProducts && recentProducts.length > 0 ? (
              <div className="space-y-4">
                {recentProducts.map((product: any) => (
                  <div key={product.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.category?.name || 'No category'} • {format(new Date(product.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(product.price, settings.currency)}</p>
                      <p className="text-sm text-muted-foreground">
                        Stock: {product.inventory?.[0]?.quantity || 0}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No recent products found</p>
            )}
          </CardContent>
        </Card>

        {/* Top Performing Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Top Performing Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts && topProducts.length > 0 ? (
              <div className="space-y-4">
                {topProducts.slice(0, 5).map((product: any, index: number) => (
                  <div key={product.name} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{product.sales} sold</p>
                      <p className="text-sm text-muted-foreground">{formatCurrency(product.revenue, settings.currency)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No sales data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Performance Analytics</h2>
            <p className="text-sm text-muted-foreground">Key metrics and visualizations for your business</p>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
                <div className="p-3 border-t border-border">
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDateRange({
                        from: subMonths(new Date(), 12),
                        to: new Date(),
                      })}
                    >
                      Last 12 Months
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDateRange({
                        from: startOfMonth(new Date()),
                        to: endOfMonth(new Date()),
                      })}
                    >
                      This Month
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </div>
        </div>
        
        <DashboardCharts
          salesData={salesData}
          granularity={granularity}
          topProducts={topProducts}
          productPerformance={productPerformance}
          currency={settings.currency}
        />
      </div>
    </div>
  )
}
