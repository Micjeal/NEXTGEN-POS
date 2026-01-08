import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET /api/supplier-invoices - Get all supplier invoices
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get("supplier_id")
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const serviceClient = createServiceClient()

    let query = serviceClient
      .from("supplier_invoices")
      .select(`
        *,
        supplier:suppliers(id, name, contact_person, phone),
        purchase_order:purchase_orders(id, order_number),
        payments:supplier_payments(id, amount, payment_date, payment_method)
      `)

    if (supplierId) {
      query = query.eq("supplier_id", supplierId)
    }
    if (status) {
      query = query.eq("status", status)
    }
    if (search) {
      query = query.or(`invoice_number.ilike.%${search}%,supplier.name.ilike.%${search}%`)
    }

    // Get total count
    const { count } = await serviceClient
      .from("supplier_invoices")
      .select("*", { count: "exact", head: true })
      .eq("supplier_id", supplierId || "")
      .eq("status", status || "")

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.order("created_at", { ascending: false }).range(from, to)

    const { data: invoices, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate totals
    const totalAmount = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0
    const paidAmount = invoices?.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0) || 0
    const outstandingAmount = totalAmount - paidAmount

    return NextResponse.json({
      invoices: invoices || [],
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        summary: {
          total_amount: totalAmount,
          paid_amount: paidAmount,
          outstanding_amount: outstandingAmount
        }
      }
    })
  } catch (error) {
    console.error("Get supplier invoices error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/supplier-invoices - Create a new supplier invoice
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("*, role:roles(*)")
      .eq("id", user.id)
      .single()

    const userRole = profile?.role?.name
    if (userRole !== "admin" && userRole !== "manager") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { 
      supplier_id, 
      purchase_order_id, 
      invoice_number, 
      invoice_date, 
      due_date, 
      total_amount, 
      payment_terms, 
      notes 
    } = await request.json()

    if (!supplier_id || !invoice_number || !invoice_date || !total_amount) {
      return NextResponse.json({ 
        error: "Supplier ID, invoice number, invoice date, and total amount are required" 
      }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // Check if invoice number already exists
    const { data: existingInvoice } = await serviceClient
      .from("supplier_invoices")
      .select("id")
      .eq("invoice_number", invoice_number.trim())
      .single()

    if (existingInvoice) {
      return NextResponse.json({ error: "Invoice number already exists" }, { status: 400 })
    }

    // Create invoice
    const { data: invoice, error: insertError } = await serviceClient
      .from("supplier_invoices")
      .insert({
        supplier_id,
        purchase_order_id: purchase_order_id || null,
        invoice_number: invoice_number.trim(),
        invoice_date,
        due_date: due_date || null,
        total_amount: Number(total_amount),
        paid_amount: 0,
        status: "unpaid",
        payment_terms: payment_terms?.trim() || null,
        notes: notes?.trim() || null
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // If associated with a purchase order, update its status
    if (purchase_order_id) {
      await serviceClient
        .from("purchase_orders")
        .update({ status: "ordered" })
        .eq("id", purchase_order_id)
    }

    return NextResponse.json({
      success: true,
      invoice
    })
  } catch (error) {
    console.error("Create supplier invoice error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// PUT /api/supplier-invoices - Update a supplier invoice
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("*, role:roles(*)")
      .eq("id", user.id)
      .single()

    const userRole = profile?.role?.name
    if (userRole !== "admin" && userRole !== "manager") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { 
      id, 
      supplier_id, 
      purchase_order_id, 
      invoice_number, 
      invoice_date, 
      due_date, 
      total_amount, 
      status,
      payment_terms, 
      notes 
    } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // Check if invoice exists
    const { data: existingInvoice } = await serviceClient
      .from("supplier_invoices")
      .select("id, total_amount, paid_amount, status")
      .eq("id", id)
      .single()

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Check if another invoice with this number exists
    if (invoice_number) {
      const { data: duplicateInvoice } = await serviceClient
        .from("supplier_invoices")
        .select("id")
        .eq("invoice_number", invoice_number.trim())
        .neq("id", id)
        .single()

      if (duplicateInvoice) {
        return NextResponse.json({ error: "Another invoice with this number already exists" }, { status: 400 })
      }
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      "unpaid": ["partially_paid", "paid", "cancelled"],
      "partially_paid": ["paid", "cancelled"],
      "paid": ["cancelled"],
      "overdue": ["partially_paid", "paid", "cancelled"]
    }

    if (status && status !== existingInvoice.status) {
      const allowedTransitions = validTransitions[existingInvoice.status] || []
      if (!allowedTransitions.includes(status)) {
        return NextResponse.json({ 
          error: `Cannot transition from ${existingInvoice.status} to ${status}` 
        }, { status: 400 })
      }
    }

    // Update invoice
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (supplier_id !== undefined) updateData.supplier_id = supplier_id
    if (purchase_order_id !== undefined) updateData.purchase_order_id = purchase_order_id
    if (invoice_number) updateData.invoice_number = invoice_number.trim()
    if (invoice_date) updateData.invoice_date = invoice_date
    if (due_date !== undefined) updateData.due_date = due_date
    if (total_amount !== undefined) updateData.total_amount = Number(total_amount)
    if (status) updateData.status = status
    if (payment_terms !== undefined) updateData.payment_terms = payment_terms?.trim() || null
    if (notes !== undefined) updateData.notes = notes?.trim() || null

    const { data: invoice, error: updateError } = await serviceClient
      .from("supplier_invoices")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      invoice
    })
  } catch (error) {
    console.error("Update supplier invoice error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// DELETE /api/supplier-invoices - Delete a supplier invoice
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check user role
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
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // Check if invoice has payments
    const { data: payments } = await serviceClient
      .from("supplier_payments")
      .select("id")
      .eq("supplier_invoice_id", id)
      .limit(1)

    if (payments && payments.length > 0) {
      return NextResponse.json({ 
        error: "Cannot delete invoice with associated payments. Cancel the invoice instead." 
      }, { status: 400 })
    }

    // Delete invoice
    const { error: deleteError } = await serviceClient
      .from("supplier_invoices")
      .delete()
      .eq("id", id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Invoice deleted successfully"
    })
  } catch (error) {
    console.error("Delete supplier invoice error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
