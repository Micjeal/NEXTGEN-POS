"use client"

import { useRouter } from "next/navigation"
import { Search, Users, Building2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { NotificationButton } from "@/components/ui/notification-button"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Profile } from "@/lib/types/database"

interface HeaderProps {
  profile: Profile | null
}

export function Header({ profile }: HeaderProps) {
  const router = useRouter()

  const handleNotificationClick = () => {
    router.push('/notifications')
  }

  const handleProfileClick = () => {
    router.push('/profile')
  }

  const handleCustomerClick = () => {
    router.push('/customers')
  }

  const handleSupplierClick = () => {
    router.push('/suppliers')
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="relative flex-1 max-w-xs sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." className="w-full pl-9" />
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
        <NotificationButton
          count={3}
          onClick={handleNotificationClick}
          aria-label="View notifications"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCustomerClick}
          className="gap-1 sm:gap-2 px-2 sm:px-3"
          aria-label="View customers"
        >
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Customers</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSupplierClick}
          className="gap-1 sm:gap-2 px-2 sm:px-3"
          aria-label="View suppliers"
        >
          <Building2 className="h-4 w-4" />
          <span className="hidden sm:inline">Suppliers</span>
        </Button>
        <Button
          variant="ghost"
          className="h-8 w-8 sm:h-10 sm:w-10 rounded-full p-0"
          onClick={handleProfileClick}
          aria-label="View profile"
        >
          <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
            <AvatarImage src="" alt={profile?.full_name || 'User'} />
            <AvatarFallback className="text-xs sm:text-sm">
              {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </div>
    </header>
  )
}