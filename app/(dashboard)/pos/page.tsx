import { createClient } from "@/lib/supabase/server"
import { POSTerminal } from "@/components/pos/pos-terminal"
import type { Product, PaymentMethod } from "@/lib/types/database"

export default async function POSPage() {
  const supabase = await createClient()

  // Fetch active products with inventory
  const { data: products } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(*),
      inventory(*)
    `)
    .eq("is_active", true)
    .not("inventory", "is", null) // Only include products with inventory
    .order("name")

  // Fetch active payment methods
  const { data: paymentMethods } = await supabase.from("payment_methods").select("*").eq("is_active", true)

  return (
    <div className="h-full">
      <POSTerminal
        products={(products as Product[]) || []}
        paymentMethods={(paymentMethods as PaymentMethod[]) || []}
      />
    </div>
  )
}
