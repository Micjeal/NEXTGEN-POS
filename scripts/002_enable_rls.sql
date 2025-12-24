-- Enable Row Level Security on all tables
-- SMMS POS System RLS Policies

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTION: Get user role
-- =============================================
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT r.name 
  FROM roles r 
  JOIN profiles p ON p.role_id = r.id 
  WHERE p.id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- =============================================
-- ROLES POLICIES (Admin only for management)
-- =============================================
CREATE POLICY "roles_select_authenticated" ON roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "roles_insert_admin" ON roles
  FOR INSERT TO authenticated 
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "roles_update_admin" ON roles
  FOR UPDATE TO authenticated 
  USING (get_user_role() = 'admin');

-- =============================================
-- PROFILES POLICIES
-- =============================================
CREATE POLICY "profiles_select_authenticated" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own_or_admin" ON profiles
  FOR UPDATE TO authenticated 
  USING (auth.uid() = id OR get_user_role() = 'admin');

-- =============================================
-- CATEGORIES POLICIES (All authenticated can read)
-- =============================================
CREATE POLICY "categories_select_authenticated" ON categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "categories_insert_manager_admin" ON categories
  FOR INSERT TO authenticated 
  WITH CHECK (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "categories_update_manager_admin" ON categories
  FOR UPDATE TO authenticated 
  USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "categories_delete_admin" ON categories
  FOR DELETE TO authenticated 
  USING (get_user_role() = 'admin');

-- =============================================
-- PRODUCTS POLICIES
-- =============================================
CREATE POLICY "products_select_authenticated" ON products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "products_insert_manager_admin" ON products
  FOR INSERT TO authenticated 
  WITH CHECK (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "products_update_manager_admin" ON products
  FOR UPDATE TO authenticated 
  USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "products_delete_admin" ON products
  FOR DELETE TO authenticated 
  USING (get_user_role() = 'admin');

-- =============================================
-- INVENTORY POLICIES
-- =============================================
CREATE POLICY "inventory_select_authenticated" ON inventory
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "inventory_insert_manager_admin" ON inventory
  FOR INSERT TO authenticated 
  WITH CHECK (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "inventory_update_manager_admin" ON inventory
  FOR UPDATE TO authenticated 
  USING (get_user_role() IN ('admin', 'manager'));

-- =============================================
-- INVENTORY ADJUSTMENTS POLICIES
-- =============================================
CREATE POLICY "inventory_adjustments_select_manager_admin" ON inventory_adjustments
  FOR SELECT TO authenticated 
  USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "inventory_adjustments_insert_authenticated" ON inventory_adjustments
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- PAYMENT METHODS POLICIES
-- =============================================
CREATE POLICY "payment_methods_select_authenticated" ON payment_methods
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "payment_methods_insert_admin" ON payment_methods
  FOR INSERT TO authenticated 
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "payment_methods_update_admin" ON payment_methods
  FOR UPDATE TO authenticated 
  USING (get_user_role() = 'admin');

-- =============================================
-- SALES POLICIES (Cashiers can create, view own)
-- =============================================
CREATE POLICY "sales_select_own_or_manager" ON sales
  FOR SELECT TO authenticated 
  USING (auth.uid() = user_id OR get_user_role() IN ('admin', 'manager'));

CREATE POLICY "sales_insert_authenticated" ON sales
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sales_update_manager_admin" ON sales
  FOR UPDATE TO authenticated 
  USING (get_user_role() IN ('admin', 'manager'));

-- =============================================
-- SALE ITEMS POLICIES
-- =============================================
CREATE POLICY "sale_items_select_via_sale" ON sale_items
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM sales s 
      WHERE s.id = sale_items.sale_id 
      AND (s.user_id = auth.uid() OR get_user_role() IN ('admin', 'manager'))
    )
  );

CREATE POLICY "sale_items_insert_authenticated" ON sale_items
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sales s 
      WHERE s.id = sale_items.sale_id 
      AND s.user_id = auth.uid()
    )
  );

-- =============================================
-- PAYMENTS POLICIES
-- =============================================
CREATE POLICY "payments_select_via_sale" ON payments
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM sales s 
      WHERE s.id = payments.sale_id 
      AND (s.user_id = auth.uid() OR get_user_role() IN ('admin', 'manager'))
    )
  );

CREATE POLICY "payments_insert_authenticated" ON payments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sales s
      WHERE s.id = payments.sale_id
      AND s.user_id = auth.uid()
    )
  );

-- =============================================
-- CUSTOMERS POLICIES (All authenticated can read, managers/admins can modify)
-- =============================================
CREATE POLICY "customers_select_authenticated" ON customers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "customers_insert_authenticated" ON customers
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "customers_update_manager_admin" ON customers
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "customers_delete_admin" ON customers
  FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- =============================================
-- MESSAGES POLICIES
-- =============================================
CREATE POLICY "messages_select_own_or_recipient" ON messages
  FOR SELECT TO authenticated
  USING (
    auth.uid() = sender_id OR
    auth.uid() = recipient_id OR
    recipient_role = get_user_role() OR
    message_type IN ('broadcast', 'system')
  );

CREATE POLICY "messages_insert_authenticated" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "messages_update_own" ON messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- =============================================
-- MESSAGE RECIPIENTS POLICIES
-- =============================================
CREATE POLICY "message_recipients_select_own" ON message_recipients
  FOR SELECT TO authenticated
  USING (auth.uid() = recipient_id);

CREATE POLICY "message_recipients_insert_authenticated" ON message_recipients
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "message_recipients_update_own" ON message_recipients
  FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id);

-- =============================================
-- MESSAGE TEMPLATES POLICIES
-- =============================================
CREATE POLICY "message_templates_select_authenticated" ON message_templates
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "message_templates_insert_manager_admin" ON message_templates
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "message_templates_update_own_or_admin" ON message_templates
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR get_user_role() = 'admin');

-- =============================================
-- AUDIT LOGS POLICIES (Admin only)
-- =============================================
CREATE POLICY "audit_logs_select_admin" ON audit_logs
  FOR SELECT TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "audit_logs_insert_authenticated" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
