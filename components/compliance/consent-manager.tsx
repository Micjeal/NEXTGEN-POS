"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, CheckCircle, XCircle, Clock, Plus } from "lucide-react"

interface ConsentLog {
  id: string
  consent_type: string
  consent_given: boolean
  consent_text: string
  ip_address: string
  consent_date: string
  withdrawn_date?: string
  user_id?: string
  customer_id?: string
}

export function ConsentManager() {
  const [consents, setConsents] = useState<ConsentLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadConsents()
  }, [selectedType])

  const loadConsents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedType !== 'all') {
        params.append('type', selectedType)
      }

      const response = await fetch(`/api/consent?${params.toString()}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      if (result.error) {
        throw new Error(result.error)
      }

      setConsents(result.data || [])
    } catch (error) {
      console.error('Error loading consents:', error)
      toast({
        title: "Error",
        description: "Failed to load consent records",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const updateConsent = async (consentId: string, consentGiven: boolean) => {
    try {
      const response = await fetch('/api/consent', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consentId,
          consentGiven,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "Success",
        description: `Consent ${consentGiven ? 'restored' : 'withdrawn'}`,
      })

      loadConsents()
    } catch (error) {
      console.error('Error updating consent:', error)
      toast({
        title: "Error",
        description: "Failed to update consent",
        variant: "destructive"
      })
    }
  }

  const getConsentTypeLabel = (type: string) => {
    const labels = {
      marketing: "Marketing",
      data_processing: "Data Processing",
      cookies: "Cookies",
      third_party: "Third Party"
    }
    return labels[type as keyof typeof labels] || type
  }

  const getStatusBadge = (consent: ConsentLog) => {
    if (consent.withdrawn_date) {
      return <Badge variant="destructive">Withdrawn</Badge>
    }
    return consent.consent_given ?
      <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge> :
      <Badge variant="secondary">Inactive</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Consent Management</h2>
          <p className="text-muted-foreground">Track and manage GDPR consent records</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="data_processing">Data Processing</SelectItem>
              <SelectItem value="cookies">Cookies</SelectItem>
              <SelectItem value="third_party">Third Party</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Consent
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Consent Records
          </CardTitle>
          <CardDescription>
            View and manage all consent records in the system
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
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consents.map((consent) => (
                  <TableRow key={consent.id}>
                    <TableCell className="font-medium">
                      {getConsentTypeLabel(consent.consent_type)}
                    </TableCell>
                    <TableCell>{getStatusBadge(consent)}</TableCell>
                    <TableCell className="font-mono text-sm">{consent.ip_address}</TableCell>
                    <TableCell>
                      {new Date(consent.consent_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {consent.consent_given ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateConsent(consent.id, false)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Withdraw
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateConsent(consent.id, true)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Restore
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

      {/* Add Consent Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Consent Record</DialogTitle>
            <DialogDescription>
              Manually add a consent record for compliance tracking
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Consent records are typically created automatically through user interactions.
              Manual creation should only be used for compliance documentation purposes.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button disabled>
                Add Record (Coming Soon)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}