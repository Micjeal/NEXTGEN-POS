import { createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const serviceClient = createServiceClient()

    // Fetch key metrics
    const [
      { data: sales },
      { data: customers },
      { data: products },
      { count: totalSales }
    ] = await Promise.all([
      serviceClient
        .from("sales")
        .select("total")
        .eq("status", "completed"),
      serviceClient
        .from("customers")
        .select("id, full_name, membership_tier, total_spent, total_visits")
        .eq("is_active", true),
      serviceClient
        .from("products")
        .select("id")
        .eq("is_active", true),
      serviceClient
        .from("sales")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed")
    ])

    const totalRevenue = sales?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0
    const totalCustomers = customers?.length || 0
    const totalProducts = products?.length || 0
    const totalTransactions = totalSales || 0
    const avgOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0

    // Top customers
    const topCustomers = customers
      ?.sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, 5) || []

    // Low stock products
    const { data: lowStockProducts } = await serviceClient
      .from("products")
      .select("id, name, inventory(quantity, min_stock_level)")
      .eq("is_active", true)
      .lte("inventory.quantity", "inventory.min_stock_level")

    return NextResponse.json({
      metrics: {
        totalRevenue,
        totalCustomers,
        totalProducts,
        totalTransactions,
        avgOrderValue
      },
      topCustomers,
      lowStockProducts: lowStockProducts || []
    })
  } catch (error) {
    console.error("Reports summary error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}