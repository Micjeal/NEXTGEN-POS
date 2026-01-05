-- Fix RLS and Security Issues for Performance
-- This script addresses the Supabase database linter issues that may be causing performance problems

-- =============================================
-- 1. ENABLE RLS ON TABLES WHERE POLICIES EXIST BUT RLS DISABLED
-- =============================================

-- Enable RLS on customers table (if not already enabled)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Ensure policies exist for customers
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "authenticated_select" ON customers;
DROP POLICY IF EXISTS "cashier_insert_customers" ON customers;
DROP POLICY IF EXISTS "cashier_update_customers" ON customers;

-- Recreate policies
CREATE POLICY "authenticated_select" ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "cashier_insert_customers" ON customers FOR INSERT TO authenticated
WITH CHECK (get_user_role() = 'cashier');
CREATE POLICY "cashier_update_customers" ON customers FOR UPDATE TO authenticated
USING (get_user_role() = 'cashier');

-- =============================================
-- 2. CHANGE SECURITY DEFINER VIEWS TO SECURITY INVOKER
-- =============================================

-- Drop and recreate customer_purchase_history view with SECURITY INVOKER
DROP VIEW IF EXISTS customer_purchase_history;
CREATE OR REPLACE VIEW customer_purchase_history
WITH (security_invoker = true) AS
SELECT
  c.id as customer_id,
  c.full_name,
  c.phone,
  c.email,
  c.membership_tier,
  s.id as sale_id,
  s.invoice_number,
  s.created_at as purchase_date,
  s.total,
  s.subtotal,
  s.tax_amount,
  s.discount_amount,
  si.product_name,
  si.quantity,
  si.unit_price,
  si.line_total,
  COALESCE(lt.points, 0) as points_earned
FROM customers c
LEFT JOIN sales s ON s.customer_id = c.id
LEFT JOIN sale_items si ON si.sale_id = s.id
LEFT JOIN loyalty_transactions lt ON lt.sale_id = s.id AND lt.transaction_type = 'earn'
ORDER BY c.id, s.created_at DESC;

-- Drop and recreate customer_loyalty_dashboard view with SECURITY INVOKER
DROP VIEW IF EXISTS customer_loyalty_dashboard;
CREATE OR REPLACE VIEW customer_loyalty_dashboard
WITH (security_invoker = true) AS
SELECT
  rc.id as registered_customer_id,
  rc.user_id,
  rc.full_name,
  rc.phone,
  rc.email,
  c.id as customer_id,
  COALESCE(c.membership_tier, 'none') as membership_tier,
  COALESCE(c.total_spent, 0) as total_spent,
  COALESCE(c.total_visits, 0) as total_visits,
  c.last_visit_date,
  COALESCE(cla.current_points, 0) as current_points,
  COALESCE(cla.total_points_earned, 0) as total_points_earned,
  COALESCE(cla.total_points_redeemed, 0) as total_points_redeemed,
  COALESCE(cla.tier, 'none') as tier,
  cla.join_date,
  COALESCE(lt.benefits, '{}') as tier_benefits
FROM registered_customers rc
LEFT JOIN customers c ON c.registered_customer_id = rc.id
LEFT JOIN customer_loyalty_accounts cla ON cla.customer_id = c.id
LEFT JOIN loyalty_tiers lt ON lt.tier_name = cla.tier;

-- =============================================
-- 3. ENABLE RLS ON TABLES IN PUBLIC SCHEMA WITHOUT RLS
-- =============================================

-- Enable RLS on customer_notifications (assuming it exists)
-- If the table doesn't exist, this will fail, but that's okay
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_notifications') THEN
    EXECUTE 'ALTER TABLE customer_notifications ENABLE ROW LEVEL SECURITY';
    -- Drop existing policy if exists
    EXECUTE 'DROP POLICY IF EXISTS "authenticated_select_customer_notifications" ON customer_notifications';
    -- Add basic policy
    EXECUTE 'CREATE POLICY "authenticated_select_customer_notifications" ON customer_notifications FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;

-- Enable RLS on cached_table_metadata
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cached_table_metadata') THEN
    EXECUTE 'ALTER TABLE cached_table_metadata ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "authenticated_select_cached_table_metadata" ON cached_table_metadata';
    EXECUTE 'CREATE POLICY "authenticated_select_cached_table_metadata" ON cached_table_metadata FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;

-- Enable RLS on cached_column_metadata
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cached_column_metadata') THEN
    EXECUTE 'ALTER TABLE cached_column_metadata ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "authenticated_select_cached_column_metadata" ON cached_column_metadata';
    EXECUTE 'CREATE POLICY "authenticated_select_cached_column_metadata" ON cached_column_metadata FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;

-- Enable RLS on customer_payment_methods
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_payment_methods') THEN
    EXECUTE 'ALTER TABLE customer_payment_methods ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "authenticated_select_customer_payment_methods" ON customer_payment_methods';
    EXECUTE 'CREATE POLICY "authenticated_select_customer_payment_methods" ON customer_payment_methods FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;

-- Enable RLS on customer_payment_tokens
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_payment_tokens') THEN
    EXECUTE 'ALTER TABLE customer_payment_tokens ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "authenticated_select_customer_payment_tokens" ON customer_payment_tokens';
    EXECUTE 'CREATE POLICY "authenticated_select_customer_payment_tokens" ON customer_payment_tokens FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;

-- =============================================
-- 4. ADD INDEXES TO IMPROVE PERFORMANCE
-- =============================================

-- Add indexes on commonly queried columns for RLS policies
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_membership_tier ON customers(membership_tier);

-- =============================================
-- 5. FIX AUTH RLS INITPLAN ISSUES
-- =============================================

-- Optimize employees policies
DROP POLICY IF EXISTS "employees_select" ON employees;
DROP POLICY IF EXISTS "employees_manage" ON employees;

CREATE POLICY "employees_select" ON employees FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()) OR (select get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "employees_manage_insert" ON employees FOR INSERT TO authenticated
  WITH CHECK ((select get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "employees_manage_update" ON employees FOR UPDATE TO authenticated
  USING ((select get_user_role()) IN ('admin', 'manager'))
  WITH CHECK ((select get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "employees_manage_delete" ON employees FOR DELETE TO authenticated
  USING ((select get_user_role()) IN ('admin', 'manager'));

-- Optimize employee_shifts policies
DROP POLICY IF EXISTS "employee_shifts_select" ON employee_shifts;
DROP POLICY IF EXISTS "employee_shifts_manage" ON employee_shifts;

CREATE POLICY "employee_shifts_select" ON employee_shifts FOR SELECT TO authenticated
  USING (employee_id IN (SELECT id FROM employees WHERE user_id = (select auth.uid())) OR (select get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "employee_shifts_manage_insert" ON employee_shifts FOR INSERT TO authenticated
  WITH CHECK ((select get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "employee_shifts_manage_update" ON employee_shifts FOR UPDATE TO authenticated
  USING ((select get_user_role()) IN ('admin', 'manager'))
  WITH CHECK ((select get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "employee_shifts_manage_delete" ON employee_shifts FOR DELETE TO authenticated
  USING ((select get_user_role()) IN ('admin', 'manager'));

-- Optimize employee_performance policies
DROP POLICY IF EXISTS "employee_performance_select" ON employee_performance;
DROP POLICY IF EXISTS "employee_performance_manage" ON employee_performance;

CREATE POLICY "employee_performance_select" ON employee_performance FOR SELECT TO authenticated
  USING (employee_id IN (SELECT id FROM employees WHERE user_id = (select auth.uid())) OR (select get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "employee_performance_manage_insert" ON employee_performance FOR INSERT TO authenticated
  WITH CHECK ((select get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "employee_performance_manage_update" ON employee_performance FOR UPDATE TO authenticated
  USING ((select get_user_role()) IN ('admin', 'manager'))
  WITH CHECK ((select get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "employee_performance_manage_delete" ON employee_performance FOR DELETE TO authenticated
  USING ((select get_user_role()) IN ('admin', 'manager'));

-- =============================================
-- 6. REMOVE DUPLICATE INDEXES
-- =============================================

-- Drop duplicate indexes on products
DROP INDEX IF EXISTS idx_products_category;

-- Drop duplicate indexes on sale_items
DROP INDEX IF EXISTS idx_sale_items_sale;

-- Drop duplicate indexes on sales
DROP INDEX IF EXISTS idx_sales_created;
DROP INDEX IF EXISTS idx_sales_user;

-- =============================================
-- 7. OPTIMIZE EXISTING POLICIES
-- =============================================

-- Ensure the get_user_role function is optimized
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT r.name FROM roles r JOIN profiles p ON p.role_id = r.id WHERE p.id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Add comment for documentation
COMMENT ON FUNCTION get_user_role() IS 'Returns the role name for the current authenticated user. Optimized with STABLE for better performance.';