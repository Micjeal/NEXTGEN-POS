import { createClient, createServiceClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { TierProgress } from "@/components/loyalty/tier-progress"
import { RewardsCatalog } from "@/components/loyalty/rewards-catalog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Star, Award, TrendingUp, Gift, Target, Zap,
  Crown, Shield, Sparkles, Trophy, History
} from "lucide-react"
import { redirect } from "next/navigation"
import type { Reward } from "@/components/loyalty/rewards-catalog"

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
  let transactions: any[] = []
  let tierHistory: any[] = []

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

      // Get tier history
      const { data: history } = await serviceClient
        .from("tier_history")
        .select("*")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false })
        .limit(5)

      tierHistory = history || []
    }
  }

  // Get available rewards
  let { data: rewards } = await serviceClient
    .from("rewards")
    .select(`
      *,
      tier:min_tier_name(tier_name, display_name, tier_color)
    `)
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("points_cost", { ascending: true })

  if (!rewards) {
    rewards = []
  }

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
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rewards">Rewards Catalog</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Tier Progress */}
            <TierProgress
              currentPoints={loyaltyAccount.current_points || 0}
              currentTier={loyaltyAccount.tier || 'bronze'}
              totalEarned={loyaltyAccount.total_points_earned || 0}
              totalRedeemed={loyaltyAccount.total_points_redeemed || 0}
              joinDate={loyaltyAccount.join_date || new Date().toISOString()}
              onViewRewards={() => {
                // This will be handled by client-side navigation
              }}
            />

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
                  {[
                    { name: 'bronze', min: 0, max: 999, color: 'bg-orange-500', icon: Shield, benefits: ['1x Points Earning', 'Birthday Gift'] },
                    { name: 'silver', min: 1000, max: 4999, color: 'bg-gray-400', icon: Star, benefits: ['1.1x Points Earning', '2% Discount', 'Birthday Gift'] },
                    { name: 'gold', min: 5000, max: 9999, color: 'bg-yellow-500', icon: Award, benefits: ['1.2x Points Earning', '5% Discount', 'Free Delivery', 'Priority Support'] },
                    { name: 'platinum', min: 10000, max: null, color: 'bg-purple-500', icon: Crown, benefits: ['1.3x Points Earning', '10% Discount', 'Free Delivery', 'Priority Support', 'Personal Shopper'] }
                  ].map((tier) => {
                    const isCurrentTier = tier.name === loyaltyAccount.tier
                    const isHigherTier = (loyaltyAccount.current_points || 0) < tier.min

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
                          <tier.icon className={`h-5 w-5 ${tier.color.replace('bg-', 'text-')}`} />
                          <span className="font-semibold capitalize">{tier.name}</span>
                          {isCurrentTier && <Badge variant="secondary">Current</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {tier.min.toLocaleString()} - {tier.max ? tier.max.toLocaleString() : '∞'} points
                        </p>
                        <div className="mt-2 space-y-1">
                          {tier.benefits.map((benefit, i) => (
                            <p key={i} className="text-xs text-muted-foreground">• {benefit}</p>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rewards">
            <RewardsCatalog 
              initialRewards={(rewards as Reward[]) || []}
              userTier={loyaltyAccount.tier || 'bronze'}
              userPoints={loyaltyAccount.current_points || 0}
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {/* Transaction History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Points Activity
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
                            {transaction.description && (
                              <p className="text-xs text-muted-foreground">{transaction.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${
                            transaction.transaction_type === 'earn' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.transaction_type === 'earn' ? '+' : '-'}{Math.abs(transaction.points).toLocaleString()} pts
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Balance: {transaction.points_balance_after?.toLocaleString() || 0}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tier History */}
            {tierHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Tier Changes
                  </CardTitle>
                  <CardDescription>
                    Your tier upgrade and downgrade history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tierHistory.map((history: any) => (
                      <div key={history.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            history.previous_tier && 
                            ['silver', 'gold', 'platinum'].includes(history.new_tier) &&
                            ['bronze', 'silver', 'gold'].includes(history.previous_tier || '')
                              ? 'bg-green-100 text-green-600'
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            <Award className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold">
                              {history.previous_tier?.toUpperCase() || 'START'} → {history.new_tier.toUpperCase()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(history.created_at).toLocaleDateString()}
                            </p>
                            {history.reason && (
                              <p className="text-xs text-muted-foreground">{history.reason}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {history.trigger_type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
