import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const serviceClient = createServiceClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current cash drawer for user
    const { data: drawer, error: drawerError } = await serviceClient
      .from("cash_drawers")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "open")
      .single()

    if (drawerError && drawerError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error("Error fetching drawer:", drawerError)
      return NextResponse.json({ error: "Failed to fetch drawer" }, { status: 500 })
    }

    // Get all transactions if drawer exists
    let transactions = []
    if (drawer) {
      const { data: txns, error: txnError } = await serviceClient
        .from("cash_transactions")
        .select("*")
        .eq("drawer_id", drawer.id)
        .order("created_at", { ascending: false })

      if (txnError) {
        console.error("Error fetching transactions:", txnError)
      } else {
        transactions = txns || []
      }
    }

    // Get today's date in UTC
    const today = new Date()
    const todayString = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`

    // Get today's sales data
    const { data: todaySales, error: salesError } = await serviceClient
      .from("sales")
      .select(`
        id,
        total,
        created_at,
        customer_id,
        payments:payments(
          amount,
          payment_method:payment_methods(name)
        )
      `)
      .eq("user_id", user.id)
      .eq("status", "completed")
      .gte("created_at", `${todayString}T00:00:00.000Z`)
      .lte("created_at", `${todayString}T23:59:59.999Z`)

    if (salesError) {
      console.error("Error fetching today's sales:", salesError)
    }

    // Calculate today's sales summary
    const todaySalesTotal = todaySales?.reduce((sum, sale) => sum + sale.total, 0) || 0
    const todaySalesCount = todaySales?.length || 0
    const todayCustomerCount = new Set(todaySales?.map(sale => sale.customer_id).filter(Boolean)).size

    // Calculate payment method breakdown
    const paymentBreakdown = {
      cash: 0,
      card: 0,
      mobile: 0,
      other: 0
    }

    todaySales?.forEach(sale => {
      sale.payments?.forEach((payment: any) => {
        const method = payment.payment_method?.name?.toLowerCase() || 'other'
        if (method.includes('cash')) {
          paymentBreakdown.cash += payment.amount
        } else if (method.includes('card') || method.includes('credit') || method.includes('debit')) {
          paymentBreakdown.card += payment.amount
        } else if (method.includes('mobile') || method.includes('airtel') || method.includes('mtn')) {
          paymentBreakdown.mobile += payment.amount
        } else {
          paymentBreakdown.other += payment.amount
        }
      })
    })

    // Get top selling products today
    const { data: topProductsData, error: productsError } = await serviceClient
      .from("sale_items")
      .select(`
        quantity,
        line_total,
        product:products(name, category:categories(name))
      `)
      .in("sale_id", todaySales?.map(s => s.id) || [])
      .order("quantity", { ascending: false })
      .limit(5)

    if (productsError) {
      console.error("Error fetching top products:", productsError)
    }

    // Process top products
    const productSales = (topProductsData || []).reduce((acc: any, item: any) => {
      const name = item.product?.name || 'Unknown'
      if (!acc[name]) {
        acc[name] = {
          name,
          quantity: 0,
          revenue: 0,
          category: item.product?.category?.name || 'General'
        }
      }
      acc[name].quantity += item.quantity
      acc[name].revenue += item.line_total
      return acc
    }, {})

    const topProducts = Object.values(productSales)
      .sort((a: any, b: any) => b.quantity - a.quantity)
      .slice(0, 5)

    // Get low stock alerts
    const { data: lowStockItems, error: stockError } = await serviceClient
      .from("products")
      .select("name, inventory!inner(quantity)")
      .eq("is_active", true)
      .lt("inventory.quantity", 10)
      .order("name", { ascending: true })
      .limit(5)

    if (stockError) {
      console.error("Error fetching low stock:", stockError)
    }

    return NextResponse.json({
      drawer: drawer || null,
      transactions,
      todaySummary: {
        salesTotal: todaySalesTotal,
        salesCount: todaySalesCount,
        customerCount: todayCustomerCount,
        paymentBreakdown
      },
      topProducts,
      lowStockItems: lowStockItems || []
    })
  } catch (error) {
    console.error("Error in cash drawer GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const serviceClient = createServiceClient()
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
        const { data: newDrawer, error: createError } = await serviceClient
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
          await serviceClient
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
        await serviceClient
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
        const { data: updatedDrawer, error: updateError } = await serviceClient
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
        await serviceClient
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
        const { data: transaction, error: txnError } = await serviceClient
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
        await serviceClient
          .from("cash_drawers")
          .update({
            current_balance: balanceAfter,
            expected_balance: expectedAfter
          })
          .eq("id", drawer_id)

        // Log audit
        await serviceClient
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
        const { data: updatedDrawer, error: updateError } = await serviceClient
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
          await serviceClient
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
        await serviceClient
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