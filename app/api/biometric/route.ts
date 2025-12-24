import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EncryptionService } from '@/lib/encryption';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || user.id;

    // Check if user can access this biometric data
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

    if (role?.name !== 'admin' && userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get biometric data for the user
    const { data, error } = await supabase
      .from('biometric_auth')
      .select('id, biometric_type, device_id, is_active, last_used_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching biometric data:', error);
      return NextResponse.json({ error: 'Failed to fetch biometric data' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in biometric GET:', error);
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
    const { biometricType, biometricData, deviceId } = body;

    if (!biometricType || !biometricData) {
      return NextResponse.json(
        { error: 'Missing required fields: biometricType, biometricData' },
        { status: 400 }
      );
    }

    // Validate biometric type
    const validTypes = ['fingerprint', 'facial', 'voice', 'iris'];
    if (!validTypes.includes(biometricType)) {
      return NextResponse.json({ error: 'Invalid biometric type' }, { status: 400 });
    }

    // Check if user already has this biometric type registered
    const { data: existing } = await supabase
      .from('biometric_auth')
      .select('id')
      .eq('user_id', user.id)
      .eq('biometric_type', biometricType)
      .eq('is_active', true)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Biometric authentication already registered for this type' },
        { status: 400 }
      );
    }

    // Encrypt the biometric data before storing
    const encryptedData = EncryptionService.encrypt(biometricData);

    const biometricRecord = {
      user_id: user.id,
      biometric_type: biometricType,
      biometric_data: encryptedData.encrypted,
      device_id: deviceId || null,
      is_active: true
    };

    const { data, error } = await supabase
      .from('biometric_auth')
      .insert(biometricRecord)
      .select()
      .single();

    if (error) {
      console.error('Error registering biometric auth:', error);
      return NextResponse.json({ error: 'Failed to register biometric authentication' }, { status: 500 });
    }

    // Log the biometric registration
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'biometric_registered',
      table_name: 'biometric_auth',
      record_id: data.id,
      new_data: { biometric_type: biometricType, device_id: deviceId }
    });

    return NextResponse.json({
      success: true,
      message: 'Biometric authentication registered successfully',
      data: {
        id: data.id,
        biometric_type: data.biometric_type,
        device_id: data.device_id,
        created_at: data.created_at
      }
    });
  } catch (error) {
    console.error('Error in biometric POST:', error);
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

    const body = await request.json();
    const { id, isActive } = body;

    if (!id || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: id, isActive' },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('biometric_auth')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Biometric record not found or access denied' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('biometric_auth')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating biometric auth:', error);
      return NextResponse.json({ error: 'Failed to update biometric authentication' }, { status: 500 });
    }

    // Log the update
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'biometric_updated',
      table_name: 'biometric_auth',
      record_id: id,
      new_data: { is_active: isActive }
    });

    return NextResponse.json({
      success: true,
      message: `Biometric authentication ${isActive ? 'enabled' : 'disabled'}`,
      data
    });
  } catch (error) {
    console.error('Error in biometric PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Biometric ID is required' }, { status: 400 });
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('biometric_auth')
      .select('user_id, biometric_type')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Biometric record not found or access denied' }, { status: 404 });
    }

    const { error } = await supabase
      .from('biometric_auth')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting biometric auth:', error);
      return NextResponse.json({ error: 'Failed to delete biometric authentication' }, { status: 500 });
    }

    // Log the deletion
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'biometric_deleted',
      table_name: 'biometric_auth',
      record_id: id,
      old_data: { biometric_type: existing.biometric_type }
    });

    return NextResponse.json({
      success: true,
      message: 'Biometric authentication removed successfully'
    });
  } catch (error) {
    console.error('Error in biometric DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Authenticate using biometric data
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { biometricType, biometricData, deviceId } = body;

    if (!biometricType || !biometricData) {
      return NextResponse.json(
        { error: 'Missing required fields: biometricType, biometricData' },
        { status: 400 }
      );
    }

    // Create supabase client without authentication for biometric login
    const supabase = await createClient();

    // Find matching biometric record
    const { data: biometricRecords, error } = await supabase
      .from('biometric_auth')
      .select('id, user_id, biometric_data, device_id, is_active')
      .eq('biometric_type', biometricType)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching biometric records:', error);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }

    if (!biometricRecords || biometricRecords.length === 0) {
      return NextResponse.json(
        { error: 'No biometric records found for this type' },
        { status: 401 }
      );
    }

    // Check each record for a match
    for (const record of biometricRecords) {
      try {
        // For demo purposes, we'll do a simple comparison
        // In production, this would use proper biometric matching algorithms
        const storedData = record.biometric_data;
        if (storedData === biometricData) {
          // Update last used timestamp
          await supabase
            .from('biometric_auth')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', record.id);

          // Get user details for authentication
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('id', record.user_id)
            .single();

          if (userError || !userData) {
            console.error('Error fetching user data:', userError);
            continue;
          }

          // Log successful biometric authentication
          await supabase.from('audit_logs').insert({
            user_id: record.user_id,
            action: 'biometric_auth_success',
            table_name: 'biometric_auth',
            record_id: record.id,
            new_data: { biometric_type: biometricType, device_id: deviceId }
          });

          // For biometric authentication, we'll create a temporary token
          // that can be used to authenticate the user
          const biometricToken = `bio_${record.user_id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

          // Store the token temporarily (in production, use Redis or similar)
          // For demo purposes, we'll use a simple approach

          return NextResponse.json({
            success: true,
            message: 'Biometric authentication successful',
            userId: record.user_id,
            userEmail: userData.email,
            biometricToken,
            authenticated: true
          });
        }
      } catch (matchError) {
        console.error('Error matching biometric data:', matchError);
        continue;
      }
    }

    // Log failed authentication attempt
    await supabase.from('audit_logs').insert({
      action: 'biometric_auth_failed',
      table_name: 'biometric_auth',
      new_data: { biometric_type: biometricType, device_id: deviceId }
    });

    return NextResponse.json(
      { error: 'Biometric authentication failed' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Error in biometric PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}