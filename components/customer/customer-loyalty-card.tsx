"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Gift, Crown, Medal, Award } from "lucide-react"

interface CustomerLoyaltyCardProps {
  customer: any
  loyaltyAccount: any
}

export function CustomerLoyaltyCard({ customer, loyaltyAccount }: CustomerLoyaltyCardProps) {
  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return <Crown className="h-6 w-6 text-purple-500" />
      case 'gold':
        return <Award className="h-6 w-6 text-yellow-500" />
      case 'silver':
        return <Medal className="h-6 w-6 text-gray-500" />
      default:
        return <Star className="h-6 w-6 text-blue-500" />
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return 'from-purple-500 to-purple-600'
      case 'gold':
        return 'from-yellow-500 to-yellow-600'
      case 'silver':
        return 'from-gray-400 to-gray-500'
      default:
        return 'from-blue-500 to-blue-600'
    }
  }

  return (
    <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">
          {getTierIcon(customer.membership_tier)}
        </div>
        <CardTitle className="text-xl capitalize">{customer.membership_tier} Member</CardTitle>
        <CardDescription>
          {customer.full_name}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Points Balance */}
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r ${getTierColor(customer.membership_tier)} text-white mb-4`}>
            <div className="text-center">
              <div className="text-2xl font-bold">{loyaltyAccount?.current_points || 0}</div>
              <div className="text-xs">Points</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Available Points Balance
          </p>
        </div>

        {/* Quick Stats */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Earned</span>
            <span className="font-semibold">{loyaltyAccount?.total_points_earned || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Redeemed</span>
            <span className="font-semibold">{loyaltyAccount?.total_points_redeemed || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Visits</span>
            <span className="font-semibold">{customer.total_visits || 0}</span>
          </div>
        </div>

        {/* Tier Benefits */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Tier Benefits
          </h4>
          <div className="space-y-2 text-sm">
            {customer.membership_tier === 'platinum' && (
              <>
                <div className="flex items-center gap-2">
                  <Star className="h-3 w-3 text-purple-500" />
                  <span>5x points on all purchases</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-3 w-3 text-purple-500" />
                  <span>Free delivery on orders over UGX 50,000</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-3 w-3 text-purple-500" />
                  <span>Exclusive member discounts</span>
                </div>
              </>
            )}
            {customer.membership_tier === 'gold' && (
              <>
                <div className="flex items-center gap-2">
                  <Star className="h-3 w-3 text-yellow-500" />
                  <span>3x points on all purchases</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-3 w-3 text-yellow-500" />
                  <span>Free delivery on orders over UGX 25,000</span>
                </div>
              </>
            )}
            {customer.membership_tier === 'silver' && (
              <>
                <div className="flex items-center gap-2">
                  <Star className="h-3 w-3 text-gray-500" />
                  <span>2x points on all purchases</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-3 w-3 text-gray-500" />
                  <span>Birthday month bonus points</span>
                </div>
              </>
            )}
            {customer.membership_tier === 'bronze' && (
              <>
                <div className="flex items-center gap-2">
                  <Star className="h-3 w-3 text-blue-500" />
                  <span>1x points on all purchases</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-3 w-3 text-blue-500" />
                  <span>Welcome bonus: 50 points</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Next Tier Progress */}
        {customer.membership_tier !== 'platinum' && (
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Next Tier Progress</h4>
            <div className="space-y-2">
              {customer.membership_tier === 'bronze' && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>To Silver Tier</span>
                    <span>{Math.min((customer.total_spent || 0) / 100000 * 100, 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.min((customer.total_spent || 0) / 100000 * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Spend UGX {Math.max(0, 100000 - (customer.total_spent || 0)).toLocaleString()} more
                  </p>
                </div>
              )}
              {customer.membership_tier === 'silver' && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>To Gold Tier</span>
                    <span>{Math.min((customer.total_spent || 0) / 500000 * 100, 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{ width: `${Math.min((customer.total_spent || 0) / 500000 * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Spend UGX {Math.max(0, 500000 - (customer.total_spent || 0)).toLocaleString()} more
                  </p>
                </div>
              )}
              {customer.membership_tier === 'gold' && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>To Platinum Tier</span>
                    <span>{Math.min((customer.total_spent || 0) / 1000000 * 100, 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${Math.min((customer.total_spent || 0) / 1000000 * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Spend UGX {Math.max(0, 1000000 - (customer.total_spent || 0)).toLocaleString()} more
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}