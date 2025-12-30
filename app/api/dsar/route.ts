import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can view DSAR requests
    let isAdmin = false;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role_id')
        .eq('id', user.id)
        .single();

      const { data: role } = await supabase
        .from('roles')
        .select('name')
        .eq('id', profile?.role_id)
        .single();

      isAdmin = role?.name === 'admin';
    } catch (error) {
      console.log('Role check failed, assuming non-admin');
      isAdmin = false;
    }

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('data_subject_requests')
      .select(`
        *,
        customers (
          full_name,
          email,
          phone
        )
      `)
      .order('requested_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    try {
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching DSAR requests:', error);
        // Return empty array for any database error
        return NextResponse.json({ data: [] });
      }

      return NextResponse.json({ data });
    } catch (dbError) {
      console.error('Database error fetching DSAR requests:', dbError);
      // Return empty array for any database exception
      return NextResponse.json({ data: [] });
    }
  } catch (error) {
    console.error('Error in DSAR GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { customerId, requestType, requestData, notes } = body;

    if (!customerId || !requestType) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, requestType' },
        { status: 400 }
      );
    }

    // Verify customer exists
    const { data: customer } = await supabase
      .from('customers')
      .select('id, full_name, email')
      .eq('id', customerId)
      .single();

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const dsarRecord = {
      customer_id: customerId,
      request_type: requestType,
      user_id: user.id,
      request_data: requestData || {},
      notes: notes || null
    };

    const { data, error } = await supabase
      .from('data_subject_requests')
      .insert(dsarRecord)
      .select()
      .single();

    if (error) {
      console.error('Error creating DSAR request:', error);
      return NextResponse.json({ error: 'Failed to create DSAR request' }, { status: 500 });
    }

    // Log the DSAR creation in audit logs
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'dsar_created',
      table_name: 'data_subject_requests',
      record_id: data.id,
      new_data: dsarRecord
    });

    // TODO: Send notification email to customer about DSAR request

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in DSAR POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can update DSAR requests
    const { data: profile } = await supabase
      .from('profiles')
      .select('role_id')
      .eq('id', user.id)
      .single();

    const { data: role } = await supabase
      .from('roles')
      .select('name')
      .eq('id', profile?.role_id)
      .single();

    if (role?.name !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, responseData, notes } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: id, status' },
        { status: 400 }
      );
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (responseData) updateData.response_data = responseData;
    if (notes) updateData.notes = notes;

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('data_subject_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating DSAR request:', error);
      return NextResponse.json({ error: 'Failed to update DSAR request' }, { status: 500 });
    }

    // Log the update
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'dsar_updated',
      table_name: 'data_subject_requests',
      record_id: id,
      new_data: updateData
    });

    // TODO: Send notification email to customer about DSAR status update

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in DSAR PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to export customer data for DSAR
export async function exportCustomerData(customerId: string): Promise<any> {
  const supabase = await createClient();

  // Get customer profile
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();

  // Get customer sales history
  const { data: sales } = await supabase
    .from('sales')
    .select(`
      *,
      sale_items (
        product_name,
        quantity,
        unit_price,
        line_total
      ),
      payments (
        amount,
        payment_method_id,
        reference_number
      )
    `)
    .eq('customer_id', customerId);

  // Get loyalty data
  const { data: loyalty } = await supabase
    .from('customer_loyalty_accounts')
    .select(`
      *,
      loyalty_transactions (*)
    `)
    .eq('customer_id', customerId);

  // Get consent logs
  const { data: consents } = await supabase
    .from('consent_logs')
    .select('*')
    .eq('customer_id', customerId);

  return {
    customer,
    sales,
    loyalty,
    consents,
    exportDate: new Date().toISOString()
  };
}