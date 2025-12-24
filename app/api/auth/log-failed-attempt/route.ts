import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Insert failed attempt
    const { error: insertError } = await supabase
      .from('login_attempts')
      .insert({
        email,
        ip_address: ip,
        user_agent: userAgent,
        successful: false,
        attempted_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error inserting login attempt:', insertError);
    }

    // Check count of failed attempts in last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from('login_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('email', email)
      .eq('successful', false)
      .gte('attempted_at', twentyFourHoursAgo);

    if (countError) {
      console.error('Error counting attempts:', countError);
      return NextResponse.json({ error: 'Failed to check attempts' }, { status: 500 });
    }

    if (count && count > 4) {
      // Create security incident
      const { error: incidentError } = await supabase
        .from('security_incidents')
        .insert({
          incident_type: 'brute_force_attempt',
          severity: 'high',
          description: `Multiple failed login attempts for email: ${email} from IP: ${ip}. Total failed attempts in 24h: ${count}`,
          status: 'open',
          detected_at: new Date().toISOString(),
          ip_address: ip
        });

      if (incidentError) {
        console.error('Error creating security incident:', incidentError);
      }

      // Send message to admin
      const { data: firstUser } = await supabase.from('profiles').select('id').limit(1).single();
      const senderId = firstUser?.id || '00000000-0000-0000-0000-000000000000';

      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: senderId,
          recipient_role: 'admin',
          subject: 'Security Alert: Brute Force Login Attempt',
          content: `Multiple failed login attempts detected for email: ${email} from IP: ${ip}. Total failed attempts: ${count}. Please review the security dashboard at http://localhost:3000/compliance`,
          message_type: 'role_based',
          priority: 'critical',
          is_read: false
        });

      if (messageError) {
        console.error('Error sending message:', messageError);
      }
    }

    return NextResponse.json({ message: 'Failed attempt logged' });
  } catch (error) {
    console.error('Error logging failed attempt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}