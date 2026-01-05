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
    const { data: allProducts } = await serviceClient
      .from("products")
      .select("id, name, inventory(quantity, min_stock_level)")
      .eq("is_active", true)

    const lowStockProducts = allProducts?.filter(product =>
      product.inventory && product.inventory.quantity <= product.inventory.min_stock_level
    ) || []

    // Top products by sales volume
    const { data: topProductsData } = await serviceClient
      .from("sale_items")
      .select(`
        quantity,
        products!inner (
          id,
          name,
          price,
          cost_price
        ),
        sales!inner (
          status
        )
      `)
      .eq("sales.status", "completed")

    // Aggregate top products
    const productSales = new Map()
    topProductsData?.forEach((item: any) => {
      const product = item.products as any
      if (product) {
        const existing = productSales.get(product.id) || {
          id: product.id,
          name: product.name,
          price: product.price,
          cost_price: product.cost_price,
          total_quantity: 0,
          total_revenue: 0
        }
        existing.total_quantity += item.quantity
        existing.total_revenue += item.quantity * product.price
        productSales.set(product.id, existing)
      }
    })

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.total_quantity - a.total_quantity)
      .slice(0, 10)

    // Calculate financial metrics
    const totalCostOfGoods = topProducts.reduce((sum, product) =>
      sum + (product.total_quantity * (product.cost_price || 0)), 0)
    const totalProfit = totalRevenue - totalCostOfGoods

    return NextResponse.json({
      metrics: {
        totalRevenue,
        totalCustomers,
        totalProducts,
        totalTransactions,
        avgOrderValue,
        totalCostOfGoods,
        totalProfit
      },
      topCustomers,
      topProducts,
      lowStockProducts: lowStockProducts || []
    })
  } catch (error) {
    console.error("Reports summary error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}