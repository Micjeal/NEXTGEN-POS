-- Fix database issues: Add missing tables and RLS policies

-- =============================================
-- CASH TRANSACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS cash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drawer_id UUID NOT NULL REFERENCES cash_drawers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('opening_float', 'cash_in', 'cash_out', 'sale', 'refund', 'adjustment', 'closing')),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  balance_before DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CASH DRAWER AUDIT LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS cash_drawer_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drawer_id UUID NOT NULL REFERENCES cash_drawers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('opened', 'closed', 'reconciled', 'transaction_added')),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INVENTORY ADJUSTMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('manual', 'sale', 'purchase', 'return', 'adjustment')),
  quantity_change INTEGER NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reason TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ENABLE RLS ON NEW TABLES
-- =============================================
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_drawer_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_adjustments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ADD MISSING RLS POLICIES
-- =============================================

-- Sales table policies
CREATE POLICY "cashier_insert_sales" ON sales FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND get_user_role() = 'cashier');

CREATE POLICY "cashier_update_own_sales" ON sales FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND get_user_role() = 'cashier')
WITH CHECK (auth.uid() = user_id AND get_user_role() = 'cashier');

CREATE POLICY "admin_manager_insert_sales" ON sales FOR INSERT TO authenticated
WITH CHECK (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "admin_manager_update_sales" ON sales FOR UPDATE TO authenticated
USING (get_user_role() IN ('admin', 'manager'))
WITH CHECK (get_user_role() IN ('admin', 'manager'));

-- Sale items policies
CREATE POLICY "authenticated_insert_sale_items" ON sale_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update_sale_items" ON sale_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Payments policies
CREATE POLICY "authenticated_insert_payments" ON payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update_payments" ON payments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Cash drawers policies
CREATE POLICY "cashier_select_own_drawers" ON cash_drawers FOR SELECT TO authenticated
USING (auth.uid() = user_id OR get_user_role() IN ('admin', 'manager'));

CREATE POLICY "cashier_insert_drawers" ON cash_drawers FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND get_user_role() = 'cashier');

CREATE POLICY "cashier_update_own_drawers" ON cash_drawers FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND get_user_role() = 'cashier')
WITH CHECK (auth.uid() = user_id AND get_user_role() = 'cashier');

CREATE POLICY "admin_manager_manage_drawers" ON cash_drawers FOR ALL TO authenticated
USING (get_user_role() IN ('admin', 'manager'));

-- Cash transactions policies
CREATE POLICY "cashier_select_own_transactions" ON cash_transactions FOR SELECT TO authenticated
USING (auth.uid() = user_id OR get_user_role() IN ('admin', 'manager'));

CREATE POLICY "cashier_insert_transactions" ON cash_transactions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND get_user_role() = 'cashier');

CREATE POLICY "admin_manager_manage_transactions" ON cash_transactions FOR ALL TO authenticated
USING (get_user_role() IN ('admin', 'manager'));

-- Cash drawer audit logs policies
CREATE POLICY "authenticated_select_audit_logs" ON cash_drawer_audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_insert_audit_logs" ON cash_drawer_audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Inventory adjustments policies
CREATE POLICY "authenticated_select_adjustments" ON inventory_adjustments FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_insert_adjustments" ON inventory_adjustments FOR INSERT TO authenticated WITH CHECK (true);

-- Customers policies (for POS operations)
CREATE POLICY "cashier_insert_customers" ON customers FOR INSERT TO authenticated
WITH CHECK (get_user_role() = 'cashier');

CREATE POLICY "cashier_update_customers" ON customers FOR UPDATE TO authenticated
USING (get_user_role() = 'cashier')
WITH CHECK (get_user_role() = 'cashier');

-- Inventory policies
CREATE POLICY "authenticated_update_inventory" ON inventory FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- ADD INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_cash_transactions_drawer_id ON cash_transactions(drawer_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_user_id ON cash_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_created_at ON cash_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_cash_drawer_audit_logs_drawer_id ON cash_drawer_audit_logs(drawer_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_product_id ON inventory_adjustments(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_created_at ON inventory_adjustments(created_at);