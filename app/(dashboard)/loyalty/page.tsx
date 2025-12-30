import { createClient } from "@/lib/supabase/server"
import { LoyaltyManagement } from "@/components/loyalty/loyalty-management"
import type { Customer, LoyaltyProgram, CustomerLoyaltyAccount } from "@/lib/types/database"

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Loyalty Management</h1>
          <p className="text-muted-foreground">Manage customer loyalty points and programs</p>
        </div>
      </div>

      <LoyaltyManagement
        programs={(programs as LoyaltyProgram[]) || []}
        accounts={(accounts as (CustomerLoyaltyAccount & {
          customer: Customer
          loyalty_program: LoyaltyProgram
        })[]) || []}
      />
    </div>
  )
}