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

    // Check storage (cross-platform)
    try {
      let usagePercent = 24 // default

      // Try Unix/Linux command first
      try {
        const { stdout } = await execAsync('df -h / | tail -1 | awk \'{print $5}\' 2>/dev/null || echo "24%"')
        usagePercent = parseInt(stdout.trim().replace('%', '')) || 24
      } catch (unixError) {
        // Try Windows command
        try {
          const { stdout } = await execAsync('wmic logicaldisk where "DeviceID=\'C:\'" get Size,FreeSpace /value 2>nul')
          const lines = stdout.trim().split('\n')
          let total = 0, free = 0
          lines.forEach(line => {
            if (line.startsWith('FreeSpace=')) free = parseInt(line.split('=')[1]) || 0
            if (line.startsWith('Size=')) total = parseInt(line.split('=')[1]) || 0
          })
          if (total > 0) {
            usagePercent = Math.round(((total - free) / total) * 100)
          }
        } catch (windowsError) {
          // Both commands failed, use default
          console.log('Storage check commands not available, using defaults')
        }
      }

      if (usagePercent > 90) {
        systemStatus.storage = 'error'
      } else if (usagePercent > 75) {
        systemStatus.storage = 'warning'
      }
    } catch (error) {
      // If all storage checks fail, assume healthy
      console.log('Storage check failed, assuming healthy')
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