"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Shield,
  AlertTriangle,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  Users,
  Lock,
  MessageSquare
} from "lucide-react"

interface LoginAttempt {
  id: string
  email: string
  ip_address: string
  successful: boolean
  attempted_at: string
}

interface SecurityIncident {
  id: string
  incident_type: string
  severity: string
  description: string
  status: string
  detected_at: string
  ip_address?: string
}

interface AuditLog {
  id: string
  user_id?: string
  action: string
  table_name?: string
  created_at: string
}

interface Message {
  id: string
  subject: string
  content: string
  priority: string
  is_read: boolean
  created_at: string
}

export function SecurityDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState({
    totalLoginAttempts: 0,
    failedLoginAttempts: 0,
    securityIncidents: 0,
    auditLogs: 0,
    unreadMessages: 0
  })
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([])
  const [securityIncidents, setSecurityIncidents] = useState<SecurityIncident[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [securityMessages, setSecurityMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadSecurityData()
  }, [])

  const loadSecurityData = async () => {
    try {
      setLoading(true)

      // Load stats
      const [
        loginAttemptsResult,
        failedAttemptsResult,
        incidentsResult,
        auditResult,
        messagesResult
      ] = await Promise.all([
        supabase.from('login_attempts').select('*', { count: 'exact', head: true }),
        supabase.from('login_attempts').select('*', { count: 'exact', head: true }).eq('successful', false),
        supabase.from('security_incidents').select('*', { count: 'exact', head: true }),
        supabase.from('audit_logs').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('is_read', false).eq('recipient_role', 'admin')
      ])

      setStats({
        totalLoginAttempts: loginAttemptsResult.count || 0,
        failedLoginAttempts: failedAttemptsResult.count || 0,
        securityIncidents: incidentsResult.count || 0,
        auditLogs: auditResult.count || 0,
        unreadMessages: messagesResult.count || 0
      })

      // Load recent data
      const [
        recentAttempts,
        recentIncidents,
        recentAudits,
        recentMessages
      ] = await Promise.all([
        supabase.from('login_attempts').select('*').order('attempted_at', { ascending: false }).limit(10),
        supabase.from('security_incidents').select('*').order('detected_at', { ascending: false }).limit(10),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('messages').select('*').eq('recipient_role', 'admin').order('created_at', { ascending: false }).limit(10)
      ])

      setLoginAttempts(recentAttempts.data || [])
      setSecurityIncidents(recentIncidents.data || [])
      setAuditLogs(recentAudits.data || [])
      setSecurityMessages(recentMessages.data || [])

    } catch (error) {
      console.error('Error loading security data:', error)
      toast({
        title: "Error",
        description: "Failed to load security data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'investigating': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'open': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Shield className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-muted-foreground">Loading security data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Security Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Login Attempts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLoginAttempts}</div>
            <p className="text-xs text-muted-foreground">All login attempts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Attempts</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failedLoginAttempts}</div>
            <p className="text-xs text-muted-foreground">Suspicious activity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.securityIncidents}</div>
            <p className="text-xs text-muted-foreground">Reported incidents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit Logs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.auditLogs}</div>
            <p className="text-xs text-muted-foreground">System activities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.unreadMessages}</div>
            <p className="text-xs text-muted-foreground">Unread messages</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="login-attempts">Login Attempts</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Status
                </CardTitle>
                <CardDescription>
                  Current security posture and active monitoring
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Login Monitoring</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Incident Detection</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Audit Logging</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Brute Force Protection</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Recent Security Alerts
                </CardTitle>
                <CardDescription>
                  Latest security notifications and alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {securityMessages.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No security alerts</p>
                    </div>
                  ) : (
                    securityMessages.slice(0, 5).map((message) => (
                      <div key={message.id} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{message.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(message.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {!message.is_read && (
                          <Badge variant="secondary" className="text-xs">New</Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="login-attempts">
          <Card>
            <CardHeader>
              <CardTitle>Login Attempts</CardTitle>
              <CardDescription>
                Monitor authentication attempts and detect suspicious activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginAttempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell className="font-medium">{attempt.email}</TableCell>
                      <TableCell>{attempt.ip_address}</TableCell>
                      <TableCell>
                        <Badge variant={attempt.successful ? "secondary" : "destructive"}>
                          {attempt.successful ? "Success" : "Failed"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(attempt.attempted_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {loginAttempts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No login attempts recorded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents">
          <Card>
            <CardHeader>
              <CardTitle>Security Incidents</CardTitle>
              <CardDescription>
                Track and manage security incidents and breaches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Detected</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securityIncidents.map((incident) => (
                    <TableRow key={incident.id}>
                      <TableCell className="font-medium">{incident.incident_type}</TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(incident.severity)}>
                          {incident.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{incident.description}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(incident.status)}>
                          {incident.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(incident.detected_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {securityIncidents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No security incidents reported</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>
                System activity and change tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.user_id || 'System'}</TableCell>
                      <TableCell className="font-medium">{log.action}</TableCell>
                      <TableCell>{log.table_name || 'N/A'}</TableCell>
                      <TableCell>
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {auditLogs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No audit logs available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}