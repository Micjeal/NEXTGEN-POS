"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Bell, Mail, MessageSquare, Save, Package, TrendingDown, Receipt, CreditCard } from "lucide-react"

interface NotificationSettings {
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  lowStockAlerts: boolean
  transactionAlerts: boolean
  systemUpdates: boolean
  weeklyReports: boolean
  marketingEmails: boolean
  notificationFrequency: 'immediate' | 'daily' | 'weekly'
}

export function NotificationSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    lowStockAlerts: true,
    transactionAlerts: true,
    systemUpdates: true,
    weeklyReports: false,
    marketingEmails: false,
    notificationFrequency: 'immediate',
  })

  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchNotificationSettings()
  }, [])

  const fetchNotificationSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch email settings from database
      const { data: emailSettings, error } = await supabase
        .from('email_settings')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error

      // Map database settings to component state
      const settingsMap: Record<string, boolean> = {}
      emailSettings?.forEach(setting => {
        settingsMap[setting.email_type] = setting.enabled
      })

      setSettings(prev => ({
        ...prev,
        lowStockAlerts: settingsMap.low_stock || false,
        transactionAlerts: settingsMap.transaction_alert || false,
        systemUpdates: settingsMap.system_updates || false,
        weeklyReports: settingsMap.weekly_report || false,
        marketingEmails: settingsMap.marketing || false,
      }))
    } catch (error) {
      console.error('Error fetching notification settings:', error)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Prepare settings to save
      const settingsToSave = [
        { email_type: 'low_stock', enabled: settings.lowStockAlerts, frequency: 'immediate' },
        { email_type: 'out_of_stock', enabled: settings.lowStockAlerts, frequency: 'immediate' }, // Using same switch for now
        { email_type: 'transaction_alert', enabled: settings.transactionAlerts, frequency: 'immediate' },
        { email_type: 'system_updates', enabled: settings.systemUpdates, frequency: 'immediate' },
        { email_type: 'weekly_report', enabled: settings.weeklyReports, frequency: 'weekly' },
        { email_type: 'marketing', enabled: settings.marketingEmails, frequency: 'weekly' },
      ]

      // Upsert each setting
      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from('email_settings')
          .upsert({
            user_id: user.id,
            email_type: setting.email_type,
            enabled: setting.enabled,
            frequency: setting.frequency,
          }, {
            onConflict: 'user_id,email_type'
          })

        if (error) throw error
      }

      toast({
        title: "Success",
        description: "Notification preferences have been saved",
      })
    } catch (error) {
      console.error('Error saving notification settings:', error)
      toast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateSetting = (key: keyof NotificationSettings, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      {/* General Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            General Preferences
          </CardTitle>
          <CardDescription>Choose how you want to receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  SMS Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via text message
                </p>
              </div>
              <Switch
                checked={settings.smsNotifications}
                onCheckedChange={(checked) => updateSetting('smsNotifications', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Push Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive push notifications in your browser
                </p>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Notification Frequency</Label>
              <Select
                value={settings.notificationFrequency}
                onValueChange={(value: 'immediate' | 'daily' | 'weekly') =>
                  updateSetting('notificationFrequency', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="daily">Daily Digest</SelectItem>
                  <SelectItem value="weekly">Weekly Summary</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How often you want to receive grouped notifications
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* POS Transaction Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            POS Transaction Alerts
          </CardTitle>
          <CardDescription>Get notified about sales and transactions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Transaction Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when transactions are processed
              </p>
            </div>
            <Switch
              checked={settings.transactionAlerts}
              onCheckedChange={(checked) => updateSetting('transactionAlerts', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Receipt Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive digital receipts for transactions
              </p>
            </div>
            <Switch
              checked={settings.transactionAlerts}
              onCheckedChange={(checked) => updateSetting('transactionAlerts', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Inventory Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Alerts
          </CardTitle>
          <CardDescription>Stay informed about your stock levels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Low Stock Alerts
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified when products are running low
              </p>
            </div>
            <Switch
              checked={settings.lowStockAlerts}
              onCheckedChange={(checked) => updateSetting('lowStockAlerts', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Out of Stock Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when products go out of stock
              </p>
            </div>
            <Switch
              checked={settings.lowStockAlerts}
              onCheckedChange={(checked) => updateSetting('lowStockAlerts', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* System & Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            System & Reports
          </CardTitle>
          <CardDescription>System updates and business reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>System Updates</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about system maintenance and updates
              </p>
            </div>
            <Switch
              checked={settings.systemUpdates}
              onCheckedChange={(checked) => updateSetting('systemUpdates', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weekly Reports</Label>
              <p className="text-sm text-muted-foreground">
                Receive weekly business performance reports
              </p>
            </div>
            <Switch
              checked={settings.weeklyReports}
              onCheckedChange={(checked) => updateSetting('weeklyReports', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Marketing Emails</Label>
              <p className="text-sm text-muted-foreground">
                Receive tips, updates, and promotional content
              </p>
            </div>
            <Switch
              checked={settings.marketingEmails}
              onCheckedChange={(checked) => updateSetting('marketingEmails', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  )
}