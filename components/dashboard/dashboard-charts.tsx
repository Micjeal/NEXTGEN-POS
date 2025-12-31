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

      <div className="grid gap-8 md:grid-cols-2">
        {/* Top Selling Products */}
        {hasTopProducts ? (
          <Card className="shadow-lg border-0 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <BarChart className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                Top Selling Products
              </CardTitle>
              <p className="text-sm text-muted-foreground">Best performing products by units sold</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={topProducts} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    className="text-sm"
                    angle={-45}
                    textAnchor="end"
                    height={80}
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
                    formatter={(value: any) => [`${Number(value).toLocaleString()} units`, 'Units Sold']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar
                    dataKey="sales"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg border-0 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <BarChart className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                Top Selling Products
              </CardTitle>
              <p className="text-sm text-muted-foreground">Best performing products by units sold</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <BarChart className="h-12 w-12 text-emerald-300 dark:text-emerald-700 mb-4" />
                <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100 mb-2">No Sales Data Yet</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Top selling products will appear here once you start processing transactions.
                  Track which items are your best performers.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Product Performance */}
        {hasProductPerformance ? (
          <Card className="shadow-lg border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Package className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                Product Performance & Stock Recommendations
              </CardTitle>
              <p className="text-sm text-muted-foreground">AI-powered inventory insights with predictive analytics</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {productPerformance.map((product, index) => (
                  <div key={index} className="p-4 border border-amber-200 dark:border-amber-800 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{product.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{product.stockRecommendation}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {product.performance === 'high' && <TrendingUp className="h-5 w-5 text-green-500" />}
                        {product.performance === 'medium' && <BarChart className="h-5 w-5 text-yellow-500" />}
                        {product.performance === 'low' && <TrendingDown className="h-5 w-5 text-red-500" />}
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          product.performance === 'high' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          product.performance === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {product.performance.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Predictive Insights */}
                    {(product.predictedDemand || product.confidence) && (
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        {product.predictedDemand && (
                          <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-xs text-muted-foreground">Predicted Demand</p>
                            <p className="font-semibold text-blue-700 dark:text-blue-300">{product.predictedDemand} units/week</p>
                          </div>
                        )}
                        {product.confidence && (
                          <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <p className="text-xs text-muted-foreground">AI Confidence</p>
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-300"
                                  style={{ width: `${product.confidence}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">{product.confidence}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Risk Level and Actions */}
                    <div className="flex items-center justify-between">
                      {product.riskLevel && product.riskLevel !== 'low' && (
                        <Badge variant="destructive" className="text-xs">
                          {product.riskLevel === 'high' ? 'Critical Risk' : 'Medium Risk'}
                        </Badge>
                      )}
                      <div className="flex gap-2 ml-auto">
                        {product.performance === 'high' && (
                          <Button size="sm" variant="outline" className="text-xs h-7">
                            Order More
                          </Button>
                        )}
                        {product.performance === 'low' && (
                          <Button size="sm" variant="outline" className="text-xs h-7">
                            Reduce Stock
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="text-xs h-7">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Package className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                Product Performance & AI Insights
              </CardTitle>
              <p className="text-sm text-muted-foreground">AI-powered inventory insights with predictive analytics</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Package className="h-12 w-12 text-amber-300 dark:text-amber-700 mb-4" />
                <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">No Performance Data Yet</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Product performance insights will appear here once you start processing sales.
                  AI recommendations will help optimize your inventory.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sales by Category Pie Chart - Only show if we have top products */}
      {hasTopProducts ? (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <PieChartIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              Revenue by Product
            </CardTitle>
            <p className="text-sm text-muted-foreground">Top products contribution to total revenue</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <ResponsiveContainer width="100%" height={400} className="lg:w-1/2">
                <PieChart>
                  <Pie
                    data={topProducts.slice(0, 5)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => percent > 0.05 ? `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%` : ''}
                    outerRadius={100}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="revenue"
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  >
                    {topProducts.slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                    formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(value) => <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="lg:w-1/2 space-y-3">
                <h4 className="font-semibold text-lg mb-4">Top Contributors</h4>
                {topProducts.slice(0, 5).map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{product.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                      <p className="text-sm text-muted-foreground">{product.sales} units</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <PieChartIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              Revenue Analytics
            </CardTitle>
            <p className="text-sm text-muted-foreground">Top products contribution to total revenue</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <PieChartIcon className="h-12 w-12 text-purple-300 dark:text-purple-700 mb-4" />
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">No Revenue Data Yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Revenue analytics will appear here once you start processing sales transactions.
                Track which products generate the most revenue for your business.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}