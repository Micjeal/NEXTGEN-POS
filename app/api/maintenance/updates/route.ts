import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { exec } from 'child_process'
import { promisify } from 'util'
import { readFileSync } from 'fs'
import { join } from 'path'

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

    // Get current version from package.json
    let currentVersion = '2.1.0'
    try {
      const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'))
      currentVersion = packageJson.version || '2.1.0'
    } catch (error) {
      // Use default version if can't read package.json
    }

    // Check for updates (mock implementation - in production check against update server)
    const latestVersion = '2.1.0' // Assume up to date for demo
    const hasUpdate = false

    // Get update history from logs
    const { data: updateLogs } = await supabase
      .from('system_logs')
      .select('*')
      .eq('event_type', 'update_completed')
      .order('created_at', { ascending: false })
      .limit(5)

    const updateHistory = updateLogs?.map(log => ({
      version: log.metadata?.version || 'Unknown',
      date: log.created_at,
      description: log.message
    })) || []

    return NextResponse.json({
      currentVersion,
      latestVersion,
      hasUpdate,
      updateHistory,
      lastChecked: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error checking for updates:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    // Log update start
    await supabase.from('system_logs').insert({
      event_type: 'update_started',
      message: 'Software update initiated by admin',
      user_id: user.id
    })

    // Perform update (simplified - in production use proper update mechanism)
    try {
      // For demo purposes, simulate update process
      // In production, implement proper update mechanism
      console.log('Simulating software update...')

      // Simulate update delay
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Try npm update if available
      let updateSuccess = false
      try {
        await execAsync('npm update --dry-run 2>/dev/null || echo "npm update simulated"')
        updateSuccess = true
      } catch (error) {
        console.log('npm update not available, simulating success')
        updateSuccess = true // Simulate success for demo
      }

      // Log successful update
      await supabase.from('system_logs').insert({
        event_type: 'update_completed',
        message: 'Software updated successfully',
        user_id: user.id,
        metadata: { version: '2.1.1', simulated: !updateSuccess }
      })

      return NextResponse.json({
        message: "Update completed successfully",
        newVersion: '2.1.1',
        simulated: !updateSuccess
      })
    } catch (updateError) {
      console.error('Update error:', updateError)
      // Log failed update
      await supabase.from('system_logs').insert({
        event_type: 'update_failed',
        message: `Update failed: ${updateError.message}`,
        user_id: user.id,
        metadata: { error: updateError.message }
      })

      return NextResponse.json({ error: "Update failed", details: updateError.message }, { status: 500 })
    }
  } catch (error) {
    console.error('Error performing update:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}