"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, Mail, AlertTriangle, Clock, User } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Message } from "@/lib/types/database"

export function SentMessages() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSentMessages()
  }, [])

  const fetchSentMessages = () => {
    try {
      setLoading(true)
      // Load sent messages from localStorage
      const sentMessages = JSON.parse(localStorage.getItem('sentMessages') || '[]')
      setMessages(sentMessages)
    } catch (error) {
      console.error('Error loading sent messages:', error)
    } finally {
      setLoading(false)
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

  const getRecipientDisplay = (message: Message) => {
    if (message.message_type === "broadcast") {
      return "Broadcast to All Users"
    } else if (message.recipient_id) {
      return "Direct Message"
    } else if (message.recipient_role) {
      return `All ${message.recipient_role}s`
    } else {
      return "Unknown"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading sent messages...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Sent Messages
        </CardTitle>
        <CardDescription>Messages you have sent</CardDescription>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No sent messages yet</p>
            <p className="text-sm">Messages you send will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className="flex items-start gap-4 p-4 border rounded-lg bg-muted/20"
              >
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Send className="h-4 w-4 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm truncate">
                      {message.subject}
                    </p>
                    <Badge variant={getPriorityColor(message.priority)} className="text-xs flex items-center gap-1">
                      {getPriorityIcon(message.priority)}
                      {message.priority}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {message.content}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {getRecipientDisplay(message)}
                    </span>
                    <span>
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}