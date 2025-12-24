import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// POST /api/customers - Create a new customer
export async function POST(request: NextRequest) {
  try {
    // Check if the requester is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { phone, full_name, email, date_of_birth, gender, address, city, country, notes } = await request.json()

    if (!phone || !full_name) {
      return NextResponse.json({ error: "Phone and full name are required" }, { status: 400 })
    }

    // Check if customer with this phone already exists
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("phone", phone)
      .single()

    if (existingCustomer) {
      return NextResponse.json({ error: "Customer with this phone number already exists" }, { status: 400 })
    }

    // Create customer - handle empty strings for optional fields
    const customerData = {
      phone,
      full_name,
      email: email || null,
      date_of_birth: date_of_birth || null,
      gender: gender || null,
      address: address || null,
      city: city || null,
      country: country || 'Uganda',
      notes: notes || null,
      membership_tier: 'bronze',
      total_spent: 0,
      total_visits: 0,
      is_active: true,
      first_visit_date: new Date().toISOString(),
    }

    const { data: customer, error: insertError } = await supabase
      .from("customers")
      .insert(customerData)
      .select()
      .single()

    if (insertError) {
      console.error("Database insert error:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Send welcome email if customer has email address
    if (customer.email) {
      try {
        // Trigger welcome email asynchronously
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/emails/customer-welcome`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ customerId: customer.id })
        }).catch(error => {
          console.error('Failed to send welcome email:', error)
        })
      } catch (emailError) {
        console.error('Error triggering welcome email:', emailError)
        // Don't fail the customer creation if email fails
      }
    }

    return NextResponse.json({
      success: true,
      customer
    })
  } catch (error) {
    console.error("Create customer error:", error)
    console.error("Error details:", JSON.stringify(error, null, 2))
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// GET /api/customers - Get all customers (with optional search)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    let query = supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false })

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: customers, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ customers: customers || [] })
  } catch (error) {
    console.error("Get customers error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}