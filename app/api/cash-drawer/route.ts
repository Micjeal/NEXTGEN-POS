import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current cash drawer for user
    const { data: drawer, error: drawerError } = await supabase
      .from("cash_drawers")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "open")
      .single()

    if (drawerError && drawerError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error("Error fetching drawer:", drawerError)
      return NextResponse.json({ error: "Failed to fetch drawer" }, { status: 500 })
    }

    // Get recent transactions if drawer exists
    let transactions = []
    if (drawer) {
      const { data: txns, error: txnError } = await supabase
        .from("cash_transactions")
        .select("*")
        .eq("drawer_id", drawer.id)
        .order("created_at", { ascending: false })
        .limit(50)

      if (txnError) {
        console.error("Error fetching transactions:", txnError)
      } else {
        transactions = txns || []
      }
    }

    return NextResponse.json({
      drawer: drawer || null,
      transactions
    })
  } catch (error) {
    console.error("Error in cash drawer GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case "open_drawer": {
        // Check if user already has an open drawer
        const { data: existingDrawer } = await supabase
          .from("cash_drawers")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "open")
          .single()

        if (existingDrawer) {
          return NextResponse.json({ error: "Drawer already open" }, { status: 400 })
        }

        const openingBalance = data.opening_balance || 0

        // Create new drawer
        const { data: newDrawer, error: createError } = await supabase
          .from("cash_drawers")
          .insert({
            user_id: user.id,
            status: "open",
            opening_balance: openingBalance,
            current_balance: openingBalance,
            expected_balance: openingBalance,
            opened_at: new Date().toISOString()
          })
          .select()
          .single()

        if (createError) {
          console.error("Error creating drawer:", createError)
          return NextResponse.json({ error: "Failed to open drawer" }, { status: 500 })
        }

        // Add opening float transaction
        if (openingBalance > 0) {
          await supabase
            .from("cash_transactions")
            .insert({
              drawer_id: newDrawer.id,
              user_id: user.id,
              transaction_type: "opening_float",
              amount: openingBalance,
              description: "Opening float",
              balance_before: 0,
              balance_after: openingBalance
            })
        }

        // Log audit
        await supabase
          .from("cash_drawer_audit_logs")
          .insert({
            drawer_id: newDrawer.id,
            user_id: user.id,
            action: "opened",
            details: { opening_balance: openingBalance }
          })

        return NextResponse.json({ drawer: newDrawer })
      }

      case "close_drawer": {
        const { drawer_id, actual_balance, notes } = data

        // Get drawer
        const { data: drawer, error: fetchError } = await supabase
          .from("cash_drawers")
          .select("*")
          .eq("id", drawer_id)
          .eq("user_id", user.id)
          .eq("status", "open")
          .single()

        if (fetchError || !drawer) {
          return NextResponse.json({ error: "Drawer not found or not open" }, { status: 404 })
        }

        // Update drawer
        const { data: updatedDrawer, error: updateError } = await supabase
          .from("cash_drawers")
          .update({
            status: "closed",
            current_balance: actual_balance,
            closed_at: new Date().toISOString(),
            notes
          })
          .eq("id", drawer_id)
          .select()
          .single()

        if (updateError) {
          console.error("Error closing drawer:", updateError)
          return NextResponse.json({ error: "Failed to close drawer" }, { status: 500 })
        }

        // Log audit
        await supabase
          .from("cash_drawer_audit_logs")
          .insert({
            drawer_id: drawer_id,
            user_id: user.id,
            action: "closed",
            details: { actual_balance, expected_balance: drawer.expected_balance, notes }
          })

        return NextResponse.json({ drawer: updatedDrawer })
      }

      case "add_transaction": {
        const { drawer_id, transaction_type, amount, description, notes } = data

        // Get current drawer balance
        const { data: drawer, error: drawerError } = await supabase
          .from("cash_drawers")
          .select("current_balance, expected_balance")
          .eq("id", drawer_id)
          .eq("user_id", user.id)
          .eq("status", "open")
          .single()

        if (drawerError || !drawer) {
          return NextResponse.json({ error: "Drawer not found or not open" }, { status: 404 })
        }

        const balanceBefore = drawer.current_balance
        const balanceAfter = balanceBefore + amount
        const expectedAfter = drawer.expected_balance + amount

        // Add transaction
        const { data: transaction, error: txnError } = await supabase
          .from("cash_transactions")
          .insert({
            drawer_id,
            user_id: user.id,
            transaction_type,
            amount,
            description,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            notes
          })
          .select()
          .single()

        if (txnError) {
          console.error("Error adding transaction:", txnError)
          return NextResponse.json({ error: "Failed to add transaction" }, { status: 500 })
        }

        // Update drawer balance
        await supabase
          .from("cash_drawers")
          .update({
            current_balance: balanceAfter,
            expected_balance: expectedAfter
          })
          .eq("id", drawer_id)

        // Log audit
        await supabase
          .from("cash_drawer_audit_logs")
          .insert({
            drawer_id,
            user_id: user.id,
            action: "transaction_added",
            details: { transaction_id: transaction.id, type: transaction_type, amount, description }
          })

        return NextResponse.json({ transaction })
      }

      case "reconcile": {
        const { drawer_id, actual_balance, notes } = data

        // Get drawer
        const { data: drawer, error: fetchError } = await supabase
          .from("cash_drawers")
          .select("*")
          .eq("id", drawer_id)
          .eq("user_id", user.id)
          .eq("status", "closed")
          .single()

        if (fetchError || !drawer) {
          return NextResponse.json({ error: "Drawer not found or not closed" }, { status: 404 })
        }

        const discrepancy = actual_balance - drawer.expected_balance

        // Update drawer
        const { data: updatedDrawer, error: updateError } = await supabase
          .from("cash_drawers")
          .update({
            status: "reconciled",
            reconciled_at: new Date().toISOString(),
            reconciled_by: user.id,
            notes: notes || drawer.notes
          })
          .eq("id", drawer_id)
          .select()
          .single()

        if (updateError) {
          console.error("Error reconciling drawer:", updateError)
          return NextResponse.json({ error: "Failed to reconcile drawer" }, { status: 500 })
        }

        // Add reconciliation transaction if there's a discrepancy
        if (discrepancy !== 0) {
          await supabase
            .from("cash_transactions")
            .insert({
              drawer_id,
              user_id: user.id,
              transaction_type: "adjustment",
              amount: discrepancy,
              description: `Reconciliation adjustment (actual: ${actual_balance}, expected: ${drawer.expected_balance})`,
              balance_before: drawer.current_balance,
              balance_after: actual_balance,
              notes
            })
        }

        // Log audit
        await supabase
          .from("cash_drawer_audit_logs")
          .insert({
            drawer_id,
            user_id: user.id,
            action: "reconciled",
            details: { actual_balance, expected_balance: drawer.expected_balance, discrepancy, notes }
          })

        return NextResponse.json({ drawer: updatedDrawer, discrepancy })
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in cash drawer POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}