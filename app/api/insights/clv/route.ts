import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// GET /api/insights/clv - Get customer lifetime value analytics
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

    // Get customer analytics data
    const { data: customerAnalytics } = await serviceClient
      .from('customer_analytics')
      .select('*')
      .order('analysis_date', { ascending: false })
      .limit(1000)

    // Calculate average CLV
    const totalCLV = customerAnalytics?.reduce((sum, customer) => sum + (customer.predicted_clv || 0), 0) || 0
    const averageCLV = customerAnalytics && customerAnalytics.length > 0 ? totalCLV / customerAnalytics.length : 0

    // Get top segment CLV (highest CLV in the dataset)
    const topSegmentCLV = customerAnalytics?.reduce((max, customer) =>
      (customer.predicted_clv || 0) > max ? (customer.predicted_clv || 0) : max, 0) || 0

    // Calculate CLV growth (comparing recent vs older data)
    const recentData = customerAnalytics?.filter(customer =>
      new Date(customer.analysis_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ) || []
    const olderData = customerAnalytics?.filter(customer =>
      new Date(customer.analysis_date) <= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ) || []

    const recentAvgCLV = recentData.length > 0 ?
      recentData.reduce((sum, customer) => sum + (customer.predicted_clv || 0), 0) / recentData.length : 0
    const olderAvgCLV = olderData.length > 0 ?
      olderData.reduce((sum, customer) => sum + (customer.predicted_clv || 0), 0) / olderData.length : 0

    const clvGrowth = olderAvgCLV > 0 ? ((recentAvgCLV - olderAvgCLV) / olderAvgCLV) * 100 : 0

    // Calculate customer retention (from loyalty accounts)
    const { data: loyaltyAccounts } = await serviceClient
      .from('customer_loyalty_accounts')
      .select('is_active, join_date, last_activity_date')

    const activeAccounts = loyaltyAccounts?.filter(account => account.is_active) || []
    const totalAccounts = loyaltyAccounts?.length || 0
    const customerRetention = totalAccounts > 0 ? (activeAccounts.length / totalAccounts) * 100 : 0

    // Calculate churn rate
    const churnRate = 100 - customerRetention

    // Get CLV distribution by segments
    const segmentData = customerAnalytics?.reduce((acc, customer) => {
      const segment = customer.loyalty_tier || 'bronze'
      if (!acc[segment]) {
        acc[segment] = { total: 0, count: 0 }
      }
      acc[segment].total += customer.predicted_clv || 0
      acc[segment].count += 1
      return acc
    }, {} as Record<string, { total: number; count: number }>) || {}

    const lifetimeValueDistribution = Object.entries(segmentData).map(([segment, data]) => ({
      segment: segment.charAt(0).toUpperCase() + segment.slice(1),
      value: Math.round(data.total / data.count),
      count: data.count
    }))

    const clvData = {
      averageCLV: Math.round(averageCLV),
      topSegmentCLV: Math.round(topSegmentCLV),
      clvGrowth: Math.round(clvGrowth * 100) / 100,
      customerRetention: Math.round(customerRetention * 100) / 100,
      churnRate: Math.round(churnRate * 100) / 100,
      lifetimeValueDistribution
    }

    return NextResponse.json(clvData)
  } catch (error) {
    console.error('CLV insights error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}