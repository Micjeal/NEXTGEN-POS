"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import type { Profile } from "@/lib/types/database"

interface User {
  name?: string | null
  email?: string | null
  image?: string | null
}

export function ProfileClient({ profile }: { profile: Profile | null }) {
  const router = useRouter()

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

  const handleEditProfile = () => {
    router.push('/profile/edit')
  }

  const handleChangePassword = () => {
    router.push('/profile/change-password')
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <p>No profile found</p>
      </div>
    )
  }

  const user: User = {
    name: profile.full_name,
    email: profile.email,
    image: null,
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20 border">
              <AvatarImage src={user.image || ''} alt={user.name || 'User'} />
              <AvatarFallback className="text-xl bg-muted">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-semibold">{user.name || 'User'}</h2>
              <p className="text-muted-foreground">{user.email || 'No email provided'}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
              <p className="text-sm">{user.email || 'No email provided'}</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Account Type</h3>
              <p className="text-sm">{profile.role?.name || 'Standard User'}</p>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <Button
              variant="outline"
              onClick={handleEditProfile}
            >
              Edit Profile
            </Button>
            <Button onClick={handleChangePassword}>
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}