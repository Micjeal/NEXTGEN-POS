import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { format, subDays, isToday } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Get current user and their role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*, role:roles(*)")
      .eq("id", user.id)
      .single()

    const userRole = profile?.role?.name || "cashier"
    const isCashier = userRole === "cashier"

    // Date range for filtering
    const fromDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Default 1 year ago
    const toDate = dateTo ? new Date(dateTo) : new Date()

    // Determine granularity based on date range
    const rangeDays = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
    let granularity: 'monthly' | 'daily' | 'hourly' = 'monthly'

    if (rangeDays <= 7) {
      granularity = 'hourly'
    } else if (rangeDays <= 90) {
      granularity = 'daily'
    }

    // Fetch today's sales
    const today = new Date().toISOString().split("T")[0]
    let todaySalesQuery = supabase
      .from("sales")
      .select("total")
      .gte("created_at", `${today}T00:00:00`)
      .eq("status", "completed")

    if (isCashier) {
      todaySalesQuery = todaySalesQuery.eq("user_id", user.id)
    }

    const { data: todaySales } = await todaySalesQuery
    const todayTotal = (todaySales as {total: number}[] | null)?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0
    const todayCount = todaySales?.length || 0

    // Fetch product count
    const { count: productCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)

    // Fetch low stock items
    const { data: lowStock } = await supabase
      .from("products")
      .select("name, inventory!inner(quantity)")
      .eq("is_active", true)
      .lt("inventory.quantity", 10)

    const lowStockCount = lowStock?.length || 0

    // Fetch active employees count
    const { count: activeEmployeesCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)

    // Fetch recent products
    const { data: recentProducts } = await supabase
      .from("products")
      .select("*, category:categories(name), inventory(quantity)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(5)

    // Fetch monthly sales data
    let monthlySalesQuery = supabase
      .from("sales")
      .select("total, created_at")
      .gte("created_at", fromDate.toISOString())
      .lte("created_at", toDate.toISOString())
      .eq("status", "completed")

    if (isCashier) {
      monthlySalesQuery = monthlySalesQuery.eq("user_id", user.id)
    }

    const { data: monthlySalesData } = await monthlySalesQuery

    // Process sales data based on granularity
    let processedSales: Array<{ period: string; sales: number; growth: number }> = []

    // Check if we have real sales data
    const hasRealSalesData = monthlySalesData && monthlySalesData.length > 0

    if (granularity === 'hourly') {
      // Group by hour for the selected date range
      const hours = []
      for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
        for (let h = 0; h < 24; h++) {
          const hourStart = new Date(d)
          hourStart.setHours(h, 0, 0, 0)
          const hourEnd = new Date(d)
          hourEnd.setHours(h + 1, 0, 0, 0)

          const hourSales = monthlySalesData?.filter(sale => {
            const saleDate = new Date(sale.created_at)
            return saleDate >= hourStart && saleDate < hourEnd
          }).reduce((sum, sale) => sum + sale.total, 0) || 0

          hours.push({
            period: `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${h}:00`,
            sales: hourSales,
            growth: 0
          })
        }
      }
      processedSales = hours
    } else if (granularity === 'daily') {
      // Group by day
      const days = []
      for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
        const dayKey = d.toISOString().slice(0, 10)
        const daySales = monthlySalesData?.filter(sale =>
          sale.created_at.startsWith(dayKey)
        ).reduce((sum, sale) => sum + sale.total, 0) || 0

        days.push({
          period: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          sales: daySales,
          growth: 0
        })
      }
      processedSales = days
    } else {
      // Group by month (original logic)
      processedSales = Array.from({ length: 12 }, (_, i) => {
        const date = new Date()
        date.setMonth(date.getMonth() - (11 - i))
        const monthKey = date.toISOString().slice(0, 7)
        const monthSales = monthlySalesData?.filter(sale =>
          sale.created_at.startsWith(monthKey)
        ).reduce((sum, sale) => sum + sale.total, 0) || 0

        return {
          period: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          sales: monthSales,
          growth: 0
        }
      })
    }

    // If no sales data, processedSales will remain empty

    // Calculate growth
    for (let i = 1; i < processedSales.length; i++) {
      const prev = processedSales[i - 1].sales
      const curr = processedSales[i].sales
      processedSales[i].growth = prev > 0 ? ((curr - prev) / prev) * 100 : 0
    }

    // Fetch top products
    let saleIds: string[] = []
    if (isCashier) {
      const { data: cashierSales } = await supabase
        .from("sales")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "completed")
      saleIds = cashierSales?.map(s => s.id) || []
    }

    let topProductsQuery = supabase
      .from("sale_items")
      .select("quantity, line_total, product:products!inner(name)")

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
    }, {}) || {}

    const topProducts: Array<{ name: string; sales: number; revenue: number; category: string }> =
      (Object.values(productSales) as any[]).sort((a: any, b: any) => b.sales - a.sales).slice(0, 10)

    // Calculate yesterday's sales
    const yesterday = subDays(new Date(), 1).toISOString().split('T')[0]
    let yesterdaySalesQuery = supabase
      .from("sales")
      .select("total")
      .gte("created_at", `${yesterday}T00:00:00`)
      .lt("created_at", `${yesterday}T23:59:59`)
      .eq("status", "completed")

    if (isCashier) {
      yesterdaySalesQuery = yesterdaySalesQuery.eq("user_id", user.id)
    }

    const { data: yesterdaySales } = await yesterdaySalesQuery
    const yesterdayTotal = (yesterdaySales as {total: number}[] | null)?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0
    const salesChange = yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 : (todayTotal > 0 ? 100 : 0)

    // Generate predictive insights if user has permission
    let predictiveData = null
    if (['admin', 'manager'].includes(userRole)) {
      try {
        const serviceClient = createServiceClient()

        // Get inventory data for demand forecasting
        const { data: inventoryData } = await serviceClient
          .from('inventory')
          .select(`
            quantity,
            min_stock_level,
            product:products(
              name,
              category:categories(name)
            )
          `)
          .order('quantity', { ascending: true })
          .limit(20)

        // Get recent sales data for forecasting
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: recentSales } = await serviceClient
          .from('sales')
          .select(`
            created_at,
            total,
            items:sale_items(
              product_name,
              quantity
            )
          `)
          .eq('status', 'completed')
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: false })

        // Generate demand forecast based on recent sales patterns
        const productSales: Record<string, { totalSold: number; days: Set<string> }> = {}

        recentSales?.forEach(sale => {
          const saleDate = new Date(sale.created_at).toDateString()
          sale.items?.forEach((item: any) => {
            const productName = item.product_name
            if (!productSales[productName]) {
              productSales[productName] = { totalSold: 0, days: new Set() }
            }
            productSales[productName].totalSold += item.quantity || 0
            productSales[productName].days.add(saleDate)
          })
        })

        // Calculate demand forecast
        const demandForecast = Object.entries(productSales)
          .map(([product, data]) => {
            const avgDailySales = data.totalSold / data.days.size
            const predictedUnits = Math.round(avgDailySales * 7) // 7-day forecast
            const confidence = Math.min(95, Math.max(70, (data.days.size / 30) * 100)) // Confidence based on data points

            return {
              product,
              predicted: predictedUnits,
              confidence: Math.round(confidence)
            }
          })
          .sort((a, b) => b.predicted - a.predicted)
          .slice(0, 10) // Top 10 for dashboard

        // Generate inventory risk alerts
        const inventoryAlerts = inventoryData
          ?.filter(item => item.quantity <= item.min_stock_level * 1.5)
          .map(item => {
            const current = item.quantity
            const optimal = item.min_stock_level * 2
            let risk = 'low'
            if (current <= item.min_stock_level * 0.5) risk = 'high'
            else if (current <= item.min_stock_level) risk = 'medium'

            return {
              product: (item.product as any)?.name || 'Unknown Product',
              current,
              optimal: Math.round(optimal),
              risk
            }
          })
          .slice(0, 10) || []

        predictiveData = {
          demandForecast,
          inventoryAlerts
        }
      } catch (error) {
        console.error('Failed to generate predictive data:', error)
      }
    }

    // Product performance with predictive insights
    const productPerformance = topProducts.map((product: any) => {
      let performance: 'high' | 'medium' | 'low' = 'medium'
      let stockRecommendation = 'Maintain current stock'
      let predictedDemand = null
      let confidence = null
      let riskLevel = 'low'

      // Basic performance based on sales
      if (product.sales > 50) {
        performance = 'high'
        stockRecommendation = 'Increase stock - high demand'
      } else if (product.sales < 10) {
        performance = 'low'
        stockRecommendation = 'Reduce stock - low demand'
      }

      // Enhance with predictive data if available
      if (predictiveData) {
        const forecast = predictiveData.demandForecast?.find((f: any) => f.product === product.name)
        if (forecast) {
          predictedDemand = forecast.predicted
          confidence = forecast.confidence
          if (predictedDemand > product.sales * 1.5) {
            performance = 'high'
            stockRecommendation = `High demand predicted: ${predictedDemand} units/week (${confidence}% confidence)`
          } else if (predictedDemand < product.sales * 0.5) {
            performance = 'low'
            stockRecommendation = `Low demand predicted: ${predictedDemand} units/week (${confidence}% confidence)`
          } else {
            stockRecommendation = `Stable demand: ${predictedDemand} units/week (${confidence}% confidence)`
          }
        }

        // Check inventory alerts
        const alert = predictiveData.inventoryAlerts?.find((a: any) => a.product === product.name)
        if (alert) {
          riskLevel = alert.risk
          if (alert.risk === 'high') {
            stockRecommendation += ' - URGENT: Stock critically low'
          } else if (alert.risk === 'medium') {
            stockRecommendation += ' - Consider restocking soon'
          }
        }
      }

      return {
        name: product.name,
        performance,
        stockRecommendation,
        predictedDemand,
        confidence,
        riskLevel
      }
    })

    return NextResponse.json({
      todayTotal,
      todayCount,
      productCount: productCount || 0,
      lowStockCount,
      lowStock,
      recentProducts,
      salesData: processedSales,
      granularity,
      topProducts,
      productPerformance,
      salesChange,
      yesterdayTotal,
      activeEmployeesCount: activeEmployeesCount || 0,
      userRole,
      greeting: `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}`
    })

  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}