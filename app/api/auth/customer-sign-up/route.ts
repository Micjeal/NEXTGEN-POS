import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { phone, full_name, email, password, date_of_birth, gender, address, city, country } = await request.json()

    if (!phone || !full_name || !email || !password) {
      return NextResponse.json({ error: "Phone, full name, email, and password are required" }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // Check if registered customer with this phone already exists
    const { data: existingRegisteredCustomer } = await serviceClient
      .from("registered_customers")
      .select("id")
      .eq("phone", phone)
      .single()

    if (existingRegisteredCustomer) {
      return NextResponse.json({ error: "Customer with this phone number already exists" }, { status: 400 })
    }

    // Check if email already exists
    const { data: existingEmailCustomer } = await serviceClient
      .from("registered_customers")
      .select("id")
      .eq("email", email)
      .single()

    if (existingEmailCustomer) {
      return NextResponse.json({ error: "Customer with this email already exists" }, { status: 400 })
    }

    // Use admin client to create user (ensures user is fully created before inserting into registered_customers)
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Create user in auth with email confirmed
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email so user can login immediately
      user_metadata: {
        full_name,
        phone,
        role: 'customer'
      }
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Failed to create user account" }, { status: 500 })
    }

    // Create registered customer record
    const registeredCustomerData = {
      user_id: authData.user.id,
      phone,
      full_name,
      email,
      date_of_birth: date_of_birth || null,
      gender: gender || null,
      address: address || null,
      city: city || null,
      country: country || 'Uganda',
      registration_date: new Date().toISOString(),
      is_active: true
    }

    const { data: registeredCustomer, error: customerError } = await serviceClient
      .from("registered_customers")
      .insert(registeredCustomerData)
      .select()
      .single()

    if (customerError) {
      // If registered customer creation fails, we should clean up the auth user
      // But for now, just return the error
      return NextResponse.json({ error: customerError.message }, { status: 500 })
    }

    // Send welcome email
    try {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/emails/customer-welcome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ registeredCustomerId: registeredCustomer.id })
      }).catch(error => {
        console.error('Failed to send welcome email:', error)
      })
    } catch (emailError) {
      console.error('Error triggering welcome email:', emailError)
    }

    return NextResponse.json({
      success: true,
      message: "Customer account created successfully. Please check your email to verify your account.",
      registeredCustomer
    })

  } catch (error) {
    console.error("Customer registration error:", error)
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}