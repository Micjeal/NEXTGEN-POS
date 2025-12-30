-- Additional Tables for Customer Database with Purchase History Tracking, Points-Based Loyalty System, Tier-Based Rewards, Customer Analytics Dashboard, and POS Integration
-- This adds to the existing schema without affecting other tables

-- =============================================
-- 0. UPDATE ROLES TABLE CONSTRAINT AND ADD CUSTOMER ROLE
-- =============================================
-- First, update the check constraint to include 'customer'
ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_access_level_check;
ALTER TABLE roles ADD CONSTRAINT roles_access_level_check CHECK (access_level IN ('admin', 'manager', 'cashier', 'customer'));

-- Then add the customer role
INSERT INTO roles (name, description, access_level) VALUES
  ('customer', 'Customer access for loyalty and profile management', 'customer')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- 1. REGISTERED CUSTOMERS TABLE
-- =============================================
-- Table for customers who register before making purchases
-- Linked to auth.users for login capabilities
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
-- 2. REGISTERED CUSTOMER PROFILES
-- =============================================
-- Profiles for registered customers (similar to staff profiles but for customers)
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
-- 3. MODIFY CUSTOMERS TABLE (Add reference to registered customers)
-- =============================================
-- Add foreign key to link customers to their registered customer record
ALTER TABLE customers ADD COLUMN IF NOT EXISTS registered_customer_id UUID REFERENCES registered_customers(id);

-- =============================================
-- 3. CUSTOMER ANALYTICS TABLE
-- =============================================
-- Table for storing customer analytics data
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
-- 4. LOYALTY TIERS CONFIGURATION
-- =============================================
-- Table for configuring tier-based rewards
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
-- 4. CUSTOMER ANALYTICS TABLE
-- =============================================
-- Table for storing customer analytics data
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
-- 5. LOYALTY TIERS CONFIGURATION
-- =============================================
-- Table for configuring tier-based rewards
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
-- ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE registered_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE registered_customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================
-- Registered Customers: Customers can read/update their own, admins/managers can manage all
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

-- Registered Customer Profiles: Similar access
CREATE POLICY "customer_select_own_profiles" ON registered_customer_profiles FOR SELECT TO authenticated USING (
  id = auth.uid() OR get_user_role() IN ('admin', 'manager', 'cashier')
);
CREATE POLICY "customer_update_own_profiles" ON registered_customer_profiles FOR UPDATE TO authenticated USING (
  id = auth.uid() OR get_user_role() IN ('admin', 'manager')
) WITH CHECK (
  id = auth.uid() OR get_user_role() IN ('admin', 'manager')
);
CREATE POLICY "admin_manager_manage_profiles" ON registered_customer_profiles FOR ALL TO authenticated USING (get_user_role() IN ('admin', 'manager'));

-- Customer Analytics: Customers can read their own, admins/managers can read all
CREATE POLICY "customer_select_own_analytics" ON customer_analytics FOR SELECT TO authenticated USING (
  customer_id IN (
    SELECT c.id FROM customers c
    JOIN registered_customers rc ON c.registered_customer_id = rc.id
    WHERE rc.user_id = auth.uid()
  ) OR get_user_role() IN ('admin', 'manager')
);
CREATE POLICY "admin_manager_manage_customer_analytics" ON customer_analytics FOR ALL TO authenticated USING (get_user_role() IN ('admin', 'manager'));

-- Loyalty Tiers: All authenticated users can read, admins can manage
CREATE POLICY "authenticated_select_loyalty_tiers" ON loyalty_tiers FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manage_loyalty_tiers" ON loyalty_tiers FOR ALL TO authenticated USING (get_user_role() = 'admin');

-- =============================================
-- SEED DATA
-- =============================================
INSERT INTO loyalty_tiers (tier_name, min_points, max_points, earning_multiplier, redemption_multiplier, benefits) VALUES
  ('bronze', 0, 999, 1.0, 1.0, '{"birthday_discount": false, "free_delivery": false, "priority_support": false}'),
  ('silver', 1000, 4999, 1.1, 1.05, '{"birthday_discount": true, "free_delivery": false, "priority_support": false}'),
  ('gold', 5000, 9999, 1.2, 1.1, '{"birthday_discount": true, "free_delivery": true, "priority_support": true}'),
  ('platinum', 10000, NULL, 1.3, 1.15, '{"birthday_discount": true, "free_delivery": true, "priority_support": true, "personal_shopper": true}')
ON CONFLICT (tier_name) DO NOTHING;

-- =============================================
-- FUNCTIONS FOR LOYALTY SYSTEM
-- =============================================
-- Function to update customer tier based on points
CREATE OR REPLACE FUNCTION update_customer_loyalty_tier()
RETURNS TRIGGER AS $$
BEGIN
  -- Update tier in customer_loyalty_accounts based on current points
  UPDATE customer_loyalty_accounts
  SET tier = (
    SELECT tier_name FROM loyalty_tiers
    WHERE NEW.current_points >= min_points
    AND (max_points IS NULL OR NEW.current_points <= max_points)
    ORDER BY min_points DESC
    LIMIT 1
  )
  WHERE id = NEW.id;

  -- Also update the membership_tier in customers table for consistency
  UPDATE customers
  SET membership_tier = (
    SELECT tier FROM customer_loyalty_accounts WHERE customer_id = NEW.customer_id
  )
  WHERE id = NEW.customer_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create customer from registered customer on first purchase
CREATE OR REPLACE FUNCTION create_customer_from_registered(customer_phone TEXT, customer_email TEXT)
RETURNS UUID AS $$
DECLARE
  reg_customer_id UUID;
  new_customer_id UUID;
BEGIN
  -- Find registered customer
  SELECT id INTO reg_customer_id
  FROM registered_customers
  WHERE (phone = customer_phone OR (phone IS NULL AND customer_phone IS NULL))
  AND (email = customer_email OR (email IS NULL AND customer_email IS NULL))
  LIMIT 1;

  IF reg_customer_id IS NOT NULL THEN
    -- Check if customer already exists
    SELECT id INTO new_customer_id
    FROM customers
    WHERE registered_customer_id = reg_customer_id;

    IF new_customer_id IS NULL THEN
      -- Create customer record
      INSERT INTO customers (
        phone, email, full_name, date_of_birth, gender, address, city, country,
        registered_customer_id, first_visit_date
      )
      SELECT phone, email, full_name, date_of_birth, gender, address, city, country,
             id, NOW()
      FROM registered_customers
      WHERE id = reg_customer_id
      RETURNING id INTO new_customer_id;

      -- Create loyalty account
      INSERT INTO customer_loyalty_accounts (customer_id, loyalty_program_id)
      SELECT new_customer_id, id FROM loyalty_programs WHERE is_active = true LIMIT 1;
    END IF;

    RETURN new_customer_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to get customer role (extends get_user_role for customers)
CREATE OR REPLACE FUNCTION get_customer_role()
RETURNS TEXT AS $$
BEGIN
  -- Check if user is a registered customer
  IF EXISTS (SELECT 1 FROM registered_customer_profiles WHERE id = auth.uid()) THEN
    RETURN 'customer';
  ELSE
    RETURN get_user_role();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGERS
-- =============================================
-- Trigger to update tier when points change
CREATE OR REPLACE TRIGGER trigger_update_loyalty_tier
  AFTER UPDATE OF current_points ON customer_loyalty_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_loyalty_tier();

-- Trigger to create registered customer profile when registered customer is created
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

-- =============================================
-- VIEWS (Run these separately after base schema is confirmed)
-- =============================================
-- Note: Create these views after running the master database schema
-- to ensure all referenced tables exist

-- Customer Purchase History View:
/*
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
  lt.points as points_earned
FROM customers c
LEFT JOIN sales s ON s.customer_id = c.id
LEFT JOIN sale_items si ON si.sale_id = s.id
LEFT JOIN loyalty_transactions lt ON lt.sale_id = s.id AND lt.transaction_type = 'earn'
ORDER BY c.id, s.created_at DESC;
*/

-- Customer Loyalty Dashboard View:
/*
CREATE OR REPLACE VIEW customer_loyalty_dashboard AS
SELECT
  rc.id as registered_customer_id,
  rc.user_id,
  rc.full_name,
  rc.phone,
  rc.email,
  c.id as customer_id,
  c.membership_tier,
  c.total_spent,
  c.total_visits,
  c.last_visit_date,
  cla.current_points,
  cla.total_points_earned,
  cla.total_points_redeemed,
  cla.tier,
  cla.join_date,
  lt.benefits as tier_benefits
FROM registered_customers rc
LEFT JOIN customers c ON c.registered_customer_id = rc.id
LEFT JOIN customer_loyalty_accounts cla ON cla.customer_id = c.id
LEFT JOIN loyalty_tiers lt ON lt.tier_name = cla.tier;
*/

-- =============================================
-- GRANTS (if needed for specific roles)
-- =============================================
-- These would be set based on your specific requirements