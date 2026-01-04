"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ShoppingCart, LayoutDashboard, Package, Warehouse, Users, BarChart3, Settings, LogOut, CreditCard, MessageSquare, Building2, FileText, Receipt, Shield, UserCheck, Award, Eye, Globe, ArrowRightLeft, TrendingUp, Calendar, Star } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import type { Profile } from "@/lib/types/database"
import styles from "./sidebar.module.css"

const navigation = [
  { name: "Overview", href: "/home", icon: LayoutDashboard, roles: ["admin", "manager", "cashier"] },
  { name: "POS Terminal", href: "/pos", icon: ShoppingCart, roles: ["admin", "manager", "cashier"] },
  { name: "All Transactions", href: "/transactions", icon: Receipt, roles: ["admin", "manager", "cashier"] },
  { name: "Online Orders", href: "/online-orders", icon: Globe, roles: ["admin", "manager"] },
  { name: "Cash Draw", href: "/cash-draw", icon: CreditCard, roles: ["admin", "manager", "cashier"] },
  { name: "Customers", href: "/customers", icon: UserCheck, roles: ["admin", "manager", "cashier"] },
  { name: "Loyalty", href: "/loyalty", icon: Award, roles: ["admin", "manager"] },
  { name: "Products", href: "/products", icon: Package, roles: ["admin", "manager"] },
  { name: "Inventory", href: "/inventory", icon: Warehouse, roles: ["admin", "manager"] },
  { name: "Branch Inventory", href: "/branch-inventory", icon: Package, roles: ["admin", "manager"] },
  { name: "Suppliers", href: "/suppliers", icon: Building2, roles: ["admin", "manager"] },
  { name: "Purchase Orders", href: "/purchase-orders", icon: FileText, roles: ["admin", "manager"] },
  { name: "Users", href: "/users", icon: Users, roles: ["admin", "manager"] },
  { name: "Employees", href: "/employees", icon: Users, roles: ["admin", "manager"] },
  { name: "Employee Shifts", href: "/employee-shifts", icon: Calendar, roles: ["admin", "manager"] },
  { name: "Employee Performance", href: "/employee-performance", icon: Star, roles: ["admin", "manager"] },
  { name: "Branches", href: "/branches", icon: Building2, roles: ["admin", "manager"] },
  { name: "Branch Performance", href: "/branch-performance", icon: TrendingUp, roles: ["admin", "manager"] },
  { name: "Messages", href: "/messages", icon: MessageSquare, roles: ["admin", "manager", "cashier"] },
  { name: "Reports", href: "/reports", icon: BarChart3, roles: ["admin", "manager"] },
  { name: "Insights", href: "/insights", icon: Eye, roles: ["admin", "manager"] },
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
  const supabase = createClient()

  // Get current user to check role from JWT
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  // Get role from JWT claims first, then profile, then default to cashier
  const userRole = user?.user_metadata?.role || profile?.role?.name || "cashier"

  const filteredNavigation = navigation.filter((item) => item.roles.includes(userRole))

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <div className={cn(
      styles.sidebarWrapper,
      !isOpen && styles.collapsed
    )}>
      <div className={styles.sidebarHeader}>
        <ShoppingCart className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">POS System</span>
      </div>
      <nav className={styles.nav}>
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
      <div className={styles.footer}>
        <div className={styles.userInfo}>
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
