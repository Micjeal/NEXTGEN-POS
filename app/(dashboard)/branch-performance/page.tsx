"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  TrendingUp,
  Building2
} from "lucide-react"

interface BranchPerformanceData {
  branch: {
    id: string
    name: string
    code: string
    address: string
    is_headquarters: boolean
  }
  metrics: {
    totalRevenue: number
    totalTransactions: number
    avgOrderValue: number
    totalInventoryItems: number
    totalInventoryValue: number
    lowStockItems: number
    employeeCount: number
  }
  recentSales: any[]
}

export default function BranchPerformancePage() {
  const [performanceData, setPerformanceData] = useState<BranchPerformanceData[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPerformanceData = async () => {
    try {
      const response = await fetch('/api/branch-performance')
      const data = await response.json()
      setPerformanceData(data.branchPerformance || [])
    } catch (error) {
      console.error('Error fetching branch performance:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPerformanceData()
  }, [])

  // Calculate overall metrics
  const overallMetrics = performanceData.reduce(
    (acc, branch) => ({
      totalRevenue: acc.totalRevenue + branch.metrics.totalRevenue,
      totalTransactions: acc.totalTransactions + branch.metrics.totalTransactions,
      totalInventoryItems: acc.totalInventoryItems + branch.metrics.totalInventoryItems,
      totalLowStockItems: acc.totalLowStockItems + branch.metrics.lowStockItems,
      totalEmployees: acc.totalEmployees + branch.metrics.employeeCount,
    }),
    {
      totalRevenue: 0,
      totalTransactions: 0,
      totalInventoryItems: 0,
      totalLowStockItems: 0,
      totalEmployees: 0,
    }
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
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
            Branch Performance Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Monitor performance metrics across all branches
          </p>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              UGX {overallMetrics.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-green-700 dark:text-green-300">
              Across all branches
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {overallMetrics.totalTransactions}
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Completed sales
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {overallMetrics.totalEmployees}
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-300">
              Active staff
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-red-200 dark:border-red-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-red-900 dark:text-red-100">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-red-900 dark:text-red-100">
              {overallMetrics.totalLowStockItems}
            </div>
            <p className="text-xs text-red-700 dark:text-red-300">
              Items need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Branch Performance Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {performanceData.map((item) => (
          <Card key={item.branch.id} className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900/50 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {item.branch.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{item.branch.code}</p>
                </div>
                {item.branch.is_headquarters && (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-700">
                    HQ
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Revenue</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    UGX {item.metrics.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Transactions</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {item.metrics.totalTransactions}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg Order</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    UGX {item.metrics.avgOrderValue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Employees</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {item.metrics.employeeCount}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Inventory Status</p>
                <div className="flex justify-between text-sm">
                  <span>Total Items: {item.metrics.totalInventoryItems}</span>
                  <span className={item.metrics.lowStockItems > 0 ? "text-red-600" : "text-green-600"}>
                    Low Stock: {item.metrics.lowStockItems}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Performance: {item.metrics.totalTransactions > 0 ? "Active" : "Low Activity"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {performanceData.length === 0 && (
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950/20 dark:to-slate-900/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              No branch data available
            </h3>
            <p className="text-muted-foreground text-center">
              Branch performance data will appear here once branches are set up and transactions are recorded.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}