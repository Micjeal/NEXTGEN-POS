import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GDPRService } from '@/lib/encryption';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || user.id;
    const consentType = searchParams.get('type');

    // Build query
    let query = supabase
      .from('consent_logs')
      .select('*')
      .order('consent_date', { ascending: false });

    if (consentType) {
      query = query.eq('consent_type', consentType);
    }

    // Users can only see their own consent, admins can see all
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
      query = query.eq('user_id', user.id);
    } else if (userId && userId !== user.id) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching consent logs:', error);
      return NextResponse.json({ error: 'Failed to fetch consent logs' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in consent GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { consentType, consentGiven, consentText, customerId } = body;

    if (!consentType || typeof consentGiven !== 'boolean' || !consentText) {
      return NextResponse.json(
        { error: 'Missing required fields: consentType, consentGiven, consentText' },
        { status: 400 }
      );
    }

    // Get client IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const consentRecord = {
      user_id: user.id,
      customer_id: customerId || null,
      consent_type: consentType,
      consent_given: consentGiven,
      consent_text: consentText,
      ip_address: ipAddress,
      user_agent: userAgent,
      consent_date: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('consent_logs')
      .insert(consentRecord)
      .select()
      .single();

    if (error) {
      console.error('Error creating consent log:', error);
      return NextResponse.json({ error: 'Failed to create consent log' }, { status: 500 });
    }

    // Log the consent action in audit logs
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'consent_given',
      table_name: 'consent_logs',
      record_id: data.id,
      new_data: consentRecord
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in consent POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { consentId, consentGiven } = body;

    if (!consentId || typeof consentGiven !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: consentId, consentGiven' },
        { status: 400 }
      );
    }

    // Check if user can update this consent
    const { data: existingConsent } = await supabase
      .from('consent_logs')
      .select('user_id')
      .eq('id', consentId)
      .single();

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

    if (role?.name !== 'admin' && existingConsent?.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to update this consent' }, { status: 403 });
    }

    const updateData = {
      consent_given: consentGiven,
      withdrawn_date: consentGiven ? null : new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('consent_logs')
      .update(updateData)
      .eq('id', consentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating consent:', error);
      return NextResponse.json({ error: 'Failed to update consent' }, { status: 500 });
    }

    // Log the update
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'consent_updated',
      table_name: 'consent_logs',
      record_id: consentId,
      new_data: updateData
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in consent PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}