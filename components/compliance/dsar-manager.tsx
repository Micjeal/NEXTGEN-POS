"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Clock, CheckCircle, XCircle, Download, Plus } from "lucide-react"

interface DSARRequest {
  id: string
  request_type: string
  status: string
  requested_at: string
  completed_at?: string
  notes?: string
  customers?: {
    full_name: string
    email: string
    phone: string
  }
}

export function DSARManager() {
  const [dsarRequests, setDsarRequests] = useState<DSARRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showResponseDialog, setShowResponseDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<DSARRequest | null>(null)
  const [responseData, setResponseData] = useState("")
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadDSARRequests()
  }, [selectedStatus])

  const loadDSARRequests = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('data_subject_requests')
        .select(`
          *,
          customers (
            full_name,
            email,
            phone
          )
        `)
        .order('requested_at', { ascending: false })

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus)
      }

      const { data, error } = await query

      if (error) throw error
      setDsarRequests(data || [])
    } catch (error) {
      console.error('Error loading DSAR requests:', error)
      toast({
        title: "Error",
        description: "Failed to load DSAR requests",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const updateDSARStatus = async (requestId: string, status: string, responseData?: string) => {
    try {
      const updateData: any = { status }

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString()
        updateData.response_data = responseData ? { response: responseData } : null
      }

      const { error } = await supabase
        .from('data_subject_requests')
        .update(updateData)
        .eq('id', requestId)

      if (error) throw error

      toast({
        title: "Success",
        description: `DSAR request ${status}`,
      })

      loadDSARRequests()
      setShowResponseDialog(false)
      setSelectedRequest(null)
      setResponseData("")
    } catch (error) {
      console.error('Error updating DSAR:', error)
      toast({
        title: "Error",
        description: "Failed to update DSAR request",
        variant: "destructive"
      })
    }
  }

  const getRequestTypeLabel = (type: string) => {
    const labels = {
      access: "Access Data",
      rectification: "Rectify Data",
      erasure: "Erase Data",
      restriction: "Restrict Processing",
      portability: "Data Portability",
      objection: "Object to Processing"
    }
    return labels[type as keyof typeof labels] || type
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>,
      in_progress: <Badge variant="secondary" className="bg-blue-100 text-blue-800">In Progress</Badge>,
      completed: <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>,
      rejected: <Badge variant="destructive">Rejected</Badge>
    }
    return badges[status as keyof typeof badges] || <Badge>{status}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">DSAR Management</h2>
          <p className="text-muted-foreground">Handle Data Subject Access Requests</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New DSAR
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Data Subject Access Requests
          </CardTitle>
          <CardDescription>
            Manage GDPR data subject access requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Request Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dsarRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.customers?.full_name}</div>
                        <div className="text-sm text-muted-foreground">{request.customers?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getRequestTypeLabel(request.request_type)}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {new Date(request.requested_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {request.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateDSARStatus(request.id, 'in_progress')}
                          >
                            Start
                          </Button>
                        )}
                        {request.status === 'in_progress' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRequest(request)
                                setShowResponseDialog(true)
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateDSARStatus(request.id, 'rejected')}
                              className="text-red-600"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {request.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {/* Download response */}}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Complete DSAR Request</DialogTitle>
            <DialogDescription>
              Provide response data for the data subject access request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRequest && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium">Request Details</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedRequest.customers?.full_name} - {getRequestTypeLabel(selectedRequest.request_type)}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Response Data</label>
              <Textarea
                value={responseData}
                onChange={(e) => setResponseData(e.target.value)}
                placeholder="Enter the data or response for this DSAR request..."
                className="mt-2"
                rows={6}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowResponseDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => selectedRequest && updateDSARStatus(selectedRequest.id, 'completed', responseData)}
                disabled={!responseData.trim()}
              >
                Complete Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add DSAR Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create DSAR Request</DialogTitle>
            <DialogDescription>
              Manually create a data subject access request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              DSAR requests are typically created through customer portals or direct requests.
              Manual creation should only be used for documentation purposes.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button disabled>
                Create Request (Coming Soon)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}