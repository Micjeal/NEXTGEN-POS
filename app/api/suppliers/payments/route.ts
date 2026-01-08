import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch supplier payments with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const supplierId = searchParams.get('supplier_id');
    const status = searchParams.get('status');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const paymentMethod = searchParams.get('payment_method');
    
    let query = supabase
      .from('supplier_payments')
      .select(`
        *,
        supplier:suppliers(id, name, code),
        invoice:supplier_invoices(id, invoice_number, total_amount),
        created_user:created_by(id, full_name),
        bank_account:supplier_bank_accounts(id, bank_name, account_number)
      `, { count: 'exact' });
    
    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (paymentMethod) {
      query = query.eq('payment_method', paymentMethod);
    }
    if (startDate) {
      query = query.gte('payment_date', startDate);
    }
    if (endDate) {
      query = query.lte('payment_date', endDate);
    }
    
    query = query
      .order('payment_date', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    
    const { data: payments, error, count } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Calculate summary
    const { data: summary } = await supabase
      .from('supplier_payments')
      .select('amount', { head: true })
      .eq('status', 'completed')
      .gte('payment_date', startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      .lte('payment_date', endDate || new Date().toISOString());
    
    const totalPaid = summary?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    
    return NextResponse.json({
      payments: payments || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      summary: {
        totalPaid,
        periodPayments: summary?.length || 0
      }
    });
    
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new supplier payment
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const paymentData = await request.json();
    
    // Validate required fields
    if (!paymentData.supplier_id || !paymentData.amount || !paymentData.payment_method) {
      return NextResponse.json({ 
        error: 'Missing required fields: supplier_id, amount, payment_method' 
      }, { status: 400 });
    }
    
    // Start transaction
    const { data: payment, error } = await supabase
      .from('supplier_payments')
      .insert({
        supplier_id: paymentData.supplier_id,
        invoice_id: paymentData.invoice_id,
        amount: paymentData.amount,
        payment_date: paymentData.payment_date || new Date().toISOString(),
        payment_method: paymentData.payment_method,
        reference_number: paymentData.reference_number,
        bank_account_id: paymentData.bank_account_id,
        notes: paymentData.notes,
        status: 'completed',
        created_by: user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Update invoice if payment is linked to specific invoice
    if (paymentData.invoice_id) {
      const { data: invoice } = await supabase
        .from('supplier_invoices')
        .select('total_amount, total_amount_paid')
        .eq('id', paymentData.invoice_id)
        .single();
      
      if (invoice) {
        const newPaidAmount = (invoice.total_amount_paid || 0) + paymentData.amount;
        const newStatus = newPaidAmount >= invoice.total_amount ? 'paid' : 'partial';
        
        await supabase
          .from('supplier_invoices')
          .update({
            total_amount_paid: newPaidAmount,
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentData.invoice_id);
        
        // Log status change
        await supabase.from('supplier_invoice_status_history').insert({
          invoice_id: paymentData.invoice_id,
          status: newStatus,
          changed_by: user.id,
          changed_at: new Date().toISOString(),
          notes: `Payment of ${paymentData.amount} recorded`
        });
      }
    } else {
      // Advance payment to supplier (not linked to specific invoice)
      await supabase.from('supplier_advance_payments').insert({
        payment_id: payment.id,
        supplier_id: paymentData.supplier_id,
        amount: paymentData.amount,
        payment_date: paymentData.payment_date || new Date().toISOString(),
        created_by: user.id
      });
    }
    
    // Log activity
    await supabase.from('activity_logs').insert({
      action: 'supplier_payment_created',
      entity_type: 'supplier_payment',
      entity_id: payment.id,
      user_id: user.id,
      details: {
        supplier_id: paymentData.supplier_id,
        invoice_id: paymentData.invoice_id,
        amount: paymentData.amount,
        payment_method: paymentData.payment_method
      }
    });
    
    return NextResponse.json({ success: true, payment });
    
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
