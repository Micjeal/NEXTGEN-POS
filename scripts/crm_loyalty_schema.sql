-- SMMS POS CRM & Loyalty System Schema
-- Run this after the main schema to add customer management functionality

-- =============================================
-- CUSTOMERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE, -- Primary identifier for POS lookup
  email TEXT UNIQUE,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Uganda',
  membership_tier TEXT DEFAULT 'bronze' CHECK (membership_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  total_spent DECIMAL(10,2) DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  last_visit_date TIMESTAMPTZ,
  first_visit_date TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- LOYALTY PROGRAMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS loyalty_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  points_per_currency DECIMAL(5,2) DEFAULT 1.0, -- Points earned per currency unit
  currency_to_points_rate DECIMAL(5,2) DEFAULT 1.0,
  minimum_points_redeem INTEGER DEFAULT 100,
  points_expiry_months INTEGER DEFAULT 24,
  redemption_value_per_point DECIMAL(5,2) DEFAULT 0.01, -- Currency value per point
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CUSTOMER LOYALTY ACCOUNTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS customer_loyalty_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  loyalty_program_id UUID NOT NULL REFERENCES loyalty_programs(id),
  current_points INTEGER DEFAULT 0,
  total_points_earned INTEGER DEFAULT 0,
  total_points_redeemed INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'bronze',
  join_date TIMESTAMPTZ DEFAULT NOW(),
  last_points_earned TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(customer_id, loyalty_program_id)
);

-- =============================================
-- LOYALTY TRANSACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_loyalty_account_id UUID NOT NULL REFERENCES customer_loyalty_accounts(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'redeem', 'expire', 'adjust', 'transfer')),
  points INTEGER NOT NULL,
  points_balance_after INTEGER NOT NULL, -- Balance after this transaction
  sale_id UUID REFERENCES sales(id), -- Link to POS transaction
  reason TEXT,
  expiry_date TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MODIFY EXISTING SALES TABLE
-- =============================================
-- Add customer_id to link sales to customers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'customer_id') THEN
    ALTER TABLE sales ADD COLUMN customer_id UUID REFERENCES customers(id);
  END IF;
END $$;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_membership_tier ON customers(membership_tier);
CREATE INDEX IF NOT EXISTS idx_customers_last_visit ON customers(last_visit_date);
CREATE INDEX IF NOT EXISTS idx_customer_loyalty_accounts_customer ON customer_loyalty_accounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_account ON loyalty_transactions(customer_loyalty_account_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_sale ON loyalty_transactions(sale_id);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Customers: All authenticated users can read, managers/admins can modify
CREATE POLICY "customers_select_authenticated" ON customers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "customers_insert_manager_admin" ON customers
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN roles ON profiles.role_id = roles.id
      WHERE profiles.id = auth.uid()
      AND roles.name IN ('admin', 'manager')
    )
  );

CREATE POLICY "customers_update_manager_admin" ON customers
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN roles ON profiles.role_id = roles.id
      WHERE profiles.id = auth.uid()
      AND roles.name IN ('admin', 'manager')
    )
  );

-- Loyalty Programs: Admin only for management
CREATE POLICY "loyalty_programs_select_authenticated" ON loyalty_programs
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "loyalty_programs_manage_admin" ON loyalty_programs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN roles ON profiles.role_id = roles.id
      WHERE profiles.id = auth.uid()
      AND roles.name = 'admin'
    )
  );

-- Customer Loyalty Accounts: Users can view their own, staff can view all
CREATE POLICY "loyalty_accounts_select_own_or_staff" ON customer_loyalty_accounts
  FOR SELECT TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE phone IN (
        SELECT phone FROM customers c
        JOIN profiles p ON p.email = c.email
        WHERE p.id = auth.uid()
      )
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      JOIN roles ON profiles.role_id = roles.id
      WHERE profiles.id = auth.uid()
      AND roles.name IN ('admin', 'manager', 'cashier')
    )
  );

-- Loyalty Transactions: Users can view their own, staff can view all
CREATE POLICY "loyalty_transactions_select_own_or_staff" ON loyalty_transactions
  FOR SELECT TO authenticated
  USING (
    customer_loyalty_account_id IN (
      SELECT cla.id FROM customer_loyalty_accounts cla
      JOIN customers c ON cla.customer_id = c.id
      JOIN profiles p ON p.email = c.email
      WHERE p.id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      JOIN roles ON profiles.role_id = roles.id
      WHERE profiles.id = auth.uid()
      AND roles.name IN ('admin', 'manager', 'cashier')
    )
  );

-- =============================================
-- DEFAULT LOYALTY PROGRAM
-- =============================================
INSERT INTO loyalty_programs (name, description, points_per_currency, minimum_points_redeem, points_expiry_months, redemption_value_per_point) VALUES
  ('SMMS Loyalty Program', 'Earn points on every purchase and redeem for discounts', 1.0, 100, 24, 0.01)
ON CONFLICT (name) DO NOTHING;