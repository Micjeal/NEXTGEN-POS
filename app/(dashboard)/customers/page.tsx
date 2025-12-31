import { createClient, createServiceClient } from "@/lib/supabase/server"
import { CustomersTable } from "@/components/customers/customers-table"
import { Button } from "@/components/ui/button"
import { UserPlus, Users, Award, ShoppingCart, TrendingUp } from "lucide-react"
import Link from "next/link"
import type { Customer } from "@/lib/types/database"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CustomerLoyaltyDisplay } from "@/components/customers/customer-loyalty-display"
import { CustomerPurchaseHistory } from "@/components/customers/customer-purchase-history"

export default async function CustomersPage() {
  const serviceClient = createServiceClient()

  // Fetch customers with loyalty data
  const { data: customers } = await serviceClient
    .from("customers")
    .select(`
      *,
      loyalty_account:customer_loyalty_accounts(
        current_points,
        total_points_earned,
        total_points_redeemed,
        tier,
        join_date
      )
    `)
    .order("created_at", { ascending: false })

  // Fetch loyalty programs
  const { data: loyaltyPrograms } = await serviceClient
    .from("loyalty_programs")
    .select("*")
    .eq("is_active", true)

  // Fetch recent sales for purchase history
  const { data: recentSales } = await serviceClient
    .from("sales")
    .select(`
      *,
      customer:customers(id, full_name),
      items:sale_items(
        quantity,
        unit_price,
        product:products(name)
      )
    `)
    .order("created_at", { ascending: false })
    .limit(100)

  // Calculate some stats
  const totalCustomers = customers?.length || 0
  const activeCustomers = customers?.filter(c => c.is_active).length || 0
  const totalLoyaltyPoints = customers?.reduce((sum, c) =>
    sum + (c.loyalty_account?.[0]?.current_points || 0), 0) || 0
  const totalRevenue = customers?.reduce((sum, c) => sum + (c.total_spent || 0), 0) || 0

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Customer Management
          </h1>
          <p className="text-muted-foreground">Comprehensive customer relationship and loyalty management</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Link href="/customers/add">
            <UserPlus className="h-4 w-4 mr-2" />
            Register New Customer
          </Link>
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalCustomers}</div>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {activeCustomers} active
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Loyalty Points</CardTitle>
            <Award className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">{totalLoyaltyPoints.toLocaleString()}</div>
            <p className="text-xs text-green-700 dark:text-green-300">
              Total active points
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">Total Revenue</CardTitle>
            <ShoppingCart className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              UGX {totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-300">
              From all customers
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              UGX {totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers).toLocaleString() : 0}
            </div>
            <p className="text-xs text-orange-700 dark:text-orange-300">
              Per customer
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="customers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Customer List
          </TabsTrigger>
          <TabsTrigger value="loyalty" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Loyalty Points
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Purchase History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-6">
          <CustomersTable customers={(customers as Customer[]) || []} />
        </TabsContent>

        <TabsContent value="loyalty" className="space-y-6">
          <CustomerLoyaltyDisplay
            customers={customers || []}
            loyaltyPrograms={loyaltyPrograms || []}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <CustomerPurchaseHistory
            sales={recentSales || []}
            customers={customers || []}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}