import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { emailService } from '@/lib/email/service'

// POST /api/emails/system-maintenance - Send system maintenance notifications
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { maintenanceDate, maintenanceTime, duration, description } = await request.json()

    if (!maintenanceDate || !maintenanceTime) {
      return NextResponse.json({ error: 'Maintenance date and time are required' }, { status: 400 })
    }

    // Get all users who have system update alerts enabled
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        email_settings!inner(enabled)
      `)
      .eq('email_settings.email_type', 'system_updates')
      .eq('email_settings.enabled', true)

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users have system update notifications enabled' })
    }

    // Get system maintenance template
    console.log('Fetching system maintenance templates...')
    const templates = await emailService.getTemplatesByCategory('system')
    console.log('Found system templates:', templates.map(t => t.name))
    const maintenanceTemplate = templates.find(t => t.name === 'System Maintenance Notice')
    console.log('Maintenance template found:', !!maintenanceTemplate)

    if (!maintenanceTemplate) {
      console.error('System maintenance template not found in DB')
      return NextResponse.json({ error: 'System maintenance template not found' }, { status: 500 })
    }

    let sentCount = 0
    let failedCount = 0

    // Send notifications to each user
    for (const user of users) {
      const variables = {
        user_name: user.full_name,
        maintenance_date: maintenanceDate,
        maintenance_time: maintenanceTime,
        duration: duration || 'TBD',
        description: description || 'Scheduled system maintenance',
        notification_date: new Date().toLocaleDateString()
      }

      const result = await emailService.sendEmail(
        maintenanceTemplate.id,
        user.email,
        user.full_name,
        variables
      )

      if (result.success) {
        sentCount++
      } else {
        failedCount++
        console.error(`Failed to send maintenance notice to ${user.email}:`, result.error)
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      total_users: users.length
    })
  } catch (error) {
    console.error('System maintenance notification error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}