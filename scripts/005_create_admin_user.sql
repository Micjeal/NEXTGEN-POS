-- SMMS POS System - Create Admin User
-- This script sets up the admin role for a user
-- 
-- IMPORTANT: You must first sign up using the app with email "admin@store.com"
-- Then run this script to promote that user to admin role.

-- Step 1: Get the admin role ID
DO $$
DECLARE
  admin_role_id UUID;
BEGIN
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
  
  -- Step 2: Update the profile to have admin role
  -- This will update any profile with email 'admin@store.com' to be an admin
  UPDATE profiles 
  SET role_id = admin_role_id,
      full_name = 'System Administrator'
  WHERE email = 'micknick168@gmail.com';
  
  RAISE NOTICE 'Admin role assigned to admin@store.com';
END $$;
