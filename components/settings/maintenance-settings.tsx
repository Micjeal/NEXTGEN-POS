"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Activity,
  Database,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  HardDrive,
  Shield,
  Zap,
  FileText,
  Calendar,
  Play,
  Pause,
  Trash2
} from "lucide-react"
import { toast } from "sonner"

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'debug'
  message: string
  source: string
}

interface BackupSchedule {
  id: string
  name: string
  frequency: 'daily' | 'weekly' | 'monthly'
  time: string
  enabled: boolean
  lastRun?: string
  nextRun?: string
}

export function MaintenanceSettings() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [backups, setBackups] = useState<BackupSchedule[]>([])
  const [systemStatus, setSystemStatus] = useState({
    database: 'healthy',
    api: 'healthy',
    storage: 'healthy',
    lastBackup: '2024-01-15 14:30:00'
  })
  const [loading, setLoading] = useState(true)
  const [updateInfo, setUpdateInfo] = useState({
    currentVersion: '2.1.0',
    latestVersion: '2.1.0',
    hasUpdate: false,
    updateHistory: [],
    lastChecked: null as string | null
  })
  const [diagnostics, setDiagnostics] = useState({
    diskUsage: { used: '2.4 GB', total: '10 GB', percentage: 24 },
    memoryUsage: { used: '1.2 GB', total: '4 GB', percentage: 30 },
    cpuUsage: 15,
    uptime: '5 days, 3 hours'
  })

  // Fetch data on component mount
  useEffect(() => {
    fetchLogs()
    fetchSystemStatus()
    fetchBackups()
    fetchUpdateInfo()
    fetchDiagnostics()
  }, [])

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/maintenance/logs')
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    }
  }

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/maintenance/status')
      if (response.ok) {
        const data = await response.json()
        setSystemStatus(data.status)
      }
    } catch (error) {
      console.error('Failed to fetch system status:', error)
    }
  }

  const fetchBackups = async () => {
    try {
      const response = await fetch('/api/maintenance/backup')
      if (response.ok) {
        const data = await response.json()
        setBackups(data.schedules || [])
      }
    } catch (error) {
      console.error('Failed to fetch backups:', error)
    }
  }

  const fetchUpdateInfo = async () => {
    try {
      const response = await fetch('/api/maintenance/updates')
      if (response.ok) {
        const data = await response.json()
        setUpdateInfo(data)
      }
    } catch (error) {
      console.error('Failed to fetch update info:', error)
    }
  }

  const fetchDiagnostics = async () => {
    try {
      const response = await fetch('/api/maintenance/tools')
      if (response.ok) {
        const data = await response.json()
        setDiagnostics(data.diagnostics)
      }
    } catch (error) {
      console.error('Failed to fetch diagnostics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleManualBackup = async () => {
    toast.info("Starting manual backup...")
    try {
      const response = await fetch('/api/maintenance/backup', {
        method: 'POST'
      })
      if (response.ok) {
        const data = await response.json()
        toast.success(data.message)
        fetchSystemStatus() // Refresh system status to show new backup time
      } else {
        toast.error("Backup failed")
      }
    } catch (error) {
      toast.error("Backup failed")
    }
  }

  const handleSoftwareUpdate = async () => {
    toast.info("Checking for updates...")
    try {
      const response = await fetch('/api/maintenance/updates', {
        method: 'POST'
      })
      if (response.ok) {
        const data = await response.json()
        toast.success(data.message)
        fetchUpdateInfo() // Refresh update info
      } else {
        toast.error("Update failed")
      }
    } catch (error) {
      toast.error("Update failed")
    }
  }

  const handleClearLogs = async () => {
    try {
      const response = await fetch('/api/maintenance/logs', {
        method: 'DELETE'
      })
      if (response.ok) {
        setLogs([])
        toast.success("Logs cleared successfully!")
      } else {
        toast.error("Failed to clear logs")
      }
    } catch (error) {
      toast.error("Failed to clear logs")
    }
  }

  const handleAdminTool = async (action: string) => {
    toast.info(`Performing ${action.replace('_', ' ')}...`)
    try {
      const response = await fetch('/api/maintenance/tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      })
      if (response.ok) {
        const data = await response.json()
        toast.success(data.message)
        if (action === 'run_integrity_check') {
          if (data.issues && data.issues.length > 0) {
            toast.warning(`Issues found: ${data.issues.join(', ')}`)
          }
        }
      } else {
        toast.error(`${action.replace('_', ' ')} failed`)
      }
    } catch (error) {
      toast.error(`${action.replace('_', ' ')} failed`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="monitoring" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
          <TabsTrigger value="tools">Admin Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-6">
          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Status
              </CardTitle>
              <CardDescription>
                Real-time monitoring of system components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  {getStatusIcon(systemStatus.database)}
                  <div>
                    <p className="font-medium">Database</p>
                    <p className={`text-sm capitalize ${getStatusColor(systemStatus.database)}`}>
                      {systemStatus.database}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  {getStatusIcon(systemStatus.api)}
                  <div>
                    <p className="font-medium">API Services</p>
                    <p className={`text-sm capitalize ${getStatusColor(systemStatus.api)}`}>
                      {systemStatus.api}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  {getStatusIcon(systemStatus.storage)}
                  <div>
                    <p className="font-medium">Storage</p>
                    <p className={`text-sm capitalize ${getStatusColor(systemStatus.storage)}`}>
                      {systemStatus.storage}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                   <Clock className="h-4 w-4 text-blue-600" />
                   <div>
                     <p className="font-medium">Last Backup</p>
                     <p className="text-sm text-muted-foreground">
                       {new Date(systemStatus.lastBackup).toLocaleString()}
                     </p>
                   </div>
                 </div>
              </div>
            </CardContent>
          </Card>

          {/* System Logs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    System Logs
                  </CardTitle>
                  <CardDescription>
                    Recent system activities and events
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleClearLogs}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Logs
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Badge
                      variant={
                        log.level === 'error' ? 'destructive' :
                        log.level === 'warning' ? 'secondary' : 'default'
                      }
                      className="mt-0.5"
                    >
                      {log.level.toUpperCase()}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{log.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {log.timestamp}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {log.source}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backups" className="space-y-6">
          {/* Manual Backup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Manual Backup
              </CardTitle>
              <CardDescription>
                Create an immediate backup of your data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Button onClick={handleManualBackup}>
                  <Download className="h-4 w-4 mr-2" />
                  Start Backup
                </Button>
                <p className="text-sm text-muted-foreground">
                  This will create a full backup of your database and files
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Backup Schedules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Scheduled Backups
              </CardTitle>
              <CardDescription>
                Configure automatic backup schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {backups.map((backup) => (
                  <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-medium">{backup.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{backup.frequency.charAt(0).toUpperCase() + backup.frequency.slice(1)} at {backup.time}</span>
                        {backup.lastRun && (
                          <span>• Last: {backup.lastRun}</span>
                        )}
                        {backup.nextRun && (
                          <span>• Next: {backup.nextRun}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={backup.enabled ? "default" : "secondary"}>
                        {backup.enabled ? "Active" : "Disabled"}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="updates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Software Updates
              </CardTitle>
              <CardDescription>
                Keep your system up to date with the latest features and security patches
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Version */}
               <div className="flex items-center justify-between p-4 border rounded-lg">
                 <div>
                   <h4 className="font-medium">Current Version</h4>
                   <p className="text-sm text-muted-foreground">POS System v{updateInfo.currentVersion}</p>
                 </div>
                 <Badge variant={updateInfo.hasUpdate ? "destructive" : "default"}>
                   {updateInfo.hasUpdate ? "Update Available" : "Up to Date"}
                 </Badge>
               </div>

               {/* Update Actions */}
               <div className="flex items-center gap-4">
                 <Button onClick={handleSoftwareUpdate} disabled={updateInfo.hasUpdate}>
                   <RefreshCw className="h-4 w-4 mr-2" />
                   {updateInfo.hasUpdate ? "Install Update" : "Check for Updates"}
                 </Button>
                 <p className="text-sm text-muted-foreground">
                   Last checked: {updateInfo.lastChecked ? new Date(updateInfo.lastChecked).toLocaleString() : 'Never'}
                 </p>
               </div>

               {/* Update History */}
               <div className="space-y-3">
                 <h4 className="font-medium">Recent Updates</h4>
                 <div className="space-y-2">
                   {updateInfo.updateHistory.length > 0 ? updateInfo.updateHistory.map((update: any, index: number) => (
                     <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                       <CheckCircle className="h-4 w-4 text-green-600" />
                       <div>
                         <p className="text-sm font-medium">{update.description || 'Update applied'}</p>
                         <p className="text-xs text-muted-foreground">
                           v{update.version} - {new Date(update.date).toLocaleDateString()}
                         </p>
                       </div>
                     </div>
                   )) : (
                     <p className="text-sm text-muted-foreground">No recent updates</p>
                   )}
                 </div>
               </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Admin Tools
              </CardTitle>
              <CardDescription>
                Advanced maintenance and diagnostic tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cache Management */}
              <div className="space-y-3">
                <h4 className="font-medium">Cache Management</h4>
                <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={() => handleAdminTool('clear_cache')}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear Cache
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Clear application cache to resolve performance issues
                  </p>
                </div>
              </div>

              {/* Database Tools */}
              <div className="space-y-3">
                <h4 className="font-medium">Database Tools</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <Button variant="outline" onClick={() => handleAdminTool('optimize_database')}>
                    <Database className="h-4 w-4 mr-2" />
                    Optimize Database
                  </Button>
                  <Button variant="outline" onClick={() => handleAdminTool('run_integrity_check')}>
                    <Shield className="h-4 w-4 mr-2" />
                    Run Integrity Check
                  </Button>
                </div>
              </div>

              {/* System Diagnostics */}
              <div className="space-y-3">
                <h4 className="font-medium">System Diagnostics</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Disk Usage</p>
                      <p className="text-sm text-muted-foreground">{diagnostics.diskUsage.used} used of {diagnostics.diskUsage.total}</p>
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${diagnostics.diskUsage.percentage}%` }}></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Memory Usage</p>
                      <p className="text-sm text-muted-foreground">{diagnostics.memoryUsage.used} used of {diagnostics.memoryUsage.total}</p>
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${diagnostics.memoryUsage.percentage}%` }}></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">CPU Usage</p>
                      <p className="text-sm text-muted-foreground">{diagnostics.cpuUsage}%</p>
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${diagnostics.cpuUsage}%` }}></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">System Uptime</p>
                      <p className="text-sm text-muted-foreground">{diagnostics.uptime}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}