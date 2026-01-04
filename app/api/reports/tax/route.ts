import { createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const serviceClient = createServiceClient()
    const { searchParams } = new URL(request.url)

    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const branchId = searchParams.get('branchId')

    let query = serviceClient
      .from("sales")
      .select(`
        id,
        invoice_number,
        created_at,
        subtotal,
        tax_amount,
        total,
        branch_id,
        sale_items (
          product_name,
          quantity,
          unit_price,
          tax_rate,
          tax_amount,
          line_total
        )
      `)
      .eq("status", "completed")

    // Apply date filters
    if (startDate) {
      query = query.gte("created_at", startDate)
    }
    if (endDate) {
      query = query.lte("created_at", endDate)
    }
    if (branchId) {
      query = query.eq("branch_id", branchId)
    }

    const { data: sales, error } = await query

    if (error) {
      console.error("Tax report query error:", error)
      return NextResponse.json({ error: "Failed to fetch tax data" }, { status: 500 })
    }

    // Calculate tax summaries
    const taxSummary = {
      totalSales: 0,
      totalTaxCollected: 0,
      totalTaxableAmount: 0,
      taxByRate: {} as Record<string, { taxable: number; tax: number; count: number }>,
      monthlyBreakdown: {} as Record<string, { sales: number; tax: number; transactions: number }>
    }

    sales?.forEach(sale => {
      const saleDate = new Date(sale.created_at).toISOString().slice(0, 7) // YYYY-MM format
      const saleTax = sale.tax_amount || 0
      const saleSubtotal = sale.subtotal || 0

      taxSummary.totalSales += sale.total || 0
      taxSummary.totalTaxCollected += saleTax
      taxSummary.totalTaxableAmount += saleSubtotal

      // Monthly breakdown
      if (!taxSummary.monthlyBreakdown[saleDate]) {
        taxSummary.monthlyBreakdown[saleDate] = { sales: 0, tax: 0, transactions: 0 }
      }
      taxSummary.monthlyBreakdown[saleDate].sales += sale.total || 0
      taxSummary.monthlyBreakdown[saleDate].tax += saleTax
      taxSummary.monthlyBreakdown[saleDate].transactions += 1

      // Tax by rate breakdown
      sale.sale_items?.forEach((item: any) => {
        const rate = item.tax_rate || 0
        const rateKey = `${rate}%`

        if (!taxSummary.taxByRate[rateKey]) {
          taxSummary.taxByRate[rateKey] = { taxable: 0, tax: 0, count: 0 }
        }

        taxSummary.taxByRate[rateKey].taxable += (item.quantity * item.unit_price)
        taxSummary.taxByRate[rateKey].tax += item.tax_amount || 0
        taxSummary.taxByRate[rateKey].count += 1
      })
    })

    // Get tax settings
    const { data: settings } = await serviceClient
      .from("system_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["tax_number", "business_name", "tax_rates"])

    const taxSettings = settings?.reduce((acc, setting) => {
      acc[setting.setting_key] = setting.setting_value
      return acc
    }, {} as Record<string, any>) || {}

    return NextResponse.json({
      taxSummary,
      period: {
        startDate: startDate || "All time",
        endDate: endDate || "Present",
        branchId
      },
      settings: taxSettings,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error("Tax reports error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}