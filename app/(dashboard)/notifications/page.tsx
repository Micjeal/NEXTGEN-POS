import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, MessageSquare, Mail, AlertTriangle, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function NotificationsPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return <div>Please log in to access notifications</div>
  }

  // Sample notifications (in production, these would come from a notifications table)
  const systemNotifications = [
    { id: 'sys1', message: "New order received", subject: "New order received", sender: "System", priority: 'normal', date: new Date().toISOString(), read: false, type: "order", category: 'system' },
    { id: 'sys2', message: "Inventory low: Product X", subject: "Inventory low: Product X", sender: "System", priority: 'urgent', date: new Date(Date.now() - 3600000).toISOString(), read: false, type: "inventory", category: 'system' },
    { id: 'sys3', message: "New user registered", subject: "New user registered", sender: "System", priority: 'normal', date: new Date(Date.now() - 86400000).toISOString(), read: true, type: "user", category: 'system' },
  ]

  // Sample messages that appear as notifications (in production, fetch unread messages)
  const messageNotifications = [
    {
      id: 'msg1',
      subject: 'Welcome to SMMS Messaging',
      message: 'Welcome to SMMS Messaging',
      sender: 'System Administrator',
      priority: 'normal',
      date: new Date(Date.now() - 3600000).toISOString(),
      read: false,
      type: 'message',
      category: 'message'
    },
    {
      id: 'msg2',
      subject: 'Daily Operations Update',
      message: 'Daily Operations Update',
      sender: 'Store Manager',
      priority: 'normal',
      date: new Date(Date.now() - 7200000).toISOString(),
      read: true,
      type: 'message',
      category: 'message'
    },
    {
      id: 'msg3',
      subject: 'System Maintenance Tonight',
      message: 'System Maintenance Tonight',
      sender: 'IT Administrator',
      priority: 'urgent',
      date: new Date(Date.now() - 86400000).toISOString(),
      read: false,
      type: 'message',
      category: 'message'
    }
  ]

  // Combine all notifications
  const allNotifications = [
    ...systemNotifications,
    ...messageNotifications
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const unreadCount = allNotifications.filter(n => !n.read).length

  const getNotificationIcon = (type: string, priority?: string) => {
    if (type === 'message') {
      if (priority === 'urgent') return <AlertTriangle className="h-4 w-4 text-orange-500" />
      if (priority === 'critical') return <AlertTriangle className="h-4 w-4 text-red-500" />
      return <MessageSquare className="h-4 w-4 text-blue-500" />
    }
    return <Bell className="h-4 w-4 text-gray-500" />
  }

  const getPriorityBadge = (priority?: string) => {
    if (!priority || priority === 'normal') return null

    const variants = {
      urgent: 'default',
      critical: 'destructive'
    } as const

    return (
      <Badge variant={variants[priority as keyof typeof variants] || 'secondary'} className="text-xs">
        {priority}
      </Badge>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Your recent notifications and messages</p>
        </div>
        <div className="flex items-center gap-4">
          {unreadCount > 0 && (
            <Badge variant="destructive" className="px-3 py-1">
              {unreadCount} unread
            </Badge>
          )}
          <Link href="/messages">
            <Button variant="outline">
              <MessageSquare className="h-4 w-4 mr-2" />
              View Messages
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Your Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allNotifications.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No notifications yet</p>
          ) : (
            <div className="space-y-4">
              {allNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border ${
                    !notification.read ? "bg-muted/50 border-l-4 border-l-primary" : "bg-background"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {getNotificationIcon(notification.type, notification.priority)}
                      {notification.category === 'message' ? (
                        <span className="text-sm font-medium text-blue-600">Message</span>
                      ) : (
                        <span className="text-sm font-medium text-gray-600">System</span>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(notification.date).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {notification.category === 'message' ? (
                        <div>
                          <p className="font-medium">{notification.subject}</p>
                          <p className="text-sm text-muted-foreground">From: {notification.sender}</p>
                        </div>
                      ) : (
                        <p className="font-medium">{notification.message}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(notification.priority)}
                      {!notification.read && (
                        <Badge variant="default" className="text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                  </div>

                  {notification.category === 'message' && (
                    <div className="mt-3">
                      <Link href="/messages">
                        <Button size="sm" variant="outline">
                          <Mail className="h-3 w-3 mr-1" />
                          View in Messages
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
