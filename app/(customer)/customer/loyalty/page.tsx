import { createClient, createServiceClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Star, Award, TrendingUp, Gift, Target, Zap,
  Crown, Shield, Sparkles, Trophy
} from "lucide-react"
import { redirect } from "next/navigation"

export default async function CustomerLoyaltyPage() {
  const supabase = await createClient()
  const serviceClient = createServiceClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/auth/customer-login")
  }

  // Get customer data and loyalty account
  const { data: registeredCustomer } = await serviceClient
    .from("registered_customers")
    .select("id, full_name")
    .eq("user_id", user.id)
    .single()

  if (!registeredCustomer) {
    redirect("/auth/customer-login")
  }

  const { data: customer } = await serviceClient
    .from("customers")
    .select("*")
    .eq("registered_customer_id", registeredCustomer.id)
    .single()

  let loyaltyAccount = null
  let loyaltyProgram = null
  let transactions = []

  if (customer) {
    const { data: account } = await serviceClient
      .from("customer_loyalty_accounts")
      .select(`
        *,
        loyalty_program:loyalty_programs(*)
      `)
      .eq("customer_id", customer.id)
      .eq("is_active", true)
      .single()

    if (account) {
      loyaltyAccount = account
      loyaltyProgram = account.loyalty_program

      // Get recent transactions
      const { data: txns } = await serviceClient
        .from("loyalty_transactions")
        .select("*")
        .eq("customer_loyalty_account_id", account.id)
        .order("created_at", { ascending: false })
        .limit(10)

      transactions = txns || []
    }
  }

  // Tier information
  const tiers = [
    { name: 'bronze', min: 0, max: 999, color: 'bg-orange-500', icon: Shield },
    { name: 'silver', min: 1000, max: 4999, color: 'bg-gray-400', icon: Star },
    { name: 'gold', min: 5000, max: 9999, color: 'bg-yellow-500', icon: Award },
    { name: 'platinum', min: 10000, max: null, color: 'bg-purple-500', icon: Crown }
  ]

  const currentTier = tiers.find(t => t.name === (loyaltyAccount?.tier || 'bronze'))
  const nextTier = tiers.find(t => t.min > (loyaltyAccount?.current_points || 0))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Loyalty Program</h1>
        <p className="text-muted-foreground">Track your rewards and earn points with every purchase</p>
      </div>

      {!loyaltyAccount ? (
        <Card>
          <CardContent className="text-center py-12">
            <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Loyalty Account Found</h3>
            <p className="text-muted-foreground mb-6">
              Make your first purchase to automatically join our loyalty program and start earning rewards!
            </p>
            <Button>
              <Zap className="h-4 w-4 mr-2" />
              Start Shopping
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Current Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Current Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-2xl font-bold capitalize">{loyaltyAccount.tier} Member</p>
                    <p className="text-muted-foreground">{loyaltyProgram?.name}</p>
                  </div>
                  <Badge className={`text-white ${currentTier?.color}`}>
                    {loyaltyAccount.current_points} Points
                  </Badge>
                </div>

                {nextTier && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress to {nextTier.name}</span>
                      <span>{loyaltyAccount.current_points}/{nextTier.max || '∞'}</span>
                    </div>
                    <Progress
                      value={nextTier.max ? (loyaltyAccount.current_points / nextTier.max) * 100 : 0}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      {nextTier.max ? nextTier.max - loyaltyAccount.current_points : '∞'} more points to reach {nextTier.name}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                  <p className="text-2xl font-bold">{loyaltyAccount.total_points_earned}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Redeemed</p>
                  <p className="text-2xl font-bold">{loyaltyAccount.total_points_redeemed}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Available</p>
                  <p className="text-2xl font-bold text-green-600">
                    {loyaltyAccount.current_points}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tier Benefits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Your Tier Benefits
              </CardTitle>
              <CardDescription>
                Enjoy exclusive perks based on your membership level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {tiers.map((tier) => {
                  const Icon = tier.icon
                  const isCurrentTier = tier.name === loyaltyAccount.tier
                  const isHigherTier = tier.min > (loyaltyAccount.current_points || 0)

                  return (
                    <div
                      key={tier.name}
                      className={`p-4 rounded-lg border-2 ${
                        isCurrentTier
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                          : isHigherTier
                          ? 'border-gray-200 bg-gray-50 dark:bg-gray-800'
                          : 'border-green-500 bg-green-50 dark:bg-green-950'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`h-5 w-5 ${tier.color.replace('bg-', 'text-')}`} />
                        <span className="font-semibold capitalize">{tier.name}</span>
                        {isCurrentTier && <Badge variant="secondary">Current</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {tier.min.toLocaleString()} - {tier.max ? tier.max.toLocaleString() : '∞'} points
                      </p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Your latest points transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
                  <p className="text-muted-foreground">
                    Your points transaction history will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction: any) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.transaction_type === 'earn'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {transaction.transaction_type === 'earn' ? (
                            <TrendingUp className="h-5 w-5" />
                          ) : (
                            <Gift className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold capitalize">{transaction.transaction_type}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          transaction.transaction_type === 'earn' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.transaction_type === 'earn' ? '+' : '-'}{transaction.points} points
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Balance: {transaction.points_balance_after}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button className="h-auto p-4" variant="outline">
                  <div className="text-center">
                    <Gift className="h-6 w-6 mx-auto mb-2" />
                    <span className="text-sm">Redeem Points</span>
                  </div>
                </Button>
                <Button className="h-auto p-4" variant="outline">
                  <div className="text-center">
                    <Target className="h-6 w-6 mx-auto mb-2" />
                    <span className="text-sm">View Rewards</span>
                  </div>
                </Button>
                <Button className="h-auto p-4" variant="outline">
                  <div className="text-center">
                    <Star className="h-6 w-6 mx-auto mb-2" />
                    <span className="text-sm">Earn More</span>
                  </div>
                </Button>
                <Button className="h-auto p-4" variant="outline">
                  <div className="text-center">
                    <Award className="h-6 w-6 mx-auto mb-2" />
                    <span className="text-sm">Tier Info</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}