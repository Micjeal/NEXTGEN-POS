"use client"

import { ReportsDashboard } from "@/components/reports/reports-dashboard"
import type { Sale, Product, Payment, Category as CategoryType, PaymentMethod } from "@/lib/types/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Receipt, ShoppingCart, Package, Users, Activity, Package2, FileText, LayoutDashboard, Warehouse } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ExportButtons } from "@/components/dashboard/export-buttons"
import { formatCurrency } from "@/lib/utils/cart"
import { useEffect, useState } from "react"
import { Spinner } from "@/components/ui/spinner"

interface ReportsData {
  sales: Sale[]
  salesChartData: { date: string; total: number; count: number }[]
  categories: CategoryType[]
  paymentMethods: PaymentMethod[]
  auditLogs: any[]
  inventoryAdjustments: any[]
  userActivity: any[]
  productChanges: any[]
  statistics: {
    totalUsers: number
    totalSalesCount: number
    totalSales: number
    totalTransactions: number
    avgSale: number
    revenueChange: number
    transactionChange: number
    avgSaleChange: number
    activeProducts: number
    activeProductsChange: number
    dateRange: { start: string; end: string }
  }
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        const response = await fetch('/api/reports')
        if (!response.ok) {
          throw new Error('Failed to fetch reports data')
        }
        const reportsData = await response.json()
        setData(reportsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchReportsData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner className="h-8 w-8 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading reports data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading reports: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  const {
    sales,
    salesChartData,
    categories,
    paymentMethods,
    auditLogs,
    inventoryAdjustments,
    userActivity,
    productChanges,
    statistics
  } = data

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Sales Reports</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Analytics and insights for {new Date(statistics.dateRange.start).toLocaleDateString()} - {new Date(statistics.dateRange.end).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
          <ExportButtons />
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard" className="block">
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 h-full">
            <CardContent className="flex items-center p-4 sm:p-6">
              <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                <LayoutDashboard className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-semibold truncate">Overview</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Dashboard & Analytics</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/pos" className="block">
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 h-full">
            <CardContent className="flex items-center p-4 sm:p-6">
              <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/30 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-semibold truncate">Transactions</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Point of Sale System</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/inventory" className="block sm:col-span-2 lg:col-span-1">
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10 h-full">
            <CardContent className="flex items-center p-4 sm:p-6">
              <div className="p-2 sm:p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                <Warehouse className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-semibold truncate">Inventory</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Stock Management</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Key Metrics Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold sm:text-xl">Key Metrics</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${statistics.totalSales.toFixed(2)}</div>
              <p className={`text-xs ${statistics.revenueChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {statistics.revenueChange >= 0 ? '+' : ''}{statistics.revenueChange.toFixed(1)}% from last month
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalTransactions}</div>
              <p className={`text-xs ${statistics.transactionChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {statistics.transactionChange >= 0 ? '+' : ''}{statistics.transactionChange.toFixed(1)}% from last month
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${statistics.avgSale.toFixed(2)}</div>
              <p className={`text-xs ${statistics.avgSaleChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {statistics.avgSaleChange >= 0 ? '+' : ''}{statistics.avgSaleChange.toFixed(1)}% from last month
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.activeProducts}</div>
              <p className={`text-xs ${statistics.activeProductsChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {statistics.activeProductsChange >= 0 ? '+' : ''}{statistics.activeProductsChange} from last month
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Dashboard Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Sales Analytics</h2>
        <ReportsDashboard
          sales={sales}
          salesChartData={salesChartData}
          categories={categories || []}
          paymentMethods={paymentMethods || []}
        />
      </div>

      {/* System Monitoring Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold sm:text-xl">System Monitoring</h2>
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* System Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Users</span>
                <span className="font-semibold">{statistics.totalUsers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Sales</span>
                <span className="font-semibold">{statistics.totalSalesCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Products</span>
                <span className="font-semibold">{statistics.activeProducts} products</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Database Health</span>
                <Badge variant="default" className="text-xs">Healthy</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {auditLogs?.length ? (
                  auditLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium capitalize">{log.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.table_name} • System
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No recent activities</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package2 className="h-5 w-5" />
                Inventory Adjustments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {inventoryAdjustments?.length ? (
                  inventoryAdjustments.map((adjustment) => (
                    <div key={adjustment.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <Package className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{adjustment.product?.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            adjustment.adjustment_type === 'add' ? 'default' :
                            adjustment.adjustment_type === 'remove' ? 'destructive' : 'secondary'
                          } className="text-xs">
                            {adjustment.adjustment_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {adjustment.quantity_change > 0 ? '+' : ''}{adjustment.quantity_change}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          System • {new Date(adjustment.created_at).toLocaleString()}
                        </p>
                        {adjustment.reason && (
                          <p className="text-xs text-muted-foreground italic">{adjustment.reason}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No recent inventory adjustments</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* User Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recent User Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {userActivity?.length ? (
                  userActivity.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Updated</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(user.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No recent user activity</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Product Changes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Recent Product Changes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {productChanges?.length ? (
                  productChanges.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(product.price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Updated</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(product.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No recent product changes</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
