-- Check if customers table exists and what's missing
-- Run this in Supabase SQL Editor

-- Check if table exists
SELECT EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'customers'
) AS table_exists;

-- If table doesn't exist, run this:
-- (Copy from 005_create_customers_table.sql)

-- If table exists but you get permission errors, check RLS:
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'customers';

-- Check existing policies:
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'customers';

-- If no policies exist, you can add them manually:
-- (The policies from 005_create_customers_table.sql)