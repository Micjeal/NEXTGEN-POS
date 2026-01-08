import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - List supplier invoices with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const supplierId = searchParams.get('supplier_id');
    const status = searchParams.get('status');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const branchId = searchParams.get('branch_id');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    let query = supabase
      .from('supplier_invoices')
      .select(`
        *,
        supplier:suppliers(id, name, contact_email, phone),
        purchase_order:purchase_orders(id, order_number),
        branch:branches(id, name),
        created_user:created_by(id, full_name),
        items:supplier_invoice_items(*),
        payments:supplier_invoice_payments(*),
        status_history:supplier_invoice_status_history(*)
      `, { count: 'exact' });
    
    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (startDate) {
      query = query.gte('invoice_date', startDate);
    }
    if (endDate) {
      query = query.lte('invoice_date', endDate);
    }
    if (branchId) {
      query = query.eq('branch_id', branchId);
    }
    if (search) {
      query = query.or(`invoice_number.ilike.%${search}%,notes.ilike.%${search}%`);
    }
    
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query
      .order('invoice_date', { ascending: false })
      .range(from, to);
    
    const { data: invoices, error, count } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Calculate summary statistics
    const summary = {
      total: count || 0,
      total_amount: invoices?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0,
      paid_amount: invoices?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0,
      pending_amount: invoices?.filter(inv => ['pending', 'overdue'].includes(inv.status)).reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0,
      overdue_count: invoices?.filter(inv => inv.status === 'overdue').length || 0
    };
    
    return NextResponse.json({
      invoices: invoices || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      },
      summary
    });
    
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new supplier invoice
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const invoiceData = await request.json();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Validate required fields
    if (!invoiceData.supplier_id || !invoiceData.invoice_date || !invoiceData.due_date) {
      return NextResponse.json({ 
        error: 'Missing required fields: supplier_id, invoice_date, due_date' 
      }, { status: 400 });
    }
    
    // Calculate totals from items if provided
    let subtotal = 0;
    let taxAmount = 0;
    if (invoiceData.items && invoiceData.items.length > 0) {
      subtotal = invoiceData.items.reduce((sum: number, item: { quantity: number; unit_price: number; tax_rate?: number }) => {
        return sum + (Number(item.quantity) * Number(item.unit_price));
      }, 0);
      taxAmount = invoiceData.items.reduce((sum: number, item: { quantity: number; unit_price: number; tax_rate?: number }) => {
        return sum + (Number(item.quantity) * Number(item.unit_price) * (Number(item.tax_rate || 0) / 100));
      }, 0);
    }
    
    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('supplier_invoices')
      .insert({
        supplier_id: invoiceData.supplier_id,
        purchase_order_id: invoiceData.purchase_order_id,
        branch_id: invoiceData.branch_id,
        invoice_date: invoiceData.invoice_date,
        due_date: invoiceData.due_date,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: invoiceData.discount_amount || 0,
        total_amount: subtotal + taxAmount - (invoiceData.discount_amount || 0),
        currency: invoiceData.currency || 'USD',
        status: invoiceData.status || 'pending',
        notes: invoiceData.notes,
        created_by: user.id
      })
      .select()
      .single();
    
    if (invoiceError) {
      return NextResponse.json({ error: invoiceError.message }, { status: 500 });
    }
    
    // Create invoice items if provided
    if (invoiceData.items && invoiceData.items.length > 0) {
      const itemsToInsert = invoiceData.items.map((item: { product_id?: string; product_name?: string; sku?: string; quantity: number; unit_price: number; unit_of_measure?: string; tax_rate?: number; description?: string }) => ({
        invoice_id: invoice.id,
        product_id: item.product_id,
        product_name: item.product_name,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        unit_of_measure: item.unit_of_measure || 'units',
        tax_rate: item.tax_rate || 0,
        tax_amount: Number(item.quantity) * Number(item.unit_price) * (Number(item.tax_rate || 0) / 100),
        subtotal: Number(item.quantity) * Number(item.unit_price),
        description: item.description
      }));
      
      const { error: itemsError } = await supabase
        .from('supplier_invoice_items')
        .insert(itemsToInsert);
      
      if (itemsError) {
        // Delete the invoice if items fail
        await supabase.from('supplier_invoices').delete().eq('id', invoice.id);
        return NextResponse.json({ error: itemsError.message }, { status: 500 });
      }
    }
    
    // Fetch complete invoice with relations
    const { data: completeInvoice } = await supabase
      .from('supplier_invoices')
      .select(`
        *,
        supplier:suppliers(*),
        purchase_order:purchase_orders(*),
        branch:branches(*),
        items:supplier_invoice_items(*)
      `)
      .eq('id', invoice.id)
      .single();
    
    // Log activity
    await supabase.from('activity_logs').insert({
      action: 'supplier_invoice_created',
      entity_type: 'supplier_invoice',
      entity_id: invoice.id,
      user_id: user.id,
      details: { 
        invoice_number: invoice.invoice_number,
        supplier_id: invoiceData.supplier_id,
        total_amount: invoice.total_amount
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      invoice: completeInvoice 
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
