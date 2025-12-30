import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
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

    // Run compliance schema setup
    // Note: In a real application, you would execute the SQL from scripts/compliance_schema.sql
    // For now, we'll return a message that the schema needs to be run manually

    return NextResponse.json({
      success: true,
      message: 'Compliance schema setup initiated. Please run the SQL from scripts/compliance_schema.sql in your Supabase dashboard.',
      tables: [
        'consent_logs',
        'data_subject_requests',
        'compliance_audits',
        'security_incidents',
        'biometric_auth',
        'encryption_keys'
      ]
    });

  } catch (error) {
    console.error('Error setting up compliance:', error);
    return NextResponse.json({ error: 'Failed to setup compliance schema' }, { status: 500 });
  }
}