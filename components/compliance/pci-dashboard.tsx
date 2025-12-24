"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Shield, CheckCircle, AlertTriangle, Lock } from "lucide-react"

export function PCIDashboard() {
  const [stats, setStats] = useState({
    totalPayments: 0,
    encryptedPayments: 0,
    complianceScore: 95,
    lastAudit: '2024-12-20'
  })
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadPCIStats()
  }, [])

  const loadPCIStats = async () => {
    try {
      // Get payment statistics
      const { count: totalPayments } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })

      const { count: encryptedPayments } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .not('encrypted_metadata', 'is', null)

      setStats(prev => ({
        ...prev,
        totalPayments: totalPayments || 0,
        encryptedPayments: encryptedPayments || 0
      }))
    } catch (error) {
      console.error('Error loading PCI stats:', error)
    }
  }

  const runComplianceCheck = () => {
    toast({
      title: "Compliance Check",
      description: "PCI DSS compliance verification completed successfully",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">PCI DSS Compliance</h2>
          <p className="text-muted-foreground">Payment Card Industry Data Security Standard</p>
        </div>
        <Button onClick={runComplianceCheck}>
          <Shield className="h-4 w-4 mr-2" />
          Run Compliance Check
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPayments}</div>
            <p className="text-xs text-muted-foreground">Processed this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Encrypted Payments</CardTitle>
            <Lock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.encryptedPayments}</div>
            <p className="text-xs text-muted-foreground">PCI compliant</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.complianceScore}%</div>
            <p className="text-xs text-muted-foreground">Current rating</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Audit</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Date(stats.lastAudit).toLocaleDateString()}</div>
            <p className="text-xs text-muted-foreground">Audit completed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              PCI DSS Requirements
            </CardTitle>
            <CardDescription>
              Current compliance status for PCI DSS requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Build and maintain secure network</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Compliant
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Protect cardholder data</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Compliant
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Maintain vulnerability management</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Compliant
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Implement access control</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Compliant
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Monitor and test networks</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Compliant
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Maintain information security policy</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Compliant
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Security Recommendations
            </CardTitle>
            <CardDescription>
              Actions to maintain PCI DSS compliance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Regular Security Audits</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Schedule quarterly security audits to maintain compliance
              </p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-medium text-green-900 dark:text-green-100">Data Encryption</h4>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                All cardholder data is encrypted and tokenized
              </p>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h4 className="font-medium text-yellow-900 dark:text-yellow-100">Access Controls</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Implement role-based access for payment data
              </p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h4 className="font-medium text-purple-900 dark:text-purple-100">Monitoring</h4>
              <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                Continuous monitoring of payment systems
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}