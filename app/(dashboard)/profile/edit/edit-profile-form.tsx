"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { Loader2, Upload, X, ArrowLeft, User, Mail, Shield } from "lucide-react"
import type { Profile } from "@/lib/types/database"

interface EditProfileFormProps {
  profile: Profile | null
}

export function EditProfileForm({ profile }: EditProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
  })
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const getInitials = (name?: string | null) => {
    if (!name) return "U"
    return name
      .split(' ')
      .filter(Boolean)
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Create image preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.full_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Full name is required",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) {
        throw error
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      })

      router.push('/profile')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">No profile found</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/profile')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </Button>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-4">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Edit Profile
            </span>
          </h1>
          <p className="text-muted-foreground mt-2">Update your account information</p>
        </div>

        <div className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-3">
          {/* Preview Sidebar */}
          <Card className="lg:col-span-1 overflow-hidden shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-28" />
            <CardContent className="relative px-6 pb-6">
              <div className="flex flex-col items-center -mt-12">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                  <AvatarImage src={imagePreview || ""} alt={profile.full_name || "User"} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-100 to-purple-100 text-blue-600">
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>

                <div className="text-center mt-3">
                  <div className="text-xl font-semibold text-gray-900">
                    {formData.full_name || "User"}
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <Shield className="w-4 h-4" />
                      {profile.role?.name || "Standard User"}
                    </Badge>
                  </div>
                </div>

                <Separator className="my-5" />

                <div className="w-full space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-medium">Email</div>
                      <div className="text-muted-foreground break-all">
                        {profile.email || "No email"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-medium">Member since</div>
                      <div className="text-muted-foreground">
                        {format(new Date(profile.created_at), "PPP")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Card */}
          <Card className="lg:col-span-2 shadow-lg border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Edit Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Picture Upload */}
                <Card className="border bg-white/70">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Upload className="w-5 h-5 text-blue-600" />
                      Profile Picture
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <Avatar className="h-20 w-20 border-2 border-white shadow-md">
                          <AvatarImage src={imagePreview || ""} alt={profile.full_name || "User"} />
                          <AvatarFallback className="text-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {getInitials(profile.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        {imagePreview && (
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-white hover:bg-destructive/90 shadow-md"
                            aria-label="Remove image"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-3">
                          Upload a new profile picture (optional)
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/gif"
                            onChange={handleImageChange}
                            className="hidden"
                            id="profile-image"
                            aria-label="Upload profile picture"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('profile-image')?.click()}
                            className="gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            Choose Image
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          JPG, PNG or GIF (max 5MB)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Editable Fields */}
                <Card className="border bg-white/70">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <User className="w-5 h-5 text-purple-600" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Read-only Fields */}
                <Card className="border bg-white/70">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Shield className="w-5 h-5 text-gray-600" />
                      Account Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <Input
                        value={profile.email || ''}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed here
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Account Type</Label>
                      <Input
                        value={profile.role?.name || 'Standard User'}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/profile')}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Profile'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}