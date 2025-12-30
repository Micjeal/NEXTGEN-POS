import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { emailService } from '@/lib/email/service'

// POST /api/emails/low-stock-alert - Send low stock alerts to managers
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all inventory items
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

    if (productsError) {
      console.error('Error fetching inventory:', productsError)
      return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
    }

    // Filter for low stock items
    const lowStockProducts = (allInventory || []).filter(
      item => item.quantity <= item.min_stock_level
    )

    if (productsError) {
      console.error('Error fetching low stock products:', productsError)
      return NextResponse.json({ error: 'Failed to fetch low stock products' }, { status: 500 })
    }

    if (!lowStockProducts || lowStockProducts.length === 0) {
      return NextResponse.json({ message: 'No low stock items found' })
    }

    // Get managers who have low stock alerts enabled
    const { data: managers, error: managersError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        email_settings!inner(enabled)
      `)
      .eq('email_settings.email_type', 'low_stock')
      .eq('email_settings.enabled', true)
      .eq('role_id', (
        supabase.from('roles').select('id').eq('name', 'manager').single()
      ))

    if (managersError) {
      console.error('Error fetching managers:', managersError)
      return NextResponse.json({ error: 'Failed to fetch managers' }, { status: 500 })
    }

    // Get low stock alert template
    console.log('Fetching low stock alert templates...')
    const templates = await emailService.getTemplatesByCategory('alerts')
    console.log('Found alert templates:', templates.map(t => t.name))
    const lowStockTemplate = templates.find(t => t.name === 'Low Stock Alert')
    console.log('Low stock template found:', !!lowStockTemplate)

    if (!lowStockTemplate) {
      console.error('Low stock alert template not found in DB')
      return NextResponse.json({ error: 'Low stock alert template not found' }, { status: 500 })
    }

    let sentCount = 0
    let failedCount = 0

    // Send alerts to each manager
    for (const manager of managers || []) {
      for (const inventoryItem of lowStockProducts) {
        const variables = {
          product_name: inventoryItem.products?.name || 'Unknown Product',
          current_stock: inventoryItem.quantity,
          min_stock_level: inventoryItem.min_stock_level,
          barcode: inventoryItem.products?.barcode || 'N/A'
        }

        const result = await emailService.sendEmail(
          lowStockTemplate.id,
          manager.email,
          manager.full_name,
          variables
        )

        if (result.success) {
          sentCount++
        } else {
          failedCount++
          console.error(`Failed to send low stock alert to ${manager.email}:`, result.error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      products: lowStockProducts.length
    })
  } catch (error) {
    console.error('Low stock alert error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}