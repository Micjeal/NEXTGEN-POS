import React from "react"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, ShoppingCart, Package, AlertTriangle, Clock, TrendingUp, TrendingDown, BarChart3, Users, CheckCircle, ArrowUpRight, ArrowDownRight, RefreshCw, Filter, Download } from "lucide-react"
import { formatCurrency } from "@/lib/utils/cart"
import { format, subDays, isToday } from "date-fns"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"
import { ExportButtons } from "@/components/dashboard/export-buttons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get current user and their role
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, role:roles(*)")
    .eq("id", user?.id)
    .single()

  const userRole = profile?.role?.name || "cashier"
  const isCashier = userRole === "cashier"

  // Dynamic greeting
  const currentHour = new Date().getHours()
  let greeting = "Good morning"
  if (currentHour >= 12 && currentHour < 17) greeting = "Good afternoon"
  else if (currentHour >= 17) greeting = "Good evening"

  // Fetch today's sales (filtered for cashiers)
  const today = new Date().toISOString().split("T")[0]
  let todaySalesQuery = supabase
    .from("sales")
    .select("total")
    .gte("created_at", `${today}T00:00:00`)
    .eq("status", "completed")

  if (isCashier && user?.id) {
    todaySalesQuery = todaySalesQuery.eq("user_id", user.id)
  }

  const { data: todaySales } = await todaySalesQuery

  const todayTotal = (todaySales as {total: number}[] | null)?.reduce((sum: number, sale: {total: number}) => sum + Number(sale.total), 0) || 0
  const todayCount = todaySales?.length || 0

  // Fetch product count
  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)

  const productCount = count || 0

  // Fetch low stock items
  const { data: lowStock } = await supabase
    .from("products")
    .select(`
      name,
      inventory!inner(quantity)
    `)
    .eq("is_active", true)
    .lt("inventory.quantity", 10)

  const lowStockCount = lowStock?.length || 0

  // Fetch recently added products (last 5)
  const { data: recentProducts } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(name),
      inventory(quantity)
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(5)

  // Fetch monthly sales data (last 12 months) - filtered for cashiers
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

  let monthlySalesQuery = supabase
    .from("sales")
    .select("total, created_at")
    .gte("created_at", twelveMonthsAgo.toISOString())
    .eq("status", "completed")

  if (isCashier && user?.id) {
    monthlySalesQuery = monthlySalesQuery.eq("user_id", user.id)
  }

  const { data: monthlySalesData } = await monthlySalesQuery

  // Process monthly sales
  const monthlySales = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (11 - i))
    const monthKey = date.toISOString().slice(0, 7) // YYYY-MM
    const monthSales = monthlySalesData?.filter(sale =>
      sale.created_at.startsWith(monthKey)
    ).reduce((sum, sale) => sum + sale.total, 0) || 0

    return {
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      sales: monthSales,
      growth: 0 // Will calculate growth
    }
  })

  // Calculate growth
  for (let i = 1; i < monthlySales.length; i++) {
    const prev = monthlySales[i - 1].sales
    const curr = monthlySales[i].sales
    monthlySales[i].growth = prev > 0 ? ((curr - prev) / prev) * 100 : 0
  }

  // Fetch top selling products (filtered for cashiers)
  let saleIds: string[] = []

  if (isCashier && user?.id) {
    // For cashiers, get their sale IDs first
    const { data: cashierSales } = await supabase
      .from("sales")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "completed")

    saleIds = cashierSales?.map(s => s.id) || []
  }

  let topProductsQuery = supabase
    .from("sale_items")
    .select(`
      quantity,
      line_total,
      product:products!inner(name)
    `)

  if (isCashier && saleIds.length > 0) {
    topProductsQuery = topProductsQuery.in("sale_id", saleIds)
  }

  const { data: topProductsData } = await topProductsQuery

  const productSales = (topProductsData as any)?.reduce((acc: any, item: any) => {
    const name = item.product?.name || 'Unknown'
    if (!acc[name]) {
      acc[name] = { name, sales: 0, revenue: 0, category: 'General' }
    }
    acc[name].sales += item.quantity
    acc[name].revenue += item.line_total
    return acc
  }, {} as Record<string, { name: string; sales: number; revenue: number; category: string }>) || {}

  const topProducts: Array<{ name: string; sales: number; revenue: number; category: string }> = (Object.values(productSales) as any[]).sort((a: any, b: any) => b.sales - a.sales).slice(0, 10)

  // Product performance analysis
  const productPerformance = topProducts.map((product: any) => {
    let performance: 'high' | 'medium' | 'low' = 'medium'
    let stockRecommendation = 'Maintain current stock'

    if (product.sales > 50) {
      performance = 'high'
      stockRecommendation = 'Increase stock - high demand'
    } else if (product.sales < 10) {
      performance = 'low'
      stockRecommendation = 'Reduce stock - low demand'
    }

    return {
      name: product.name,
      performance,
      stockRecommendation
    }
  })

  // Calculate yesterday's sales for comparison
  const yesterday = subDays(new Date(), 1).toISOString().split('T')[0]
  let yesterdaySalesQuery = supabase
    .from("sales")
    .select("total")
    .gte("created_at", `${yesterday}T00:00:00`)
    .lt("created_at", `${yesterday}T23:59:59`)
    .eq("status", "completed")

  if (isCashier && user?.id) {
    yesterdaySalesQuery = yesterdaySalesQuery.eq("user_id", user.id)
  }

  const { data: yesterdaySales } = await yesterdaySalesQuery
  const yesterdayTotal = (yesterdaySales as {total: number}[] | null)?.reduce((sum: number, sale: {total: number}) => sum + Number(sale.total), 0) || 0
  const salesChange = yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 : 100
  const isSalesUp = salesChange >= 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            {greeting}, {profile?.full_name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="text-muted-foreground">
            {isToday(new Date()) ? "Here's what's happening today" : "Here's your performance overview"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButtons />
          <Button variant="outline" size="sm" className="gap-2">
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
            <div className="text-2xl font-bold text-blue-900 dark:text-white">{formatCurrency(todayTotal)}</div>
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
              {recentProducts?.slice(0, 2).map((product, i) => (
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
              {lowStock?.slice(0, 5).map((item, index) => (
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
                {recentProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.category?.name || 'No category'} • {format(new Date(product.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(product.price)}</p>
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
                {topProducts.slice(0, 5).map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{product.sales} sold</p>
                      <p className="text-sm text-muted-foreground">{formatCurrency(product.revenue)}</p>
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
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </div>
        </div>
        
        <DashboardCharts 
          monthlySales={monthlySales} 
          topProducts={topProducts} 
          productPerformance={productPerformance} 
        />
      </div>
    </div>
  )
}
