import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Settings, Palette, Shield, Store, Users, Database, Plus, Edit, Trash2, User, Bell } from "lucide-react"
import { SystemSettings } from "@/components/settings/system-settings"
import { ThemeSettings } from "@/components/settings/theme-settings"
import { PermissionSettings } from "@/components/settings/permission-settings"
import { CategoryManager } from "@/components/settings/category-manager"
import { PaymentManager } from "@/components/settings/payment-manager"
import { ProfileSettings } from "@/components/settings/profile-settings"
import { SecuritySettings } from "@/components/settings/security-settings"
import { NotificationSettings } from "@/components/settings/notification-settings"
import { EmailTemplates } from "@/components/settings/email-templates"
import { redirect } from "next/navigation"
import { Mail } from "lucide-react"

export default async function SettingsPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/auth/login")
  }

  // Check user role - only admin can access system settings
  const { data: profile, error: roleError } = await supabase
    .from('profiles')
    .select('*, role:roles(*)')
    .eq('id', user.id)
    .single()

  if (roleError || !profile) {
    redirect("/auth/login")
  }

  const userRole = profile.role?.name
  if (userRole !== 'admin') {
    redirect("/dashboard")
  }

  const { data: categories } = await supabase.from("categories").select("*").order("name")
  const { data: paymentMethods } = await supabase.from("payment_methods").select("*").order("name")
  const { data: roles } = await supabase.from("roles").select("*").order("name")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
          System Settings
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Configure system preferences, permissions, and appearance
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="emails" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Emails
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecuritySettings />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="emails" className="space-y-6">
          <EmailTemplates />
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <SystemSettings />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <ThemeSettings />
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <PermissionSettings roles={roles || []} />
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <CategoryManager categories={categories || []} />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <PaymentManager paymentMethods={paymentMethods || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
