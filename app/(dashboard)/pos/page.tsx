import { createClient, createServiceClient } from "@/lib/supabase/server"
import { POSTerminal } from "@/components/pos/pos-terminal"
import type { Product, PaymentMethod } from "@/lib/types/database"
import { cookies } from "next/headers"

export default async function POSPage() {
    const supabase = await createClient()
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.getAll().map(({ name, value }) => `${name}=${value}`).join('; ')

    // Fetch active products with inventory via API
    console.log('POS: Starting to fetch products via API...')
    const productsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/products`, {
      cache: 'no-store', // Ensure fresh data
      headers: {
        'Cookie': cookieHeader
      }
    })
    let productsData;
    try {
      productsData = await productsResponse.json();
    } catch {
      productsData = { error: 'Failed to parse response' };
    }
    const products = productsData.products || []

    console.log('POS: Products fetch result:', { products: products?.length || 0, error: !productsResponse.ok ? productsData.error : null })
    if (!productsResponse.ok) {
      console.error('POS: Products fetch error:', productsData.error)
    }
 // Fetch active payment methods

 const { data: paymentMethods } = await supabase.from("payment_methods").select("*").eq("is_active", true)

    // Fetch system settings
    const settingsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/settings`, {
      cache: 'no-store', // Ensure fresh data
      headers: {
        'Cookie': cookieHeader
      }
    })
    const settings = settingsResponse.ok ? await settingsResponse.json() : { currency: 'UGX' }

   return (
     <div className="h-full">
       <POSTerminal
         products={(products as Product[]) || []}
         paymentMethods={(paymentMethods as PaymentMethod[]) || []}
         currency={settings.currency || 'UGX'}
       />
     </div>
   )
 }
