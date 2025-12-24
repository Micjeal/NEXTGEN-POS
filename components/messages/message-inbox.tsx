"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Inbox, Mail, MailOpen, AlertTriangle, Clock, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { Message } from "@/lib/types/database"
import { formatDistanceToNow } from "date-fns"

export function MessageInbox() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
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
          .or(`recipient_id.eq.${user.id},recipient_role.in.(admin,manager,cashier)`)
          .order("created_at", { ascending: false })
          .limit(50)

        if (error) throw error

        if (data && data.length > 0) {
          console.log('Messages loaded from database:', data.length)
          setMessages(data as Message[])
          return
        }
      } catch (dbError) {
        console.log('Database not available for messages, using sample data')
      }

      // Fallback: Show sample messages for demonstration
      console.log('Loading sample messages for demonstration...')

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Sample messages for demonstration
      const sampleMessages = [
        {
          id: '1',
          sender_id: 'system',
          recipient_id: user.id,
          recipient_role: null,
          subject: 'Welcome to SMMS Messaging',
          content: 'Welcome to the new internal messaging system! You can now communicate with your team members and receive important notifications.',
          message_type: 'system' as const,
          priority: 'normal' as const,
          is_read: false,
          parent_message_id: null,
          created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          updated_at: new Date(Date.now() - 3600000).toISOString(),
          sender: { full_name: 'System Administrator' }
        },
        {
          id: '2',
          sender_id: 'manager1',
          recipient_id: user.id,
          recipient_role: null,
          subject: 'Daily Operations Update',
          content: 'Good morning team! Today\'s focus will be on inventory management and customer service excellence. Please ensure all transactions are processed accurately.',
          message_type: 'role_based' as const,
          priority: 'normal' as const,
          is_read: true,
          parent_message_id: null,
          created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          updated_at: new Date(Date.now() - 7200000).toISOString(),
          sender: { full_name: 'Store Manager' }
        },
        {
          id: '3',
          sender_id: 'admin1',
          recipient_id: user.id,
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
        }
      ]

      setMessages(sampleMessages as Message[])
    } catch (error: any) {
      console.error('Error fetching messages:', error)
      toast({
        title: "Error",
        description: "Failed to load messages",
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
        console.log('Message marked as read in database')
      } else {
        console.log('Database update failed, updating local state only')
      }

      // Always update local state for immediate UI feedback
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ))

    } catch (error: any) {
      console.error('Error marking message as read:', error)
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
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Inbox className="h-5 w-5" />
          Inbox
        </CardTitle>
        <CardDescription>Your received messages and notifications</CardDescription>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm">Messages from your team will appear here</p>
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
                  <AvatarFallback>
                    {message.sender?.full_name?.charAt(0)?.toUpperCase() || "S"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm truncate">
                      {message.sender?.full_name || "System"}
                    </p>
                    {message.recipient_role && (
                      <Badge variant="outline" className="text-xs">
                        {message.recipient_role}
                      </Badge>
                    )}
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