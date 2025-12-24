"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Profile, Role } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { KeyRound } from "lucide-react"

interface EditUserDialogProps {
  profile: Profile | null
  roles: Role[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditUserDialog({ profile, roles, open, onOpenChange }: EditUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [formData, setFormData] = useState({
    full_name: "",
    role_id: "",
    is_active: true,
  })
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name,
        role_id: profile.role_id || "",
        is_active: profile.is_active,
      })
    }
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setIsLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          role_id: formData.role_id || null,
          is_active: formData.is_active,
        })
        .eq("id", profile.id)

      if (error) throw error

      toast({
        title: "User Updated",
        description: `${formData.full_name}'s profile has been updated`,
      })

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!profile || !newPassword) return
    setIsResettingPassword(true)

    try {
      // Use admin API to reset password
      const response = await fetch("/api/auth/reset-user-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: profile.id,
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password")
      }

      toast({
        title: "Password Reset",
        description: `Password has been reset for ${formData.full_name}. They will need to use the new password to log in.`,
      })

      setNewPassword("")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reset password",
        variant: "destructive",
      })
    } finally {
      setIsResettingPassword(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update user profile and permissions</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" value={profile?.email || ""} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={formData.role_id} onValueChange={(value) => setFormData({ ...formData, role_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id} className="capitalize">
                      {role.name} - {role.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="edit-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="edit-active">Active Account</Label>
            </div>

            {/* Password Reset Section */}
            <div className="border-t pt-4 mt-4">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Reset Password</Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetPassword}
                  disabled={isResettingPassword || !newPassword}
                  className="gap-2"
                >
                  <KeyRound className="h-4 w-4" />
                  {isResettingPassword ? "Resetting..." : "Reset"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Set a new password for this user. They will need to use it on next login.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
