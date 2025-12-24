import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Inbox, Send, Megaphone, FileText, Plus, MessageSquare, Users, Package, Database } from "lucide-react"
import { MessageInbox } from "@/components/messages/message-inbox"
import { MessageComposer } from "@/components/messages/message-composer"
import { MessageTemplates } from "@/components/messages/message-templates"
import { SentMessages } from "@/components/messages/sent-messages"

export default async function MessagesPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return <div>Please log in to access messages</div>
  }

  // Get user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role:roles(name)")
    .eq("id", user.id)
    .single()

  const userRole = (profile as any)?.role?.name || "cashier"
  const isAdminOrManager = ["admin", "manager"].includes(userRole)

  // Get unread message count
  const { count: unreadCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .or(`recipient_id.eq.${user.id},recipient_role.in.(admin,manager,cashier)`)
    .eq("is_read", false)

  // Get system statistics
  const [
    { count: totalUsers },
    { count: totalProducts },
    { count: totalCategories },
    { count: totalMessages }
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase.from("messages").select("*", { count: "exact", head: true })
  ])

  // Get recent user activity
  const { data: recentUsers } = await supabase
    .from("profiles")
    .select("full_name, created_at, role:roles(name)")
    .order("created_at", { ascending: false })
    .limit(5)

  // Get role distribution
  const { data: roleStats } = await supabase
    .from("profiles")
    .select("role:roles(name)")
    .not("role", "is", null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-800 to-purple-600 dark:from-blue-200 dark:to-purple-400 bg-clip-text text-transparent">
            Messages
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Internal communication and announcements
            <span className="ml-2 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-2 py-1 rounded">
              Demo Mode
            </span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          {unreadCount && unreadCount > 0 && (
            <Badge variant="destructive" className="px-3 py-1">
              {unreadCount} unread
            </Badge>
          )}
          <MessageComposer>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Compose Message
            </Button>
          </MessageComposer>
        </div>
      </div>

      <Tabs defaultValue="inbox" className="space-y-6">
        <TabsList className={`grid w-full ${isAdminOrManager ? 'grid-cols-5' : 'grid-cols-4'}`}>
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Inbox {unreadCount && unreadCount > 0 && `(${unreadCount})`}
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Sent
          </TabsTrigger>
          <TabsTrigger value="broadcasts" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            Broadcasts
          </TabsTrigger>
          {isAdminOrManager && (
            <TabsTrigger value="system" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              System
            </TabsTrigger>
          )}
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-6">
          <MessageInbox />
        </TabsContent>

        <TabsContent value="sent" className="space-y-6">
          <SentMessages />
        </TabsContent>

        <TabsContent value="broadcasts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Broadcast Messages
              </CardTitle>
              <CardDescription>System-wide announcements and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Broadcast messages feature coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdminOrManager && (
          <TabsContent value="system" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">Registered users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProducts || 0}</div>
                <p className="text-xs text-muted-foreground">In catalog</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCategories || 0}</div>
                <p className="text-xs text-muted-foreground">Product categories</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalMessages || 0}</div>
                <p className="text-xs text-muted-foreground">Total sent</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Users</CardTitle>
                <CardDescription>Newly registered team members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentUsers?.slice(0, 5).map((user, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{(user as any).role?.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  )) || (
                    <p className="text-muted-foreground text-sm">No recent users</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current system information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Database Status</span>
                    <span className="text-sm font-medium text-green-600">Connected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Last Backup</span>
                    <span className="text-sm font-medium">Today 2:00 AM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">System Version</span>
                    <span className="text-sm font-medium">SMMS POS v1.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Active Sessions</span>
                    <span className="text-sm font-medium">{totalUsers || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          </TabsContent>
        )}

        <TabsContent value="templates" className="space-y-6">
          <MessageTemplates />
        </TabsContent>
      </Tabs>
    </div>
  )
}