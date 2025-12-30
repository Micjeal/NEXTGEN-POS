-- Complete Customer Schema - Run this to add all missing customer tables

-- =============================================
-- UPDATE ROLES TABLE
-- =============================================
ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_access_level_check;
ALTER TABLE roles ADD CONSTRAINT roles_access_level_check CHECK (access_level IN ('admin', 'manager', 'cashier', 'customer'));

INSERT INTO roles (name, description, access_level) VALUES
  ('customer', 'Customer access for loyalty and profile management', 'customer')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- REGISTERED CUSTOMERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS registered_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Uganda',
  registration_date TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- REGISTERED CUSTOMER PROFILES
-- =============================================
CREATE TABLE IF NOT EXISTS registered_customer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  registered_customer_id UUID REFERENCES registered_customers(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role_id UUID REFERENCES roles(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(id),
  UNIQUE(registered_customer_id)
);

-- =============================================
-- MODIFY CUSTOMERS TABLE
-- =============================================
ALTER TABLE customers ADD COLUMN IF NOT EXISTS registered_customer_id UUID REFERENCES registered_customers(id);

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
-- CUSTOMER ANALYTICS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS customer_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  analysis_date DATE NOT NULL,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  average_order_value DECIMAL(10,2),
  purchase_frequency DECIMAL(5,2),
  customer_age_days INTEGER,
  predicted_clv DECIMAL(12,2),
  clv_segment TEXT CHECK (clv_segment IN ('low', 'medium', 'high', 'vip')),
  churn_probability DECIMAL(5,2) CHECK (churn_probability >= 0 AND churn_probability <= 100),
  loyalty_tier TEXT CHECK (loyalty_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  points_balance INTEGER DEFAULT 0,
  last_purchase_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, analysis_date)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_registered_customers_user_id ON registered_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_registered_customers_phone ON registered_customers(phone);
CREATE INDEX IF NOT EXISTS idx_registered_customers_email ON registered_customers(email);
CREATE INDEX IF NOT EXISTS idx_registered_customer_profiles_id ON registered_customer_profiles(id);
CREATE INDEX IF NOT EXISTS idx_registered_customer_profiles_registered_customer_id ON registered_customer_profiles(registered_customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_registered_customer_id ON customers(registered_customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_customer_id ON customer_analytics(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_date ON customer_analytics(analysis_date);

-- =============================================
-- ENABLE RLS
-- =============================================
ALTER TABLE registered_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE registered_customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_analytics ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================
CREATE POLICY "customer_select_own_registered_customers" ON registered_customers FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR get_user_role() IN ('admin', 'manager', 'cashier')
);
CREATE POLICY "customer_update_own_registered_customers" ON registered_customers FOR UPDATE TO authenticated USING (
  user_id = auth.uid() OR get_user_role() IN ('admin', 'manager')
) WITH CHECK (
  user_id = auth.uid() OR get_user_role() IN ('admin', 'manager')
);
CREATE POLICY "admin_manager_insert_registered_customers" ON registered_customers FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('admin', 'manager'));
CREATE POLICY "admin_manager_delete_registered_customers" ON registered_customers FOR DELETE TO authenticated USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "customer_select_own_profiles" ON registered_customer_profiles FOR SELECT TO authenticated USING (
  id = auth.uid() OR get_user_role() IN ('admin', 'manager', 'cashier')
);
CREATE POLICY "customer_update_own_profiles" ON registered_customer_profiles FOR UPDATE TO authenticated USING (
  id = auth.uid() OR get_user_role() IN ('admin', 'manager')
) WITH CHECK (
  id = auth.uid() OR get_user_role() IN ('admin', 'manager')
);
CREATE POLICY "admin_manager_manage_profiles" ON registered_customer_profiles FOR ALL TO authenticated USING (get_user_role() IN ('admin', 'manager'));

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

CREATE POLICY "customer_select_own_analytics" ON customer_analytics FOR SELECT TO authenticated USING (
  customer_id IN (
    SELECT c.id FROM customers c
    JOIN registered_customers rc ON c.registered_customer_id = rc.id
    WHERE rc.user_id = auth.uid()
  ) OR get_user_role() IN ('admin', 'manager')
);
CREATE POLICY "admin_manager_manage_customer_analytics" ON customer_analytics FOR ALL TO authenticated USING (get_user_role() IN ('admin', 'manager'));

-- =============================================
-- FUNCTIONS
-- =============================================
CREATE OR REPLACE FUNCTION get_customer_role()
RETURNS TEXT AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM registered_customer_profiles WHERE id = auth.uid()) THEN
    RETURN 'customer';
  ELSE
    RETURN get_user_role();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_customer_from_registered(customer_phone TEXT, customer_email TEXT)
RETURNS UUID AS $$
DECLARE
  reg_customer_id UUID;
  new_customer_id UUID;
BEGIN
  SELECT id INTO reg_customer_id
  FROM registered_customers
  WHERE (phone = customer_phone OR (phone IS NULL AND customer_phone IS NULL))
  AND (email = customer_email OR (email IS NULL AND customer_email IS NULL))
  LIMIT 1;

  IF reg_customer_id IS NOT NULL THEN
    SELECT id INTO new_customer_id
    FROM customers
    WHERE registered_customer_id = reg_customer_id;

    IF new_customer_id IS NULL THEN
      INSERT INTO customers (
        phone, email, full_name, date_of_birth, gender, address, city, country,
        registered_customer_id, first_visit_date
      )
      SELECT phone, email, full_name, date_of_birth, gender, address, city, country,
             id, NOW()
      FROM registered_customers
      WHERE id = reg_customer_id
      RETURNING id INTO new_customer_id;

      INSERT INTO customer_loyalty_accounts (customer_id, loyalty_program_id)
      SELECT new_customer_id, id FROM loyalty_programs WHERE is_active = true LIMIT 1;
    END IF;

    RETURN new_customer_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================
CREATE OR REPLACE FUNCTION create_registered_customer_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO registered_customer_profiles (id, registered_customer_id, email, full_name, role_id)
  SELECT NEW.user_id, NEW.id, NEW.email, NEW.full_name, r.id
  FROM roles r
  WHERE r.name = 'customer';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_create_registered_customer_profile
  AFTER INSERT ON registered_customers
  FOR EACH ROW
  EXECUTE FUNCTION create_registered_customer_profile();

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