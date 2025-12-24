"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Shield, Smartphone, Key, LogOut, AlertTriangle, CheckCircle } from "lucide-react"

interface Session {
  id: string
  device: string
  location: string
  lastActive: string
  current: boolean
}

export function SecuritySettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchSecuritySettings()
    fetchSessions()
  }, [])

  const fetchSecuritySettings = async () => {
    try {
      // In a real app, you'd fetch 2FA status from the database
      // For now, we'll simulate this
      setTwoFactorEnabled(false)
    } catch (error) {
      console.error('Error fetching security settings:', error)
    }
  }

  const fetchSessions = async () => {
    try {
      // Mock session data - in a real app, you'd fetch from your backend
      const mockSessions: Session[] = [
        {
          id: "1",
          device: "Chrome on Windows",
          location: "Kampala, Uganda",
          lastActive: new Date().toISOString(),
          current: true,
        },
        {
          id: "2",
          device: "Safari on iPhone",
          location: "Kampala, Uganda",
          lastActive: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          current: false,
        },
      ]
      setSessions(mockSessions)
    } catch (error) {
      console.error('Error fetching sessions:', error)
    }
  }

  const handleTwoFactorToggle = async (enabled: boolean) => {
    if (enabled && !twoFactorEnabled) {
      setShowTwoFactorSetup(true)
    } else if (!enabled && twoFactorEnabled) {
      // Disable 2FA
      setIsLoading(true)
      try {
        // In a real app, you'd call an API to disable 2FA
        setTwoFactorEnabled(false)
        toast({
          title: "Success",
          description: "Two-factor authentication has been disabled",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to disable two-factor authentication",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleTwoFactorSetup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!verificationCode) {
      toast({
        title: "Validation Error",
        description: "Please enter the verification code",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // In a real app, you'd verify the code with your backend
      // For demo purposes, we'll just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000))

      setTwoFactorEnabled(true)
      setShowTwoFactorSetup(false)
      setVerificationCode("")

      toast({
        title: "Success",
        description: "Two-factor authentication has been enabled",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid verification code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    setIsLoading(true)

    try {
      // In a real app, you'd call an API to revoke the session
      setSessions(prev => prev.filter(s => s.id !== sessionId))

      toast({
        title: "Success",
        description: "Session has been revoked",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke session",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevokeAllSessions = async () => {
    setIsLoading(true)

    try {
      // In a real app, you'd call an API to revoke all sessions except current
      setSessions(prev => prev.filter(s => s.current))

      toast({
        title: "Success",
        description: "All other sessions have been revoked",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke sessions",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Require a verification code in addition to your password
              </p>
            </div>
            <div className="flex items-center gap-2">
              {twoFactorEnabled && (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Enabled
                </Badge>
              )}
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={handleTwoFactorToggle}
                disabled={isLoading}
              />
            </div>
          </div>

          {showTwoFactorSetup && (
            <div className="space-y-4 pt-4 border-t">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded">
                    <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                      Setup Instructions
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                      1. Install an authenticator app like Google Authenticator or Authy
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                      2. Scan the QR code or enter the secret key manually
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      3. Enter the 6-digit code from your app below
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleTwoFactorSetup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verificationCode">Verification Code</Label>
                  <Input
                    id="verificationCode"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowTwoFactorSetup(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Enable 2FA'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>Manage your active login sessions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{session.device}</p>
                  {session.current && (
                    <Badge variant="secondary" className="text-xs">
                      Current
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{session.location}</p>
                <p className="text-xs text-muted-foreground">
                  Last active: {new Date(session.lastActive).toLocaleString()}
                </p>
              </div>
              {!session.current && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRevokeSession(session.id)}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Revoke
                </Button>
              )}
            </div>
          ))}

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Revoke All Other Sessions</Label>
              <p className="text-sm text-muted-foreground">
                This will log you out from all other devices
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRevokeAllSessions}
              disabled={isLoading || sessions.filter(s => !s.current).length === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Revoking...
                </>
              ) : (
                'Revoke All'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Security Recommendations
          </CardTitle>
          <CardDescription>Tips to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Use a strong password</p>
                <p className="text-sm text-muted-foreground">
                  Use at least 8 characters with a mix of letters, numbers, and symbols
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Enable two-factor authentication</p>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Monitor active sessions</p>
                <p className="text-sm text-muted-foreground">
                  Regularly check and revoke suspicious login sessions
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}