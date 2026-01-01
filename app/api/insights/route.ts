import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// GET /api/insights - Get real-time sales metrics and targets
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
    const now = new Date()
    const currentHour = now.getHours()

    // Get current hour sales
    const startOfHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), currentHour, 0, 0, 0)
    const endOfHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), currentHour + 1, 0, 0, 0)

    const { data: currentHourSales } = await serviceClient
      .from('sales')
      .select('total')
      .eq('status', 'completed')
      .gte('created_at', startOfHour.toISOString())
      .lt('created_at', endOfHour.toISOString())

    const currentHourTotal = currentHourSales?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0

    // Get today's sales
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)

    const { data: dailySales } = await serviceClient
      .from('sales')
      .select('total')
      .eq('status', 'completed')
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfDay.toISOString())

    const dailyTotal = dailySales?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0

    // Get this week's sales
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)

    const { data: weeklySales } = await serviceClient
      .from('sales')
      .select('total')
      .eq('status', 'completed')
      .gte('created_at', startOfWeek.toISOString())
      .lt('created_at', endOfWeek.toISOString())

    const weeklyTotal = weeklySales?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0

    // Get this month's sales
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0)

    const { data: monthlySales } = await serviceClient
      .from('sales')
      .select('total')
      .eq('status', 'completed')
      .gte('created_at', startOfMonth.toISOString())
      .lt('created_at', endOfMonth.toISOString())

    const monthlyTotal = monthlySales?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0

    // Get active customers (customers who made purchases today)
    const { data: activeCustomers } = await serviceClient
      .from('sales')
      .select('customer_id')
      .eq('status', 'completed')
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfDay.toISOString())

    const uniqueActiveCustomers = new Set(activeCustomers?.map(sale => sale.customer_id).filter(Boolean) || [])
    const activeCustomersCount = uniqueActiveCustomers.size

    // Calculate conversion rate (this would need more complex logic in real implementation)
    // For now, using a mock calculation
    const conversionRate = 68.5

    // Calculate average transaction value
    const totalTransactions = dailySales?.length || 0
    const avgTransactionValue = totalTransactions > 0 ? dailyTotal / totalTransactions : 0

    // Peak hours analysis (simplified - would need more complex analysis)
    const peakHours = ["11:00-12:00", "14:00-15:00", "18:00-19:00"]

    // Mock targets (in real implementation, these would come from a targets table)
    const hourlyTarget = 150000
    const dailyTarget = 3200000
    const weeklyTarget = 20000000
    const monthlyTarget = 85000000

    const realTimeMetrics = {
      currentHourSales: currentHourTotal,
      hourlyTarget,
      dailySales: dailyTotal,
      dailyTarget,
      weeklySales: weeklyTotal,
      weeklyTarget,
      monthlySales: monthlyTotal,
      monthlyTarget,
      activeCustomers: activeCustomersCount,
      conversionRate,
      avgTransactionValue: Math.round(avgTransactionValue),
      peakHours
    }

    return NextResponse.json(realTimeMetrics)
  } catch (error) {
    console.error('Insights API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}