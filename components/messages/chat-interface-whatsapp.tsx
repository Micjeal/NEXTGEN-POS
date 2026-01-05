"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { MessageSquare, Send, Reply, AlertTriangle, Clock, Megaphone, MoreVertical, Users, Search, ArrowLeft, Check, CheckCheck, Smile, Paperclip, Mic, Phone, Video, Info, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { Message } from "@/lib/types/database"
import { formatDistanceToNow, format } from "date-fns"

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
  const [selectedChat, setSelectedChat] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showEmoji, setShowEmoji] = useState(false)
  const [showAttach, setShowAttach] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [showChatInfo, setShowChatInfo] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  useEffect(() => {
    // Simulate online status
    const interval = setInterval(() => {
      setOnlineUsers(new Set(availableUsers.slice(0, 3).map(u => u.id)))
    }, 5000)
    return () => clearInterval(interval)
  }, [availableUsers])

  const fetchUsers = async () => {
    try {
      console.log('Fetching users... userId:', userId)
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role:roles(name)")
        .neq("id", userId)
        .order("full_name")

      if (error) {
        console.error('Supabase profiles query error:', error)
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

      const { data: profile } = await supabase
        .from("profiles")
        .select("role:roles(name)")
        .eq("id", user.id)
        .single()

      setUserRole((profile as any)?.role?.name || "cashier")

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`recipient_id.eq.${user.id},recipient_role.in.(admin,manager,cashier),sender_id.eq.${user.id},message_type.eq.broadcast`)
        .order("created_at", { ascending: true })
        .limit(100)

      if (error) throw error

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
            const profileMap = profiles.reduce((acc, profile) => {
              acc[profile.id] = profile
              return acc
            }, {} as Record<string, any>)

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
        const err = error as any
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
      if (!userId) {
        throw new Error('User not authenticated')
      }

      const messageData: any = {
        sender_id: userId,
        subject: newMessage.substring(0, 50),
        content: newMessage,
        priority: 'normal',
      }

      if (selectedUserId && selectedUserId !== 'role-based') {
        messageData.recipient_id = selectedUserId
        messageData.message_type = 'direct'
      } else {
        messageData.message_type = 'role_based'
        messageData.recipient_role = userRole === 'admin' ? 'manager' : userRole === 'manager' ? 'cashier' : 'manager'
      }

      if (replyingTo) {
        messageData.parent_message_id = replyingTo.id
      }

      const { data, error } = await supabase
        .from("messages")
        .insert(messageData)
        .select("*")
        .single()

      if (error) {
        const err = error as any
        const isTableNotFound = err.message?.includes('relation "public.messages" does not exist') ||
            err.message?.includes('does not exist') ||
            err.code === '42P01' ||
            (!err.message && Object.keys(err).length === 0)

        if (isTableNotFound) {
          setSetupNeeded(true)
          throw new Error('Messages table not found. Please run the database setup.')
        }
        throw error
      }

      const { data: senderProfile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single()

      if (!profileError && senderProfile) {
        data.sender = senderProfile
      }

      setMessages(prev => [...prev, data as Message])
      setNewMessage("")
      setReplyingTo(null)

      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      })

    } catch (error: any) {
      console.error('Error sending message:', error)
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

  const emojis = ['😀', '😂', '❤️', '👍', '🎉', '🔥', '😎', '🤔']

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  }

  const formatChatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return format(date, 'HH:mm')
    } else if (diffInHours < 24 * 7) {
      return format(date, 'EEE')
    } else {
      return format(date, 'MMM d')
    }
  }

  const handleFileAttach = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Handle file upload logic here
      toast({
        title: "File Attached",
        description: `${file.name} attached to message`,
      })
      setShowAttach(false)
    }
  }

  const handleVoiceRecord = () => {
    if (isRecording) {
      // Stop recording and send voice message
      setIsRecording(false)
      toast({
        title: "Voice Message",
        description: "Voice message sent",
      })
    } else {
      // Start recording
      setIsRecording(true)
      setTimeout(() => setIsRecording(false), 3000) // Auto-stop after 3 seconds for demo
    }
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
        await fetchMessages()
      } else {
        toast({
          title: "Setup Failed",
          description: result.message || "Please run the SQL manually in Supabase.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Setup Error",
        description: "Failed to run setup. Please check your Supabase connection.",
        variant: "destructive",
      })
    }
  }

  // Group messages by sender/recipient for chat list
  const chatList = availableUsers.map(user => {
    const userMessages = messages.filter(msg => 
      (msg.sender_id === user.id || msg.recipient_id === user.id) && msg.message_type !== 'broadcast'
    )
    const lastMessage = userMessages[userMessages.length - 1]
    const unreadCount = userMessages.filter(msg => !msg.is_read && msg.sender_id !== userId).length
    
    return {
      ...user,
      lastMessage,
      unreadCount,
      messages: userMessages
    }
  }).filter(chat => chat.lastMessage).sort((a, b) => 
    new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
  )

  const filteredChatList = chatList.filter(chat =>
    chat.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const currentChatMessages = selectedChat 
    ? messages.filter(msg => 
        (msg.sender_id === selectedChat.id || msg.recipient_id === selectedChat.id) && msg.message_type !== 'broadcast'
      ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : messages.filter(msg => msg.message_type === 'broadcast' || !msg.recipient_id)

  if (setupNeeded) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Setup Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-600">
              Your messaging system needs to be set up. We'll create the necessary database tables.
            </p>
            <Button onClick={runSetup} className="w-full bg-green-500 hover:bg-green-600">
              Set Up Messaging System
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-100 flex overflow-hidden">
      {/* Mobile: Show chat list when no chat selected */}
      <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-96 bg-white border-r border-gray-200 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Team Chat</h1>
                <p className="text-sm text-gray-500">Real-time messaging</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Users className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200 focus:border-green-500"
            />
          </div>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {/* Team Chat Option */}
            <div
              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                !selectedChat ? 'bg-green-50 border border-green-200 shadow-sm' : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedChat(null)}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-xs text-white font-bold">{availableUsers.length + 1}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 truncate">Team Chat</p>
                    <span className="text-xs text-gray-500">
                      {messages.length > 0 ? formatChatTime(messages[messages.length - 1].created_at) : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-500 truncate">
                      {messages.length > 0 ? messages[messages.length - 1].content.substring(0, 35) + '...' : 'No messages yet'}
                    </p>
                    {messages.filter(m => !m.is_read && m.sender_id !== userId).length > 0 && (
                      <Badge className="bg-green-500 text-white text-xs rounded-full">
                        {messages.filter(m => !m.is_read && m.sender_id !== userId).length}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-2" />

            {/* Individual Chats */}
            {filteredChatList.map((chat) => (
              <div
                key={chat.id}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedChat?.id === chat.id ? 'bg-green-50 border border-green-200 shadow-sm' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedChat(chat)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gray-200 text-gray-600 font-medium">
                        {chat.full_name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {onlineUsers.has(chat.id) && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 truncate">{chat.full_name}</p>
                      <span className="text-xs text-gray-500">
                        {formatChatTime(chat.lastMessage.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-500 truncate">
                        {chat.lastMessage.content.substring(0, 35) + '...'}
                      </p>
                      {chat.unreadCount > 0 && (
                        <Badge className="bg-green-500 text-white text-xs rounded-full">
                          {chat.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className={`${selectedChat ? 'flex' : 'hidden md:flex'} flex-1 flex flex-col bg-white`}>
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile back button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setSelectedChat(null)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              {selectedChat ? (
                <>
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gray-200 text-gray-600 font-medium">
                        {selectedChat.full_name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {onlineUsers.has(selectedChat.id) && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedChat.full_name}</p>
                    <p className="text-sm text-gray-500">
                      {onlineUsers.has(selectedChat.id) ? 'Active now' : 'Offline'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Team Chat</p>
                    <p className="text-sm text-gray-500">
                      {availableUsers.filter(u => onlineUsers.has(u.id)).length + 1} online
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Phone className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Video className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900"
                onClick={() => setShowChatInfo(!showChatInfo)}
              >
                <Info className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 bg-gray-50">
          <div className="flex flex-col p-4 space-y-4">
            {currentChatMessages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center">
                <div>
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No messages yet</p>
                  <p className="text-sm text-gray-400 mt-2">Start the conversation with a friendly hello!</p>
                </div>
              </div>
            ) : (
              currentChatMessages.map((message, index) => {
                const isOwn = isOwnMessage(message)
                const showAvatar = index === 0 || currentChatMessages[index - 1].sender_id !== message.sender_id

                return (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                    onClick={() => (message.is_read === false || message.is_read === null) && !isOwn && markAsRead(message.id)}
                  >
                    {!isOwn && showAvatar && (
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback className="bg-gray-200 text-gray-600 text-xs font-medium">
                          {message.sender?.full_name?.charAt(0)?.toUpperCase() || "S"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    {!isOwn && !showAvatar && <div className="w-8" />}
                    
                    <div className={`max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'}`}>
                      {!isOwn && showAvatar && (
                        <p className="text-xs text-gray-500 mb-1 font-medium">
                          {message.sender?.full_name || "System"}
                        </p>
                      )}
                      <div
                        className={`px-4 py-2 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
                          isOwn
                            ? 'bg-green-500 text-white rounded-br-sm'
                            : 'bg-white text-gray-900 rounded-bl-sm border border-gray-200'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                      <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-xs text-gray-500">
                          {formatTime(message.created_at)}
                        </span>
                        {isOwn && (
                          <span className="text-green-500">
                            {message.is_read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                          </span>
                        )}
                      </div>
                    </div>

                    {isOwn && showAvatar && (
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback className="bg-green-500 text-white text-xs font-medium">
                          You
                        </AvatarFallback>
                      </Avatar>
                    )}
                    {isOwn && !showAvatar && <div className="w-8" />}
                  </div>
                )
              })
            )}
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2 justify-start">
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback className="bg-gray-200 text-gray-600 text-xs font-medium">
                    T
                  </AvatarFallback>
                </Avatar>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Reply indicator */}
        {replyingTo && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between bg-white rounded-lg p-2 border border-gray-200">
              <div className="flex items-center gap-2">
                <Reply className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">
                  Replying to {replyingTo.sender?.full_name || "System"}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(null)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="space-y-3">
            {/* User selection */}
            <div className="flex items-center gap-2">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="flex-1 bg-gray-50 border-gray-200">
                <SelectValue placeholder="Send to team" />
                  <SelectValue placeholder="Send to team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="role-based">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Team (role-based)
                    </div>
                  </SelectItem>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs">
                            {user.full_name?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{user.full_name}</span>
                        {onlineUsers.has(user.id) && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Emoji picker */}
            {showEmoji && (
              <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-lg mb-3">
                <div className="grid grid-cols-8 gap-1">
                  {emojis.map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="sm"
                      className="text-lg hover:bg-gray-100"
                      onClick={() => {
                        setNewMessage(newMessage + emoji)
                        setShowEmoji(false)
                      }}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Message input */}
            <div className="flex gap-2">
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setShowEmoji(!showEmoji)}
                >
                  <Smile className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileAttach}
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  aria-label="Attach file to message"
                />
              </div>
              
              <div className="flex-1 relative">
                <Input
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value)
                    setIsTyping(e.target.value.length > 0)
                    setTimeout(() => setIsTyping(false), 1000)
                  }}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === 'Enter' && !sending && handleSendMessage()}
                  disabled={sending}
                  className="bg-gray-50 border-gray-200 focus:border-green-500 pr-10"
                />
                {newMessage.trim() && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    Press Enter to send
                  </div>
                )}
              </div>
              
              {newMessage.trim() ? (
                <Button
                  onClick={handleSendMessage}
                  disabled={sending}
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`text-gray-500 hover:text-gray-700 ${isRecording ? 'text-red-500' : ''}`}
                  onClick={handleVoiceRecord}
                >
                  <Mic className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Info Sidebar (Desktop) */}
      {showChatInfo && selectedChat && (
        <div className="hidden md:flex w-80 bg-white border-l border-gray-200 flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Chat Info</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowChatInfo(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="p-4">
            <div className="text-center mb-6">
              <Avatar className="h-20 w-20 mx-auto mb-3">
                <AvatarFallback className="bg-gray-200 text-gray-600 text-xl font-medium">
                  {selectedChat.full_name?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h4 className="font-semibold text-gray-900 text-lg">{selectedChat.full_name}</h4>
              <p className="text-sm text-gray-500">
                {onlineUsers.has(selectedChat.id) ? 'Active now' : 'Offline'}
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Role</span>
                <Badge variant="outline">{(selectedChat.role as any)?.name || 'User'}</Badge>
              </div>
              <Separator />
              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-2">Shared Media</h5>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-square bg-gray-100 rounded-lg"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
