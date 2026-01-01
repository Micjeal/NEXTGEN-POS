"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Send, Reply, AlertTriangle, Clock, Megaphone, MoreVertical, Users } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { Message } from "@/lib/types/database"
import { formatDistanceToNow } from "date-fns"

interface ChatInterfaceProps {
  initialMessages?: Message[]
}

export function ChatInterface({ initialMessages = [] }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [userId, setUserId] = useState<string>("")
  const [userRole, setUserRole] = useState<string>("")
  const [setupNeeded, setSetupNeeded] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("role-based")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    fetchMessages()
  }, [])

  useEffect(() => {
    if (userId) {
      fetchUsers()
    }
  }, [userId])

  const fetchUsers = async () => {
    try {
      console.log('Fetching users... userId:', userId)
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role:roles(name)")
        .neq("id", userId) // Exclude current user
        .order("full_name")

      if (error) {
        console.error('Supabase profiles query error:', error)
        console.error('This likely means the profiles table does not exist or RLS policies are blocking access')
        console.error('Please ensure the database is properly set up')
        // If profiles table doesn't exist, just set empty array
        setAvailableUsers([])
        return
      }

      console.log('Users fetched successfully:', data?.length || 0, 'users')
      setAvailableUsers(data || [])
    } catch (error) {
      console.error('Exception fetching users:', error)
      setAvailableUsers([])
    }
  }

  const fetchMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      setUserId(user.id)

      // Get user role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role:roles(name)")
        .eq("id", user.id)
        .single()

      setUserRole((profile as any)?.role?.name || "cashier")

      // Fetch messages from database
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`recipient_id.eq.${user.id},recipient_role.in.(admin,manager,cashier),sender_id.eq.${user.id},message_type.eq.broadcast`)
        .order("created_at", { ascending: true })
        .limit(100)

      if (error) throw error

      // Fetch sender profiles separately
      if (data && data.length > 0) {
        const senderIds = [...new Set(data.map(msg => msg.sender_id).filter(id => id))]
        const recipientIds = [...new Set(data.map(msg => msg.recipient_id).filter(id => id))]

        const allUserIds = [...new Set([...senderIds, ...recipientIds])]

        if (allUserIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", allUserIds)

          if (!profilesError && profiles) {
            // Create a map of user profiles
            const profileMap = profiles.reduce((acc, profile) => {
              acc[profile.id] = profile
              return acc
            }, {} as Record<string, any>)

            // Attach profiles to messages
            data.forEach(msg => {
              if (msg.sender_id && profileMap[msg.sender_id]) {
                msg.sender = profileMap[msg.sender_id]
              }
              if (msg.recipient_id && profileMap[msg.recipient_id]) {
                msg.recipient = profileMap[msg.recipient_id]
              }
            })
          }
        }
      }

      if (error) {
        console.error('Supabase query error:', error)
        const err = error as any
        console.error('Error details:', {
          message: err.message,
          details: err.details,
          hint: err.hint,
          code: err.code
        })

        // Check if it's a table not found error
        if (err.message?.includes('relation "public.messages" does not exist') ||
            err.message?.includes('does not exist') ||
            err.code === '42P01') {
          setSetupNeeded(true)
          setMessages([])
          setLoading(false)
          return
        }
        throw error
      }

      console.log('Messages loaded from database:', data?.length || 0)
      setMessages(data as Message[] || [])
    } catch (error: any) {
      console.error('Error fetching messages:', error)
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      })
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (messageId: string) => {
    if (!messageId.startsWith('broadcast-') && !messageId.startsWith('system-')) {
      try {
        const { error } = await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("id", messageId)

        if (!error) {
          console.log('Message marked as read in database')
        }
      } catch (error) {
        console.log('Database update failed, updating local state only')
      }
    }

    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, is_read: true } : msg
    ))
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    setSending(true)
    try {
      // Ensure we have a valid user
      if (!userId) {
        throw new Error('User not authenticated')
      }

      const messageData: any = {
        sender_id: userId,
        subject: newMessage.substring(0, 50), // Use first 50 chars as subject
        content: newMessage,
        priority: 'normal',
      }

      // If a specific user is selected, send direct message
      if (selectedUserId && selectedUserId !== 'role-based') {
        messageData.recipient_id = selectedUserId
        messageData.message_type = 'direct'
      } else {
        // Otherwise send to role
        messageData.message_type = 'role_based'
        messageData.recipient_role = userRole === 'admin' ? 'manager' : userRole === 'manager' ? 'cashier' : 'manager'
      }

      if (replyingTo) {
        messageData.parent_message_id = replyingTo.id
      }

      console.log('Sending message data:', messageData)

      // Insert message into database
      const { data, error } = await supabase
        .from("messages")
        .insert(messageData)
        .select("*")
        .single()

      if (error) {
        console.error('Supabase insert error:', error)
        const err = error as any
        console.error('Error details:', {
          message: err.message,
          details: err.details,
          hint: err.hint,
          code: err.code
        })

        // Check if it's a table not found error or empty error object
        const isTableNotFound = err.message?.includes('relation "public.messages" does not exist') ||
            err.message?.includes('does not exist') ||
            err.code === '42P01' ||
            (!err.message && Object.keys(err).length === 0) // Empty error object

        if (isTableNotFound) {
          setSetupNeeded(true)
          throw new Error('Messages table not found. Please run the database setup.')
        }
        throw error
      }

      // Fetch sender profile
      const { data: senderProfile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single()

      if (!profileError && senderProfile) {
        data.sender = senderProfile
      }

      console.log('Message sent successfully:', data)

      // Add to local state
      setMessages(prev => [...prev, data as Message])

      setNewMessage("")
      setReplyingTo(null)

      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      })

    } catch (error: any) {
      console.error('Error sending message:', error)
      console.error('Error type:', typeof error)
      console.error('Error keys:', Object.keys(error))
      console.error('Error stringified:', JSON.stringify(error, null, 2))
      toast({
        title: "Error",
        description: error?.message || "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const getMessageTypeIcon = (message: Message) => {
    if (message.message_type === 'broadcast') {
      return <Megaphone className="h-3 w-3" />
    } else if (message.priority === 'urgent') {
      return <Clock className="h-3 w-3" />
    } else if (message.priority === 'critical') {
      return <AlertTriangle className="h-3 w-3" />
    }
    return null
  }

  const isOwnMessage = (message: Message) => {
    return message.sender_id === userId
  }

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  }

  const runSetup = async () => {
    try {
      const response = await fetch('/api/setup-messaging', {
        method: 'POST',
      })
      const result = await response.json()

      if (result.success) {
        toast({
          title: "Setup Complete",
          description: "Messaging tables have been created. Refreshing...",
        })
        setSetupNeeded(false)
        // Refresh the messages
        await fetchMessages()
      } else {
        toast({
          title: "Setup Failed",
          description: result.message || "Please run the SQL manually in Supabase.",
          variant: "destructive",
        })
        // If SQL content is provided, log it for manual execution
        if (result.sql_content) {
          console.log("SQL to execute manually in Supabase SQL Editor:")
          console.log(result.sql_content)
        }
      }
    } catch (error) {
      toast({
        title: "Setup Error",
        description: "Failed to run setup. Please check your Supabase connection.",
        variant: "destructive",
      })
    }
  }

  if (setupNeeded) {
    return (
      <div className="h-[700px] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="h-full flex items-center justify-center p-8">
          <div className="text-center max-w-lg bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <MessageSquare className="h-10 w-10 text-white" />
            </div>

            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
              Welcome to Team Chat
            </h3>

            <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              Your messaging system needs to be set up. We'll create the necessary database tables to get you started with seamless team communication.
            </p>

            <div className="space-y-4">
              <Button
                onClick={runSetup}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl py-3 text-lg font-medium"
              >
                🚀 Set Up Messaging System
              </Button>

              <div className="text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Or set up manually:</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 font-mono">
                  Run scripts/messaging_schema.sql in Supabase
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Real-time messaging
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Team collaboration
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Secure & private
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <Card className="h-[600px]">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="h-[700px] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Team Chat</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Real-time messaging</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Online</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
        <ScrollArea className="flex-1 h-full overflow-auto">
          <div className="px-6 py-4 space-y-6 pb-6">
            {messages.length === 0 && !loading && (
              <div className="flex items-center justify-center h-full text-center">
                <div className="max-w-lg">
                  <div className="w-24 h-24 bg-gradient-to-r from-emerald-100 to-cyan-100 dark:from-emerald-900/30 dark:to-cyan-900/30 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
                    <MessageSquare className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                    Start the conversation
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed mb-8">
                    Send your first message to get the team chat rolling. Everyone will see your messages instantly.
                  </p>
                  <div className="flex items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-full px-6 py-3">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">All team members online</span>
                  </div>
                </div>
              </div>
            )}

            {messages.map((message, index) => {
              const isOwn = isOwnMessage(message)
              const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 group animate-in slide-in-from-bottom-2 duration-300 ${
                    isOwn ? 'justify-end' : 'justify-start'
                  }`}
                  onClick={() => (message.is_read === false || message.is_read === null) && !isOwn && markAsRead(message.id)}
                >
                  {/* Avatar for received messages */}
                  {!isOwn && (
                    <div className={`flex-shrink-0 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                      <Avatar className="h-8 w-8 ring-2 ring-slate-200 dark:ring-slate-700">
                        <AvatarFallback className="text-xs bg-gradient-to-br from-slate-400 to-slate-600 text-white">
                          {message.sender?.full_name?.charAt(0)?.toUpperCase() || "S"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}

                  <div className={`flex flex-col max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                    {/* Sender name and badges */}
                    {!isOwn && showAvatar && (
                      <div className="flex items-center gap-2 mb-2 ml-1">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {message.sender?.full_name || "System"}
                        </span>
                        {message.message_type === 'broadcast' && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5 bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800">
                            <Megaphone className="h-3 w-3 mr-1" />
                            Broadcast
                          </Badge>
                        )}
                        {message.message_type === 'direct' && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                            <Users className="h-3 w-3 mr-1" />
                            Direct
                          </Badge>
                        )}
                        {getMessageTypeIcon(message) && (
                          <Badge variant={message.priority === 'critical' ? 'destructive' : 'secondary'} className="text-xs px-2 py-0.5">
                            {getMessageTypeIcon(message)}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Message bubble */}
                    <div className="relative group">
                      <div
                        className={`rounded-2xl px-4 py-3 max-w-full break-words shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer ${
                          isOwn
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md'
                            : message.message_type === 'broadcast'
                            ? 'bg-gradient-to-br from-orange-100 to-orange-200 text-orange-900 dark:from-orange-900/30 dark:to-orange-800/30 dark:text-orange-100 rounded-bl-md'
                            : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-md border border-slate-200 dark:border-slate-600'
                        }`}
                        onClick={() => !isOwn && setReplyingTo(message)}
                      >
                        {message.subject && message.subject !== message.content.substring(0, 50) && (
                          <div className={`font-medium text-sm mb-2 ${isOwn ? 'text-blue-100' : 'text-slate-700 dark:text-slate-300'}`}>
                            {message.subject}
                          </div>
                        )}
                        <div className="text-sm leading-relaxed">{message.content}</div>
                      </div>

                      {/* Message actions */}
                      <div className={`absolute top-0 ${isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 px-2`}>
                        {!isOwn && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReplyingTo(message)}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                          >
                            <Reply className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Timestamp and status */}
                    <div className={`flex items-center gap-2 mt-1 px-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {formatTime(message.created_at)}
                      </span>
                      {isOwn && (
                        <span className="text-xs text-blue-400">✓</span>
                      )}
                      {!isOwn && (message.is_read === false || message.is_read === null) && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      )}
                    </div>
                  </div>

                  {/* Avatar for sent messages */}
                  {isOwn && (
                    <div className="flex-shrink-0">
                      <Avatar className="h-8 w-8 ring-2 ring-blue-200 dark:ring-blue-800">
                        <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                          You
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Reply indicator */}
        {replyingTo && (
          <div className="mx-6 mb-3 bg-slate-100 dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Reply className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Replying to {replyingTo.sender?.full_name || "System"}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(null)}
                className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              >
                ×
              </Button>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1 truncate bg-slate-50 dark:bg-slate-700/50 rounded px-2 py-1">
              {replyingTo.content}
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4">
          <div className="space-y-3">
            {/* User selection */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Send to:</span>
              </div>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="flex-1 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                  <SelectValue placeholder="Everyone (role-based)" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectItem value="role-based" className="hover:bg-slate-50 dark:hover:bg-slate-700">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-500" />
                      Everyone (role-based)
                    </div>
                  </SelectItem>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs">
                            {user.full_name?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{user.full_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {(user.role as any)?.name}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Message input */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={selectedUserId && selectedUserId !== 'role-based' ? "Send direct message..." : "Send to your team..."}
                  onKeyPress={(e) => e.key === 'Enter' && !sending && handleSendMessage()}
                  disabled={sending}
                  className="pr-12 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl"
                />
                {newMessage.trim() && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    Press Enter to send
                  </div>
                )}
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}