import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { emailService } from '@/lib/email/service'

// POST /api/emails/out-of-stock-alert - Send out of stock alerts to managers
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all inventory items that are out of stock
    const { data: allInventory, error: productsError } = await supabase
      .from('inventory')
      .select(`
        *,
        products (
          id,
          name,
          barcode
        )
      `)
      .eq('quantity', 0)

    if (productsError) {
      console.error('Error fetching inventory:', productsError)
      return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
    }

    if (!allInventory || allInventory.length === 0) {
      return NextResponse.json({ message: 'No out of stock items found' })
    }

    // Get managers who have out of stock alerts enabled
    const { data: managers, error: managersError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        email_settings!inner(enabled)
      `)
      .eq('email_settings.email_type', 'out_of_stock')
      .eq('email_settings.enabled', true)
      .eq('role_id', (
        supabase.from('roles').select('id').eq('name', 'manager').single()
      ))

    if (managersError) {
      console.error('Error fetching managers:', managersError)
      return NextResponse.json({ error: 'Failed to fetch managers' }, { status: 500 })
    }

    // Get out of stock alert template
    console.log('Fetching out of stock alert templates...')
    const templates = await emailService.getTemplatesByCategory('alerts')
    console.log('Found alert templates:', templates.map(t => t.name))
    const outOfStockTemplate = templates.find(t => t.name === 'Out of Stock Alert')
    console.log('Out of stock template found:', !!outOfStockTemplate)

    if (!outOfStockTemplate) {
      console.error('Out of stock alert template not found in DB')
      return NextResponse.json({ error: 'Out of stock alert template not found' }, { status: 500 })
    }

    let sentCount = 0
    let failedCount = 0

    // Send alerts to each manager
    for (const manager of managers || []) {
      for (const inventoryItem of allInventory) {
        const variables = {
          product_name: inventoryItem.products?.name || 'Unknown Product',
          current_stock: inventoryItem.quantity,
          barcode: inventoryItem.products?.barcode || 'N/A',
          alert_date: new Date().toLocaleDateString(),
          manager_name: manager.full_name
        }

        const result = await emailService.sendEmail(
          outOfStockTemplate.id,
          manager.email,
          manager.full_name,
          variables
        )

        if (result.success) {
          sentCount++
        } else {
          failedCount++
          console.error(`Failed to send out of stock alert to ${manager.email}:`, result.error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      products: allInventory.length
    })
  } catch (error) {
    console.error('Out of stock alert error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}