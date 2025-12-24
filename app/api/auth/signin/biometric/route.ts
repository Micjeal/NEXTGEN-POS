import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { email, biometricAuthenticated } = body;

    if (!email || !biometricAuthenticated) {
      return NextResponse.json(
        { error: 'Invalid biometric authentication request' },
        { status: 400 }
      );
    }

    // Get user by email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create a session for the user
    // Since we're using Supabase auth, we need to sign them in
    // For biometric authentication, we'll use a special flow

    // First, check if the user has any active biometric records
    const { data: biometricRecords, error: bioError } = await supabase
      .from('biometric_auth')
      .select('id')
      .eq('user_id', userData.id)
      .eq('is_active', true)
      .limit(1);

    if (bioError || !biometricRecords || biometricRecords.length === 0) {
      return NextResponse.json(
        { error: 'No active biometric authentication found' },
        { status: 403 }
      );
    }

    // Since we can't directly create a Supabase session from the API,
    // we'll return the user info and let the client handle the redirect
    // In a production app, you'd implement proper session management

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email
      },
      message: 'Biometric authentication successful'
    });

  } catch (error) {
    console.error('Biometric signin error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}