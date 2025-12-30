"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Eye,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import type { Sale } from "@/lib/types/database"

interface RealTimeMetrics {
  currentHourSales: number
  hourlyTarget: number
  dailySales: number
  dailyTarget: number
  weeklySales: number
  weeklyTarget: number
  monthlySales: number
  monthlyTarget: number
  activeCustomers: number
  conversionRate: number
  avgTransactionValue: number
  peakHours: string[]
}

interface CLVData {
  averageCLV: number
  topSegmentCLV: number
  clvGrowth: number
  customerRetention: number
  churnRate: number
  lifetimeValueDistribution: { segment: string; value: number; count: number }[]
}

interface ProfitMarginData {
  overallMargin: number
  categoryMargins: { category: string; margin: number; sales: number }[]
  productMargins: { product: string; margin: number; sales: number }[]
  costAnalysis: { category: string; cost: number; percentage: number }[]
}

interface PredictiveData {
  demandForecast: { product: string; predicted: number; confidence: number }[]
  salesTrend: { date: string; actual: number; predicted: number }[]
  inventoryAlerts: { product: string; current: number; optimal: number; risk: string }[]
  seasonalPatterns: { month: string; growth: number; confidence: number }[]
}

export default function InsightsPage() {
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null)
  const [clvData, setClvData] = useState<CLVData | null>(null)
  const [profitMarginData, setProfitMarginData] = useState<ProfitMarginData | null>(null)
  const [predictiveData, setPredictiveData] = useState<PredictiveData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      setRefreshing(true)

      const [
        realTimeRes,
        clvRes,
        profitRes,
        predictiveRes
      ] = await Promise.all([
        fetch('/api/insights/real-time'),
        fetch('/api/insights/clv'),
        fetch('/api/insights/profit-margins'),
        fetch('/api/insights/predictive')
      ])

      if (realTimeRes.ok) {
        const realTimeData = await realTimeRes.json()
        setRealTimeMetrics(realTimeData)
      }

      if (clvRes.ok) {
        const clvDataResponse = await clvRes.json()
        setClvData(clvDataResponse)
      }

      if (profitRes.ok) {
        const profitData = await profitRes.json()
        setProfitMarginData(profitData)
      }

      if (predictiveRes.ok) {
        const predictiveDataResponse = await predictiveRes.json()
        setPredictiveData(predictiveDataResponse)
      }

    } catch (error) {
      console.error('Error fetching insights data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRefresh = () => {
    fetchData()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted rounded animate-pulse" />
            <div className="h-4 w-96 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-6 w-16 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 bg-muted rounded mb-2" />
                <div className="h-3 w-20 bg-muted rounded" />
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Business Insights & Analytics
          </h1>
          <p className="text-muted-foreground text-lg">
            Advanced analytics, predictive insights, and real-time performance metrics
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-200 hover:shadow-lg self-start sm:self-auto"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      <Tabs defaultValue="real-time" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="real-time" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Real-Time
          </TabsTrigger>
          <TabsTrigger value="clv" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Customer Value
          </TabsTrigger>
          <TabsTrigger value="profit" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Profit Analysis
          </TabsTrigger>
          <TabsTrigger value="predictive" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Predictive
          </TabsTrigger>
        </TabsList>

        {/* Real-Time Sales Metrics */}
        <TabsContent value="real-time" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Current Hour Sales</CardTitle>
                <Clock className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  UGX {realTimeMetrics?.currentHourSales.toLocaleString()}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Progress
                    value={(realTimeMetrics?.currentHourSales || 0) / (realTimeMetrics?.hourlyTarget || 1) * 100}
                    className="flex-1 h-2"
                  />
                  <span className="text-xs text-muted-foreground">
                    {Math.round((realTimeMetrics?.currentHourSales || 0) / (realTimeMetrics?.hourlyTarget || 1) * 100)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Active Customers</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {realTimeMetrics?.activeCustomers}
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Currently in store
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">Conversion Rate</CardTitle>
                <Target className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {realTimeMetrics?.conversionRate}%
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">+2.3%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">Avg Transaction</CardTitle>
                <DollarSign className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  UGX {realTimeMetrics?.avgTransactionValue.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">+5.1%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Peak Hours & Performance Targets */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Peak Performance Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {realTimeMetrics?.peakHours.map((hour, index) => (
                    <div key={hour} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <span className="font-medium">{hour}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-green-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: `${85 - index * 10}%` }}></div>
                        </div>
                        <span className="text-sm text-muted-foreground">{85 - index * 10}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Sales Targets Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Daily Target</span>
                    <span>UGX {realTimeMetrics?.dailySales.toLocaleString()} / {realTimeMetrics?.dailyTarget.toLocaleString()}</span>
                  </div>
                  <Progress value={(realTimeMetrics?.dailySales || 0) / (realTimeMetrics?.dailyTarget || 1) * 100} className="h-3" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Weekly Target</span>
                    <span>UGX {realTimeMetrics?.weeklySales.toLocaleString()} / {realTimeMetrics?.weeklyTarget.toLocaleString()}</span>
                  </div>
                  <Progress value={(realTimeMetrics?.weeklySales || 0) / (realTimeMetrics?.weeklyTarget || 1) * 100} className="h-3" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Monthly Target</span>
                    <span>UGX {realTimeMetrics?.monthlySales.toLocaleString()} / {realTimeMetrics?.monthlyTarget.toLocaleString()}</span>
                  </div>
                  <Progress value={(realTimeMetrics?.monthlySales || 0) / (realTimeMetrics?.monthlyTarget || 1) * 100} className="h-3" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customer Lifetime Value Analysis */}
        <TabsContent value="clv" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/20 dark:to-indigo-900/20 border-indigo-200 dark:border-indigo-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-indigo-900 dark:text-indigo-100">Average CLV</CardTitle>
                <Users className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                  UGX {clvData?.averageCLV.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">+{clvData?.clvGrowth}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950/20 dark:to-teal-900/20 border-teal-200 dark:border-teal-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-teal-900 dark:text-teal-100">Retention Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-teal-600" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-teal-900 dark:text-teal-100">
                  {clvData?.customerRetention}%
                </div>
                <p className="text-xs text-teal-700 dark:text-teal-300 mt-1">
                  Customer retention
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-red-200 dark:border-red-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-red-900 dark:text-red-100">Churn Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {clvData?.churnRate}%
                </div>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  Customer churn
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-100">Top Segment CLV</CardTitle>
                <TrendingUp className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  UGX {clvData?.topSegmentCLV.toLocaleString()}
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  VIP customers
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CLV Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Lifetime Value Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {clvData?.lifetimeValueDistribution.map((segment) => (
                  <div key={segment.segment} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{segment.segment}</Badge>
                      <span className="text-sm text-muted-foreground">{segment.count} customers</span>
                    </div>
                    <div className="text-2xl font-bold">
                      UGX {segment.value.toLocaleString()}
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${(segment.value / (clvData?.topSegmentCLV || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profit Margin Analysis */}
        <TabsContent value="profit" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Overall Margin</CardTitle>
                <BarChart3 className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  {profitMarginData?.overallMargin}%
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">+1.2%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Margins */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Profit Margins by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profitMarginData?.categoryMargins.map((category) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{category.category}</span>
                          <span className="text-sm text-muted-foreground">{category.margin}%</span>
                        </div>
                        <Progress value={category.margin} className="h-2" />
                        <div className="text-xs text-muted-foreground mt-1">
                          UGX {category.sales.toLocaleString()} in sales
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Analysis Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profitMarginData?.costAnalysis.map((cost) => (
                    <div key={cost.category} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{cost.category}</span>
                          <span className="text-sm text-muted-foreground">{cost.percentage}%</span>
                        </div>
                        <Progress value={cost.percentage} className="h-2" />
                        <div className="text-xs text-muted-foreground mt-1">
                          UGX {cost.cost.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Predictive Analytics */}
        <TabsContent value="predictive" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Demand Forecast (Next 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {predictiveData?.demandForecast.map((forecast) => (
                    <div key={forecast.product} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{forecast.product}</div>
                        <div className="text-sm text-muted-foreground">
                          Predicted: {forecast.predicted} units
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={forecast.confidence > 90 ? "default" : "secondary"}>
                          {forecast.confidence}% confidence
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Inventory Risk Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {predictiveData?.inventoryAlerts.map((alert) => (
                    <div key={alert.product} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{alert.product}</div>
                        <div className="text-sm text-muted-foreground">
                          Current: {alert.current} | Optimal: {alert.optimal}
                        </div>
                      </div>
                      <Badge variant={alert.risk === 'high' ? 'destructive' : alert.risk === 'medium' ? 'secondary' : 'outline'}>
                        {alert.risk} risk
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Seasonal Patterns */}
          <Card>
            <CardHeader>
              <CardTitle>Seasonal Sales Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {predictiveData?.seasonalPatterns.map((pattern) => (
                  <div key={pattern.month} className="p-4 border rounded-lg text-center">
                    <div className="text-lg font-bold">{pattern.month}</div>
                    <div className={`text-2xl font-bold mt-2 ${pattern.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {pattern.growth > 0 ? '+' : ''}{pattern.growth}%
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {pattern.confidence}% confidence
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}