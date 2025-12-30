"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import {
  User, Mail, Phone, MapPin, Calendar, Edit, Save, X,
  Shield, Bell, Lock, CreditCard, CheckCircle, Loader2
} from "lucide-react"
import { useRouter } from "next/navigation"

export default function CustomerProfilePage() {
  const [customer, setCustomer] = useState<any>(null)
  const [registeredCustomer, setRegisteredCustomer] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: ''
  })
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push("/auth/customer-login")
        return
      }

      // Get registered customer
      const { data: regCustomer } = await supabase
        .from("registered_customers")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (!regCustomer) {
        router.push("/auth/customer-login")
        return
      }

      setRegisteredCustomer(regCustomer)

      // Get customer record
      const { data: customerData } = await supabase
        .from("customers")
        .select("*")
        .eq("registered_customer_id", regCustomer.id)
        .single()

      if (customerData) {
        setCustomer(customerData)
        setFormData({
          full_name: customerData.full_name || regCustomer.full_name || '',
          phone: customerData.phone || regCustomer.phone || '',
          date_of_birth: customerData.date_of_birth || '',
          gender: customerData.gender || '',
          address: customerData.address || ''
        })
      } else {
        // No customer record yet, use registered customer data
        setFormData({
          full_name: regCustomer.full_name || '',
          phone: regCustomer.phone || '',
          date_of_birth: '',
          gender: '',
          address: ''
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      // Update registered customer
      const { error: regError } = await supabase
        .from("registered_customers")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          updated_at: new Date().toISOString()
        })
        .eq("id", registeredCustomer.id)

      if (regError) throw regError

      // Update or create customer record
      if (customer) {
        const { error: custError } = await supabase
          .from("customers")
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            date_of_birth: formData.date_of_birth || null,
            gender: formData.gender || null,
            address: formData.address || null,
            updated_at: new Date().toISOString()
          })
          .eq("id", customer.id)

        if (custError) throw custError
      } else {
        // Create customer record
        const { error: createError } = await supabase
          .from("customers")
          .insert({
            registered_customer_id: registeredCustomer.id,
            full_name: formData.full_name,
            phone: formData.phone,
            email: registeredCustomer.email,
            date_of_birth: formData.date_of_birth || null,
            gender: formData.gender || null,
            address: formData.address || null,
            membership_tier: 'bronze',
            total_spent: 0,
            total_visits: 0
          })

        if (createError) throw createError
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      })

      // Reload profile data
      await loadProfile()
    } catch (error) {
      console.error('Error saving profile:', error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!registeredCustomer) {
    return null
  }

  const profileData = customer || registeredCustomer

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account information and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {profileData.full_name?.charAt(0) || 'U'}
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg">{profileData.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{profileData.email}</p>
                  {customer && (
                    <Badge variant="secondary" className="mt-2">
                      {customer.membership_tier} Member
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profileData.email}</span>
                </div>
                {profileData.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profileData.phone}</span>
                  </div>
                )}
                {profileData.date_of_birth && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {new Date(profileData.date_of_birth).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {(profileData.address || profileData.city) && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {[profileData.address, profileData.city].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    name="gender"
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                    value={formData.gender}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                    aria-label="Select gender"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter your address"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => loadProfile()}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive updates about your orders and rewards</p>
                    </div>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded"
                      aria-label="Enable email notifications"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Enable</Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Change Password</p>
                      <p className="text-sm text-muted-foreground">Update your account password</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Change</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Membership Status */}
          {customer && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Membership Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium capitalize">{customer.membership_tier} Member</p>
                    <p className="text-sm text-muted-foreground">
                      Total spent: UGX {customer.total_spent?.toLocaleString() || 0}
                    </p>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {customer.membership_tier}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}