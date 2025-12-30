import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { emailService } from '@/lib/email/service'

// POST /api/emails/send - Send a single email
export async function POST(request: NextRequest) {
  try {
    console.log('Email send API called')

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('Auth check:', { user: user?.id, authError })

    if (authError || !user) {
      console.error('Authentication failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { templateId, recipientEmail, recipientName, variables } = body

    console.log('Request body:', { templateId, recipientEmail, recipientName, variables })

    // Check if templateId looks like a demo ID (string number)
    if (/^\d+$/.test(templateId)) {
      console.log('Demo template ID detected, this may not exist in DB')
    }

    if (!templateId || !recipientEmail) {
      return NextResponse.json({
        error: 'Template ID and recipient email are required'
      }, { status: 400 })
    }

    // Check if template exists
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .single()

    console.log('Template lookup:', { template: template?.id, templateError })

    if (templateError || !template) {
      console.error('Template not found:', templateError)
      return NextResponse.json({
        error: 'Email template not found'
      }, { status: 404 })
    }

    console.log('Calling email service...')
    const result = await emailService.sendEmail(
      templateId,
      recipientEmail,
      recipientName,
      variables || {}
    )

    console.log('Email service result:', result)

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId
      })
    } else {
      return NextResponse.json({
        error: result.error
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Send email API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}