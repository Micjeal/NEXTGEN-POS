-- Missing Loyalty Tables - Run this if customer_loyalty_accounts is missing

-- =============================================
-- LOYALTY PROGRAMS
-- =============================================
CREATE TABLE IF NOT EXISTS loyalty_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  points_per_currency DECIMAL(10,2) DEFAULT 1.0,
  currency_to_points_rate DECIMAL(10,2) DEFAULT 1.0,
  redemption_rate DECIMAL(10,2) DEFAULT 0.01,
  minimum_points_for_redemption INTEGER DEFAULT 100,
  points_expiry_months INTEGER DEFAULT 24,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CUSTOMER LOYALTY ACCOUNTS
-- =============================================
CREATE TABLE IF NOT EXISTS customer_loyalty_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  loyalty_program_id UUID NOT NULL REFERENCES loyalty_programs(id),
  current_points INTEGER DEFAULT 0 CHECK (current_points >= 0),
  total_points_earned INTEGER DEFAULT 0 CHECK (total_points_earned >= 0),
  total_points_redeemed INTEGER DEFAULT 0 CHECK (total_points_redeemed >= 0),
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  join_date DATE DEFAULT CURRENT_DATE,
  last_activity_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, loyalty_program_id)
);

-- =============================================
-- LOYALTY TRANSACTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_loyalty_account_id UUID NOT NULL REFERENCES customer_loyalty_accounts(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'redeem', 'expire', 'adjustment')),
  points INTEGER NOT NULL,
  points_balance_before INTEGER NOT NULL,
  points_balance_after INTEGER NOT NULL,
  sale_id UUID REFERENCES sales(id),
  description TEXT,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- LOYALTY TIERS CONFIGURATION
-- =============================================
CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL UNIQUE CHECK (tier_name IN ('bronze', 'silver', 'gold', 'platinum')),
  min_points INTEGER NOT NULL DEFAULT 0,
  max_points INTEGER,
  earning_multiplier DECIMAL(3,2) DEFAULT 1.0,
  redemption_multiplier DECIMAL(3,2) DEFAULT 1.0,
  benefits JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ENABLE RLS
-- =============================================
ALTER TABLE loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================
CREATE POLICY "authenticated_select_loyalty_programs" ON loyalty_programs FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manage_loyalty_programs" ON loyalty_programs FOR ALL TO authenticated USING (get_user_role() = 'admin');

CREATE POLICY "customer_select_own_loyalty_accounts" ON customer_loyalty_accounts FOR SELECT TO authenticated USING (
  customer_id IN (
    SELECT c.id FROM customers c
    JOIN registered_customers rc ON c.registered_customer_id = rc.id
    WHERE rc.user_id = auth.uid()
  ) OR get_user_role() IN ('admin', 'manager', 'cashier')
);
CREATE POLICY "admin_manager_manage_loyalty_accounts" ON customer_loyalty_accounts FOR ALL TO authenticated USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "customer_select_own_loyalty_transactions" ON loyalty_transactions FOR SELECT TO authenticated USING (
  customer_loyalty_account_id IN (
    SELECT cla.id FROM customer_loyalty_accounts cla
    JOIN customers c ON cla.customer_id = c.id
    JOIN registered_customers rc ON c.registered_customer_id = rc.id
    WHERE rc.user_id = auth.uid()
  ) OR get_user_role() IN ('admin', 'manager', 'cashier')
);
CREATE POLICY "admin_manager_manage_loyalty_transactions" ON loyalty_transactions FOR ALL TO authenticated USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "authenticated_select_loyalty_tiers" ON loyalty_tiers FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manage_loyalty_tiers" ON loyalty_tiers FOR ALL TO authenticated USING (get_user_role() = 'admin');

-- =============================================
-- SEED DATA
-- =============================================
INSERT INTO loyalty_programs (name, description, points_per_currency, redemption_rate) VALUES
  ('Standard Loyalty Program', 'Earn 1 point per UGX 1 spent', 1.0, 0.01)
ON CONFLICT DO NOTHING;

INSERT INTO loyalty_tiers (tier_name, min_points, max_points, earning_multiplier, redemption_multiplier, benefits) VALUES
  ('bronze', 0, 999, 1.0, 1.0, '{"birthday_discount": false, "free_delivery": false, "priority_support": false}'),
  ('silver', 1000, 4999, 1.1, 1.05, '{"birthday_discount": true, "free_delivery": false, "priority_support": false}'),
  ('gold', 5000, 9999, 1.2, 1.1, '{"birthday_discount": true, "free_delivery": true, "priority_support": true}'),
  ('platinum', 10000, NULL, 1.3, 1.15, '{"birthday_discount": true, "free_delivery": true, "priority_support": true, "personal_shopper": true}')
ON CONFLICT (tier_name) DO NOTHING;

-- =============================================
-- TRIGGER FOR TIER UPDATES
-- =============================================
CREATE OR REPLACE FUNCTION update_customer_loyalty_tier()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE customer_loyalty_accounts
  SET tier = (
    SELECT tier_name FROM loyalty_tiers
    WHERE NEW.current_points >= min_points
    AND (max_points IS NULL OR NEW.current_points <= max_points)
    ORDER BY min_points DESC
    LIMIT 1
  )
  WHERE id = NEW.id;

  UPDATE customers
  SET membership_tier = (
    SELECT tier FROM customer_loyalty_accounts WHERE customer_id = NEW.customer_id
  )
  WHERE id = NEW.customer_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_update_loyalty_tier
  AFTER UPDATE OF current_points ON customer_loyalty_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_loyalty_tier();