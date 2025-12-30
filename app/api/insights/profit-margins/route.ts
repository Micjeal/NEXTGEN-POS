import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// GET /api/insights/profit-margins - Get profit margin analytics
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

    // Get sales data with product and category information
    const { data: salesData } = await serviceClient
      .from('sales')
      .select(`
        total,
        subtotal,
        tax_amount,
        discount_amount,
        items:sale_items(
          product_name,
          quantity,
          unit_price,
          line_total,
          product:products(
            category_id,
            cost_price,
            category:categories(name)
          )
        )
      `)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1000)

    // Calculate overall margin
    let totalRevenue = 0
    let totalCost = 0

    const categoryMargins: Record<string, { sales: number; cost: number; margin: number }> = {}
    const productMargins: Record<string, { sales: number; cost: number; margin: number }> = {}

    salesData?.forEach(sale => {
      const saleRevenue = sale.total || 0
      totalRevenue += saleRevenue

      sale.items?.forEach((item: any) => {
        const quantity = item.quantity || 0
        const unitPrice = item.unit_price || 0
        const costPrice = item.product?.cost_price || 0
        const categoryName = item.product?.category?.name || 'Uncategorized'

        const itemRevenue = quantity * unitPrice
        const itemCost = quantity * costPrice

        totalCost += itemCost

        // Category margins
        if (!categoryMargins[categoryName]) {
          categoryMargins[categoryName] = { sales: 0, cost: 0, margin: 0 }
        }
        categoryMargins[categoryName].sales += itemRevenue
        categoryMargins[categoryName].cost += itemCost

        // Product margins
        const productName = item.product_name || 'Unknown Product'
        if (!productMargins[productName]) {
          productMargins[productName] = { sales: 0, cost: 0, margin: 0 }
        }
        productMargins[productName].sales += itemRevenue
        productMargins[productName].cost += itemCost
      })
    })

    const overallMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0

    // Process category margins
    const categoryMarginsArray = Object.entries(categoryMargins).map(([category, data]) => ({
      category,
      margin: data.sales > 0 ? ((data.sales - data.cost) / data.sales) * 100 : 0,
      sales: data.sales
    })).sort((a, b) => b.margin - a.margin)

    // Process product margins (top products)
    const productMarginsArray = Object.entries(productMargins)
      .map(([product, data]) => ({
        product,
        margin: data.sales > 0 ? ((data.sales - data.cost) / data.sales) * 100 : 0,
        sales: data.sales
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10) // Top 10 products

    // Mock cost analysis (in real implementation, this would come from accounting data)
    const costAnalysis = [
      { category: "COGS", cost: totalCost, percentage: totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0 },
      { category: "Operations", cost: totalRevenue * 0.173, percentage: 17.3 },
      { category: "Marketing", cost: totalRevenue * 0.097, percentage: 9.7 },
      { category: "Overhead", cost: totalRevenue * 0.059, percentage: 5.9 }
    ]

    const profitMarginData = {
      overallMargin: Math.round(overallMargin * 100) / 100,
      categoryMargins: categoryMarginsArray.map(cat => ({
        ...cat,
        margin: Math.round(cat.margin * 100) / 100,
        sales: Math.round(cat.sales)
      })),
      productMargins: productMarginsArray.map(prod => ({
        ...prod,
        margin: Math.round(prod.margin * 100) / 100,
        sales: Math.round(prod.sales)
      })),
      costAnalysis: costAnalysis.map(cost => ({
        ...cost,
        cost: Math.round(cost.cost),
        percentage: Math.round(cost.percentage * 100) / 100
      }))
    }

    return NextResponse.json(profitMarginData)
  } catch (error) {
    console.error('Profit margins insights error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}