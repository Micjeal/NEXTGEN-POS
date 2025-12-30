import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or manager
    const { data: profile } = await supabase
      .from("profiles")
      .select("role_id")
      .eq("id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const { data: role } = await supabase
      .from("roles")
      .select("name")
      .eq("id", profile.role_id)
      .single()

    if (!role || !['admin', 'manager'].includes(role.name)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const accountId = params.accountId

    if (!accountId) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 })
    }

    // Fetch loyalty transactions for the account
    const { data: transactions, error } = await supabase
      .from("loyalty_transactions")
      .select(`
        *,
        performed_by_profile:performed_by(
          full_name
        )
      `)
      .eq("customer_loyalty_account_id", accountId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching transactions:", error)
      return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
    }

    // Transform the data to include performed_by name
    const transformedTransactions = transactions?.map(transaction => ({
      ...transaction,
      performed_by: transaction.performed_by_profile?.full_name || null
    })) || []

    return NextResponse.json({
      transactions: transformedTransactions,
      total: transformedTransactions.length
    })

  } catch (error) {
    console.error("Error in transactions API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}