-- =============================================
-- CUSTOMER LOYALTY SYSTEM TABLES
-- =============================================
-- This file contains the additional tables for the customer database
-- with purchase history tracking, points-based loyalty system,
-- tier-based rewards, and customer analytics.
-- Includes registered_customers table for pre-registration.

-- =============================================
-- 1. REGISTERED CUSTOMERS TABLE
-- =============================================
-- For customers who register before shopping
CREATE TABLE IF NOT EXISTS registered_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
-- 2. CUSTOMER LOYALTY ACCOUNTS TABLE
-- =============================================
-- Main loyalty accounts for points tracking
CREATE TABLE IF NOT EXISTS customer_loyalty_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  current_points INTEGER DEFAULT 0 CHECK (current_points >= 0),
  total_points_earned INTEGER DEFAULT 0,
  total_points_redeemed INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id)
);

-- =============================================
-- 3. LOYALTY TRANSACTIONS TABLE
-- =============================================
-- For tracking points earned and redeemed
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES customer_loyalty_accounts(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'redeem', 'adjustment')),
  points INTEGER NOT NULL,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. CUSTOMER PURCHASE HISTORY VIEW
-- =============================================
-- View for easy access to customer purchase history
CREATE OR REPLACE VIEW customer_purchase_history AS
SELECT
  c.id as customer_id,
  c.full_name,
  c.phone,
  c.email,
  s.id as sale_id,
  s.invoice_number,
  s.created_at as purchase_date,
  s.total as purchase_amount,
  s.subtotal,
  s.tax_amount,
  s.discount_amount,
  COUNT(si.product_id) as items_count,
  STRING_AGG(p.name, ', ') as products_purchased
FROM customers c
LEFT JOIN sales s ON s.customer_id = c.id
LEFT JOIN sale_items si ON si.sale_id = s.id
LEFT JOIN products p ON p.id = si.product_id
WHERE s.status = 'completed'
GROUP BY c.id, c.full_name, c.phone, c.email, s.id, s.invoice_number, s.created_at, s.total, s.subtotal, s.tax_amount, s.discount_amount
ORDER BY s.created_at DESC;

-- =============================================
-- 3. CUSTOMER ANALYTICS TABLE
-- =============================================
-- For storing computed analytics data
CREATE TABLE IF NOT EXISTS customer_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  analysis_date DATE NOT NULL,
  total_purchases INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  average_order_value DECIMAL(10,2),
  purchase_frequency_days DECIMAL(5,2),
  favorite_category TEXT,
  last_purchase_date TIMESTAMPTZ,
  days_since_last_purchase INTEGER,
  churn_risk TEXT CHECK (churn_risk IN ('low', 'medium', 'high')),
  lifetime_value DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, analysis_date)
);

-- =============================================
-- 4. LOYALTY TIERS CONFIGURATION
-- =============================================
-- Configuration for tier-based rewards
CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL UNIQUE CHECK (tier_name IN ('bronze', 'silver', 'gold', 'platinum')),
  min_points INTEGER NOT NULL DEFAULT 0,
  earning_multiplier DECIMAL(3,2) DEFAULT 1.0,
  redemption_multiplier DECIMAL(3,2) DEFAULT 1.0,
  benefits JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. CUSTOMER FEEDBACK TABLE
-- =============================================
-- For collecting customer feedback and reviews
CREATE TABLE IF NOT EXISTS customer_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  feedback_type TEXT CHECK (feedback_type IN ('product', 'service', 'store', 'general')),
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. CUSTOMER PREFERENCES TABLE
-- =============================================
-- For storing customer preferences and marketing opt-ins
CREATE TABLE IF NOT EXISTS customer_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  email_marketing BOOLEAN DEFAULT TRUE,
  sms_marketing BOOLEAN DEFAULT TRUE,
  birthday_reminders BOOLEAN DEFAULT TRUE,
  preferred_categories TEXT[],
  preferred_payment_methods TEXT[],
  preferred_shopping_times TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_registered_customers_phone ON registered_customers(phone);
CREATE INDEX IF NOT EXISTS idx_registered_customers_email ON registered_customers(email);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_customer ON customer_analytics(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_customer ON customer_feedback(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_preferences_customer ON customer_preferences(customer_id);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE registered_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_preferences ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================
-- Registered customers: authenticated users can read, admins/managers can manage
CREATE POLICY "authenticated_select_registered" ON registered_customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manager_insert_registered" ON registered_customers FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('admin', 'manager'));
CREATE POLICY "admin_manager_update_registered" ON registered_customers FOR UPDATE TO authenticated USING (get_user_role() IN ('admin', 'manager'));
CREATE POLICY "admin_manager_delete_registered" ON registered_customers FOR DELETE TO authenticated USING (get_user_role() IN ('admin', 'manager'));

-- Customer analytics: authenticated users can read, admins/managers can manage
CREATE POLICY "authenticated_select_analytics" ON customer_analytics FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manager_all_analytics" ON customer_analytics FOR ALL TO authenticated USING (get_user_role() IN ('admin', 'manager'));

-- Loyalty tiers: all authenticated can read, admins can manage
CREATE POLICY "authenticated_select_tiers" ON loyalty_tiers FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_all_tiers" ON loyalty_tiers FOR ALL TO authenticated USING (get_user_role() = 'admin');

-- Customer feedback: customers can insert their own, authenticated can read
CREATE POLICY "customer_insert_feedback" ON customer_feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (SELECT id FROM customers WHERE id = customer_id) OR get_user_role() IN ('admin', 'manager', 'cashier'));
CREATE POLICY "authenticated_select_feedback" ON customer_feedback FOR SELECT TO authenticated USING (true);

-- Customer preferences: customers can manage their own, admins/managers can manage all
CREATE POLICY "customer_manage_preferences" ON customer_preferences FOR ALL TO authenticated USING (auth.uid() IN (SELECT id FROM customers WHERE id = customer_id) OR get_user_role() IN ('admin', 'manager'));
CREATE POLICY "admin_manager_all_preferences" ON customer_preferences FOR ALL TO authenticated USING (get_user_role() IN ('admin', 'manager'));

-- =============================================
-- SEED DATA
-- =============================================
INSERT INTO loyalty_tiers (tier_name, min_points, earning_multiplier, redemption_multiplier, benefits) VALUES
  ('bronze', 0, 1.0, 1.0, '{"birthday_discount": 5, "points_multiplier": 1}'),
  ('silver', 1000, 1.2, 1.1, '{"birthday_discount": 10, "points_multiplier": 1.2, "free_delivery": true}'),
  ('gold', 5000, 1.5, 1.25, '{"birthday_discount": 15, "points_multiplier": 1.5, "free_delivery": true, "priority_service": true}'),
  ('platinum', 15000, 2.0, 1.5, '{"birthday_discount": 20, "points_multiplier": 2.0, "free_delivery": true, "priority_service": true, "personal_shopper": true}')
ON CONFLICT (tier_name) DO NOTHING;

-- =============================================
-- FUNCTIONS FOR LOYALTY SYSTEM
-- =============================================

-- Function to get customer tier based on points
CREATE OR REPLACE FUNCTION get_customer_tier(customer_points INTEGER)
RETURNS TEXT AS $$
  SELECT tier_name
  FROM loyalty_tiers
  WHERE min_points <= customer_points
  ORDER BY min_points DESC
  LIMIT 1;
$$ LANGUAGE SQL;

-- Function to calculate points earned
CREATE OR REPLACE FUNCTION calculate_points_earned(customer_id UUID, purchase_amount DECIMAL)
RETURNS INTEGER AS $$
DECLARE
  current_tier TEXT;
  multiplier DECIMAL;
  base_points INTEGER;
BEGIN
  -- Get current tier
  SELECT tier INTO current_tier
  FROM customer_loyalty_accounts
  WHERE customer_id = $1;

  IF current_tier IS NULL THEN
    current_tier := 'bronze';
  END IF;

  -- Get multiplier
  SELECT earning_multiplier INTO multiplier
  FROM loyalty_tiers
  WHERE tier_name = current_tier;

  -- Calculate base points (1 point per currency unit)
  base_points := FLOOR(purchase_amount)::INTEGER;

  -- Apply multiplier
  RETURN FLOOR(base_points * multiplier)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Function to update customer analytics
CREATE OR REPLACE FUNCTION update_customer_analytics(target_customer_id UUID)
RETURNS VOID AS $$
DECLARE
  total_purch DECIMAL(12,2) := 0;
  total_count INTEGER := 0;
  avg_order DECIMAL(10,2) := 0;
  freq_days DECIMAL(5,2) := 0;
  last_purch TIMESTAMPTZ;
  days_since INTEGER := 0;
  fav_cat TEXT;
  lifetime_val DECIMAL(12,2) := 0;
  churn TEXT := 'low';
BEGIN
  -- Calculate totals
  SELECT COALESCE(SUM(total), 0), COUNT(*)
  INTO total_purch, total_count
  FROM sales
  WHERE customer_id = target_customer_id AND status = 'completed';

  -- Average order value
  IF total_count > 0 THEN
    avg_order := total_purch / total_count;
  END IF;

  -- Purchase frequency
  SELECT MAX(created_at), MIN(created_at)
  INTO last_purch, freq_days
  FROM sales
  WHERE customer_id = target_customer_id AND status = 'completed';

  IF total_count > 1 THEN
    freq_days := EXTRACT(EPOCH FROM (last_purch - MIN(created_at))) / (total_count - 1) / 86400;
  END IF;

  -- Days since last purchase
  IF last_purch IS NOT NULL THEN
    days_since := EXTRACT(EPOCH FROM (NOW() - last_purch)) / 86400;
  END IF;

  -- Favorite category
  SELECT c.name INTO fav_cat
  FROM categories c
  JOIN products p ON p.category_id = c.id
  JOIN sale_items si ON si.product_id = p.id
  JOIN sales s ON s.id = si.sale_id
  WHERE s.customer_id = target_customer_id AND s.status = 'completed'
  GROUP BY c.id, c.name
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Lifetime value
  lifetime_val := total_purch;

  -- Churn risk
  IF days_since > 90 THEN
    churn := 'high';
  ELSIF days_since > 30 THEN
    churn := 'medium';
  END IF;

  -- Insert or update analytics
  INSERT INTO customer_analytics (
    customer_id, analysis_date, total_purchases, total_spent,
    average_order_value, purchase_frequency_days, favorite_category,
    last_purchase_date, days_since_last_purchase, churn_risk, lifetime_value
  ) VALUES (
    target_customer_id, CURRENT_DATE, total_count, total_purch,
    avg_order, freq_days, fav_cat, last_purch, days_since, churn, lifetime_val
  )
  ON CONFLICT (customer_id, analysis_date)
  DO UPDATE SET
    total_purchases = EXCLUDED.total_purchases,
    total_spent = EXCLUDED.total_spent,
    average_order_value = EXCLUDED.average_order_value,
    purchase_frequency_days = EXCLUDED.purchase_frequency_days,
    favorite_category = EXCLUDED.favorite_category,
    last_purchase_date = EXCLUDED.last_purchase_date,
    days_since_last_purchase = EXCLUDED.days_since_last_purchase,
    churn_risk = EXCLUDED.churn_risk,
    lifetime_value = EXCLUDED.lifetime_value;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger to update customer analytics after sale
CREATE OR REPLACE FUNCTION trigger_update_customer_analytics()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM update_customer_analytics(NEW.customer_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_analytics_trigger
  AFTER INSERT OR UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_customer_analytics();

-- Trigger to update customer tier based on points
CREATE OR REPLACE FUNCTION trigger_update_customer_tier()
RETURNS TRIGGER AS $$
DECLARE
  new_tier TEXT;
BEGIN
  SELECT get_customer_tier(NEW.current_points) INTO new_tier;

  IF new_tier != OLD.tier THEN
    UPDATE customer_loyalty_accounts
    SET tier = new_tier, updated_at = NOW()
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_tier_trigger
  AFTER UPDATE ON customer_loyalty_accounts
  FOR EACH ROW
  WHEN (OLD.current_points != NEW.current_points)
  EXECUTE FUNCTION trigger_update_customer_tier();