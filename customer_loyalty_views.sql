-- Customer Loyalty Views
-- Run this after the base schema and customer_loyalty_schema_addition.sql are applied

-- =============================================
-- CUSTOMER PURCHASE HISTORY VIEW
-- =============================================
-- View for easy access to customer purchase history
CREATE OR REPLACE VIEW customer_purchase_history AS
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

-- =============================================
-- CUSTOMER LOYALTY DASHBOARD VIEW
-- =============================================
-- View for customers to see their loyalty information
CREATE OR REPLACE VIEW customer_loyalty_dashboard AS
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
-- ENABLE RLS ON VIEWS
-- =============================================
ALTER VIEW customer_purchase_history SET (security_barrier = true);
ALTER VIEW customer_loyalty_dashboard SET (security_barrier = true);

-- =============================================
-- RLS POLICIES FOR VIEWS
-- =============================================
-- Customer Purchase History: Customers can see their own history
CREATE POLICY "customer_view_own_purchase_history" ON customer_purchase_history
FOR SELECT TO authenticated
USING (
  customer_id IN (
    SELECT c.id FROM customers c
    JOIN registered_customers rc ON c.registered_customer_id = rc.id
    WHERE rc.user_id = auth.uid()
  ) OR get_user_role() IN ('admin', 'manager', 'cashier')
);

-- Customer Loyalty Dashboard: Customers can see their own dashboard
CREATE POLICY "customer_view_own_loyalty_dashboard" ON customer_loyalty_dashboard
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR get_user_role() IN ('admin', 'manager', 'cashier')
);