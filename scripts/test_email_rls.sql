-- Test script for Email System RLS policies
-- Run this after applying the migration to verify RLS is working

-- Test 1: Check if tables exist
SELECT 'email_templates exists' as test_result
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_templates');

SELECT 'email_logs exists' as test_result
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_logs');

SELECT 'email_settings exists' as test_result
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_settings');

-- Test 2: Check RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('email_templates', 'email_logs', 'email_settings')
AND schemaname = 'public';

-- Test 3: Check policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('email_templates', 'email_logs', 'email_settings')
AND schemaname = 'public'
ORDER BY tablename, policyname;

-- Test 4: Check default templates were inserted
SELECT COUNT(*) as template_count FROM email_templates;

-- Test 5: Verify template categories
SELECT category, COUNT(*) as count_per_category
FROM email_templates
GROUP BY category
ORDER BY category;

-- If you want to test with actual user permissions, you would need to:
-- 1. Set the session to a specific user: SELECT auth.uid();
-- 2. Try SELECT queries on the tables
-- 3. Check if they return expected results based on RLS policies