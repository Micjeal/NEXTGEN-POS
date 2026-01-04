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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900 via-violet-900 to-indigo-900 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20"></div>
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-gradient-to-br from-violet-400/30 to-purple-400/30 blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-400/30 to-blue-400/30 blur-3xl"></div>
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
                  Business Insights & Analytics
                </h1>
                <p className="text-purple-100 text-lg font-medium">
                  Advanced analytics, predictive insights, and real-time performance metrics
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:shadow-xl transition-all duration-300 self-start sm:self-auto px-6 py-3 rounded-xl"
          >
            <RefreshCw className={`mr-2 h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      <Tabs defaultValue="real-time" className="space-y-8">
        <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-950/50 dark:via-slate-900/50 dark:to-slate-950/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
          <TabsList className="grid w-full grid-cols-4 h-14 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 p-1 rounded-xl shadow-inner">
            <TabsTrigger
              value="real-time"
              className="flex items-center gap-3 h-12 rounded-lg font-semibold text-slate-700 dark:text-slate-300 data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 transition-all duration-300"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                <Activity className="h-4 w-4 text-white" />
              </div>
              Real-Time
            </TabsTrigger>
            <TabsTrigger
              value="clv"
              className="flex items-center gap-3 h-12 rounded-lg font-semibold text-slate-700 dark:text-slate-300 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/25 transition-all duration-300"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg">
                <Users className="h-4 w-4 text-white" />
              </div>
              Customer Value
            </TabsTrigger>
            <TabsTrigger
              value="profit"
              className="flex items-center gap-3 h-12 rounded-lg font-semibold text-slate-700 dark:text-slate-300 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/25 transition-all duration-300"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              Profit Analysis
            </TabsTrigger>
            <TabsTrigger
              value="predictive"
              className="flex items-center gap-3 h-12 rounded-lg font-semibold text-slate-700 dark:text-slate-300 data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=active]:shadow-lg data-[state=active]:shadow-violet-500/25 transition-all duration-300"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                <Eye className="h-4 w-4 text-white" />
              </div>
              Predictive
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Real-Time Sales Metrics */}
        <TabsContent value="real-time" className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="group relative overflow-hidden bg-gradient-to-br from-green-50 via-green-100 to-green-200 dark:from-green-950/30 dark:via-green-900/30 dark:to-green-800/30 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative">
                <CardTitle className="text-sm font-semibold text-green-900 dark:text-green-100">Current Hour Sales</CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                  <Clock className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-0 relative">
                <div className="text-3xl font-bold text-green-900 dark:text-green-100 mb-3">
                  UGX {realTimeMetrics?.currentHourSales.toLocaleString()}
                </div>
                <div className="flex items-center gap-3">
                  <Progress
                    value={(realTimeMetrics?.currentHourSales || 0) / (realTimeMetrics?.hourlyTarget || 1) * 100}
                    className="flex-1 h-3 bg-green-200 dark:bg-green-800"
                  />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                    {Math.round((realTimeMetrics?.currentHourSales || 0) / (realTimeMetrics?.hourlyTarget || 1) * 100)}%
                  </span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300 mt-2 font-medium">
                  Target: UGX {realTimeMetrics?.hourlyTarget.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 dark:from-blue-950/30 dark:via-blue-900/30 dark:to-blue-800/30 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative">
                <CardTitle className="text-sm font-semibold text-blue-900 dark:text-blue-100">Active Customers</CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-0 relative">
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-2">{realTimeMetrics?.activeCustomers}</div>
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  Currently in store
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Activity className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Live tracking</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200 dark:from-purple-950/30 dark:via-purple-900/30 dark:to-purple-800/30 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative">
                <CardTitle className="text-sm font-semibold text-purple-900 dark:text-purple-100">Conversion Rate</CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-0 relative">
                <div className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-2">
                  {realTimeMetrics?.conversionRate}%
                </div>
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-600">+2.3%</span>
                  <span className="text-xs text-purple-700 dark:text-purple-300">vs last week</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 dark:from-orange-950/30 dark:via-orange-900/30 dark:to-orange-800/30 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative">
                <CardTitle className="text-sm font-semibold text-orange-900 dark:text-orange-100">Avg Transaction</CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-0 relative">
                <div className="text-3xl font-bold text-orange-900 dark:text-orange-100 mb-2">
                  UGX {realTimeMetrics?.avgTransactionValue.toLocaleString()}
                </div>
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-600">+5.1%</span>
                  <span className="text-xs text-orange-700 dark:text-orange-300">vs last week</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Peak Hours & Performance Targets */}
          <div className="grid gap-8 md:grid-cols-2">
            <Card className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/30 dark:via-yellow-950/30 dark:to-orange-950/30 shadow-xl border-0">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-4 text-amber-900 dark:text-amber-100">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Peak Performance Hours</h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">Busiest times of the day</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {realTimeMetrics?.peakHours.map((hour, index) => (
                    <div key={hour} className="group flex items-center justify-between p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl border border-amber-200 dark:border-amber-700 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold shadow-lg">
                          {index + 1}
                        </div>
                        <div>
                          <span className="font-bold text-amber-900 dark:text-amber-100 text-lg">{hour}</span>
                          <p className="text-sm text-amber-700 dark:text-amber-300">Peak hour</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-amber-200 dark:bg-amber-800 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-amber-500 to-orange-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${85 - index * 10}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-amber-700 dark:text-amber-300 min-w-[3rem] text-right">
                          {85 - index * 10}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-cyan-950/30 shadow-xl border-0">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-4 text-emerald-900 dark:text-emerald-100">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Sales Targets Progress</h3>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Performance against goals</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl border border-emerald-200 dark:border-emerald-700">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold text-emerald-900 dark:text-emerald-100">Daily Target</span>
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                      UGX {realTimeMetrics?.dailySales.toLocaleString()} / {realTimeMetrics?.dailyTarget.toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    value={(realTimeMetrics?.dailySales || 0) / (realTimeMetrics?.dailyTarget || 1) * 100}
                    className="h-4 bg-emerald-200 dark:bg-emerald-800"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">Progress</span>
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                      {Math.round((realTimeMetrics?.dailySales || 0) / (realTimeMetrics?.dailyTarget || 1) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl border border-teal-200 dark:border-teal-700">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold text-teal-900 dark:text-teal-100">Weekly Target</span>
                    <span className="text-sm font-bold text-teal-700 dark:text-teal-300">
                      UGX {realTimeMetrics?.weeklySales.toLocaleString()} / {realTimeMetrics?.weeklyTarget.toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    value={(realTimeMetrics?.weeklySales || 0) / (realTimeMetrics?.weeklyTarget || 1) * 100}
                    className="h-4 bg-teal-200 dark:bg-teal-800"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-teal-600 dark:text-teal-400">Progress</span>
                    <span className="text-sm font-bold text-teal-700 dark:text-teal-300">
                      {Math.round((realTimeMetrics?.weeklySales || 0) / (realTimeMetrics?.weeklyTarget || 1) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl border border-cyan-200 dark:border-cyan-700">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold text-cyan-900 dark:text-cyan-100">Monthly Target</span>
                    <span className="text-sm font-bold text-cyan-700 dark:text-cyan-300">
                      UGX {realTimeMetrics?.monthlySales.toLocaleString()} / {realTimeMetrics?.monthlyTarget.toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    value={(realTimeMetrics?.monthlySales || 0) / (realTimeMetrics?.monthlyTarget || 1) * 100}
                    className="h-4 bg-cyan-200 dark:bg-cyan-800"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-cyan-600 dark:text-cyan-400">Progress</span>
                    <span className="text-sm font-bold text-cyan-700 dark:text-cyan-300">
                      {Math.round((realTimeMetrics?.monthlySales || 0) / (realTimeMetrics?.monthlyTarget || 1) * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customer Lifetime Value Analysis */}
        <TabsContent value="clv" className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="group relative overflow-hidden bg-gradient-to-br from-indigo-50 via-indigo-100 to-indigo-200 dark:from-indigo-950/30 dark:via-indigo-900/30 dark:to-indigo-800/30 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/10 to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative">
                <CardTitle className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">Average CLV</CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-0 relative">
                <div className="text-3xl font-bold text-indigo-900 dark:text-indigo-100 mb-2">
                  UGX {clvData?.averageCLV.toLocaleString()}
                </div>
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-600">+{clvData?.clvGrowth}%</span>
                  <span className="text-xs text-indigo-700 dark:text-indigo-300">growth</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden bg-gradient-to-br from-teal-50 via-teal-100 to-teal-200 dark:from-teal-950/30 dark:via-teal-900/30 dark:to-teal-800/30 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-400/10 to-teal-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative">
                <CardTitle className="text-sm font-semibold text-teal-900 dark:text-teal-100">Retention Rate</CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-0 relative">
                <div className="text-3xl font-bold text-teal-900 dark:text-teal-100 mb-2">
                  {clvData?.customerRetention}%
                </div>
                <p className="text-sm text-teal-700 dark:text-teal-300 font-medium">
                  Customer retention rate
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/30">
                    <TrendingUp className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                  </div>
                  <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">Healthy retention</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden bg-gradient-to-br from-red-50 via-red-100 to-red-200 dark:from-red-950/30 dark:via-red-900/30 dark:to-red-800/30 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-red-400/10 to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative">
                <CardTitle className="text-sm font-semibold text-red-900 dark:text-red-100">Churn Rate</CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-0 relative">
                <div className="text-3xl font-bold text-red-900 dark:text-red-100 mb-2">
                  {clvData?.churnRate}%
                </div>
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                  Customer churn rate
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                    <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
                  </div>
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">Needs attention</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200 dark:from-amber-950/30 dark:via-amber-900/30 dark:to-amber-800/30 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-amber-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative">
                <CardTitle className="text-sm font-semibold text-amber-900 dark:text-amber-100">Top Segment CLV</CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-0 relative">
                <div className="text-3xl font-bold text-amber-900 dark:text-amber-100 mb-2">
                  UGX {clvData?.topSegmentCLV.toLocaleString()}
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                  VIP customer value
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <DollarSign className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">High value segment</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CLV Distribution */}
          <Card className="bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950/30 dark:via-slate-900/30 dark:to-slate-800/30 shadow-xl border-0">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-4 text-slate-800 dark:text-slate-200">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Customer Lifetime Value Distribution</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    CLV breakdown by customer segments
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {clvData?.lifetimeValueDistribution.map((segment, index) => (
                  <div key={segment.segment} className="group relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-400/5 to-slate-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="outline" className="px-3 py-1 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 font-semibold text-slate-700 dark:text-slate-300">
                          {segment.segment}
                        </Badge>
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{segment.count} customers</span>
                      </div>
                      <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                        UGX {segment.value.toLocaleString()}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                          <span>Segment Value</span>
                          <span>{Math.round((segment.value / (clvData?.topSegmentCLV || 1)) * 100)}% of max</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-slate-500 to-slate-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${(segment.value / (clvData?.topSegmentCLV || 1)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profit Margin Analysis */}
        <TabsContent value="profit" className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200 dark:from-emerald-950/30 dark:via-emerald-900/30 dark:to-emerald-800/30 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative">
                <CardTitle className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Overall Margin</CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-0 relative">
                <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100 mb-2">
                  {profitMarginData?.overallMargin}%
                </div>
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-600">+1.2%</span>
                  <span className="text-xs text-emerald-700 dark:text-emerald-300">vs last month</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Margins */}
          <div className="grid gap-8 md:grid-cols-2">
            <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 shadow-xl border-0">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-4 text-blue-900 dark:text-blue-100">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Profit Margins by Category</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                      Margin performance across product categories
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {profitMarginData?.categoryMargins.map((category, index) => (
                    <div key={category.category} className="p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl border border-blue-200 dark:border-blue-700">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-blue-900 dark:text-blue-100 text-lg">{category.category}</span>
                        <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{category.margin}% margin</span>
                      </div>
                      <Progress value={category.margin} className="h-3 mb-3 bg-blue-200 dark:bg-blue-800" />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                          UGX {category.sales.toLocaleString()} in sales
                        </span>
                        <div className="flex items-center gap-2">
                          <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${
                            category.margin >= 20 ? 'bg-green-100 dark:bg-green-900/30' :
                            category.margin >= 10 ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                            'bg-red-100 dark:bg-red-900/30'
                          }`}>
                            {category.margin >= 20 ? (
                              <CheckCircle className={`h-3 w-3 ${
                                category.margin >= 20 ? 'text-green-600 dark:text-green-400' :
                                category.margin >= 10 ? 'text-yellow-600 dark:text-yellow-400' :
                                'text-red-600 dark:text-red-400'
                              }`} />
                            ) : (
                              <AlertTriangle className={`h-3 w-3 ${
                                category.margin >= 10 ? 'text-yellow-600 dark:text-yellow-400' :
                                'text-red-600 dark:text-red-400'
                              }`} />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 dark:from-rose-950/30 dark:via-pink-950/30 dark:to-purple-950/30 shadow-xl border-0">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-4 text-rose-900 dark:text-rose-100">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg">
                    <PieChart className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Cost Analysis Breakdown</h3>
                    <p className="text-sm text-rose-700 dark:text-rose-300 font-medium">
                      Cost structure and expense distribution
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {profitMarginData?.costAnalysis.map((cost, index) => (
                    <div key={cost.category} className="p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl border border-rose-200 dark:border-rose-700">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-rose-900 dark:text-rose-100 text-lg">{cost.category}</span>
                        <span className="text-sm font-bold text-rose-700 dark:text-rose-300">{cost.percentage}% of total</span>
                      </div>
                      <Progress value={cost.percentage} className="h-3 mb-3 bg-rose-200 dark:bg-rose-800" />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-rose-600 dark:text-rose-400 font-medium">
                          UGX {cost.cost.toLocaleString()}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${
                            cost.category === 'COGS' ? 'bg-blue-100 dark:bg-blue-900/30' :
                            cost.category === 'Operations' ? 'bg-green-100 dark:bg-green-900/30' :
                            cost.category === 'Marketing' ? 'bg-purple-100 dark:bg-purple-900/30' :
                            'bg-orange-100 dark:bg-orange-900/30'
                          }`}>
                            <div className={`h-3 w-3 rounded-full ${
                              cost.category === 'COGS' ? 'bg-blue-500' :
                              cost.category === 'Operations' ? 'bg-green-500' :
                              cost.category === 'Marketing' ? 'bg-purple-500' :
                              'bg-orange-500'
                            }`} />
                          </div>
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
        <TabsContent value="predictive" className="space-y-8">
          <div className="grid gap-8 md:grid-cols-2">
            <Card className="bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:from-violet-950/30 dark:via-purple-950/30 dark:to-indigo-950/30 shadow-xl border-0">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-4 text-violet-900 dark:text-violet-100">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                    <Eye className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Demand Forecast (Next 7 Days)</h3>
                    <p className="text-sm text-violet-700 dark:text-violet-300 font-medium">
                      AI-powered sales predictions
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {predictiveData?.demandForecast.map((forecast, index) => (
                    <div key={forecast.product} className="group flex items-center justify-between p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl border border-violet-200 dark:border-violet-700 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 hover:scale-[1.01] hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold shadow-lg">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-bold text-violet-900 dark:text-violet-100 text-lg">{forecast.product}</div>
                          <div className="text-sm text-violet-700 dark:text-violet-300 font-medium">
                            Predicted: {forecast.predicted} units
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={forecast.confidence > 90 ? "default" : forecast.confidence > 80 ? "secondary" : "outline"}
                               className={`px-3 py-1 font-semibold ${
                                 forecast.confidence > 90 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                                 forecast.confidence > 80 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' :
                                 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200'
                               }`}>
                          {forecast.confidence}% confidence
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-orange-950/30 dark:via-red-950/30 dark:to-pink-950/30 shadow-xl border-0">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-4 text-orange-900 dark:text-orange-100">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Inventory Risk Alerts</h3>
                    <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">
                      Stock levels requiring attention
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {predictiveData?.inventoryAlerts.map((alert, index) => (
                    <div key={alert.product} className="group flex items-center justify-between p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl border border-orange-200 dark:border-orange-700 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 hover:scale-[1.01] hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-lg ${
                          alert.risk === 'high' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                          alert.risk === 'medium' ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                          'bg-gradient-to-br from-green-500 to-green-600'
                        } text-white font-bold`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-bold text-orange-900 dark:text-orange-100 text-lg">{alert.product}</div>
                          <div className="text-sm text-orange-700 dark:text-orange-300 font-medium">
                            Current: {alert.current} | Optimal: {alert.optimal}
                          </div>
                        </div>
                      </div>
                      <Badge variant={
                        alert.risk === 'high' ? 'destructive' :
                        alert.risk === 'medium' ? 'secondary' : 'outline'
                      } className="px-3 py-1 font-semibold">
                        {alert.risk} risk
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Seasonal Patterns */}
          <Card className="bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 dark:from-cyan-950/30 dark:via-blue-950/30 dark:to-indigo-950/30 shadow-xl border-0">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-4 text-cyan-900 dark:text-cyan-100">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Seasonal Sales Patterns</h3>
                  <p className="text-sm text-cyan-700 dark:text-cyan-300 font-medium">
                    Historical trends and seasonal performance
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                {predictiveData?.seasonalPatterns.map((pattern, index) => (
                  <div key={pattern.month} className="group relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl border border-cyan-200 dark:border-cyan-700 p-6 transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 to-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 mx-auto mb-4 shadow-lg">
                        <span className="text-white font-bold text-lg">{pattern.month.slice(0, 3)}</span>
                      </div>
                      <div className={`text-3xl font-bold mb-2 ${
                        pattern.growth > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {pattern.growth > 0 ? '+' : ''}{pattern.growth}%
                      </div>
                      <div className="text-sm text-cyan-700 dark:text-cyan-300 font-medium mb-3">
                        Growth rate
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                          <Target className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <span className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">
                          {pattern.confidence}% confidence
                        </span>
                      </div>
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