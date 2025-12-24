"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Store, Upload, Save, RefreshCw, Package, Receipt, CreditCard, ScanLine, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function SystemSettings() {
  const [settings, setSettings] = useState({
    // Store Details
    systemName: "POS System",
    systemDescription: "Supermarket Management System",
    businessAddress: "",
    businessPhone: "",
    businessEmail: "",
    taxNumber: "",
    storeLogo: "",
    currency: "UGX",
    timezone: "Africa/Kampala",

    // Inventory Settings
    lowStockThreshold: 10,
    criticalStockThreshold: 5,
    autoReorderEnabled: false,
    defaultReorderQuantity: 50,

    // Receipt Settings
    receiptHeader: "Thank you for shopping with us!",
    receiptFooter: "Visit us again soon!",
    showLogoOnReceipt: true,
    includeTaxDetails: true,
    receiptPaperSize: "80mm",

    // Integrations
    paymentGatewayEnabled: true,
    barcodeScannerEnabled: true,
    emailIntegrationEnabled: false,
    smsIntegrationEnabled: false,

    // System Preferences
    enableNotifications: true,
    enableAuditLog: true,
    autoBackup: false,
    maintenanceMode: false,
  })

  const { toast } = useToast()

  const handleSave = () => {
    // TODO: Save to database
    toast({
      title: "Settings Saved",
      description: "System settings have been updated successfully.",
    })
  }

  const handleReset = () => {
    // Reset to defaults
    setSettings({
      // Store Details
      systemName: "POS System",
      systemDescription: "Supermarket Management System",
      businessAddress: "",
      businessPhone: "",
      businessEmail: "",
      taxNumber: "",
      storeLogo: "",
      currency: "UGX",
      timezone: "Africa/Kampala",

      // Inventory Settings
      lowStockThreshold: 10,
      criticalStockThreshold: 5,
      autoReorderEnabled: false,
      defaultReorderQuantity: 50,

      // Receipt Settings
      receiptHeader: "Thank you for shopping with us!",
      receiptFooter: "Visit us again soon!",
      showLogoOnReceipt: true,
      includeTaxDetails: true,
      receiptPaperSize: "80mm",

      // Integrations
      paymentGatewayEnabled: true,
      barcodeScannerEnabled: true,
      emailIntegrationEnabled: false,
      smsIntegrationEnabled: false,

      // System Preferences
      enableNotifications: true,
      enableAuditLog: true,
      autoBackup: false,
      maintenanceMode: false,
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            System Information
          </CardTitle>
          <CardDescription>Basic system and business information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="systemName">System Name</Label>
              <Input
                id="systemName"
                value={settings.systemName}
                onChange={(e) => setSettings(prev => ({ ...prev, systemName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessEmail">Business Email</Label>
              <Input
                id="businessEmail"
                type="email"
                value={settings.businessEmail}
                onChange={(e) => setSettings(prev => ({ ...prev, businessEmail: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="systemDescription">System Description</Label>
            <Textarea
              id="systemDescription"
              value={settings.systemDescription}
              onChange={(e) => setSettings(prev => ({ ...prev, systemDescription: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="businessPhone">Business Phone</Label>
              <Input
                id="businessPhone"
                value={settings.businessPhone}
                onChange={(e) => setSettings(prev => ({ ...prev, businessPhone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxNumber">Tax Number</Label>
              <Input
                id="taxNumber"
                value={settings.taxNumber}
                onChange={(e) => setSettings(prev => ({ ...prev, taxNumber: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessAddress">Business Address</Label>
            <Textarea
              id="businessAddress"
              value={settings.businessAddress}
              onChange={(e) => setSettings(prev => ({ ...prev, businessAddress: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={settings.currency}
                onValueChange={(value) => setSettings(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UGX">UGX - Ugandan Shilling</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={settings.timezone}
                onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Africa/Kampala">East Africa Time (EAT)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Africa/Nairobi">Nairobi Time</SelectItem>
                  <SelectItem value="Africa/Dar_es_Salaam">Dar es Salaam Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeLogo">Store Logo URL</Label>
              <Input
                id="storeLogo"
                value={settings.storeLogo}
                onChange={(e) => setSettings(prev => ({ ...prev, storeLogo: e.target.value }))}
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Preferences</CardTitle>
          <CardDescription>Configure system behavior and features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive system notifications and alerts</p>
            </div>
            <Switch
              checked={settings.enableNotifications}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableNotifications: checked }))}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Audit Logging</Label>
              <p className="text-sm text-muted-foreground">Track all system activities and changes</p>
            </div>
            <Switch
              checked={settings.enableAuditLog}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableAuditLog: checked }))}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Automatic Backup</Label>
              <p className="text-sm text-muted-foreground">Automatically backup data daily</p>
            </div>
            <Switch
              checked={settings.autoBackup}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoBackup: checked }))}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">Put system in maintenance mode</p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, maintenanceMode: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Inventory Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Settings
          </CardTitle>
          <CardDescription>Configure inventory management preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
              <Input
                id="lowStockThreshold"
                type="number"
                value={settings.lowStockThreshold}
                onChange={(e) => setSettings(prev => ({ ...prev, lowStockThreshold: parseInt(e.target.value) || 0 }))}
                min="0"
              />
              <p className="text-xs text-muted-foreground">
                Alert when stock falls below this number
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="criticalStockThreshold">Critical Stock Threshold</Label>
              <Input
                id="criticalStockThreshold"
                type="number"
                value={settings.criticalStockThreshold}
                onChange={(e) => setSettings(prev => ({ ...prev, criticalStockThreshold: parseInt(e.target.value) || 0 }))}
                min="0"
              />
              <p className="text-xs text-muted-foreground">
                Critical alert when stock falls below this number
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto Reorder</Label>
              <p className="text-sm text-muted-foreground">Automatically create purchase orders when stock is low</p>
            </div>
            <Switch
              checked={settings.autoReorderEnabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoReorderEnabled: checked }))}
            />
          </div>

          {settings.autoReorderEnabled && (
            <div className="space-y-2">
              <Label htmlFor="defaultReorderQuantity">Default Reorder Quantity</Label>
              <Input
                id="defaultReorderQuantity"
                type="number"
                value={settings.defaultReorderQuantity}
                onChange={(e) => setSettings(prev => ({ ...prev, defaultReorderQuantity: parseInt(e.target.value) || 0 }))}
                min="1"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Customization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Receipt Customization
          </CardTitle>
          <CardDescription>Customize receipt appearance and content</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="receiptHeader">Receipt Header</Label>
            <Textarea
              id="receiptHeader"
              value={settings.receiptHeader}
              onChange={(e) => setSettings(prev => ({ ...prev, receiptHeader: e.target.value }))}
              rows={2}
              placeholder="Thank you for shopping with us!"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="receiptFooter">Receipt Footer</Label>
            <Textarea
              id="receiptFooter"
              value={settings.receiptFooter}
              onChange={(e) => setSettings(prev => ({ ...prev, receiptFooter: e.target.value }))}
              rows={2}
              placeholder="Visit us again soon!"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="receiptPaperSize">Paper Size</Label>
              <Select
                value={settings.receiptPaperSize}
                onValueChange={(value) => setSettings(prev => ({ ...prev, receiptPaperSize: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="58mm">58mm (Narrow)</SelectItem>
                  <SelectItem value="80mm">80mm (Standard)</SelectItem>
                  <SelectItem value="A4">A4 (Full Page)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Logo on Receipt</Label>
                <p className="text-sm text-muted-foreground">Include store logo at the top of receipts</p>
              </div>
              <Switch
                checked={settings.showLogoOnReceipt}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showLogoOnReceipt: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Include Tax Details</Label>
                <p className="text-sm text-muted-foreground">Show tax breakdown on receipts</p>
              </div>
              <Switch
                checked={settings.includeTaxDetails}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, includeTaxDetails: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Integrations
          </CardTitle>
          <CardDescription>Configure third-party integrations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Gateway
              </Label>
              <p className="text-sm text-muted-foreground">Enable online payment processing</p>
            </div>
            <Switch
              checked={settings.paymentGatewayEnabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, paymentGatewayEnabled: checked }))}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <ScanLine className="h-4 w-4" />
                Barcode Scanner
              </Label>
              <p className="text-sm text-muted-foreground">Enable barcode scanning functionality</p>
            </div>
            <Switch
              checked={settings.barcodeScannerEnabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, barcodeScannerEnabled: checked }))}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Integration</Label>
              <p className="text-sm text-muted-foreground">Send automated emails for receipts and notifications</p>
            </div>
            <Switch
              checked={settings.emailIntegrationEnabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailIntegrationEnabled: checked }))}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>SMS Integration</Label>
              <p className="text-sm text-muted-foreground">Send SMS notifications for important alerts</p>
            </div>
            <Switch
              checked={settings.smsIntegrationEnabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, smsIntegrationEnabled: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={handleReset}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  )
}