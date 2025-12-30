import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/email-templates/[id] - Get specific template
// PUT /api/email-templates/[id] - Update template
// DELETE /api/email-templates/[id] - Delete template

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        id,
        role_id,
        roles!inner(name)
      `)
      .eq('id', user.id)
      .single()

    if (!(profile as any)?.roles?.name || (profile as any).roles.name !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching template:', error)
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Get template error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        id,
        role_id,
        roles!inner(name)
      `)
      .eq('id', user.id)
      .single()

    if (!(profile as any)?.roles?.name || (profile as any).roles.name !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { name, subject, html_content, text_content, category, variables, is_active }: {
      name: string
      subject: string
      html_content: string
      text_content?: string
      category: string
      variables?: Record<string, any>
      is_active?: boolean
    } = await request.json()

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
      .update({
        name,
        subject,
        html_content,
        text_content,
        category,
        variables: variables || {},
        is_active: is_active !== undefined ? is_active : true
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating template:', error)
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Update template error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        id,
        role_id,
        roles!inner(name)
      `)
      .eq('id', user.id)
      .single()

    if (!(profile as any)?.roles?.name || (profile as any).roles.name !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Check if template is being used by any email logs
    const { count: usageCount } = await supabase
      .from('email_logs')
      .select('id', { count: 'exact', head: true })
      .eq('template_id', params.id)

    if (usageCount && usageCount > 0) {
      return NextResponse.json({
        error: 'Cannot delete template that has been used to send emails'
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting template:', error)
      return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete template error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}