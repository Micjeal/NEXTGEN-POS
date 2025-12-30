import { createClient, createServiceClient } from "@/lib/supabase/server"
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

    // Check user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, role:roles(*)')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role?.name
    if (!['admin', 'manager'].includes(userRole || '')) {
      return NextResponse.json(
        { error: 'Admin or Manager access required' },
        { status: 403 }
      )
    }

    const { start, end } = getDateRange()
    const { start: prevStart, end: prevEnd } = getPreviousDateRange()

    const serviceClient = createServiceClient()

    // Fetch sales with items and payments
    const { data: salesData } = await serviceClient
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
    const { data: prevSalesData } = await serviceClient
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
    const { data: categories } = await serviceClient
      .from("categories")
      .select("*")
      .order("name")

    // Fetch payment methods
    const { data: paymentMethods } = await serviceClient
      .from("payment_methods")
      .select("*")
      .order("name")

    // Fetch recent audit logs
    const { data: auditLogs } = await serviceClient
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
    const { data: inventoryAdjustments } = await serviceClient
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
    const { data: userActivity } = await serviceClient
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
    const { data: productChanges } = await serviceClient
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

    // Fetch loyalty program statistics
    const { data: loyaltyPrograms } = await serviceClient
      .from("loyalty_programs")
      .select("*")
      .eq("is_active", true)

    const { data: loyaltyAccounts } = await serviceClient
      .from("customer_loyalty_accounts")
      .select(`
        *,
        customer:customers(full_name, membership_tier),
        loyalty_program:loyalty_programs(name)
      `)
      .eq("is_active", true)

    const { data: loyaltyTransactions } = await serviceClient
      .from("loyalty_transactions")
      .select(`
        *,
        customer_loyalty_account:customer_loyalty_accounts(
          customer:customers(full_name),
          loyalty_program:loyalty_programs(name)
        )
      `)
      .order("created_at", { ascending: false })
      .limit(100)

    // Fetch system statistics
    const { count: totalUsers } = await serviceClient
      .from("profiles")
      .select("*", { count: "exact", head: true })

    const { count: totalSalesCount } = await serviceClient
      .from("sales")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")

    const { count: activeProducts } = await serviceClient
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)

    // Process sales data for charts and tables
    const sales = (salesData || []).map(sale => ({
      ...sale,
      total: sale.total || (sale.items?.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0) || 0)
    })) as Sale[]

    // Calculate summary statistics
    const totalSales = sales.reduce((sum, sale) => sum + (sale.total || 0), 0)
    const totalTransactions = sales.length
    const avgSale = totalTransactions > 0 ? totalSales / totalTransactions : 0

    // Calculate previous period statistics for comparison
    const prevSales = (prevSalesData || []).map(sale => ({
      ...sale,
      total: sale.total || (sale.items?.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0) || 0)
    })) as Sale[]
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

    // Calculate loyalty statistics
    const totalLoyaltyAccounts = loyaltyAccounts?.length || 0
    const totalLoyaltyPoints = loyaltyAccounts?.reduce((sum, account) => sum + (account.current_points || 0), 0) || 0
    const totalPointsEarned = loyaltyTransactions?.filter(t => t.transaction_type === 'earn').reduce((sum, t) => sum + (t.points || 0), 0) || 0
    const totalPointsRedeemed = loyaltyTransactions?.filter(t => t.transaction_type === 'redeem').reduce((sum, t) => sum + Math.abs(t.points || 0), 0) || 0

    const response = {
      sales,
      salesChartData,
      categories: categories || [],
      paymentMethods: paymentMethods || [],
      auditLogs: auditLogs || [],
      inventoryAdjustments: inventoryAdjustments || [],
      userActivity: userActivity || [],
      productChanges: productChanges || [],
      loyaltyPrograms: loyaltyPrograms || [],
      loyaltyAccounts: loyaltyAccounts || [],
      loyaltyTransactions: loyaltyTransactions || [],
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
        dateRange: { start, end },
        // Loyalty statistics
        totalLoyaltyAccounts,
        totalLoyaltyPoints,
        totalPointsEarned,
        totalPointsRedeemed
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