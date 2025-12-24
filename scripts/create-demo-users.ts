// scripts/create-demo-users.ts
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables');
  console.log('Please make sure your .env.local file has:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_project_url');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Helper function to reset user password
async function resetUserPassword(email: string, newPassword: string) {
  try {
    // First, find the user by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;
    
    const user = users.find(u => u.email === email);
    if (!user) throw new Error(`User with email ${email} not found`);
    
    // Update the user's password
    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );
    
    if (error) throw error;
    return { success: true, userId: user.id };
  } catch (error) {
    console.error(`❌ Error resetting password for ${email}:`, error.message);
    return { success: false, error };
  }
}

// Demo users data
const demoUsers = [
  { email: 'micknick168@gmail.com', password: 'admin123', role: 'admin', name: 'Admin User' },
  { email: 'micknick168@gmail.com', password: 'manager123', role: 'manager', name: 'Manager User' },
  { email: 'cashier@store.com', password: 'cashier123', role: 'cashier', name: 'Cashier User' }
];

async function createDemoUsers() {
  console.log('🚀 Starting to create/update demo users...');
  
  for (const user of demoUsers) {
    try {
      console.log(`\n🔧 Processing ${user.role} (${user.email})...`);
      
      // 1. Get role ID
      const { data: role, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', user.role)
        .single();

      if (roleError) throw roleError;
      if (!role) throw new Error(`Role '${user.role}' not found`);

      // 2. Check if user exists in auth
      const { data: { users: authUsers }, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;
      
      const authUser = authUsers.find(u => u.email === user.email);
      let userId = authUser?.id;

      // 3. Check if profile exists
      let profileExists = false;
      if (authUser) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', authUser.id)
          .maybeSingle();
        profileExists = !!existingProfile;
      }

      if (authUser) {
        // Update existing auth user
        console.log(`🔄 Updating existing auth user: ${user.email}`);
        
        // Update password
        console.log(`🔄 Resetting password for: ${user.email}`);
        const { success, error: passwordError } = await resetUserPassword(user.email, user.password);
        if (!success) throw passwordError;
        
        // Update profile if it exists, or create it
        if (profileExists) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              full_name: user.name,
              role_id: role.id,
              is_active: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', authUser.id);
          
          if (updateError) throw updateError;
          console.log(`✅ Updated profile for ${user.role} user: ${user.email}`);
        } else {
          // Create profile if it doesn't exist
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
              id: authUser.id,
              email: user.email,
              full_name: user.name,
              role_id: role.id,
              is_active: true
            }]);
          
          if (profileError) throw profileError;
          console.log(`✅ Created profile for existing auth user: ${user.email}`);
        }
      } else {
        // Create new user
        const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: { name: user.name }
        });

        if (signUpError) throw signUpError;

        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: authData.user.id,
            email: user.email,
            full_name: user.name,
            role_id: role.id,
            is_active: true
          }]);

        if (profileError) throw profileError;
        console.log(`✅ Created ${user.role} user: ${user.email}`);
      }
    } catch (error) {
      console.error(`❌ Error with ${user.role} (${user.email}):`, error.message);
    }
  }

  console.log('\n🎉 Demo users setup complete!');
  process.exit(0);
}

// Run the script
createDemoUsers();