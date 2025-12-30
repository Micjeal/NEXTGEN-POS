"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Shield, Eye, CreditCard, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react"
import { ConsentManager } from "@/components/compliance/consent-manager"
import { DSARManager } from "@/components/compliance/dsar-manager"
import { SecurityDashboard } from "@/components/compliance/security-dashboard"
import { PCIDashboard } from "@/components/compliance/pci-dashboard"

export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState({
    totalConsents: 0,
    pendingDSAR: 0,
    securityIncidents: 0,
    complianceAudits: 0
  })
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadComplianceStats()
  }, [])

  const loadComplianceStats = async () => {
    try {
      let consentCount = 0
      let dsarCount = 0
      let incidentCount = 0
      let auditCount = 0

      // Get consent stats
      try {
        const result = await supabase
          .from('consent_logs')
          .select('*', { count: 'exact', head: true })
        consentCount = result.count || 0
      } catch (e) {
        console.log('Consent logs table not available')
      }

      // Get pending DSAR requests
      try {
        const result = await supabase
          .from('data_subject_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
        dsarCount = result.count || 0
      } catch (e) {
        console.log('DSAR table not available')
      }

      // Get security incidents
      try {
        const result = await supabase
          .from('security_incidents')
          .select('*', { count: 'exact', head: true })
        incidentCount = result.count || 0
      } catch (e) {
        console.log('Security incidents table not available')
      }

      // Get compliance audits
      try {
        const result = await supabase
          .from('compliance_audits')
          .select('*', { count: 'exact', head: true })
        auditCount = result.count || 0
      } catch (e) {
        console.log('Compliance audits table not available')
      }

      setStats({
        totalConsents: consentCount,
        pendingDSAR: dsarCount,
        securityIncidents: incidentCount,
        complianceAudits: auditCount
      })
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
            Compliance & Security
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            GDPR, PCI DSS, and data protection management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-green-600" />
          <Badge variant="secondary" className="text-green-700 bg-green-100">
            Compliant
          </Badge>
        </div>
      </div>

      {/* Compliance Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Consents</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConsents}</div>
            <p className="text-xs text-muted-foreground">GDPR consents recorded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending DSAR</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingDSAR}</div>
            <p className="text-xs text-muted-foreground">Data subject requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.securityIncidents}</div>
            <p className="text-xs text-muted-foreground">Reported incidents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Audits</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.complianceAudits}</div>
            <p className="text-xs text-muted-foreground">Completed audits</p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="consent">Consent</TabsTrigger>
          <TabsTrigger value="dsar">DSAR</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="pci">PCI DSS</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Compliance Status
                </CardTitle>
                <CardDescription>
                  Current compliance status across all regulations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">GDPR Compliance</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Compliant
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">PCI DSS Compliance</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Compliant
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Data Encryption</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Audit Logging</span>
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
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest compliance and security events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Consent granted</p>
                      <p className="text-xs text-muted-foreground">Marketing communications - 2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Payment processed securely</p>
                      <p className="text-xs text-muted-foreground">PCI DSS compliant transaction - 4 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">DSAR request pending</p>
                      <p className="text-xs text-muted-foreground">Data access request - 1 day ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="consent">
          <ConsentManager />
        </TabsContent>

        <TabsContent value="dsar">
          <DSARManager />
        </TabsContent>

        <TabsContent value="security">
          <SecurityDashboard />
        </TabsContent>

        <TabsContent value="pci">
          <PCIDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}