"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import {
  Gift, Star, Award, Crown, Zap, ShoppingBag,
  CreditCard, Calendar, Lock, CheckCircle, Loader2, RefreshCw
} from "lucide-react"
import { useRouter } from "next/navigation"

export default function CustomerRewardsPage() {
  const [customer, setCustomer] = useState<any>(null)
  const [loyaltyAccount, setLoyaltyAccount] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRedeeming, setIsRedeeming] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push("/auth/customer-login")
        return
      }

      // Get customer data and loyalty account
      const { data: registeredCustomer } = await supabase
        .from("registered_customers")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (!registeredCustomer) {
        router.push("/auth/customer-login")
        return
      }

      const { data: customerData } = await supabase
        .from("customers")
        .select("*")
        .eq("registered_customer_id", registeredCustomer.id)
        .single()

      if (customerData) {
        setCustomer(customerData)

        const { data: account } = await supabase
          .from("customer_loyalty_accounts")
          .select("*")
          .eq("customer_id", customerData.id)
          .eq("is_active", true)
          .single()

        setLoyaltyAccount(account)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Failed to load rewards data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRedeem = async (rewardType: string, pointsRequired: number) => {
    setIsRedeeming(rewardType)
    try {
      const response = await fetch('/api/customer/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardType, pointsRequired })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to redeem reward')
      }

      const result = await response.json()

      toast({
        title: "Success!",
        description: `Successfully redeemed ${rewardType}!`,
      })

      // Update local state
      setLoyaltyAccount((prev: any) => ({
        ...prev,
        current_points: result.newBalance,
        total_points_redeemed: prev.total_points_redeemed + pointsRequired
      }))

    } catch (error) {
      console.error('Error redeeming reward:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to redeem reward",
        variant: "destructive"
      })
    } finally {
      setIsRedeeming(null)
    }
  }

  const availableRewards = [
    {
      id: 1,
      title: "Discount Voucher",
      description: "Get 10% off your next purchase",
      pointsRequired: 500,
      icon: CreditCard,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
      available: true
    },
    {
      id: 2,
      title: "Free Coffee",
      description: "Redeem for a complimentary coffee",
      pointsRequired: 200,
      icon: ShoppingBag,
      color: "text-brown-600",
      bgColor: "bg-amber-50 dark:bg-amber-950",
      available: true
    },
    {
      id: 3,
      title: "Birthday Bonus",
      description: "Double points on your birthday month",
      pointsRequired: 100,
      icon: Calendar,
      color: "text-pink-600",
      bgColor: "bg-pink-50 dark:bg-pink-950",
      available: true
    },
    {
      id: 4,
      title: "Free Delivery",
      description: "Waived delivery fee on orders over UGX 50,000",
      pointsRequired: 300,
      icon: Award,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
      available: true
    },
    {
      id: 5,
      title: "VIP Upgrade",
      description: "Skip the line and get priority service",
      pointsRequired: 1000,
      icon: Crown,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
      available: true
    },
    {
      id: 6,
      title: "Exclusive Item",
      description: "Access to limited edition products",
      pointsRequired: 800,
      icon: Star,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-950",
      available: true
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rewards Center</h1>
          <p className="text-muted-foreground">Redeem your points for exclusive rewards and benefits</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Available Points</p>
            <p className="text-2xl font-bold text-blue-600">
              {loyaltyAccount?.current_points || 0}
            </p>
          </div>
          <Button>
            <Zap className="h-4 w-4 mr-2" />
            Earn More Points
          </Button>
        </div>
      </div>

      {!loyaltyAccount ? (
        <Card>
          <CardContent className="text-center py-12">
            <Gift className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Loyalty Account</h3>
            <p className="text-muted-foreground mb-6">
              Start shopping to earn points and unlock exclusive rewards!
            </p>
            <Button>
              <ShoppingBag className="h-4 w-4 mr-2" />
              Start Shopping
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Points Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Star className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    <p className="text-2xl font-bold">{loyaltyAccount.current_points}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <Award className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Earned</p>
                    <p className="text-2xl font-bold">{loyaltyAccount.total_points_earned}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                    <Gift className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Redeemed</p>
                    <p className="text-2xl font-bold">{loyaltyAccount.total_points_redeemed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Available Rewards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Available Rewards
              </CardTitle>
              <CardDescription>
                Choose from our exclusive rewards catalog
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableRewards.map((reward) => {
                  const Icon = reward.icon
                  const canRedeem = (loyaltyAccount?.current_points || 0) >= reward.pointsRequired
                  const pointsNeeded = reward.pointsRequired - (loyaltyAccount?.current_points || 0)

                  return (
                    <Card key={reward.id} className={`relative ${reward.bgColor}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${reward.bgColor}`}>
                            <Icon className={`h-6 w-6 ${reward.color}`} />
                          </div>
                          <Badge variant={canRedeem ? "default" : "secondary"}>
                            {reward.pointsRequired} pts
                          </Badge>
                        </div>

                        <h3 className="font-semibold text-lg mb-2">{reward.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {reward.description}
                        </p>

                        {canRedeem ? (
                          <Button
                            className="w-full"
                            size="sm"
                            onClick={() => handleRedeem(reward.title, reward.pointsRequired)}
                            disabled={isRedeeming === reward.title}
                          >
                            {isRedeeming === reward.title ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            {isRedeeming === reward.title ? 'Redeeming...' : 'Redeem Now'}
                          </Button>
                        ) : (
                          <div className="space-y-2">
                            <Button variant="outline" className="w-full" size="sm" disabled>
                              <Lock className="h-4 w-4 mr-2" />
                              Need {pointsNeeded} more points
                            </Button>
                            <p className="text-xs text-center text-muted-foreground">
                              Earn {pointsNeeded} more points to unlock
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Redemption History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Redemption History
              </CardTitle>
              <CardDescription>
                Your previously redeemed rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No redemptions yet</h3>
                <p className="text-muted-foreground">
                  Your redeemed rewards will appear here.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* How to Earn More Points */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                How to Earn More Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Shopping & Purchasing</h4>
                  <div className="space-y-2 text-sm">
                    <p>• Earn 1 point per UGX 1 spent</p>
                    <p>• Bonus points on special promotions</p>
                    <p>• Double points on birthdays</p>
                    <p>• Extra points for bulk purchases</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Membership Benefits</h4>
                  <div className="space-y-2 text-sm">
                    <p>• Higher tiers earn more points</p>
                    <p>• Exclusive member-only rewards</p>
                    <p>• Early access to sales</p>
                    <p>• Priority customer support</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}