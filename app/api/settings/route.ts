import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entity_type')
    const entityId = searchParams.get('entity_id')

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check user role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, role:roles(*)')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role?.name
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const settings = body.settings

    // Determine scope
    const isSystemWide = !entityType || !entityId
    const scopeData = isSystemWide ? {
      is_system_wide: true,
      entity_type: null,
      entity_id: null
    } : {
      is_system_wide: false,
      entity_type: entityType,
      entity_id: entityId
    }

    // Save each setting
    const settingsToSave = [
      { key: 'system_name', value: settings.systemName, data_type: 'string' },
      { key: 'system_description', value: settings.systemDescription, data_type: 'string' },
      { key: 'business_address', value: settings.businessAddress, data_type: 'string' },
      { key: 'business_phone', value: settings.businessPhone, data_type: 'string' },
      { key: 'business_email', value: settings.businessEmail, data_type: 'string' },
      { key: 'tax_number', value: settings.taxNumber, data_type: 'string' },
      { key: 'store_logo', value: settings.storeLogo, data_type: 'string' },
      { key: 'currency', value: settings.currency, data_type: 'string' },
      { key: 'timezone', value: settings.timezone, data_type: 'string' },
      { key: 'low_stock_threshold', value: settings.lowStockThreshold.toString(), data_type: 'number' },
      { key: 'critical_stock_threshold', value: settings.criticalStockThreshold.toString(), data_type: 'number' },
      { key: 'auto_reorder_enabled', value: settings.autoReorderEnabled.toString(), data_type: 'boolean' },
      { key: 'default_reorder_quantity', value: settings.defaultReorderQuantity.toString(), data_type: 'number' },
      { key: 'receipt_header', value: settings.receiptHeader, data_type: 'string' },
      { key: 'receipt_footer', value: settings.receiptFooter, data_type: 'string' },
      { key: 'show_logo_on_receipt', value: settings.showLogoOnReceipt.toString(), data_type: 'boolean' },
      { key: 'include_tax_details', value: settings.includeTaxDetails.toString(), data_type: 'boolean' },
      { key: 'receipt_paper_size', value: settings.receiptPaperSize, data_type: 'string' },
      { key: 'payment_gateway_enabled', value: settings.paymentGatewayEnabled.toString(), data_type: 'boolean' },
      { key: 'barcode_scanner_enabled', value: settings.barcodeScannerEnabled.toString(), data_type: 'boolean' },
      { key: 'email_integration_enabled', value: settings.emailIntegrationEnabled.toString(), data_type: 'boolean' },
      { key: 'sms_integration_enabled', value: settings.smsIntegrationEnabled.toString(), data_type: 'boolean' },
      { key: 'enable_notifications', value: settings.enableNotifications.toString(), data_type: 'boolean' },
      { key: 'enable_audit_log', value: settings.enableAuditLog.toString(), data_type: 'boolean' },
      { key: 'auto_backup', value: settings.autoBackup.toString(), data_type: 'boolean' },
      { key: 'maintenance_mode', value: settings.maintenanceMode.toString(), data_type: 'boolean' },
    ]

    // Upsert settings
    for (const setting of settingsToSave) {
      const { error } = await supabase
        .from("system_settings")
        .upsert({
          ...scopeData,
          key: setting.key,
          value: setting.value,
          data_type: setting.data_type,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'entity_type,entity_id,key'
        })

      if (error) {
        console.error(`Error saving setting ${setting.key}:`, error)
        if (error.code === 'PGRST116' || error.code === 'PGRST205') {
          return NextResponse.json({
            error: "Database table 'system_settings' not found. Please run the database migration first.",
            details: "Execute the SQL in create_system_settings_table.sql in your Supabase SQL editor."
          }, { status: 500 })
        }
        return NextResponse.json({ error: `Failed to save setting: ${setting.key}` }, { status: 500 })
      }
    }

    return NextResponse.json({ message: "Settings saved successfully" })

  } catch (error) {
    console.error("Settings save error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entity_type')
    const entityId = searchParams.get('entity_id')

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check user role from profiles table (allow all authenticated users to read settings)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, role:roles(*)')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role?.name
    // All authenticated users can read settings, no role restriction

    // Build query based on scope
    let query = supabase
      .from("system_settings")
      .select("key, value, data_type")

    if (entityType && entityId) {
      // Entity-specific settings
      query = query.eq('entity_type', entityType).eq('entity_id', entityId)
    } else {
      // Global settings (backward compatibility)
      query = query.eq('is_system_wide', true)
    }

    const { data: settingsData, error } = await query

    let settings: any[] | null = settingsData

    // If table doesn't exist, return defaults
    if (error && (error.code === 'PGRST116' || error.code === 'PGRST205')) {
      console.log("System settings table doesn't exist yet, returning defaults")
      settings = null // Will use defaults below
    } else if (error) {
      console.error("Error fetching settings:", error)
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
    }

    // Convert to object
    const settingsObj: Record<string, any> = {}
    settings?.forEach(setting => {
      let value = setting.value
      // Convert based on data_type
      if (setting.data_type === 'boolean') {
        value = value === 'true'
      } else if (setting.data_type === 'number') {
        value = parseFloat(value) || 0
      } else if (setting.data_type === 'json') {
        try {
          value = JSON.parse(value)
        } catch (e) {
          value = null
        }
      }
      settingsObj[setting.key] = value
    })

    // Return settings with defaults for missing values
    return NextResponse.json({
      systemName: settingsObj.system_name || "POS System",
      systemDescription: settingsObj.system_description || "Supermarket Management System",
      businessAddress: settingsObj.business_address || "",
      businessPhone: settingsObj.business_phone || "",
      businessEmail: settingsObj.business_email || "",
      taxNumber: settingsObj.tax_number || "",
      storeLogo: settingsObj.store_logo || "",
      currency: settingsObj.currency || "UGX",
      timezone: settingsObj.timezone || "Africa/Kampala",
      lowStockThreshold: settingsObj.low_stock_threshold || 10,
      criticalStockThreshold: settingsObj.critical_stock_threshold || 5,
      autoReorderEnabled: settingsObj.auto_reorder_enabled || false,
      defaultReorderQuantity: settingsObj.default_reorder_quantity || 50,
      receiptHeader: settingsObj.receipt_header || "Thank you for shopping with us!",
      receiptFooter: settingsObj.receipt_footer || "Visit us again soon!",
      showLogoOnReceipt: settingsObj.show_logo_on_receipt || true,
      includeTaxDetails: settingsObj.include_tax_details || true,
      receiptPaperSize: settingsObj.receipt_paper_size || "80mm",
      paymentGatewayEnabled: settingsObj.payment_gateway_enabled || true,
      barcodeScannerEnabled: settingsObj.barcode_scanner_enabled || true,
      emailIntegrationEnabled: settingsObj.email_integration_enabled || false,
      smsIntegrationEnabled: settingsObj.sms_integration_enabled || false,
      enableNotifications: settingsObj.enable_notifications || true,
      enableAuditLog: settingsObj.enable_audit_log || true,
      autoBackup: settingsObj.auto_backup || false,
      maintenanceMode: settingsObj.maintenance_mode || false,
    })

  } catch (error) {
    console.error("Settings fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}