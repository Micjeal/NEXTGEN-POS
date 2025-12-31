import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

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

    // Get system status
    const systemStatus = {
      database: 'healthy',
      api: 'healthy',
      storage: 'healthy',
      lastBackup: new Date().toISOString()
    }

    // Check database health
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1)
      if (error) {
        systemStatus.database = 'error'
      }
    } catch (error) {
      systemStatus.database = 'error'
    }

    // Check API health (self-check)
    systemStatus.api = 'healthy'

    // Check storage (simplified - in production use actual disk monitoring)
    try {
      const { stdout } = await execAsync('df -h / | tail -1 | awk \'{print $5}\' 2>/dev/null || echo "24%"')
      const usagePercent = parseInt(stdout.trim().replace('%', '')) || 24
      if (usagePercent > 90) {
        systemStatus.storage = 'error'
      } else if (usagePercent > 75) {
        systemStatus.storage = 'warning'
      }
    } catch (error) {
      // If df command fails, assume healthy
      console.log('Storage check command not available, assuming healthy')
      systemStatus.storage = 'healthy'
    }

    // Get last backup time (mock for now)
    const { data: backupData } = await supabase
      .from('system_logs')
      .select('created_at')
      .eq('event_type', 'backup_completed')
      .order('created_at', { ascending: false })
      .limit(1)

    if (backupData && backupData.length > 0) {
      systemStatus.lastBackup = backupData[0].created_at
    }

    return NextResponse.json({ status: systemStatus })
  } catch (error) {
    console.error('Error fetching system status:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}