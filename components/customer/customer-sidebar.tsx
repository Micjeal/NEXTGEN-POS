"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Home,
  User,
  Star,
  ShoppingBag,
  Gift,
  CreditCard,
  Heart,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Award,
  TrendingUp
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function CustomerSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  const navigationItems = [
    { href: "/customer/dashboard", label: "Dashboard", icon: Home, description: "Overview & stats" },
    { href: "/customer/profile", label: "Profile", icon: User, description: "Account settings" },
    { href: "/customer/loyalty", label: "Loyalty", icon: Star, description: "Points & rewards" },
    { href: "/customer/orders", label: "Orders", icon: ShoppingBag, description: "Purchase history" },
    { href: "/customer/rewards", label: "Rewards", icon: Gift, description: "Available rewards" },
    { href: "/customer/wishlist", label: "Wishlist", icon: Heart, description: "Saved items" },
    { href: "/customer/payments", label: "Payments", icon: CreditCard, description: "Payment methods" },
  ]

  const quickStats = [
    { label: "Points", value: "1,250", icon: Star, color: "text-yellow-600" },
    { label: "Tier", value: "Gold", icon: Award, color: "text-purple-600" },
    { label: "Spent", value: "UGX 450K", icon: TrendingUp, color: "text-green-600" },
  ]

  return (
    <aside className={cn(
      "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Menu</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Navigate</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 w-8 p-0"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        {!isCollapsed && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Quick Stats</h3>
            <div className="space-y-2">
              {quickStats.map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Icon className={cn("h-4 w-4", stat.color)} />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{stat.value}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">{item.label}</span>
                        {item.label === "Rewards" && (
                          <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                            3
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {item.description}
                      </p>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          {!isCollapsed ? (
            <div className="space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
                <Badge variant="destructive" className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs">
                  2
                </Badge>
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Button variant="ghost" size="sm" className="w-full p-2">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="w-full p-2">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}