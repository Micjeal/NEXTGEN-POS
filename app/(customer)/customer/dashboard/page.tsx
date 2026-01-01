import { createClient, createServiceClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Gift, Star, TrendingUp, Receipt, User, Settings, ShoppingBag,
  Award, Target, Zap, Heart, Bell, CreditCard, Calendar, ChevronRight
} from "lucide-react"
import Link from "next/link"
import { CustomerLoyaltyCard } from "@/components/customer/customer-loyalty-card"
import { CustomerTransactionHistory } from "@/components/customer/customer-transaction-history"
import { redirect } from "next/navigation"

export default async function CustomerDashboardPage() {
  const supabase = await createClient()
  const serviceClient = createServiceClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/auth/customer-login")
  }

  // Get customer data and loyalty account directly
  // First check if user is a registered customer
  const { data: registeredCustomer } = await serviceClient
    .from("registered_customers")
    .select("id, full_name, email, phone, date_of_birth, registration_date")
    .eq("user_id", user.id)
    .single()

  let customer: any = null
  let loyaltyAccount: any = null
  let recentTransactions: any[] = []
  let recentPurchases: any[] = []

  if (registeredCustomer) {
    // User is a registered customer, check if they have a customer record
    const { data: customerRecord } = await serviceClient
      .from("customers")
      .select("id, full_name, email, phone, membership_tier, total_spent, total_visits, last_visit_date")
      .eq("registered_customer_id", registeredCustomer.id)
      .single()

    if (customerRecord) {
      customer = customerRecord

      // Get loyalty account (most recent active one)
      const { data: accounts } = await serviceClient
        .from("customer_loyalty_accounts")
        .select(`
          *,
          loyalty_program:loyalty_programs(*)
        `)
        .eq("customer_id", customer.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)

      const account = accounts?.[0] || null

      if (account) {
        loyaltyAccount = account

        // Get recent transactions
        const { data: transactions } = await serviceClient
          .from("loyalty_transactions")
          .select(`
            *,
            sale:sales(invoice_number, created_at, total)
          `)
          .eq("customer_loyalty_account_id", account.id)
          .order("created_at", { ascending: false })
          .limit(10)

        recentTransactions = transactions || []

        // Get recent purchases (sales)
        const { data: purchases } = await serviceClient
          .from("sales")
          .select(`
            id, invoice_number, total, created_at,
            sale_items(count, products(name, price))
          `)
          .eq("customer_id", customer.id)
          .order("created_at", { ascending: false })
          .limit(5)

        recentPurchases = purchases || []
      }
    } else {
      // Registered customer but no purchases yet
      customer = {
        ...registeredCustomer,
        membership_tier: 'bronze',
        total_spent: 0,
        total_visits: 0,
        last_visit_date: null
      }
    }
  } else {
    // Fallback for existing customers not using registered customer system
    const { data: customerRecord } = await serviceClient
      .from("customers")
      .select("id, full_name, email, phone, membership_tier, total_spent, total_visits, last_visit_date")
      .eq("email", user.email)
      .single()

    if (customerRecord) {
      customer = customerRecord

      // Get loyalty account (most recent active one)
      const { data: accounts } = await serviceClient
        .from("customer_loyalty_accounts")
        .select(`
          *,
          loyalty_program:loyalty_programs(*)
        `)
        .eq("customer_id", customer.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)

      const account = accounts?.[0] || null

      if (account) {
        loyaltyAccount = account

        // Get recent transactions
        const { data: transactions } = await serviceClient
          .from("loyalty_transactions")
          .select(`
            *,
            sale:sales(invoice_number, created_at, total)
          `)
          .eq("customer_loyalty_account_id", account.id)
          .order("created_at", { ascending: false })
          .limit(10)

        recentTransactions = transactions || []

        // Get recent purchases
        const { data: purchases } = await serviceClient
          .from("sales")
          .select(`
            id, invoice_number, total, created_at,
            sale_items(count, products(name, price))
          `)
          .eq("customer_id", customer.id)
          .order("created_at", { ascending: false })
          .limit(5)

        recentPurchases = purchases || []
      }
    }
  }

  if (!customer) {
    redirect("/auth/customer-login")
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {customer.full_name.split(' ')[0]}! 👋
            </h1>
            <p className="text-blue-100">
              {customer.membership_tier === 'none' ? 'Start your loyalty journey today' : `Your ${customer.membership_tier} member dashboard`}
            </p>
            {loyaltyAccount && (
              <div className="flex items-center gap-4 mt-2 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-300" />
                  <span>{loyaltyAccount.current_points} points</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4 text-green-300" />
                  <span>{customer.total_visits} visits</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20" asChild>
              <Link href="/customer/products">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Shop Now
              </Link>
            </Button>
          </div>
        </div>
      </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Current Points</p>
                  <p className="text-2xl lg:text-3xl font-bold text-yellow-800 dark:text-yellow-200">
                    {loyaltyAccount?.current_points || 0}
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Total Earned</p>
                  <p className="text-2xl lg:text-3xl font-bold text-green-800 dark:text-green-200">
                    {loyaltyAccount?.total_points_earned || 0}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Spent</p>
                  <p className="text-xl lg:text-2xl font-bold text-blue-800 dark:text-blue-200">
                    UGX {(customer.total_spent || 0).toLocaleString()}
                  </p>
                </div>
                <Receipt className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Membership</p>
                  <p className="text-xl lg:text-2xl font-bold text-purple-800 dark:text-purple-200 capitalize">
                    {customer.membership_tier}
                  </p>
                </div>
                <Award className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl lg:text-2xl font-bold mb-6 flex items-center gap-2">
            <Zap className="h-6 w-6 text-blue-600" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="h-auto p-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700" variant="default" asChild>
              <Link href="/customer/products">
                <div className="text-center">
                  <ShoppingBag className="h-6 w-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">Shop Now</span>
                </div>
              </Link>
            </Button>
            <Button className="h-auto p-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700" variant="default" asChild>
              <Link href="/customer/rewards">
                <div className="text-center">
                  <Gift className="h-6 w-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">Redeem Points</span>
                </div>
              </Link>
            </Button>
            <Button className="h-auto p-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700" variant="default" asChild>
              <Link href="/customer/wishlist">
                <div className="text-center">
                  <Heart className="h-6 w-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">Favorites</span>
                </div>
              </Link>
            </Button>
            <Button className="h-auto p-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700" variant="default" asChild>
              <Link href="/customer/profile">
                <div className="text-center">
                  <Bell className="h-6 w-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">Notifications</span>
                </div>
              </Link>
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Loyalty Card - Takes full width on mobile/tablet, 1 col on xl */}
          <div className="xl:col-span-1 order-2 xl:order-1">
            <CustomerLoyaltyCard
              customer={customer}
              loyaltyAccount={loyaltyAccount}
            />
          </div>

          {/* Right Column - Transaction History and Recent Purchases */}
          <div className="xl:col-span-2 order-1 xl:order-2 space-y-6">
            {/* Recent Purchases */}
            <Card className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-gray-800 dark:to-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-blue-600" />
                      Recent Purchases
                    </CardTitle>
                    <CardDescription>
                      Your latest shopping activity
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/customer/orders">
                      View All
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recentPurchases.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No purchases yet</h3>
                    <p className="text-muted-foreground">
                      Your purchase history will appear here once you make your first purchase.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentPurchases.map((purchase: any) => (
                      <div key={purchase.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900">
                            <Receipt className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold">Invoice #{purchase.invoice_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(purchase.created_at).toLocaleDateString()} • {purchase.sale_items?.length || 0} items
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">UGX {purchase.total?.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">
                            +{Math.floor(purchase.total * (loyaltyAccount?.loyalty_program?.points_per_currency || 1))} points earned
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transaction History */}
            <CustomerTransactionHistory transactions={recentTransactions} />
          </div>
        </div>

        {/* Rewards Section */}
        {loyaltyAccount && (
          <div className="mt-8">
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-purple-600" />
                  Available Rewards
                </CardTitle>
                <CardDescription>
                  Redeem your points for exclusive rewards and discounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg bg-white/50 dark:bg-gray-800/50">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <h4 className="font-semibold">Discount Voucher</h4>
                    <p className="text-sm text-muted-foreground mb-2">500 points</p>
                    <Button size="sm" disabled={loyaltyAccount.current_points < 500} asChild>
                      <Link href="/customer/rewards">Redeem</Link>
                    </Button>
                  </div>
                  <div className="text-center p-4 border rounded-lg bg-white/50 dark:bg-gray-800/50">
                    <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <h4 className="font-semibold">Free Item</h4>
                    <p className="text-sm text-muted-foreground mb-2">1000 points</p>
                    <Button size="sm" disabled={loyaltyAccount.current_points < 1000} asChild>
                      <Link href="/customer/rewards">Redeem</Link>
                    </Button>
                  </div>
                  <div className="text-center p-4 border rounded-lg bg-white/50 dark:bg-gray-800/50">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <h4 className="font-semibold">Birthday Bonus</h4>
                    <p className="text-sm text-muted-foreground mb-2">200 points</p>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/customer/rewards">Claim</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
    </div>
  )
}