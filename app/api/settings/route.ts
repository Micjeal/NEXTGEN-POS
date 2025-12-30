import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

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

    // For now, we'll store settings in a simple key-value table
    // In a real app, you'd have a proper settings table
    const settings = body.settings

    // Save each setting
    const settingsToSave = [
      { key: 'system_name', value: settings.systemName },
      { key: 'system_description', value: settings.systemDescription },
      { key: 'business_address', value: settings.businessAddress },
      { key: 'business_phone', value: settings.businessPhone },
      { key: 'business_email', value: settings.businessEmail },
      { key: 'tax_number', value: settings.taxNumber },
      { key: 'store_logo', value: settings.storeLogo },
      { key: 'currency', value: settings.currency },
      { key: 'timezone', value: settings.timezone },
      { key: 'low_stock_threshold', value: settings.lowStockThreshold.toString() },
      { key: 'critical_stock_threshold', value: settings.criticalStockThreshold.toString() },
      { key: 'auto_reorder_enabled', value: settings.autoReorderEnabled.toString() },
      { key: 'default_reorder_quantity', value: settings.defaultReorderQuantity.toString() },
      { key: 'receipt_header', value: settings.receiptHeader },
      { key: 'receipt_footer', value: settings.receiptFooter },
      { key: 'show_logo_on_receipt', value: settings.showLogoOnReceipt.toString() },
      { key: 'include_tax_details', value: settings.includeTaxDetails.toString() },
      { key: 'receipt_paper_size', value: settings.receiptPaperSize },
      { key: 'payment_gateway_enabled', value: settings.paymentGatewayEnabled.toString() },
      { key: 'barcode_scanner_enabled', value: settings.barcodeScannerEnabled.toString() },
      { key: 'email_integration_enabled', value: settings.emailIntegrationEnabled.toString() },
      { key: 'sms_integration_enabled', value: settings.smsIntegrationEnabled.toString() },
      { key: 'enable_notifications', value: settings.enableNotifications.toString() },
      { key: 'enable_audit_log', value: settings.enableAuditLog.toString() },
      { key: 'auto_backup', value: settings.autoBackup.toString() },
      { key: 'maintenance_mode', value: settings.maintenanceMode.toString() },
    ]

    // Upsert settings
    for (const setting of settingsToSave) {
      const { error } = await supabase
        .from("system_settings")
        .upsert({
          key: setting.key,
          value: setting.value,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        })

      if (error) {
        console.error(`Error saving setting ${setting.key}:`, error)
        if (error.code === 'PGRST116' || error.code === 'PGRST205') {
          return NextResponse.json({
            error: "Database table 'system_settings' not found. Please run the database seed script first.",
            details: "Execute the SQL in scripts/004_seed_data.sql in your Supabase SQL editor."
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

    // Fetch all settings
    const { data: settingsData, error } = await supabase
      .from("system_settings")
      .select("key, value")

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
      settingsObj[setting.key] = setting.value
    })

    // Convert string booleans back to booleans
    const booleanKeys = [
      'auto_reorder_enabled', 'show_logo_on_receipt', 'include_tax_details',
      'payment_gateway_enabled', 'barcode_scanner_enabled', 'email_integration_enabled',
      'sms_integration_enabled', 'enable_notifications', 'enable_audit_log',
      'auto_backup', 'maintenance_mode'
    ]

    booleanKeys.forEach(key => {
      if (settingsObj[key] !== undefined) {
        settingsObj[key] = settingsObj[key] === 'true'
      }
    })

    // Convert numbers
    const numberKeys = ['low_stock_threshold', 'critical_stock_threshold', 'default_reorder_quantity']
    numberKeys.forEach(key => {
      if (settingsObj[key] !== undefined) {
        settingsObj[key] = parseInt(settingsObj[key]) || 0
      }
    })

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