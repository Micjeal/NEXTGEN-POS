import { createClient } from "@/lib/supabase/server"
import type { Sale, Product, Payment, Category as CategoryType, PaymentMethod } from "@/lib/types/database"
import { NextResponse } from "next/server"

// Get date range for the last 30 days
const getDateRange = () => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  return { start: start.toISOString(), end: end.toISOString() }
}

// Get previous period date range (30 days before current period)
const getPreviousDateRange = () => {
  const end = new Date()
  end.setDate(end.getDate() - 30)
  const start = new Date()
  start.setDate(start.getDate() - 60)
  return { start: start.toISOString(), end: end.toISOString() }
}

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check user role - admin and manager can view reports
    const { data: profile, error: roleError } = await supabase
      .from('profiles')
      .select('*, role:roles(*)')
      .eq('id', user.id)
      .single()

    if (roleError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 403 }
      )
    }

    const userRole = profile.role?.name
    if (!['admin', 'manager'].includes(userRole || '')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { start, end } = getDateRange()
    const { start: prevStart, end: prevEnd } = getPreviousDateRange()

    // Fetch sales with items and payments
    const { data: salesData } = await supabase
      .from("sales")
      .select(`
        *,
        items:sale_items(
          *,
          product:products(name, category_id)
        ),
        payments(
          *,
          payment_method:payment_methods(name)
        ),
        profile:profiles(full_name)
      `)
      .order("created_at", { ascending: false })
      .limit(1000) // Limit for performance

    // Fetch sales for previous period for comparison
    const { data: prevSalesData } = await supabase
      .from("sales")
      .select(`
        *,
        items:sale_items(
          *,
          product:products(name, category_id)
        )
      `)
      .gte("created_at", prevStart)
      .lte("created_at", prevEnd)
      .eq("status", "completed")

    // Fetch product categories for filtering
    const { data: categories } = await supabase
      .from("categories")
      .select("*")
      .order("name")

    // Fetch payment methods
    const { data: paymentMethods } = await supabase
      .from("payment_methods")
      .select("*")
      .order("name")

    // Fetch recent audit logs
    const { data: auditLogs } = await supabase
      .from("audit_logs")
      .select(`
        id,
        user_id,
        action,
        table_name,
        created_at
      `)
      .order("created_at", { ascending: false })
      .limit(50)

    // Fetch recent inventory adjustments
    const { data: inventoryAdjustments } = await supabase
      .from("inventory_adjustments")
      .select(`
        id,
        product_id,
        user_id,
        adjustment_type,
        quantity_change,
        reason,
        created_at,
        product:products(name)
      `)
      .order("created_at", { ascending: false })
      .limit(50)

    // Fetch user activity (recent logins/profile changes)
    const { data: userActivity } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        updated_at,
        created_at
      `)
      .order("updated_at", { ascending: false })
      .limit(20)

    // Fetch product changes (recent additions/updates)
    const { data: productChanges } = await supabase
      .from("products")
      .select(`
        id,
        name,
        price,
        created_at,
        updated_at
      `)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(20)

    // Fetch system statistics
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })

    const { count: totalSalesCount } = await supabase
      .from("sales")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")

    const { count: activeProducts } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)

    // Process sales data for charts and tables
    const sales = (salesData || []) as Sale[]

    // Calculate summary statistics
    const totalSales = sales.reduce((sum, sale) => sum + (sale.total || 0), 0)
    const totalTransactions = sales.length
    const avgSale = totalTransactions > 0 ? totalSales / totalTransactions : 0

    // Calculate previous period statistics for comparison
    const prevSales = (prevSalesData || []) as Sale[]
    const prevTotalSales = prevSales.reduce((sum, sale) => sum + (sale.total || 0), 0)
    const prevTotalTransactions = prevSales.length
    const prevAvgSale = prevTotalTransactions > 0 ? prevTotalSales / prevTotalTransactions : 0

    // Calculate percentage changes
    const revenueChange = prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 : 0
    const transactionChange = prevTotalTransactions > 0 ? ((totalTransactions - prevTotalTransactions) / prevTotalTransactions) * 100 : 0
    const avgSaleChange = prevAvgSale > 0 ? ((avgSale - prevAvgSale) / prevAvgSale) * 100 : 0

    // For active products, we'll use a simple comparison (this could be enhanced)
    const activeProductsChange = 2 // Placeholder - in a real app, you'd calculate this properly

    // Prepare data for the sales chart (group by day)
    const dailySales = sales.reduce((acc, sale) => {
      const date = new Date(sale.created_at).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { date, total: 0, count: 0 }
      }
      acc[date].total += sale.total || 0
      acc[date].count += 1
      return acc
    }, {} as Record<string, { date: string; total: number; count: number }>)

    const salesChartData = Object.values(dailySales).sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    const response = {
      sales,
      salesChartData,
      categories: categories || [],
      paymentMethods: paymentMethods || [],
      auditLogs: auditLogs || [],
      inventoryAdjustments: inventoryAdjustments || [],
      userActivity: userActivity || [],
      productChanges: productChanges || [],
      statistics: {
        totalUsers: totalUsers || 0,
        totalSalesCount: totalSalesCount || 0,
        totalSales,
        totalTransactions,
        avgSale,
        revenueChange,
        transactionChange,
        avgSaleChange,
        activeProducts: activeProducts || 0,
        activeProductsChange,
        dateRange: { start, end }
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching reports data:", error)
    return NextResponse.json(
      { error: "Failed to fetch reports data" },
      { status: 500 }
    )
  }
}