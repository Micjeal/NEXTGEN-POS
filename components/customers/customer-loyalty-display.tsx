"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Award, Search, Star, TrendingUp, Users, Plus, Minus } from "lucide-react"
import { toast } from "sonner"

interface Customer {
  id: string
  full_name: string
  phone: string
  email: string | null
  membership_tier: string
  total_spent: number
  total_visits: number
  is_active: boolean
  loyalty_account?: Array<{
    current_points: number
    total_points_earned: number
    total_points_redeemed: number
    tier: string
    join_date: string
  }>
}

interface LoyaltyProgram {
  id: string
  name: string
  points_per_currency: number
  redemption_rate: number
  minimum_points_for_redemption: number
}

interface CustomerLoyaltyDisplayProps {
  customers: Customer[]
  loyaltyPrograms: LoyaltyProgram[]
}

export function CustomerLoyaltyDisplay({ customers, loyaltyPrograms }: CustomerLoyaltyDisplayProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [pointsToAdd, setPointsToAdd] = useState("")
  const [isAddingPoints, setIsAddingPoints] = useState(false)

  const filteredCustomers = customers.filter(customer =>
    customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      case 'gold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'silver': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
      default: return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    }
  }

  const handleAddPoints = async (customerId: string, points: number) => {
    if (!points || points <= 0) {
      toast.error("Please enter a valid number of points")
      return
    }

    setIsAddingPoints(true)
    try {
      const response = await fetch(`/api/loyalty/accounts/add-points`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId,
          points,
          description: "Manual points addition by admin"
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add points")
      }

      toast.success(`Added ${points} points successfully!`)
      setPointsToAdd("")
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || "Failed to add points")
    } finally {
      setIsAddingPoints(false)
    }
  }

  const totalPoints = customers.reduce((sum, customer) =>
    sum + (customer.loyalty_account?.[0]?.current_points || 0), 0)

  const activeMembers = customers.filter(customer =>
    customer.loyalty_account && customer.loyalty_account.length > 0).length

  return (
    <div className="space-y-6">
      {/* Loyalty Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Award className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{totalPoints.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Active in system</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{activeMembers}</div>
            <p className="text-xs text-muted-foreground">Enrolled in loyalty</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Avg Points</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">
              {activeMembers > 0 ? Math.round(totalPoints / activeMembers) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Per member</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Programs</CardTitle>
            <Star className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{loyaltyPrograms.length}</div>
            <p className="text-xs text-muted-foreground">Active programs</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Loyalty Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Customer Loyalty Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Current Tier</TableHead>
                <TableHead>Current Points</TableHead>
                <TableHead>Total Earned</TableHead>
                <TableHead>Total Redeemed</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => {
                  const loyaltyAccount = customer.loyalty_account?.[0]
                  return (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{customer.full_name}</div>
                          <div className="text-sm text-muted-foreground">{customer.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {loyaltyAccount ? (
                          <Badge className={getTierColor(loyaltyAccount.tier)}>
                            {loyaltyAccount.tier.charAt(0).toUpperCase() + loyaltyAccount.tier.slice(1)}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Not Enrolled</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {loyaltyAccount?.current_points || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        {loyaltyAccount?.total_points_earned || 0}
                      </TableCell>
                      <TableCell>
                        {loyaltyAccount?.total_points_redeemed || 0}
                      </TableCell>
                      <TableCell>
                        {loyaltyAccount ? (
                          new Date(loyaltyAccount.join_date).toLocaleDateString()
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              placeholder="Points"
                              value={selectedCustomer?.id === customer.id ? pointsToAdd : ""}
                              onChange={(e) => {
                                setPointsToAdd(e.target.value)
                                setSelectedCustomer(customer)
                              }}
                              className="w-20 h-8"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddPoints(customer.id, parseInt(pointsToAdd))}
                              disabled={isAddingPoints || !pointsToAdd}
                              className="h-8"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}