"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash, Gift, Star, ShoppingCart, Percent, Truck, Sparkles, CreditCard } from "lucide-react"

export interface Reward {
  id: string
  name: string
  description: string | null
  points_cost: number
  monetary_value: number
  reward_type: string
  discount_percent: number
  discount_fixed_amount: number
  image_url: string | null
  stock_quantity: number | null
  min_tier_name: string | null
  is_active: boolean
  is_featured: boolean
  tier?: {
    tier_name: string
    display_name: string
    tier_color: string
  }
}

interface RewardsCatalogProps {
  initialRewards: Reward[]
  userTier?: string
  userPoints?: number
  isAdmin?: boolean
}

const rewardTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  discount_fixed: Percent,
  discount_percent: Percent,
  free_product: Gift,
  free_delivery: Truck,
  gift_card: CreditCard,
  experience: Sparkles,
  merchandise: ShoppingCart,
  points_boost: Star
}

const rewardTypeLabels: Record<string, string> = {
  discount_fixed: "Fixed Discount",
  discount_percent: "Percentage Off",
  free_product: "Free Product",
  free_delivery: "Free Delivery",
  gift_card: "Gift Card",
  experience: "Experience",
  merchandise: "Merchandise",
  points_boost: "Points Boost"
}

export function RewardsCatalog({ 
  initialRewards, 
  userTier = 'bronze', 
  userPoints = 0,
  isAdmin = false 
}: RewardsCatalogProps) {
  const [rewards, setRewards] = useState<Reward[]>(initialRewards)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingReward, setEditingReward] = useState<Reward | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [isRedeemDialogOpen, setIsRedeemDialogOpen] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    points_cost: 0,
    monetary_value: 0,
    reward_type: "discount_percent",
    discount_percent: 0,
    discount_fixed_amount: 0,
    image_url: "",
    stock_quantity: null as number | null,
    min_tier_name: "",
    is_active: true,
    is_featured: false
  })

  const tierHierarchy = ['bronze', 'silver', 'gold', 'platinum']
  const userTierIndex = tierHierarchy.indexOf(userTier.toLowerCase())

  const canRedeem = (reward: Reward) => {
    if (userPoints < reward.points_cost) return false
    if (reward.min_tier_name) {
      const requiredTierIndex = tierHierarchy.indexOf(reward.min_tier_name)
      if (userTierIndex < requiredTierIndex) return false
    }
    return true
  }

  const handleEdit = (reward: Reward) => {
    setEditingReward(reward)
    setFormData({
      name: reward.name,
      description: reward.description || "",
      points_cost: reward.points_cost,
      monetary_value: reward.monetary_value,
      reward_type: reward.reward_type,
      discount_percent: reward.discount_percent,
      discount_fixed_amount: reward.discount_fixed_amount,
      image_url: reward.image_url || "",
      stock_quantity: reward.stock_quantity,
      min_tier_name: reward.min_tier_name || "",
      is_active: reward.is_active,
      is_featured: reward.is_featured
    })
    setIsDialogOpen(true)
  }

  const handleNew = () => {
    setEditingReward(null)
    setFormData({
      name: "",
      description: "",
      points_cost: 0,
      monetary_value: 0,
      reward_type: "discount_percent",
      discount_percent: 0,
      discount_fixed_amount: 0,
      image_url: "",
      stock_quantity: null,
      min_tier_name: "",
      is_active: true,
      is_featured: false
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/loyalty/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save reward')
      }

      toast({
        title: "Success",
        description: `Reward ${editingReward ? 'updated' : 'created'} successfully`
      })

      setIsDialogOpen(false)
      const refreshResponse = await fetch('/api/loyalty/rewards')
      const refreshData = await refreshResponse.json()
      setRewards(refreshData.rewards || [])
    } catch (error) {
      console.error('Error saving reward:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save reward",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRedeem = async () => {
    if (!selectedReward) return

    setIsProcessing(true)
    try {
      const response = await fetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId: selectedReward.id })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to redeem reward')
      }

      const data = await response.json()
      
      toast({
        title: "Success",
        description: `Successfully redeemed ${selectedReward.name}! Code: ${data.redemption.redemption_code}`
      })

      setIsRedeemDialogOpen(false)
      setSelectedReward(null)
    } catch (error) {
      console.error('Error redeeming reward:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to redeem reward",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getRewardIcon = (type: string) => {
    const Icon = rewardTypeIcons[type] || Gift
    return <Icon className="h-6 w-6" />
  }

  const filteredRewards = rewards.filter(r => {
    if (!r.is_active) return false
    if (r.min_tier_name) {
      const requiredTierIndex = tierHierarchy.indexOf(r.min_tier_name)
      if (userTierIndex < requiredTierIndex) return false
    }
    return true
  })

  const featuredRewards = filteredRewards.filter(r => r.is_featured)
  const regularRewards = filteredRewards.filter(r => !r.is_featured)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rewards Catalog</h2>
          <p className="text-muted-foreground">Redeem your points for exclusive rewards</p>
        </div>
        {isAdmin && (
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Reward
          </Button>
        )}
      </div>

      {/* User Balance Card */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
        <CardContent className="flex items-center justify-between py-6">
          <div>
            <p className="text-sm opacity-90">Your Points Balance</p>
            <p className="text-4xl font-bold">{userPoints.toLocaleString()}</p>
            <p className="text-sm opacity-90 mt-1">Current Tier: <span className="font-semibold capitalize">{userTier}</span></p>
          </div>
          <Gift className="h-16 w-16 opacity-50" />
        </CardContent>
      </Card>

      {/* Featured Rewards */}
      {featuredRewards.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Featured Rewards
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredRewards.map((reward) => {
              const Icon = rewardTypeIcons[reward.reward_type] || Gift
              const canRedeemThis = canRedeem(reward)
              
              return (
                <Card key={reward.id} className="relative overflow-hidden">
                  {reward.tier && (
                    <div 
                      className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: reward.tier.tier_color }}
                    >
                      {reward.tier.display_name}
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{reward.name}</CardTitle>
                        <Badge variant="secondary" className="mt-1">
                          {rewardTypeLabels[reward.reward_type]}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{reward.description}</p>
                    
                    {reward.reward_type === 'discount_percent' && reward.discount_percent > 0 && (
                      <p className="text-2xl font-bold text-primary">{reward.discount_percent}% OFF</p>
                    )}
                    {reward.reward_type === 'discount_fixed' && reward.discount_fixed_amount > 0 && (
                      <p className="text-2xl font-bold text-primary">UGX {reward.discount_fixed_amount.toLocaleString()} OFF</p>
                    )}
                    {reward.monetary_value > 0 && (
                      <p className="text-2xl font-bold text-primary">Value: UGX {reward.monetary_value.toLocaleString()}</p>
                    )}
                    {reward.reward_type === 'free_delivery' && (
                      <p className="text-2xl font-bold text-primary">Free Delivery</p>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Cost</p>
                        <p className="text-xl font-bold">{reward.points_cost.toLocaleString()} pts</p>
                      </div>
                      {isAdmin ? (
                        <Button variant="outline" size="sm" onClick={() => handleEdit(reward)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          disabled={!canRedeemThis}
                          onClick={() => {
                            setSelectedReward(reward)
                            setIsRedeemDialogOpen(true)
                          }}
                        >
                          {canRedeemThis ? 'Redeem' : 'Not Eligible'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* All Rewards */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">All Rewards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {regularRewards.map((reward) => {
            const Icon = rewardTypeIcons[reward.reward_type] || Gift
            const canRedeemThis = canRedeem(reward)
            
            return (
              <Card key={reward.id} className={`relative overflow-hidden ${!canRedeemThis ? 'opacity-60' : ''}`}>
                {reward.tier && (
                  <div 
                    className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: reward.tier.tier_color }}
                  >
                    {reward.tier.display_name}
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{reward.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground line-clamp-2">{reward.description}</p>
                  
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-lg font-bold">{reward.points_cost.toLocaleString()} pts</span>
                    {isAdmin ? (
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(reward)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        variant={canRedeemThis ? "default" : "outline"} 
                        size="sm"
                        disabled={!canRedeemThis}
                        onClick={() => {
                          setSelectedReward(reward)
                          setIsRedeemDialogOpen(true)
                        }}
                      >
                        {canRedeemThis ? 'Redeem' : 'Need More Points'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredRewards.length === 0 && (
          <div className="text-center py-12">
            <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No rewards available</h3>
            <p className="text-muted-foreground">Check back later for new rewards</p>
          </div>
        )}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingReward ? 'Edit Reward' : 'Create New Reward'}</DialogTitle>
            <DialogDescription>
              Configure reward settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Reward Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., 10% Off Next Purchase"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the reward"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="points_cost">Points Cost</Label>
                <Input
                  id="points_cost"
                  type="number"
                  value={formData.points_cost}
                  onChange={(e) => setFormData({ ...formData, points_cost: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="monetary_value">Monetary Value (UGX)</Label>
                <Input
                  id="monetary_value"
                  type="number"
                  value={formData.monetary_value}
                  onChange={(e) => setFormData({ ...formData, monetary_value: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="reward_type">Reward Type</Label>
              <Select 
                value={formData.reward_type} 
                onValueChange={(value) => setFormData({ ...formData, reward_type: value })}
              >
                <SelectTrigger id="reward_type">
                  <SelectValue placeholder="Select reward type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(rewardTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discount_percent">Discount Percent</Label>
                <Input
                  id="discount_percent"
                  type="number"
                  step="0.1"
                  value={formData.discount_percent}
                  onChange={(e) => setFormData({ ...formData, discount_percent: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="discount_fixed_amount">Fixed Discount (UGX)</Label>
                <Input
                  id="discount_fixed_amount"
                  type="number"
                  value={formData.discount_fixed_amount}
                  onChange={(e) => setFormData({ ...formData, discount_fixed_amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                />
                <span className="text-sm">Featured Reward</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <span className="text-sm">Active</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={isProcessing}>
                {isProcessing ? 'Saving...' : (editingReward ? 'Update' : 'Create')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Redeem Confirmation Dialog */}
      <Dialog open={isRedeemDialogOpen} onOpenChange={setIsRedeemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Redemption</DialogTitle>
            <DialogDescription>
              Are you sure you want to redeem this reward?
            </DialogDescription>
          </DialogHeader>
          {selectedReward && (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {getRewardIcon(selectedReward.reward_type)}
                    </div>
                    <div>
                      <p className="font-semibold">{selectedReward.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedReward.description}</p>
                    </div>
                  </div>
                  <div className="flex justify-between py-2 border-t">
                    <span>Points Cost:</span>
                    <span className="font-bold">{selectedReward.points_cost.toLocaleString()} pts</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span>Your Balance:</span>
                    <span className="font-bold">{userPoints.toLocaleString()} pts</span>
                  </div>
                  <div className="flex justify-between py-2 border-t font-semibold">
                    <span>After Redemption:</span>
                    <span className="text-green-600">
                      {(userPoints - selectedReward.points_cost).toLocaleString()} pts
                    </span>
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsRedeemDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRedeem} disabled={isProcessing}>
                  {isProcessing ? 'Redeeming...' : 'Confirm Redemption'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
