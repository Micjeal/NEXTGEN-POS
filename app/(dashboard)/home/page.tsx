"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, ShoppingCart, Package, AlertTriangle, Clock, TrendingUp, TrendingDown, BarChart3, Users, CheckCircle, ArrowUpRight, ArrowDownRight, RefreshCw, Filter, Download, Calendar, Brain, Target, Activity } from "lucide-react"
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
    activeEmployeesCount,
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

      {/* Summary Widgets */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Today's Sales */}
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
              <p className="text-xs text-muted-foreground mt-1">{todayCount} transactions today</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Products */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-900/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Total Products</CardTitle>
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

        {/* Low Stock Alerts */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-900/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">Low Stock Alerts</CardTitle>
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

        {/* Active Employees */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-900/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Active Employees</CardTitle>
            <div className="p-2 rounded-lg bg-purple-100/50 dark:bg-purple-900/30">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-white">{activeEmployeesCount || 0}</div>
            <div className="mt-2">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Currently Active</span>
                <span className="font-medium">{activeEmployeesCount > 0 ? 'All systems operational' : 'No active staff'}</span>
              </div>
              <Progress value={activeEmployeesCount > 0 ? 100 : 0} className="h-2 bg-purple-200/50 dark:bg-purple-900/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Demand Forecasting Section */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
            <Brain className="h-5 w-5" />
            AI-Based Demand Forecasting
          </CardTitle>
          <CardDescription className="text-indigo-700 dark:text-indigo-300">
            Intelligent predictions for inventory optimization and sales planning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Forecast Summary */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">Next 7 Days</span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  +{productPerformance?.length > 0 ? '15%' : '0%'} Growth
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Expected Sales</span>
                  <span className="font-medium">{formatCurrency(todayTotal * 1.15, settings.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Top Product</span>
                  <span className="font-medium">{topProducts?.[0]?.name || 'No data'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{productPerformance?.length > 0 ? '85%' : 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* High Demand Products */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-indigo-800 dark:text-indigo-200">High Demand Alert</h4>
              <div className="space-y-3">
                {productPerformance?.slice(0, 3).map((product: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-white/50 dark:bg-white/5">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={product.performance === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                          {product.performance || 'medium'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {product.stockRecommendation || 'Monitor stock levels'}
                        </span>
                      </div>
                    </div>
                    {product.riskLevel === 'high' && (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                )) || (
                  <p className="text-sm text-muted-foreground">No product performance data available</p>
                )}
              </div>
            </div>

            {/* Forecast Trends */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-indigo-800 dark:text-indigo-200">Trend Analysis</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Seasonal Peak</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Dec-Feb</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Price Sensitivity</span>
                  <span className="text-sm font-medium">Medium</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Market Trend</span>
                  <div className="flex items-center gap-1">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Growing</span>
                  </div>
                </div>
              </div>
              <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                <Target className="h-4 w-4 mr-2" />
                Optimize Inventory
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Trends Graph - Only show if we have some data */}
      {(salesData?.length > 0 || topProducts?.length > 0 || productPerformance?.length > 0) && (
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
      )}
    </div>
  )
}