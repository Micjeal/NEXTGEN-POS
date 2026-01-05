"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { Mail, User, Calendar, Shield, Edit, Lock } from "lucide-react"
import { format } from "date-fns"
import { useEffect } from "react"
import AOS from "aos"
import "aos/dist/aos.css"
import type { Profile } from "@/lib/types/database"

interface User {
  name?: string | null
  email?: string | null
  image?: string | null
}

export function ProfileClient({ profile }: { profile: Profile | null }) {
  const router = useRouter()

  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      offset: 50,
    })
  }, [])

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
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">No profile found</CardContent>
        </Card>
      </div>
    )
  }

  const user: User = {
    name: profile.full_name,
    email: profile.email,
    image: null,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8" data-aos="fade-down">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              My Profile
            </span>
          </h1>
          <p className="text-muted-foreground mt-2">Manage your account information and settings</p>
        </div>

        <div className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1 overflow-hidden shadow-lg border-0 bg-white/80 backdrop-blur-sm" data-aos="fade-up">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-28" />
            <CardContent className="relative px-6 pb-6">
              <div className="flex flex-col items-center -mt-12">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                  <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-100 to-purple-100 text-blue-600">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="text-center mt-3">
                  <div className="text-xl font-semibold text-gray-900">{user.name || "User"}</div>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <Shield className="w-4 h-4" />
                      {profile.role?.name || "Standard User"}
                    </Badge>
                  </div>
                </div>

                <Separator className="my-5" />

                <div className="w-full space-y-3">
                  <Button
                    variant="outline"
                    onClick={handleEditProfile}
                    className="w-full justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </Button>
                  <Button
                    onClick={handleChangePassword}
                    className="w-full justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Lock className="w-4 h-4" />
                    Change Password
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 shadow-lg border-0 bg-white/70 backdrop-blur-sm" data-aos="fade-up">
            <CardHeader>
              <CardTitle className="text-lg">Account</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card className="border bg-white/70">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <User className="w-5 h-5 text-blue-600" />
                          Contact
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-start gap-3 rounded-lg border bg-white p-4">
                          <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div className="min-w-0">
                            <div className="text-sm font-medium">Email</div>
                            <div className="text-sm text-muted-foreground break-all">
                              {user.email || "No email provided"}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border bg-white/70">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Shield className="w-5 h-5 text-purple-600" />
                          Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-start gap-3 rounded-lg border bg-white p-4">
                          <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div className="min-w-0">
                            <div className="text-sm font-medium">Role</div>
                            <div className="text-sm text-muted-foreground">
                              {profile.role?.name || "Standard User"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 rounded-lg border bg-white p-4">
                          <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div className="min-w-0">
                            <div className="text-sm font-medium">Member since</div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(profile.created_at), "PPP")}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="security" className="mt-6">
                  <div className="space-y-4">
                    <div className="rounded-lg border bg-white p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-sm font-medium">Password</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Keep your account secure by using a strong password.
                          </div>
                        </div>
                        <Button variant="outline" onClick={handleChangePassword} className="gap-2">
                          <Lock className="w-4 h-4" />
                          Update
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-lg border bg-white p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium">Access</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Your permissions are determined by your role: {profile.role?.name || "Standard User"}.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}