"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Shield, Eye, CreditCard, AlertTriangle, CheckCircle, XCircle, Clock, ShoppingCart, Users, Package } from "lucide-react"
import { SecurityDashboard } from "@/components/compliance/security-dashboard"
import { PCIDashboard } from "@/components/compliance/pci-dashboard"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface LoginAttempt {
  id: string
  email: string
  ip_address: string
  successful: boolean
  attempted_at: string
}

export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState({
    totalLoginAttempts: 0,
    failedLoginAttempts: 0,
    securityIncidents: 0,
    auditLogs: 0,
    unreadMessages: 0,
    totalSales: 0,
    totalCustomers: 0,
    totalProducts: 0
  })
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([])
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadComplianceStats()
  }, [])

  const loadComplianceStats = async () => {
    try {
      const response = await fetch('/api/insights')
      if (!response.ok) {
        throw new Error('Failed to fetch compliance data')
      }
      const data = await response.json()

      setStats(data.stats)
      setLoginAttempts(data.loginAttempts)
    } catch (error) {
      console.error('Error loading compliance stats:', error)
      toast({
        title: "Error",
        description: "Failed to load compliance statistics",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Security Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Monitor authentication, incidents, and system security
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-green-600" />
          <Badge variant="secondary" className="text-green-700 bg-green-100">
            Compliant
          </Badge>
        </div>
      </div>

      {/* Security Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Login Attempts</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLoginAttempts}</div>
            <p className="text-xs text-muted-foreground">Total authentication attempts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failedLoginAttempts}</div>
            <p className="text-xs text-muted-foreground">Suspicious activity detected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.securityIncidents}</div>
            <p className="text-xs text-muted-foreground">Reported security events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit Logs</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.auditLogs}</div>
            <p className="text-xs text-muted-foreground">System activity records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.unreadMessages}</div>
            <p className="text-xs text-muted-foreground">Unread security messages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
            <p className="text-xs text-muted-foreground">Completed transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Registered customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Available products</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="security">Security Dashboard</TabsTrigger>
          <TabsTrigger value="pci">PCI DSS</TabsTrigger>
          <TabsTrigger value="logins">Login Monitoring</TabsTrigger>
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
                  <AlertTriangle className="h-5 w-5" />
                  Recent Security Events
                </CardTitle>
                <CardDescription>
                  Latest security incidents and authentication attempts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.failedLoginAttempts > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Failed login attempts detected</p>
                        <p className="text-xs text-muted-foreground">{stats.failedLoginAttempts} suspicious attempts in the last 24h</p>
                      </div>
                    </div>
                  )}
                  {stats.securityIncidents > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Security incidents reported</p>
                        <p className="text-xs text-muted-foreground">{stats.securityIncidents} incidents require attention</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">System monitoring active</p>
                      <p className="text-xs text-muted-foreground">All security systems operational</p>
                    </div>
                  </div>
                  {stats.unreadMessages > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Security alerts pending</p>
                        <p className="text-xs text-muted-foreground">{stats.unreadMessages} unread security messages</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <SecurityDashboard />
        </TabsContent>

        <TabsContent value="pci">
          <PCIDashboard />
        </TabsContent>

        <TabsContent value="logins">
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
                  <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No login attempts recorded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}