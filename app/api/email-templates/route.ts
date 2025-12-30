import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/email-templates - Get all email templates
// POST /api/email-templates - Create new email template
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role:roles(name)')
      .eq('id', user.id)
      .single()

    if (!profile?.role?.name || profile.role.name !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { data: templates, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('category')
      .order('name')

    if (error) {
      console.error('Error fetching templates:', error)
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }

    return NextResponse.json({ templates: templates || [] })
  } catch (error) {
    console.error('Email templates error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role:roles(name)')
      .eq('id', user.id)
      .single()

    if (!profile?.role?.name || profile.role.name !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { name, subject, html_content, text_content, category, variables } = await request.json()

    if (!name || !subject || !html_content || !category) {
      return NextResponse.json({
        error: 'Name, subject, HTML content, and category are required'
      }, { status: 400 })
    }

    // Validate category
    const validCategories = ['alerts', 'reports', 'welcome', 'marketing', 'system', 'receipts']
    if (!validCategories.includes(category)) {
      return NextResponse.json({
        error: 'Invalid category'
      }, { status: 400 })
    }

    const { data: template, error } = await supabase
      .from('email_templates')
      .insert({
        name,
        subject,
        html_content,
        text_content,
        category,
        variables: variables || {},
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating template:', error)
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Create template error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}