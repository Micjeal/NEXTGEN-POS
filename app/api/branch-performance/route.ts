import { createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const serviceClient = createServiceClient()
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')

    // Get sales data by branch
    let salesQuery = serviceClient
      .from("sales")
      .select("branch_id, total, created_at")
      .eq("status", "completed")

    if (branchId) {
      salesQuery = salesQuery.eq("branch_id", branchId)
    }

    const { data: sales } = await salesQuery

    // Get inventory data by branch
    let inventoryQuery = serviceClient
      .from("branch_inventory")
      .select("branch_id, quantity, min_stock_level, max_stock_level")

    if (branchId) {
      inventoryQuery = inventoryQuery.eq("branch_id", branchId)
    }

    const { data: inventory } = await inventoryQuery

    // Get employee count by branch
    let employeeQuery = serviceClient
      .from("employees")
      .select("branch_id")
      .eq("is_active", true)

    if (branchId) {
      employeeQuery = employeeQuery.eq("branch_id", branchId)
    }

    const { data: employees } = await employeeQuery

    // Get branches
    let branchesQuery = serviceClient
      .from("branches")
      .select("*")

    if (branchId) {
      branchesQuery = branchesQuery.eq("id", branchId)
    }

    const { data: branches } = await branchesQuery

    // Aggregate data by branch
    const branchPerformance = branches?.map(branch => {
      const branchSales = sales?.filter(s => s.branch_id === branch.id) || []
      const branchInventory = inventory?.filter(i => i.branch_id === branch.id) || []
      const branchEmployees = employees?.filter(e => e.branch_id === branch.id) || []

      const totalRevenue = branchSales.reduce((sum, s) => sum + (s.total || 0), 0)
      const totalTransactions = branchSales.length
      const avgOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0

      const totalInventoryValue = branchInventory.reduce((sum, i) => sum + i.quantity, 0)
      const lowStockItems = branchInventory.filter(i => i.quantity <= i.min_stock_level).length

      return {
        branch: branch,
        metrics: {
          totalRevenue,
          totalTransactions,
          avgOrderValue,
          totalInventoryItems: branchInventory.length,
          totalInventoryValue,
          lowStockItems,
          employeeCount: branchEmployees.length
        },
        recentSales: branchSales.slice(-10).reverse() // Last 10 sales
      }
    }) || []

    return NextResponse.json({ branchPerformance })
  } catch (error) {
    console.error("Branch performance error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}