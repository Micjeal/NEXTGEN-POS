"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Star, 
  Truck, 
  Package, 
  DollarSign,
  RefreshCw 
} from "lucide-react"

interface SupplierPerformanceCardProps {
  supplierId: string
}

interface PerformanceData {
  supplier: {
    id: string
    name: string
    rating: number
    on_time_delivery_rate: number
    quality_score: number
    average_lead_time_days: number
    total_orders: number
    total_spent: number
    order_frequency: number
  }
  recent_orders: any[]
  quality_summary: {
    total_inspections: number
    excellent: number
    good: number
    acceptable: number
    poor: number
    rejected: number
  }
}

export function SupplierPerformanceCard({ supplierId }: SupplierPerformanceCardProps) {
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPerformance()
  }, [supplierId])

  const fetchPerformance = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/suppliers/performance?supplier_id=${supplierId}`)
      if (!response.ok) throw new Error("Failed to fetch performance")
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600"
    if (rating >= 3.5) return "text-yellow-600"
    return "text-red-600"
  }

  const getDeliveryRateColor = (rate: number) => {
    if (rate >= 90) return "bg-green-100 text-green-800"
    if (rate >= 75) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading Performance Data...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            {error || "No performance data available"}
          </div>
        </CardContent>
      </Card>
    )
  }

  const { supplier, quality_summary } = data
  const qualityPercentage = ((quality_summary.excellent + quality_summary.good) / Math.max(quality_summary.total_inspections, 1)) * 100

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Rating */}
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getRatingColor(supplier.rating)}`}>
              {supplier.rating.toFixed(1)}
            </div>
            <div className="flex mt-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i <= Math.floor(supplier.rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* On-Time Delivery */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Delivery</CardTitle>
            <Truck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {supplier.on_time_delivery_rate.toFixed(1)}%
            </div>
            <Progress value={supplier.on_time_delivery_rate} className="mt-2" />
          </CardContent>
        </Card>

        {/* Quality Score */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {supplier.quality_score.toFixed(1)}/5
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on {quality_summary.total_inspections} inspections
            </p>
          </CardContent>
        </Card>

        {/* Lead Time */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Lead Time</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {supplier.average_lead_time_days} <span className="text-sm font-normal">days</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {supplier.order_frequency.toFixed(1)} orders/month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{supplier.total_orders}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">
                  UGX {supplier.total_spent.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Excellent</p>
                <p className="text-2xl font-bold text-green-600">
                  {quality_summary.excellent}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {quality_summary.rejected}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quality Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Inspection Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-5">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{quality_summary.excellent}</div>
              <p className="text-sm text-muted-foreground">Excellent</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{quality_summary.good}</div>
              <p className="text-sm text-muted-foreground">Good</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{quality_summary.acceptable}</div>
              <p className="text-sm text-muted-foreground">Acceptable</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{quality_summary.poor}</div>
              <p className="text-sm text-muted-foreground">Poor</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{quality_summary.rejected}</div>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Pass Rate</span>
              <span>{qualityPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={qualityPercentage} />
          </div>
        </CardContent>
      </Card>

      {/* Performance Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {supplier.on_time_delivery_rate < 90 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                <TrendingDown className="h-5 w-5 text-yellow-600" />
                <span className="text-sm">
                  On-time delivery rate is below 90%. Consider discussing delivery schedules with the supplier.
                </span>
              </div>
            )}
            {supplier.quality_score < 4 && (
              <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <TrendingDown className="h-5 w-5 text-orange-600" />
                <span className="text-sm">
                  Quality score is below 4.0. Implement stricter quality checks on incoming goods.
                </span>
              </div>
            )}
            {supplier.average_lead_time_days > 14 && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="text-sm">
                  Average lead time is {supplier.average_lead_time_days} days. Consider maintaining higher safety stock.
                </span>
              </div>
            )}
            {supplier.on_time_delivery_rate >= 95 && supplier.quality_score >= 4.5 && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-sm">
                  Excellent performance! Consider this supplier for preferred status.
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
