import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch single invoice
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;
    
    const { data: invoice, error } = await supabase
      .from('supplier_invoices')
      .select(`
        *,
        supplier:suppliers(
          id, name, contact_email, phone, address, payment_terms,
          tax_id, bank_details
        ),
        purchase_order:purchase_orders(
          id, order_number, order_date, expected_delivery,
          items:purchase_order_items(*)
        ),
        branch:branches(id, name, address),
        created_user:created_by(id, full_name),
        approved_user:approved_by(id, full_name),
        items:supplier_invoice_items(*),
        payments:supplier_invoice_payments(
          *,
          created_user:created_by(id, full_name)
        ),
        status_history:supplier_invoice_status_history(
          *,
          changed_user:changed_by(id, full_name)
        ),
        attachments:supplier_invoice_attachments(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    
    // Calculate payment status
    const payments = invoice.payments as Array<{ amount: number }> | null;
    const totalPaid = payments?.reduce((sum, payment) => 
      sum + (payment.amount || 0), 0) || 0;
    const remainingBalance = (invoice.total_amount || 0) - totalPaid;
    
    return NextResponse.json({
      invoice: {
        ...invoice,
        total_paid: totalPaid,
        remaining_balance: remainingBalance
      }
    });
    
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const updateData = await request.json();
    
    // Prevent modification of certain fields on paid invoices
    const { data: currentInvoice } = await supabase
      .from('supplier_invoices')
      .select('status, total_amount_paid')
      .eq('id', id)
      .single();
    
    if (currentInvoice?.status === 'paid') {
      return NextResponse.json({ 
        error: 'Cannot modify a paid invoice' 
      }, { status: 400 });
    }
    
    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by: user.id
    };
    
    const allowedFields = [
      'supplier_id', 'purchase_order_id', 'branch_id', 
      'invoice_date', 'due_date', 'discount_amount', 
      'currency', 'notes', 'status'
    ];
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    });
    
    // Recalculate totals if items changed
    if (updateData.items && Array.isArray(updateData.items)) {
      const subtotal = updateData.items.reduce((sum: number, item: { quantity: number; unit_price: number; tax_rate?: number }) => 
        sum + (Number(item.quantity) * Number(item.unit_price)), 0);
      const taxAmount = updateData.items.reduce((sum: number, item: { quantity: number; unit_price: number; tax_rate?: number }) => 
        sum + (Number(item.quantity) * Number(item.unit_price) * (Number(item.tax_rate || 0) / 100)), 0);
      
      updates.subtotal = subtotal;
      updates.tax_amount = taxAmount;
      updates.total_amount = subtotal + taxAmount - (Number(updateData.discount_amount) || 0);
    }
    
    const { data: invoice, error } = await supabase
      .from('supplier_invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Update items if provided
    if (updateData.items && Array.isArray(updateData.items)) {
      // Delete existing items
      await supabase.from('supplier_invoice_items').delete().eq('invoice_id', id);
      
      // Insert new items
      const itemsToInsert = updateData.items.map((item: { product_id?: string; product_name?: string; sku?: string; quantity: number; unit_price: number; unit_of_measure?: string; tax_rate?: number; description?: string }) => ({
        invoice_id: id,
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
      
      await supabase.from('supplier_invoice_items').insert(itemsToInsert);
    }
    
    // Log activity
    await supabase.from('activity_logs').insert({
      action: 'supplier_invoice_updated',
      entity_type: 'supplier_invoice',
      entity_id: id,
      user_id: user.id,
      details: { updates: Object.keys(updateData) }
    });
    
    return NextResponse.json({ success: true, invoice });
    
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if invoice can be deleted (not paid, no payments)
    const { data: invoice } = await supabase
      .from('supplier_invoices')
      .select('status')
      .eq('id', id)
      .single();
    
    // Check for payments
    const { count: paymentCount } = await supabase
      .from('supplier_invoice_payments')
      .select('*', { count: 'exact', head: true })
      .eq('invoice_id', id);
    
    if (invoice?.status === 'paid' || (paymentCount && paymentCount > 0)) {
      return NextResponse.json({ 
        error: 'Cannot delete a paid invoice or one with payments' 
      }, { status: 400 });
    }
    
    // Delete related records first
    await supabase.from('supplier_invoice_payments').delete().eq('invoice_id', id);
    await supabase.from('supplier_invoice_items').delete().eq('invoice_id', id);
    await supabase.from('supplier_invoice_status_history').delete().eq('invoice_id', id);
    await supabase.from('supplier_invoice_attachments').delete().eq('invoice_id', id);
    
    // Delete invoice
    const { error } = await supabase
      .from('supplier_invoices')
      .delete()
      .eq('id', id);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Log activity
    await supabase.from('activity_logs').insert({
      action: 'supplier_invoice_deleted',
      entity_type: 'supplier_invoice',
      entity_id: id,
      user_id: user.id
    });
    
    return NextResponse.json({ success: true, message: 'Invoice deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
