import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET /api/supplier-payments - Get supplier payments
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get("invoice_id")
    const supplierId = searchParams.get("supplier_id")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const serviceClient = createServiceClient()

    let query = serviceClient
      .from("supplier_payments")
      .select(`
        *,
        supplier_invoice:supplier_invoices(
          id,
          invoice_number,
          total_amount,
          paid_amount,
          status,
          supplier:suppliers(id, name)
        ),
        recorder:profiles(id, full_name)
      `)
      .order("payment_date", { ascending: false })

    if (invoiceId) {
      query = query.eq("supplier_invoice_id", invoiceId)
    }
    if (supplierId) {
      query = query.eq("supplier_invoices.supplier_id", supplierId)
    }

    const { count } = await serviceClient
      .from("supplier_payments")
      .select("*", { count: "exact", head: true })

    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: payments, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const totalPaid = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

    return NextResponse.json({
      payments: payments || [],
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        total_amount: totalPaid
      }
    })
  } catch (error) {
    console.error("Get supplier payments error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/supplier-payments - Create a supplier payment
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*, role:roles(*)")
      .eq("id", user.id)
      .single()

    const userRole = profile?.role?.name
    if (userRole !== "admin" && userRole !== "manager") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { supplier_invoice_id, amount, payment_date, payment_method, reference_number, notes } = await request.json()

    if (!supplier_invoice_id || !amount || !payment_date) {
      return NextResponse.json({ error: "Invoice ID, amount, and payment date are required" }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // Get invoice details
    const { data: invoice, error: invoiceError } = await serviceClient
      .from("supplier_invoices")
      .select("id, total_amount, paid_amount, status")
      .eq("id", supplier_invoice_id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    if (invoice.status === "cancelled") {
      return NextResponse.json({ error: "Cannot payment on cancelled invoice" }, { status: 400 })
    }

    const newPaidAmount = (invoice.paid_amount || 0) + Number(amount)
    const invoiceStatus = newPaidAmount >= invoice.total_amount ? "paid" : "partially_paid"

    // Create payment
    const { data: payment, error: paymentError } = await serviceClient
      .from("supplier_payments")
      .insert({
        supplier_invoice_id,
        amount: Number(amount),
        payment_date,
        payment_method: payment_method?.trim() || null,
        reference_number: reference_number?.trim() || null,
        notes: notes?.trim() || null,
        recorded_by: user.id
      })
      .select()
      .single()

    if (paymentError) {
      return NextResponse.json({ error: paymentError.message }, { status: 500 })
    }

    // Update invoice
    const { error: updateError } = await serviceClient
      .from("supplier_invoices")
      .update({
        paid_amount: newPaidAmount,
        status: invoiceStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", supplier_invoice_id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, payment })
  } catch (error) {
    console.error("Create supplier payment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/supplier-payments - Delete a supplier payment
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*, role:roles(*)")
      .eq("id", user.id)
      .single()

    const userRole = profile?.role?.name
    if (userRole !== "admin" && userRole !== "manager") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // Get payment details
    const { data: payment } = await serviceClient
      .from("supplier_payments")
      .select("*, supplier_invoice_id, amount")
      .eq("id", id)
      .single()

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Reverse the payment
    const { data: invoice } = await serviceClient
      .from("supplier_invoices")
      .select("id, total_amount, paid_amount")
      .eq("id", payment.supplier_invoice_id)
      .single()

    if (invoice) {
      const newPaidAmount = Math.max(0, (invoice.paid_amount || 0) - payment.amount)
      const invoiceStatus = newPaidAmount === 0 ? "unpaid" : "partially_paid"

      await serviceClient
        .from("supplier_invoices")
        .update({
          paid_amount: newPaidAmount,
          status: invoiceStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", payment.supplier_invoice_id)
    }

    // Delete payment
    const { error: deleteError } = await serviceClient
      .from("supplier_payments")
      .delete()
      .eq("id", id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Payment deleted successfully" })
  } catch (error) {
    console.error("Delete supplier payment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
