"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, User, Star, X, Phone, Mail } from "lucide-react"
import { formatCurrency } from "@/lib/utils/cart"

interface Customer {
  id: string
  phone: string | null
  email: string | null
  full_name: string
  membership_tier: string
  total_spent: number
  total_visits: number
  last_visit_date: string | null
}

interface LoyaltyInfo {
  current_points: number
  tier: string
  loyalty_program: {
    name: string
    points_per_currency: number
    redemption_rate: number
  }
}

interface CustomerLookupProps {
  onCustomerSelected: (customer: Customer, loyaltyInfo?: LoyaltyInfo) => void
  selectedCustomer?: Customer | null
  onClearCustomer: () => void
  currency: string
}

export function CustomerLookup({
  onCustomerSelected,
  selectedCustomer,
  onClearCustomer,
  currency
}: CustomerLookupProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<{
    customer: Customer | null
    registeredCustomer: any | null
    loyaltyInfo: LoyaltyInfo | null
    hasPurchased: boolean
  } | null>(null)
  const [error, setError] = useState("")

  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    setIsSearching(true)
    setError("")

    try {
      // Determine if search term is email or phone
      const isEmail = searchTerm.includes('@')
      const params = new URLSearchParams()
      if (isEmail) {
        params.set('email', searchTerm.trim())
      } else {
        params.set('phone', searchTerm.trim())
      }

      const response = await fetch(`/api/customers/lookup?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Search failed')
      }

      setSearchResults(data)
    } catch (err: any) {
      setError(err.message)
      setSearchResults(null)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectCustomer = () => {
    if (searchResults?.customer) {
      onCustomerSelected(searchResults.customer, searchResults.loyaltyInfo || undefined)
      setSearchTerm("")
      setSearchResults(null)
    } else if (searchResults?.registeredCustomer) {
      // Create pseudo customer for registered customer
      const customer: Customer = {
        id: searchResults.registeredCustomer.id,
        phone: searchResults.registeredCustomer.phone,
        email: searchResults.registeredCustomer.email,
        full_name: searchResults.registeredCustomer.full_name,
        membership_tier: 'bronze',
        total_spent: 0,
        total_visits: 0,
        last_visit_date: null
      }
      onCustomerSelected(customer, undefined)
      setSearchTerm("")
      setSearchResults(null)
    }
  }

  const handleClear = () => {
    setSearchTerm("")
    setSearchResults(null)
    setError("")
    onClearCustomer()
  }

  if (selectedCustomer) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Selected Customer
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-lg">{selectedCustomer.full_name}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {selectedCustomer.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {selectedCustomer.phone}
                  </span>
                )}
                {selectedCustomer.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {selectedCustomer.email}
                  </span>
                )}
              </div>
            </div>
            <Badge variant={
              selectedCustomer.membership_tier === 'platinum' ? 'default' :
              selectedCustomer.membership_tier === 'gold' ? 'secondary' :
              selectedCustomer.membership_tier === 'silver' ? 'outline' : 'outline'
            } className="capitalize">
              {selectedCustomer.membership_tier}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Spent</p>
              <p className="font-semibold">{formatCurrency(selectedCustomer.total_spent, currency)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Visits</p>
              <p className="font-semibold">{selectedCustomer.total_visits}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Search className="h-5 w-5" />
          Customer Lookup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="customer-search">Search by Phone or Email</Label>
          <div className="flex gap-2">
            <Input
              id="customer-search"
              placeholder="Enter phone number or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchTerm.trim()}
              variant="outline"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        {searchResults && (
          <div className="space-y-3">
            {searchResults.customer ? (
              <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-green-600" />
                    {searchResults.customer.full_name}
                  </h4>
                  <Badge variant={
                    searchResults.customer.membership_tier === 'platinum' ? 'default' :
                    searchResults.customer.membership_tier === 'gold' ? 'secondary' :
                    searchResults.customer.membership_tier === 'silver' ? 'outline' : 'outline'
                  } className="capitalize">
                    {searchResults.customer.membership_tier}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-muted-foreground">Total Spent</p>
                    <p className="font-semibold">{formatCurrency(searchResults.customer.total_spent, currency)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Visits</p>
                    <p className="font-semibold">{searchResults.customer.total_visits}</p>
                  </div>
                </div>

                {searchResults.loyaltyInfo && (
                  <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 mb-3">
                    <Star className="h-4 w-4" />
                    <span>{searchResults.loyaltyInfo.current_points.toLocaleString()} points available</span>
                  </div>
                )}

                <Button onClick={handleSelectCustomer} className="w-full">
                  Select This Customer
                </Button>
              </div>
            ) : searchResults.registeredCustomer ? (
              <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-yellow-600" />
                  <h4 className="font-semibold">{searchResults.registeredCustomer.full_name}</h4>
                  <Badge variant="outline">Registered - No Purchases Yet</Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-3">
                  This customer is registered but hasn't made any purchases yet.
                  They will be automatically added to the customer database when this sale is completed.
                </p>

                <Button onClick={handleSelectCustomer} className="w-full">
                  Select This Customer
                </Button>
              </div>
            ) : (
              <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800">
                <p className="text-sm text-muted-foreground">
                  No customer found. You can proceed with the sale as a guest, or ask the customer to register.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}