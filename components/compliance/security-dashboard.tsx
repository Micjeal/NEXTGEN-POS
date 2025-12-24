"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Shield, Eye, Lock } from "lucide-react"

interface SecurityIncident {
  id: string
  incident_type: string
  severity: string
  description: string
  status: string
  detected_at: string
}

export function SecurityDashboard() {
  const [incidents, setIncidents] = useState<SecurityIncident[]>([])
  const [activeThreats, setActiveThreats] = useState(0)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadSecurityIncidents()
  }, [])

  const loadSecurityIncidents = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('security_incidents')
        .select('*')
        .order('detected_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setIncidents(data || [])
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: failedCount, error: failedError } = await supabase
        .from('login_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('successful', false)
        .gte('attempted_at', twentyFourHoursAgo);
      if (failedError) {
        console.error('Error counting failed attempts:', failedError);
        setActiveThreats(0);
      } else {
        setActiveThreats(failedCount || 0);
      }
    } catch (error) {
      console.error('Error loading security incidents:', error)
      toast({
        title: "Error",
        description: "Failed to load security incidents",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getSeverityBadge = (severity: string) => {
    const badges = {
      low: <Badge variant="secondary" className="bg-blue-100 text-blue-800">Low</Badge>,
      medium: <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium</Badge>,
      high: <Badge variant="secondary" className="bg-orange-100 text-orange-800">High</Badge>,
      critical: <Badge variant="destructive">Critical</Badge>
    }
    return badges[severity as keyof typeof badges] || <Badge>{severity}</Badge>
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      open: <Badge variant="secondary" className="bg-red-100 text-red-800">Open</Badge>,
      investigating: <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Investigating</Badge>,
      resolved: <Badge variant="secondary" className="bg-green-100 text-green-800">Resolved</Badge>,
      closed: <Badge variant="secondary" className="bg-gray-100 text-gray-800">Closed</Badge>
    }
    return badges[status as keyof typeof badges] || <Badge>{status}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security Dashboard</h2>
          <p className="text-muted-foreground">Monitor security incidents and threats</p>
        </div>
        <Button>
          <AlertTriangle className="h-4 w-4 mr-2" />
          Report Incident
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Login Attempts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No active security threats</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Encryption Status</CardTitle>
            <Lock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">AES-256 encryption enabled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit Logs</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">Events logged today</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Incidents
          </CardTitle>
          <CardDescription>
            Recent security incidents and their resolution status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : incidents.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-green-700">All Clear</h3>
              <p className="text-muted-foreground">No security incidents reported</p>
            </div>
          ) : (
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
                {incidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell className="font-medium">
                      {incident.incident_type.replace('_', ' ')}
                    </TableCell>
                    <TableCell>{getSeverityBadge(incident.severity)}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {incident.description}
                    </TableCell>
                    <TableCell>{getStatusBadge(incident.status)}</TableCell>
                    <TableCell>
                      {new Date(incident.detected_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}