"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Star, Crown, Shield, Award, TrendingUp, RefreshCw } from "lucide-react"

interface TierBenefits {
  birthday_discount: boolean
  free_delivery: boolean
  priority_support: boolean
  personal_shopper: boolean
}

interface Tier {
  id: string
  tier_name: string
  display_name: string
  description: string | null
  min_points: number
  max_points: number | null
  min_spending: number
  max_spending: number | null
  earning_multiplier: number
  redemption_multiplier: number
  tier_discount_percent: number
  tier_color: string
  benefits: TierBenefits
  sort_order: number
}

interface TierManagementProps {
  initialTiers: Tier[]
}

const tierIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  bronze: Shield,
  silver: Star,
  gold: Award,
  platinum: Crown
}

const tierColors: Record<string, string> = {
  bronze: "bg-orange-500",
  silver: "bg-gray-400",
  gold: "bg-yellow-500",
  platinum: "bg-purple-500"
}

const defaultBenefits: TierBenefits = {
  birthday_discount: false,
  free_delivery: false,
  priority_support: false,
  personal_shopper: false
}

const benefitLabels: Record<keyof TierBenefits, string> = {
  birthday_discount: "Birthday Discount",
  free_delivery: "Free Delivery",
  priority_support: "Priority Support",
  personal_shopper: "Personal Shopper"
}

export function TierManagement({ initialTiers }: TierManagementProps) {
  const [tiers, setTiers] = useState<Tier[]>(initialTiers)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTier, setEditingTier] = useState<Tier | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState<{
    tier_name: string
    display_name: string
    description: string
    min_points: number
    max_points: number | null
    min_spending: number
    max_spending: number | null
    earning_multiplier: number
    redemption_multiplier: number
    tier_discount_percent: number
    tier_color: string
    benefits: TierBenefits
  }>({
    tier_name: "",
    display_name: "",
    description: "",
    min_points: 0,
    max_points: null,
    min_spending: 0,
    max_spending: null,
    earning_multiplier: 1.0,
    redemption_multiplier: 1.0,
    tier_discount_percent: 0,
    tier_color: "#888888",
    benefits: { ...defaultBenefits }
  })

  const handleEdit = (tier: Tier) => {
    setEditingTier(tier)
    setFormData({
      tier_name: tier.tier_name,
      display_name: tier.display_name,
      description: tier.description || "",
      min_points: tier.min_points,
      max_points: tier.max_points,
      min_spending: tier.min_spending,
      max_spending: tier.max_spending,
      earning_multiplier: tier.earning_multiplier,
      redemption_multiplier: tier.redemption_multiplier,
      tier_discount_percent: tier.tier_discount_percent,
      tier_color: tier.tier_color,
      benefits: { ...tier.benefits }
    })
    setIsDialogOpen(true)
  }

  const handleNew = () => {
    setEditingTier(null)
    setFormData({
      tier_name: "",
      display_name: "",
      description: "",
      min_points: 0,
      max_points: null,
      min_spending: 0,
      max_spending: null,
      earning_multiplier: 1.0,
      redemption_multiplier: 1.0,
      tier_discount_percent: 0,
      tier_color: "#888888",
      benefits: { ...defaultBenefits }
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/loyalty/tiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save tier')
      }

      toast({
        title: "Success",
        description: `Tier ${editingTier ? 'updated' : 'created'} successfully`
      })

      setIsDialogOpen(false)
      const refreshResponse = await fetch('/api/loyalty/tiers')
      const refreshData = await refreshResponse.json()
      setTiers(refreshData.tiers || [])
    } catch (error) {
      console.error('Error saving tier:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save tier",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRecalculateTiers = async () => {
    setRecalculating(true)
    try {
      const response = await fetch('/api/loyalty/tiers/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recalculate: true })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to recalculate tiers')
      }

      const data = await response.json()
      toast({
        title: "Success",
        description: data.message
      })
    } catch (error) {
      console.error('Error recalculating tiers:', error)
      toast({
        title: "Error",
        description: "Failed to recalculate tiers",
        variant: "destructive"
      })
    } finally {
      setRecalculating(false)
    }
  }

  const getTierIcon = (tierName: string) => {
    const Icon = tierIcons[tierName.toLowerCase()] || Star
    return <Icon className={`h-5 w-5 ${tierColors[tierName.toLowerCase()]?.replace('bg-', 'text-')}`} />
  }

  const getTierIconComponent = (tierName: string) => {
    const Icon = tierIcons[tierName.toLowerCase()] || Star
    return Icon
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Loyalty Tiers</h2>
          <p className="text-muted-foreground">Configure tier levels and benefits</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRecalculateTiers} disabled={recalculating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
            Recalculate All Tiers
          </Button>
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Tier
          </Button>
        </div>
      </div>

      {/* Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiers.map((tier) => {
          const Icon = getTierIconComponent(tier.tier_name)
          const colorClass = tierColors[tier.tier_name.toLowerCase()] || "bg-gray-500"
          const textColorClass = colorClass.replace('bg-', 'text-')
          
          return (
            <Card key={tier.id} className="relative overflow-hidden">
              <div className={`h-2 ${colorClass}`} />
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-full ${colorClass} bg-opacity-10`}>
                    <Icon className={`h-6 w-6 ${textColorClass}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{tier.display_name}</CardTitle>
                    <Badge variant="outline" className="mt-1">{tier.tier_name}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{tier.description}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Points Range</span>
                    <span className="font-medium">
                      {tier.min_points.toLocaleString()} - {tier.max_points ? tier.max_points.toLocaleString() : '∞'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Spending Range</span>
                    <span className="font-medium">
                      UGX {tier.min_spending.toLocaleString()} - {tier.max_spending ? `UGX ${tier.max_spending.toLocaleString()}` : '∞'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-muted rounded">
                    <span className="text-muted-foreground">Earning</span>
                    <p className="font-semibold">{tier.earning_multiplier}x</p>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <span className="text-muted-foreground">Discount</span>
                    <p className="font-semibold">{tier.tier_discount_percent}%</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {tier.benefits.birthday_discount && (
                    <Badge variant="secondary" className="text-xs">Birthday</Badge>
                  )}
                  {tier.benefits.free_delivery && (
                    <Badge variant="secondary" className="text-xs">Free Delivery</Badge>
                  )}
                  {tier.benefits.priority_support && (
                    <Badge variant="secondary" className="text-xs">Priority</Badge>
                  )}
                  {tier.benefits.personal_shopper && (
                    <Badge variant="secondary" className="text-xs">Personal Shopper</Badge>
                  )}
                </div>

                <Button variant="outline" size="sm" className="w-full" onClick={() => handleEdit(tier)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Tier
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tier Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tier Comparison
          </CardTitle>
          <CardDescription>Compare benefits across all tiers</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Benefit</TableHead>
                {tiers.map((tier) => {
                  const Icon = getTierIconComponent(tier.tier_name)
                  return (
                    <TableHead key={tier.id} className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getTierIcon(tier.tier_name)}
                        {tier.display_name}
                      </div>
                    </TableHead>
                  )
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Points Multiplier</TableCell>
                {tiers.map((tier) => (
                  <TableCell key={tier.id} className="text-center font-medium">
                    {tier.earning_multiplier}x
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Tier Discount</TableCell>
                {tiers.map((tier) => (
                  <TableCell key={tier.id} className="text-center font-medium">
                    {tier.tier_discount_percent}%
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Birthday Bonus</TableCell>
                {tiers.map((tier) => (
                  <TableCell key={tier.id} className="text-center">
                    {tier.benefits.birthday_discount ? '✓' : '✗'}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Free Delivery</TableCell>
                {tiers.map((tier) => (
                  <TableCell key={tier.id} className="text-center">
                    {tier.benefits.free_delivery ? '✓' : '✗'}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Priority Support</TableCell>
                {tiers.map((tier) => (
                  <TableCell key={tier.id} className="text-center">
                    {tier.benefits.priority_support ? '✓' : '✗'}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Personal Shopper</TableCell>
                {tiers.map((tier) => (
                  <TableCell key={tier.id} className="text-center">
                    {tier.benefits.personal_shopper ? '✓' : '✗'}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTier ? 'Edit Tier' : 'Create New Tier'}</DialogTitle>
            <DialogDescription>
              Configure tier settings and benefits
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tier_name">Tier Key (lowercase)</Label>
                <Input
                  id="tier_name"
                  value={formData.tier_name}
                  onChange={(e) => setFormData({ ...formData, tier_name: e.target.value.toLowerCase() })}
                  placeholder="bronze, silver, gold, platinum"
                  disabled={!!editingTier}
                />
              </div>
              <div>
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Bronze Member"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description of this tier"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min_points">Minimum Points</Label>
                <Input
                  id="min_points"
                  type="number"
                  value={formData.min_points}
                  onChange={(e) => setFormData({ ...formData, min_points: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="max_points">Maximum Points (leave empty for no limit)</Label>
                <Input
                  id="max_points"
                  type="number"
                  value={formData.max_points || ''}
                  onChange={(e) => setFormData({ ...formData, max_points: e.target.value ? parseInt(e.target.value) : null })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min_spending">Minimum Spending (UGX)</Label>
                <Input
                  id="min_spending"
                  type="number"
                  value={formData.min_spending}
                  onChange={(e) => setFormData({ ...formData, min_spending: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="max_spending">Maximum Spending (UGX)</Label>
                <Input
                  id="max_spending"
                  type="number"
                  value={formData.max_spending || ''}
                  onChange={(e) => setFormData({ ...formData, max_spending: e.target.value ? parseFloat(e.target.value) : null })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="earning_multiplier">Points Multiplier</Label>
                <Input
                  id="earning_multiplier"
                  type="number"
                  step="0.1"
                  value={formData.earning_multiplier}
                  onChange={(e) => setFormData({ ...formData, earning_multiplier: parseFloat(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label htmlFor="redemption_multiplier">Redemption Multiplier</Label>
                <Input
                  id="redemption_multiplier"
                  type="number"
                  step="0.1"
                  value={formData.redemption_multiplier}
                  onChange={(e) => setFormData({ ...formData, redemption_multiplier: parseFloat(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label htmlFor="tier_discount_percent">Tier Discount (%)</Label>
                <Input
                  id="tier_discount_percent"
                  type="number"
                  step="0.5"
                  value={formData.tier_discount_percent}
                  onChange={(e) => setFormData({ ...formData, tier_discount_percent: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label>Tier Color</Label>
              <div className="flex gap-2 mt-2">
                {['#CD7F32', '#C0C0C0', '#FFD700', '#E5E4E2', '#3B82F6', '#8B5CF6', '#EF4444'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${formData.tier_color === color ? 'border-black' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, tier_color: color })}
                    title={`Color ${color}`}
                  />
                ))}
                <input
                  type="color"
                  value={formData.tier_color}
                  onChange={(e) => setFormData({ ...formData, tier_color: e.target.value })}
                  className="w-8 h-8"
                  title="Custom color"
                />
              </div>
            </div>

            <div>
              <Label>Benefits</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {(Object.keys(defaultBenefits) as Array<keyof TierBenefits>).map((benefit) => (
                  <label key={benefit} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={formData.benefits[benefit]}
                      onChange={(e) => setFormData({
                        ...formData,
                        benefits: { ...formData.benefits, [benefit]: e.target.checked }
                      })}
                    />
                    <span className="text-sm">{benefitLabels[benefit]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isProcessing}>
                {isProcessing ? 'Saving...' : (editingTier ? 'Update Tier' : 'Create Tier')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
