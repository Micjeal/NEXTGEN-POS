"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Plus, Award, Users, TrendingUp, Gift, Settings, UserPlus, History } from "lucide-react"
import { TransactionHistory } from "./transaction-history"
import type { Customer, LoyaltyProgram, CustomerLoyaltyAccount } from "@/lib/types/database"

interface LoyaltyManagementProps {
  programs: LoyaltyProgram[]
  accounts: (CustomerLoyaltyAccount & {
    customer: Customer
    loyalty_program: LoyaltyProgram
  })[]
}

export function LoyaltyManagement({ programs: initialPrograms, accounts }: LoyaltyManagementProps) {
  const [isAddPointsOpen, setIsAddPointsOpen] = useState(false)
  const [isEnrollCustomerOpen, setIsEnrollCustomerOpen] = useState(false)
  const [isCreateProgramOpen, setIsCreateProgramOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<any>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [selectedProgramId, setSelectedProgramId] = useState<string>("")
  const [pointsToAdd, setPointsToAdd] = useState("")
  const [reason, setReason] = useState("")
  const [programName, setProgramName] = useState("")
  const [programDescription, setProgramDescription] = useState("")
  const [pointsPerCurrency, setPointsPerCurrency] = useState("1")
  const [redemptionRate, setRedemptionRate] = useState("0.01")
  const [isProcessing, setIsProcessing] = useState(false)
  const [availablePrograms, setAvailablePrograms] = useState(initialPrograms)
  const { toast } = useToast()

  // Fetch available programs
  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/loyalty/programs')
      if (!response.ok) {
        throw new Error('Failed to fetch programs')
      }
      const data = await response.json()
      if (data.programs) {
        setAvailablePrograms(data.programs)
        // Set default selected program to first active one
        if (data.programs.length > 0 && !selectedProgramId) {
          setSelectedProgramId(data.programs[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
      toast({
        title: "Error",
        description: "Failed to load loyalty programs",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    fetchPrograms()
  }, [])

  const handleAddPoints = async () => {
    if (!selectedAccount || !pointsToAdd || !reason) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch('/api/loyalty/accounts/add-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccount.id,
          points: parseInt(pointsToAdd),
          reason
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add points')
      }

      toast({
        title: "Success",
        description: `Added ${pointsToAdd} points to ${selectedAccount.customer.full_name}`
      })

      setIsAddPointsOpen(false)
      setSelectedAccount(null)
      setPointsToAdd("")
      setReason("")

      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Error adding points:', error)
      toast({
        title: "Error",
        description: "Failed to add points",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreateProgram = async () => {
    if (!programName || !pointsPerCurrency) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch('/api/loyalty/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: programName,
          description: programDescription,
          points_per_currency: parseFloat(pointsPerCurrency),
          redemption_rate: parseFloat(redemptionRate)
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create program')
      }

      toast({
        title: "Success",
        description: `Created loyalty program: ${programName}`
      })

      setIsCreateProgramOpen(false)
      setProgramName("")
      setProgramDescription("")
      setPointsPerCurrency("1")
      setRedemptionRate("0.01")

      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Error creating program:', error)
      toast({
        title: "Error",
        description: "Failed to create program",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEnrollCustomer = async () => {
    if (!selectedCustomer) {
      toast({
        title: "Error",
        description: "Please select a customer",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch('/api/loyalty/accounts/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          programId: selectedProgramId
        })
      })

      if (!response.ok) {
        let errorMessage = 'Failed to enroll customer'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          console.error('Error parsing response:', parseError)
          errorMessage = `Request failed with status ${response.status}`
        }
        throw new Error(errorMessage)
      }

      toast({
        title: "Success",
        description: `Enrolled ${selectedCustomer.full_name} in loyalty program`
      })

      setIsEnrollCustomerOpen(false)
      setSelectedCustomer(null)
      setSelectedProgramId("")

      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Error enrolling customer:', error)
      const errorMessage = error instanceof Error ? error.message : "Failed to enroll customer"

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'platinum': return 'bg-purple-100 text-purple-800'
      case 'gold': return 'bg-yellow-100 text-yellow-800'
      case 'silver': return 'bg-gray-100 text-gray-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Programs</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availablePrograms.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points Issued</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accounts.reduce((sum, acc) => sum + (acc.total_points_earned || 0), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points Redeemed</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accounts.reduce((sum, acc) => sum + (acc.total_points_redeemed || 0), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Dialog open={isCreateProgramOpen} onOpenChange={setIsCreateProgramOpen}>
          <DialogTrigger asChild>
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Create Program
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Loyalty Program</DialogTitle>
              <DialogDescription>
                Set up a new loyalty program for customers
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="programName">Program Name *</Label>
                <Input
                  id="programName"
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  placeholder="e.g., Premium Loyalty Program"
                />
              </div>
              <div>
                <Label htmlFor="programDescription">Description</Label>
                <Textarea
                  id="programDescription"
                  value={programDescription}
                  onChange={(e) => setProgramDescription(e.target.value)}
                  placeholder="Describe the loyalty program"
                />
              </div>
              <div>
                <Label htmlFor="pointsPerCurrency">Points per Currency Unit *</Label>
                <Input
                  id="pointsPerCurrency"
                  type="number"
                  step="0.01"
                  value={pointsPerCurrency}
                  onChange={(e) => setPointsPerCurrency(e.target.value)}
                  placeholder="1.0"
                />
                <p className="text-sm text-muted-foreground">Points earned per currency unit spent</p>
              </div>
              <div>
                <Label htmlFor="redemptionRate">Redemption Rate</Label>
                <Input
                  id="redemptionRate"
                  type="number"
                  step="0.01"
                  value={redemptionRate}
                  onChange={(e) => setRedemptionRate(e.target.value)}
                  placeholder="0.01"
                />
                <p className="text-sm text-muted-foreground">Currency value per point when redeeming</p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateProgramOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateProgram}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Creating...' : 'Create Program'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isEnrollCustomerOpen} onOpenChange={(open) => {
          setIsEnrollCustomerOpen(open)
          if (!open) {
            setSelectedCustomer(null)
            setSelectedProgramId("")
          }
        }}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <UserPlus className="h-4 w-4 mr-2" />
              Enroll Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enroll Customer in Loyalty Program</DialogTitle>
              <DialogDescription>
                Search and enroll a customer in the loyalty program
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Search Customer</Label>
                <Input
                  placeholder="Enter customer name, phone, or email"
                  onChange={async (e) => {
                    const searchTerm = e.target.value
                    if (searchTerm.length > 2) {
                      try {
                        const response = await fetch(`/api/customers?search=${encodeURIComponent(searchTerm)}&excludeEnrolled=true`)
                        const data = await response.json()
                        // For now, just set the first result
                        if (data.customers && data.customers.length > 0) {
                          setSelectedCustomer(data.customers[0])
                        }
                      } catch (error) {
                        console.error('Error searching customers:', error)
                      }
                    }
                  }}
                />
              </div>
              {selectedCustomer && (
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">{selectedCustomer.full_name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedCustomer.phone} • {selectedCustomer.email}
                  </p>
                </div>
              )}
              <div>
                <Label htmlFor="programSelect">Loyalty Program *</Label>
                <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a loyalty program" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePrograms.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEnrollCustomerOpen(false)
                    setSelectedCustomer(null)
                    setSelectedProgramId("")
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEnrollCustomer}
                  disabled={isProcessing || !selectedCustomer || !selectedProgramId}
                >
                  {isProcessing ? 'Enrolling...' : 'Enroll Customer'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loyalty Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Loyalty Accounts</CardTitle>
          <CardDescription>
            Manage customer loyalty points and view account details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Current Points</TableHead>
                <TableHead>Total Earned</TableHead>
                <TableHead>Total Redeemed</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{account.customer.full_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {account.customer.phone || account.customer.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{account.loyalty_program.name}</TableCell>
                  <TableCell>
                    <Badge className={getTierColor(account.tier)}>
                      {account.tier || 'bronze'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {account.current_points?.toLocaleString() || 0}
                  </TableCell>
                  <TableCell>{account.total_points_earned?.toLocaleString() || 0}</TableCell>
                  <TableCell>{account.total_points_redeemed?.toLocaleString() || 0}</TableCell>
                  <TableCell>
                    {account.updated_at
                      ? new Date(account.updated_at).toISOString().split('T')[0]
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog open={isAddPointsOpen && selectedAccount?.id === account.id} onOpenChange={(open) => {
                        setIsAddPointsOpen(open)
                        if (!open) setSelectedAccount(null)
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedAccount(account)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Points
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Loyalty Points</DialogTitle>
                            <DialogDescription>
                              Add points to {account.customer.full_name}'s account
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="points">Points to Add</Label>
                              <Input
                                id="points"
                                type="number"
                                value={pointsToAdd}
                                onChange={(e) => setPointsToAdd(e.target.value)}
                                placeholder="Enter points amount"
                              />
                            </div>
                            <div>
                              <Label htmlFor="reason">Reason</Label>
                              <Textarea
                                id="reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Enter reason for adding points"
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                onClick={() => setIsAddPointsOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleAddPoints}
                                disabled={isProcessing}
                              >
                                {isProcessing ? 'Adding...' : 'Add Points'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedAccount(account)}
                          >
                            <History className="h-4 w-4 mr-2" />
                            View History
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Loyalty Transaction History</DialogTitle>
                            <DialogDescription>
                              Transaction history for {account.customer.full_name}
                            </DialogDescription>
                          </DialogHeader>
                          <TransactionHistory accountId={account.id} />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {accounts.length === 0 && (
            <div className="text-center py-8">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No loyalty accounts found</h3>
              <p className="text-muted-foreground">
                Customers will automatically get loyalty accounts when they make purchases or are manually enrolled.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}