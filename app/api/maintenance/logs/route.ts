import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role:roles(*)')
      .eq('id', user.id)
      .single()

    if (!profile?.role || profile.role.name !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // For now, return mock logs. In production, you'd fetch from a logging service
    const logs = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'System startup completed',
        source: 'system'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        level: 'warning',
        message: 'High memory usage detected',
        source: 'monitoring'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
        level: 'error',
        message: 'Database connection timeout',
        source: 'database'
      }
    ]

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Error fetching logs:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role:roles(*)')
      .eq('id', user.id)
      .single()

    if (!profile?.role || profile.role.name !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // In production, clear logs from logging service
    // For now, just return success
    return NextResponse.json({ message: "Logs cleared successfully" })
  } catch (error) {
    console.error('Error clearing logs:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}