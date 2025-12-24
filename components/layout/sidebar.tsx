"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ShoppingCart, LayoutDashboard, Package, Warehouse, Users, BarChart3, Settings, LogOut, CreditCard, MessageSquare, Building2, FileText, Receipt, Shield } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import type { Profile } from "@/lib/types/database"

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "cashier"] },
  { name: "POS Terminal", href: "/pos", icon: ShoppingCart, roles: ["admin", "manager", "cashier"] },
  { name: "All Transactions", href: "/transactions", icon: Receipt, roles: ["admin", "manager", "cashier"] },
  { name: "Cash Draw", href: "/cash-draw", icon: CreditCard, roles: ["admin", "manager", "cashier"] },
  { name: "Products", href: "/products", icon: Package, roles: ["admin", "manager"] },
  { name: "Inventory", href: "/inventory", icon: Warehouse, roles: ["admin", "manager"] },
  { name: "Suppliers", href: "/suppliers", icon: Building2, roles: ["admin", "manager"] },
  { name: "Purchase Orders", href: "/purchase-orders", icon: FileText, roles: ["admin", "manager"] },
  { name: "Users", href: "/users", icon: Users, roles: ["admin", "manager"] },
  { name: "Messages", href: "/messages", icon: MessageSquare, roles: ["admin", "manager", "cashier"] },
  { name: "Reports", href: "/reports", icon: BarChart3, roles: ["admin", "manager"] },
  { name: "Compliance", href: "/compliance", icon: Shield, roles: ["admin"] },
  { name: "Settings", href: "/settings", icon: Settings, roles: ["admin", "manager"] },
]

interface SidebarProps {
  profile: Profile | null
  isOpen?: boolean
  onToggle?: () => void
}

export function Sidebar({ profile, isOpen = true, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const userRole = profile?.role?.name || "cashier"

  const filteredNavigation = navigation.filter((item) => item.roles.includes(userRole))

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <div className={cn(
      "flex h-full flex-col bg-card border-r transition-transform duration-300 ease-in-out",
      "w-64 sm:w-72 lg:w-64",
      "lg:translate-x-0 lg:static lg:inset-0",
      isOpen ? "translate-x-0" : "-translate-x-full",
      "fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto"
    )}>
      <div className="flex h-16 items-center gap-2 px-6 border-b">
        <ShoppingCart className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">POS System</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-4">
        <div className="mb-3 px-3">
          <p className="text-sm font-medium">{profile?.full_name || "User"}</p>
          <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  )
}
