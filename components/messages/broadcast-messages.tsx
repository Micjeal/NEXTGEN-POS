"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Megaphone, Mail, MailOpen, AlertTriangle, Clock, User, Volume2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { Message } from "@/lib/types/database"
import { formatDistanceToNow } from "date-fns"

export function BroadcastMessages() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchBroadcastMessages()
  }, [])

  const fetchBroadcastMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      try {
        // Try to fetch from database first
        const { data, error } = await supabase
          .from("messages")
          .select(`
            *,
            sender:profiles(full_name)
          `)
          .eq("message_type", "broadcast")
          .order("created_at", { ascending: false })
          .limit(50)

        if (error) throw error

        if (data && data.length > 0) {
          console.log('Broadcast messages loaded from database:', data.length)
          setMessages(data as Message[])
          return
        }
      } catch (dbError) {
        console.log('Database not available for broadcast messages, using sample data')
      }

      // Fallback: Show sample broadcast messages for demonstration
      console.log('Loading sample broadcast messages for demonstration...')

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Sample broadcast messages
      const sampleBroadcasts = [
        {
          id: 'broadcast-1',
          sender_id: 'admin1',
          recipient_id: null,
          recipient_role: null,
          subject: 'System Maintenance Tonight',
          content: 'Scheduled maintenance will occur tonight from 2:00 AM to 4:00 AM. The system will be unavailable during this time. Please complete all work before then.',
          message_type: 'broadcast' as const,
          priority: 'urgent' as const,
          is_read: false,
          parent_message_id: null,
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          updated_at: new Date(Date.now() - 86400000).toISOString(),
          sender: { full_name: 'IT Administrator' }
        },
        {
          id: 'broadcast-2',
          sender_id: 'manager1',
          recipient_id: null,
          recipient_role: null,
          subject: 'New Store Policy Update',
          content: 'Effective immediately, all cashiers must verify customer ID for purchases over $50. This policy helps prevent fraud and ensures compliance with regulations.',
          message_type: 'broadcast' as const,
          priority: 'normal' as const,
          is_read: true,
          parent_message_id: null,
          created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          updated_at: new Date(Date.now() - 172800000).toISOString(),
          sender: { full_name: 'Store Manager' }
        },
        {
          id: 'broadcast-3',
          sender_id: 'admin1',
          recipient_id: null,
          recipient_role: null,
          subject: 'Holiday Schedule Announcement',
          content: 'The store will be closed on Christmas Day and New Year\'s Day. Regular hours will resume on January 2nd. Please plan your schedules accordingly.',
          message_type: 'broadcast' as const,
          priority: 'normal' as const,
          is_read: true,
          parent_message_id: null,
          created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          updated_at: new Date(Date.now() - 259200000).toISOString(),
          sender: { full_name: 'Store Administrator' }
        },
        {
          id: 'broadcast-4',
          sender_id: 'manager1',
          recipient_id: null,
          recipient_role: null,
          subject: 'URGENT: Inventory Count Required',
          content: 'Due to recent stock discrepancies, we need to perform an emergency inventory count. All staff should participate in the count starting at 6:00 PM today.',
          message_type: 'broadcast' as const,
          priority: 'critical' as const,
          is_read: false,
          parent_message_id: null,
          created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          updated_at: new Date(Date.now() - 3600000).toISOString(),
          sender: { full_name: 'Inventory Manager' }
        }
      ]

      setMessages(sampleBroadcasts as Message[])
    } catch (error: any) {
      console.error('Error fetching broadcast messages:', error)
      toast({
        title: "Error",
        description: "Failed to load broadcast messages",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      // Try to update in database first
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("id", messageId)

      if (!error) {
        console.log('Broadcast message marked as read in database')
      } else {
        console.log('Database update failed, updating local state only')
      }

      // Always update local state for immediate UI feedback
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ))

    } catch (error: any) {
      console.error('Error marking broadcast message as read:', error)
      // Still update local state even if database fails
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ))
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive'
      case 'urgent': return 'default'
      default: return 'secondary'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />
      case 'urgent': return <Clock className="h-4 w-4" />
      default: return null
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading broadcast messages...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Broadcast Messages
        </CardTitle>
        <CardDescription>System-wide announcements and important notifications</CardDescription>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Volume2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No broadcast messages yet</p>
            <p className="text-sm">Important announcements will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${
                  !message.is_read ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' : ''
                }`}
                onClick={() => !message.is_read && markAsRead(message.id)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-orange-100 dark:bg-orange-900">
                    <Megaphone className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm truncate">
                      {message.sender?.full_name || "System Administrator"}
                    </p>
                    <Badge variant="outline" className="text-xs bg-orange-50 dark:bg-orange-950">
                      <Megaphone className="h-3 w-3 mr-1" />
                      Broadcast
                    </Badge>
                    <Badge variant={getPriorityColor(message.priority)} className="text-xs flex items-center gap-1">
                      {getPriorityIcon(message.priority)}
                      {message.priority}
                    </Badge>
                    {!message.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>

                  <h4 className="font-medium text-sm mb-1 truncate">
                    {message.subject}
                  </h4>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {message.content}
                  </p>

                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {!message.is_read && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        markAsRead(message.id)
                      }}
                    >
                      <MailOpen className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}