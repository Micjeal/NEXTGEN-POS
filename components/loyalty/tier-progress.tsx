"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Trophy, Star, Shield, Award, Crown, TrendingUp, Target, Zap, Gift } from "lucide-react"

interface TierProgressProps {
  currentPoints: number
  currentTier: string
  totalEarned: number
  totalRedeemed: number
  joinDate: string
  tierColor?: string
  onViewRewards?: () => void
}

interface TierInfo {
  name: string
  displayName: string
  minPoints: number
  maxPoints: number | null
  color: string
  icon: React.ComponentType<{ className?: string }>
  benefits: string[]
}

const tiers: TierInfo[] = [
  {
    name: 'bronze',
    displayName: 'Bronze',
    minPoints: 0,
    maxPoints: 999,
    color: '#CD7F32',
    icon: Shield,
    benefits: ['1x Points Earning', 'Birthday Gift']
  },
  {
    name: 'silver',
    displayName: 'Silver',
    minPoints: 1000,
    maxPoints: 4999,
    color: '#C0C0C0',
    icon: Star,
    benefits: ['1.1x Points Earning', '2% Tier Discount', 'Birthday Gift']
  },
  {
    name: 'gold',
    displayName: 'Gold',
    minPoints: 5000,
    maxPoints: 9999,
    color: '#FFD700',
    icon: Award,
    benefits: ['1.2x Points Earning', '5% Tier Discount', 'Free Delivery', 'Priority Support']
  },
  {
    name: 'platinum',
    displayName: 'Platinum',
    minPoints: 10000,
    maxPoints: null,
    color: '#8B5CF6',
    icon: Crown,
    benefits: ['1.3x Points Earning', '10% Tier Discount', 'Free Delivery', 'Priority Support', 'Personal Shopper']
  }
]

export function TierProgress({
  currentPoints,
  currentTier,
  totalEarned,
  totalRedeemed,
  joinDate,
  tierColor,
  onViewRewards
}: TierProgressProps) {
  const [animatedPoints, setAnimatedPoints] = useState(0)
  const [progressToNext, setProgressToNext] = useState(0)

  const currentTierInfo = tiers.find(t => t.name === currentTier.toLowerCase()) || tiers[0]
  const currentTierIndex = tiers.findIndex(t => t.name === currentTier.toLowerCase())
  const nextTier = tiers[currentTierIndex + 1]
  const previousTiers = tiers.filter((t, i) => i < currentTierIndex)

  useEffect(() => {
    // Animate points on mount
    const duration = 1000
    const steps = 30
    const increment = (currentPoints - animatedPoints) / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if ((increment > 0 && current >= currentPoints) || (increment < 0 && current <= currentPoints)) {
        setAnimatedPoints(currentPoints)
        clearInterval(timer)
      } else {
        setAnimatedPoints(Math.round(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [currentPoints])

  useEffect(() => {
    // Calculate progress to next tier
    if (nextTier) {
      const pointsInCurrentTier = currentPoints - currentTierInfo.minPoints
      const pointsNeeded = nextTier.minPoints - currentTierInfo.minPoints
      const progress = Math.min(100, (pointsInCurrentTier / pointsNeeded) * 100)
      setProgressToNext(progress)
    } else {
      setProgressToNext(100)
    }
  }, [currentPoints, currentTierInfo, nextTier])

  const getTierIcon = (tier: string) => {
    const tierInfo = tiers.find(t => t.name === tier.toLowerCase())
    const Icon = tierInfo?.icon || Shield
    return <Icon className="h-5 w-5" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Current Tier Card */}
      <Card className="relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-5"
          style={{ backgroundColor: currentTierInfo.color }}
        />
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="p-3 rounded-full"
                style={{ backgroundColor: `${currentTierInfo.color}20` }}
              >
                <currentTierInfo.icon 
                  className="h-8 w-8"
                />
              </div>
              <div>
                <CardTitle className="text-2xl capitalize">{currentTierInfo.displayName} Member</CardTitle>
                <CardDescription>Member since {formatDate(joinDate)}</CardDescription>
              </div>
            </div>
            <Badge 
              className="text-lg px-4 py-2"
              style={{ 
                backgroundColor: `${currentTierInfo.color}20`,
                color: currentTierInfo.color
              }}
            >
              {currentPoints.toLocaleString()} Points
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress to Next Tier */}
          {nextTier && (
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  Progress to {nextTier.displayName}
                </span>
                <span className="font-medium">
                  {currentPoints.toLocaleString()} / {nextTier.minPoints.toLocaleString()}
                </span>
              </div>
              <Progress 
                value={progressToNext} 
                className="h-3"
                style={{
                  '--progress-background': currentTierInfo.color
                } as React.CSSProperties}
              />
              <p className="text-xs text-muted-foreground">
                {(nextTier.minPoints - currentPoints).toLocaleString()} more points to reach {nextTier.displayName}
              </p>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Earned</span>
              </div>
              <p className="text-2xl font-bold">{totalEarned.toLocaleString()}</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                <Zap className="h-4 w-4" />
                <span className="text-sm">Redeemed</span>
              </div>
              <p className="text-2xl font-bold">{totalRedeemed.toLocaleString()}</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                <Trophy className="h-4 w-4" />
                <span className="text-sm">Available</span>
              </div>
              <p className="text-2xl font-bold">{animatedPoints.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tier Journey */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Your Tier Journey
          </CardTitle>
          <CardDescription>Unlock more benefits as you progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-muted" />
            
            <div className="space-y-6">
              {/* Previous Tiers */}
              {previousTiers.map((tier, index) => (
                <div key={tier.name} className="relative flex items-center gap-4 pl-12">
                  <div 
                    className="absolute left-4 w-6 h-6 rounded-full flex items-center justify-center z-10"
                    style={{ backgroundColor: tier.color }}
                  >
                    <tier.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="p-3 bg-muted rounded-lg flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{tier.displayName}</span>
                        <Badge variant="secondary" className="text-xs">Unlocked</Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {tier.minPoints.toLocaleString()} pts
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Current Tier */}
              <div className="relative flex items-center gap-4 pl-12">
                <div 
                  className="absolute left-2 w-10 h-10 rounded-full flex items-center justify-center z-10 border-4 border-background"
                  style={{ backgroundColor: currentTierInfo.color }}
                >
                  <currentTierInfo.icon className="h-6 w-6 text-white" />
                </div>
                <div className="p-4 bg-primary/10 border-2 rounded-lg flex-1" style={{ borderColor: currentTierInfo.color }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{currentTierInfo.displayName}</span>
                      <Badge style={{ backgroundColor: currentTierInfo.color }} className="text-white">Current</Badge>
                    </div>
                    <span className="text-sm font-medium">
                      {currentTierInfo.minPoints.toLocaleString()} - {currentTierInfo.maxPoints?.toLocaleString() || '∞'} pts
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {currentTierInfo.benefits.map((benefit, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Next Tier */}
              {nextTier && (
                <div className="relative flex items-center gap-4 pl-12 opacity-60">
                  <div className="absolute left-4 w-6 h-6 rounded-full flex items-center justify-center z-10 bg-muted border-2 border-muted-foreground">
                    <nextTier.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="p-3 bg-muted rounded-lg flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{nextTier.displayName}</span>
                      <span className="text-sm text-muted-foreground">
                        {nextTier.minPoints.toLocaleString()} pts
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {nextTier.benefits.slice(0, 3).map((benefit, i) => (
                        <span key={i} className="text-xs text-muted-foreground">{benefit}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Future Tiers */}
              {tiers.slice(currentTierIndex + 2).map((tier) => (
                <div key={tier.name} className="relative flex items-center gap-4 pl-12 opacity-40">
                  <div className="absolute left-4 w-6 h-6 rounded-full flex items-center justify-center z-10 bg-muted">
                    <tier.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="p-3 bg-muted rounded-lg flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{tier.displayName}</span>
                      <span className="text-sm text-muted-foreground">
                        {tier.minPoints.toLocaleString()} pts
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {onViewRewards && (
        <div className="flex justify-center">
          <Button size="lg" onClick={onViewRewards}>
            <Gift className="h-5 w-5 mr-2" />
            View Available Rewards
          </Button>
        </div>
      )}
    </div>
  )
}
