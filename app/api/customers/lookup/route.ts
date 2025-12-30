import { createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')
    const email = searchParams.get('email')

    if (!phone && !email) {
      return NextResponse.json({ error: "Phone or email parameter is required" }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    let customer = null
    let registeredCustomer = null

    // First try to find in customers table
    if (phone) {
      const { data: customerData } = await serviceClient
        .from("customers")
        .select(`
          id, phone, email, full_name, membership_tier, total_spent, total_visits,
          registered_customer_id
        `)
        .eq("phone", phone)
        .eq("is_active", true)
        .single()

      if (customerData) {
        customer = customerData
      }
    }

    if (email && !customer) {
      const { data: customerData } = await serviceClient
        .from("customers")
        .select(`
          id, phone, email, full_name, membership_tier, total_spent, total_visits,
          registered_customer_id
        `)
        .eq("email", email)
        .eq("is_active", true)
        .single()

      if (customerData) {
        customer = customerData
      }
    }

    // If not found in customers, try registered customers
    if (!customer) {
      if (phone) {
        const { data: regCustomerData } = await serviceClient
          .from("registered_customers")
          .select("id, phone, email, full_name, registration_date")
          .eq("phone", phone)
          .eq("is_active", true)
          .single()

        if (regCustomerData) {
          registeredCustomer = regCustomerData
        }
      }

      if (email && !registeredCustomer) {
        const { data: regCustomerData } = await serviceClient
          .from("registered_customers")
          .select("id, phone, email, full_name, registration_date")
          .eq("email", email)
          .eq("is_active", true)
          .single()

        if (regCustomerData) {
          registeredCustomer = regCustomerData
        }
      }
    }

    if (!customer && !registeredCustomer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // If we found a registered customer, check if they have a customer record
    if (registeredCustomer && !customer) {
      const { data: customerData } = await serviceClient
        .from("customers")
        .select(`
          id, phone, email, full_name, membership_tier, total_spent, total_visits,
          registered_customer_id
        `)
        .eq("registered_customer_id", registeredCustomer.id)
        .single()

      if (customerData) {
        customer = customerData
      }
    }

    // Get loyalty info if customer exists
    let loyaltyInfo = null
    if (customer) {
      const { data: loyaltyAccount } = await serviceClient
        .from("customer_loyalty_accounts")
        .select(`
          current_points,
          tier,
          loyalty_program:loyalty_programs(name, points_per_currency, redemption_rate)
        `)
        .eq("customer_id", customer.id)
        .eq("is_active", true)
        .single()

      if (loyaltyAccount) {
        loyaltyInfo = loyaltyAccount
      }
    }

    return NextResponse.json({
      customer,
      registeredCustomer,
      loyaltyInfo,
      hasPurchased: !!customer
    })

  } catch (error) {
    console.error("Customer lookup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}