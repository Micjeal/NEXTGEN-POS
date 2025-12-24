-- Quick test to check if customers table exists and works
-- Run this in Supabase SQL Editor

-- Check if table exists
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename = 'customers';

-- Check table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'customers'
ORDER BY ordinal_position;

-- Check existing policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'customers';

-- Try to insert a test customer (this should work if table exists)
INSERT INTO customers (phone, full_name, membership_tier, total_spent, total_visits, is_active, first_visit_date)
VALUES ('+256700000000', 'Test Customer', 'bronze', 0, 0, true, NOW())
ON CONFLICT (phone) DO NOTHING;

-- Check if it was inserted
SELECT id, phone, full_name, membership_tier FROM customers WHERE phone = '+256700000000';