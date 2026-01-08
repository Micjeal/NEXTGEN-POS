import { createClient } from "@/lib/supabase/server"
import { LoyaltyManagement } from "@/components/loyalty/loyalty-management"
import { TierManagement } from "@/components/loyalty/tier-management"
import { RewardsCatalog } from "@/components/loyalty/rewards-catalog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Customer, LoyaltyProgram, CustomerLoyaltyAccount } from "@/lib/types/database"

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

interface Reward {
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

function transformTier(tier: any): Tier {
  return {
    ...tier,
    benefits: {
      birthday_discount: tier.benefits?.birthday_discount ?? false,
      free_delivery: tier.benefits?.free_delivery ?? false,
      priority_support: tier.benefits?.priority_support ?? false,
      personal_shopper: tier.benefits?.personal_shopper ?? false
    }
  }
}

const defaultTiers: Tier[] = [
  transformTier({
    id: '1',
    tier_name: 'bronze',
    display_name: 'Bronze',
    description: 'Entry level membership',
    min_points: 0,
    max_points: 999,
    min_spending: 0,
    max_spending: 499999,
    earning_multiplier: 1.0,
    redemption_multiplier: 1.0,
    tier_discount_percent: 0,
    tier_color: '#CD7F32',
    benefits: { birthday_discount: false, free_delivery: false, priority_support: false, personal_shopper: false },
    sort_order: 1
  }),
  transformTier({
    id: '2',
    tier_name: 'silver',
    display_name: 'Silver',
    description: 'Silver membership with additional benefits',
    min_points: 1000,
    max_points: 4999,
    min_spending: 500000,
    max_spending: 1999999,
    earning_multiplier: 1.1,
    redemption_multiplier: 1.05,
    tier_discount_percent: 2,
    tier_color: '#C0C0C0',
    benefits: { birthday_discount: true, free_delivery: false, priority_support: false, personal_shopper: false },
    sort_order: 2
  }),
  transformTier({
    id: '3',
    tier_name: 'gold',
    display_name: 'Gold',
    description: 'Premium membership with great perks',
    min_points: 5000,
    max_points: 9999,
    min_spending: 2000000,
    max_spending: 4999999,
    earning_multiplier: 1.2,
    redemption_multiplier: 1.1,
    tier_discount_percent: 5,
    tier_color: '#FFD700',
    benefits: { birthday_discount: true, free_delivery: true, priority_support: true, personal_shopper: false },
    sort_order: 3
  }),
  transformTier({
    id: '4',
    tier_name: 'platinum',
    display_name: 'Platinum',
    description: 'VIP membership with exclusive benefits',
    min_points: 10000,
    max_points: null,
    min_spending: 5000000,
    max_spending: null,
    earning_multiplier: 1.3,
    redemption_multiplier: 1.15,
    tier_discount_percent: 10,
    tier_color: '#8B5CF6',
    benefits: { birthday_discount: true, free_delivery: true, priority_support: true, personal_shopper: true },
    sort_order: 4
  })
]

export default async function LoyaltyPage() {
  const supabase = await createClient()

  // Get loyalty programs
  const { data: programs } = await supabase
    .from("loyalty_programs")
    .select("*")
    .eq("is_active", true)
    .order("name")

  // Get customer loyalty accounts with customer details
  const { data: accounts } = await supabase
    .from("customer_loyalty_accounts")
    .select(`
      *,
      customer:customers(
        id,
        full_name,
        phone,
        email,
        membership_tier,
        total_spent,
        total_visits,
        last_visit_date
      ),
      loyalty_program:loyalty_programs(name, points_per_currency)
    `)
    .order("updated_at", { ascending: false })

  // Get loyalty tiers
  let { data: tiersData } = await supabase
    .from("loyalty_tiers")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  // If tiers table doesn't exist or returns null, use default tiers
  const tiers: Tier[] = tiersData 
    ? tiersData.map(transformTier)
    : defaultTiers

  // Get rewards
  let { data: rewards } = await supabase
    .from("rewards")
    .select(`
      *,
      tier:min_tier_name(tier_name, display_name, tier_color)
    `)
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("points_cost", { ascending: true })

  // If rewards table doesn't exist, use empty array
  if (!rewards) {
    rewards = []
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Loyalty Management</h1>
          <p className="text-muted-foreground">Manage customer loyalty, tiers, and rewards</p>
        </div>
      </div>

      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="tiers">Tiers</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <LoyaltyManagement
            programs={(programs as LoyaltyProgram[]) || []}
            accounts={(accounts as (CustomerLoyaltyAccount & {
              customer: Customer
              loyalty_program: LoyaltyProgram
            })[]) || []}
          />
        </TabsContent>

        <TabsContent value="tiers">
          <TierManagement initialTiers={tiers} />
        </TabsContent>

        <TabsContent value="rewards">
          <RewardsCatalog 
            initialRewards={(rewards as Reward[]) || []} 
            isAdmin={true}
          />
        </TabsContent>

        <TabsContent value="programs">
          <LoyaltyManagement
            programs={(programs as LoyaltyProgram[]) || []}
            accounts={(accounts as (CustomerLoyaltyAccount & {
              customer: Customer
              loyalty_program: LoyaltyProgram
            })[]) || []}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
