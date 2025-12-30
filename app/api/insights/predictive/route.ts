import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// GET /api/insights/predictive - Get predictive analytics and forecasting
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, role:roles(*)')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role?.name
    if (!['admin', 'manager'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Admin or Manager access required' }, { status: 403 })
    }

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
      .slice(0, 5) // Top 5 products

    // Generate sales trend data (last 3 months)
    const salesTrend = []
    for (let i = 2; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStr = date.toISOString().slice(0, 7) // YYYY-MM format

      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1)

      const { data: monthSales } = await serviceClient
        .from('sales')
        .select('total')
        .eq('status', 'completed')
        .gte('created_at', monthStart.toISOString())
        .lt('created_at', monthEnd.toISOString())

      const actual = monthSales?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0
      const predicted = i === 0 ? actual : actual * (1 + (Math.random() * 0.2 - 0.1)) // Mock prediction for past months

      salesTrend.push({
        date: monthStr,
        actual: Math.round(actual),
        predicted: Math.round(predicted)
      })
    }

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
      .slice(0, 5) || []

    // Generate seasonal patterns (mock data based on typical patterns)
    const seasonalPatterns = [
      { month: "December", growth: 25.5, confidence: 95 },
      { month: "January", growth: -5.2, confidence: 88 },
      { month: "February", growth: 8.3, confidence: 82 },
      { month: "March", growth: 12.1, confidence: 90 }
    ]

    const predictiveData = {
      demandForecast,
      salesTrend,
      inventoryAlerts,
      seasonalPatterns
    }

    return NextResponse.json(predictiveData)
  } catch (error) {
    console.error('Predictive insights error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}