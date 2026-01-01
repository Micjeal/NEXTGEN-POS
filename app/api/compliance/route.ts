import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// GET /api/compliance - Get compliance statistics
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

    // Get all stats in parallel
    const [
      loginAttemptsResult,
      failedAttemptsResult,
      incidentsResult,
      auditResult,
      messagesResult,
      salesResult,
      customersResult,
      productsResult,
      paymentsResult,
      encryptedPaymentsResult
    ] = await Promise.all([
      serviceClient.from('login_attempts').select('*', { count: 'exact', head: true }),
      serviceClient.from('login_attempts').select('*', { count: 'exact', head: true }).eq('successful', false),
      serviceClient.from('security_incidents').select('*', { count: 'exact', head: true }),
      serviceClient.from('audit_logs').select('*', { count: 'exact', head: true }),
      serviceClient.from('messages').select('*', { count: 'exact', head: true }).eq('is_read', false).eq('recipient_role', 'admin'),
      serviceClient.from('sales').select('*', { count: 'exact', head: true }),
      serviceClient.from('customers').select('*', { count: 'exact', head: true }),
      serviceClient.from('products').select('*', { count: 'exact', head: true }),
      serviceClient.from('payments').select('*', { count: 'exact', head: true }),
      serviceClient.from('payments').select('*', { count: 'exact', head: true }).not('encrypted_metadata', 'is', null)
    ])

    const stats = {
      totalLoginAttempts: loginAttemptsResult.count || 0,
      failedLoginAttempts: failedAttemptsResult.count || 0,
      securityIncidents: incidentsResult.count || 0,
      auditLogs: auditResult.count || 0,
      unreadMessages: messagesResult.count || 0,
      totalSales: salesResult.count || 0,
      totalCustomers: customersResult.count || 0,
      totalProducts: productsResult.count || 0,
      totalPayments: paymentsResult.count || 0,
      encryptedPayments: encryptedPaymentsResult.count || 0,
      complianceScore: 95, // Could be calculated based on actual compliance checks
      lastAudit: '2024-12-20' // Could be from audit logs
    }

    // Get recent login attempts
    const { data: loginAttempts } = await serviceClient
      .from('login_attempts')
      .select('*')
      .order('attempted_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      stats,
      loginAttempts: loginAttempts || []
    })
  } catch (error) {
    console.error('Compliance API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}