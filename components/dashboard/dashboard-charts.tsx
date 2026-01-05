"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts"
import { TrendingUp, TrendingDown, Package, AlertTriangle, PieChart as PieChartIcon } from "lucide-react"

interface DashboardChartsProps {
  salesData: Array<{ period: string; sales: number; growth: number }>
  granularity: 'monthly' | 'daily' | 'hourly'
  topProducts: Array<{ name: string; sales: number; revenue: number }>
  productPerformance: Array<{ name: string; performance: 'high' | 'medium' | 'low'; stockRecommendation: string; predictedDemand?: number; confidence?: number; riskLevel?: string }>
  currency: string
}

export function DashboardCharts({ salesData, granularity, topProducts, productPerformance, currency }: DashboardChartsProps) {
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16']

  const formatCurrency = (amount: number) => {
    const locale = currency === "UGX" ? "en-UG" : "en-US"
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  // Check if we have data to display
  const hasSalesData = salesData && salesData.length > 0 && salesData.some(item => item.sales > 0)
  const hasTopProducts = topProducts && topProducts.length > 0
  const hasProductPerformance = productPerformance && productPerformance.length > 0

  return (
    <div className="space-y-8">
      {/* Monthly Sales Trend - Only show if we have sales data */}
      {hasSalesData ? (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              Sales Trend ({granularity.charAt(0).toUpperCase() + granularity.slice(1)})
            </CardTitle>
            <p className="text-sm text-muted-foreground">Track sales performance and growth over time</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="period"
                  axisLine={false}
                  tickLine={false}
                  className="text-sm"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  className="text-sm"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}
                  formatter={(value: any, name: string) => [
                    formatCurrency(Number(value)),
                    name === 'sales' ? 'Sales' : name
                  ]}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#3B82F6', strokeWidth: 2, fill: '#ffffff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              Sales Trends
            </CardTitle>
            <p className="text-sm text-muted-foreground">Track sales performance and growth over time</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <TrendingUp className="h-12 w-12 text-blue-300 dark:text-blue-700 mb-4" />
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">No Sales Data Yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Sales trends will appear here once you start processing transactions.
                Use the POS system to record sales and watch your performance analytics grow.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}