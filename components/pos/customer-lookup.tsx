"use client"

import { useState } from "react"
import { Search, User, UserPlus, Star, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { Customer } from "@/lib/types/database"

interface CustomerLookupProps {
  selectedCustomer: Customer | null
  onCustomerSelect: (customer: Customer | null) => void
}

export function CustomerLookup({ selectedCustomer, onCustomerSelect }: CustomerLookupProps) {
  const [searchPhone, setSearchPhone] = useState("")
  const [searchResults, setSearchResults] = useState<Customer[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showRegisterDialog, setShowRegisterDialog] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    full_name: "",
    phone: "",
    email: ""
  })

  const { toast } = useToast()
  const supabase = createClient()

  const searchCustomer = async () => {
    if (!searchPhone.trim()) return

    setIsSearching(true)
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("phone", searchPhone.trim())
        .eq("is_active", true)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error
      }

      if (data) {
        setSearchResults([data])
        onCustomerSelect(data)
        toast({
          title: "Customer Found",
          description: `Welcome back, ${data.full_name}!`,
        })
      } else {
        setSearchResults([])
        toast({
          title: "Customer Not Found",
          description: "Would you like to register this customer?",
          variant: "default",
        })
        setShowRegisterDialog(true)
      }
    } catch (error: any) {
      console.error('Search error:', error)
      toast({
        title: "Search Error",
        description: "Failed to search for customer",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const registerCustomer = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .insert({
          full_name: newCustomer.full_name,
          phone: newCustomer.phone || searchPhone,
          email: newCustomer.email || null,
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Customer Registered",
        description: `${data.full_name} has been registered successfully!`,
      })

      onCustomerSelect(data)
      setShowRegisterDialog(false)
      setNewCustomer({ full_name: "", phone: "", email: "" })
      setSearchPhone("")
    } catch (error: any) {
      console.error('Registration error:', error)
      toast({
        title: "Registration Failed",
        description: error?.message || "Failed to register customer",
        variant: "destructive",
      })
    }
  }

  const clearCustomer = () => {
    onCustomerSelect(null)
    setSearchPhone("")
    setSearchResults([])
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5" />
          Customer Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedCustomer ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-200">{selectedCustomer.full_name}</p>
                  <p className="text-sm text-green-600 dark:text-green-400">{selectedCustomer.phone}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="mb-1">
                  {selectedCustomer.membership_tier} member
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Total spent: UGX {selectedCustomer.total_spent?.toLocaleString() || '0'}
                </p>
              </div>
            </div>

            {/* Loyalty Points Display */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">0</div>
                <div className="text-sm text-blue-600 dark:text-blue-400">Loyalty Points</div>
              </div>
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {selectedCustomer.total_visits || 0}
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-400">Total Visits</div>
              </div>
            </div>

            <Button onClick={clearCustomer} variant="outline" className="w-full">
              Change Customer
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Customer Phone Number</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    placeholder="Enter phone number (e.g., +256700000000)"
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchCustomer()}
                    className="pl-9"
                  />
                </div>
                <Button onClick={searchCustomer} disabled={isSearching || !searchPhone.trim()}>
                  {isSearching ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowRegisterDialog(true)}
                variant="outline"
                className="flex-1"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Register New Customer
              </Button>
            </div>
          </div>
        )}

        {/* Customer Registration Dialog */}
        <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New Customer</DialogTitle>
              <DialogDescription>
                Add a new customer to the system for loyalty tracking and personalized service.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reg-name">Full Name</Label>
                <Input
                  id="reg-name"
                  value={newCustomer.full_name}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Enter customer's full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-phone">Phone Number</Label>
                <Input
                  id="reg-phone"
                  value={newCustomer.phone || searchPhone}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-email">Email (Optional)</Label>
                <Input
                  id="reg-email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowRegisterDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={registerCustomer} disabled={!newCustomer.full_name.trim()}>
                  Register Customer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}