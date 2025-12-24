-- Create customers table for CRM functionality
-- Run this script in your Supabase SQL editor

-- =============================================
-- 14. CUSTOMERS TABLE (CRM)
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_membership_tier ON customers(membership_tier);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(is_active);

-- Enable RLS (if not already enabled)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "customers_select_authenticated" ON customers;
DROP POLICY IF EXISTS "customers_insert_authenticated" ON customers;
DROP POLICY IF EXISTS "customers_update_manager_admin" ON customers;
DROP POLICY IF EXISTS "customers_delete_admin" ON customers;

-- Create RLS policies
CREATE POLICY "customers_select_authenticated" ON customers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "customers_insert_authenticated" ON customers
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "customers_update_manager_admin" ON customers
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid()
      AND r.name IN ('admin', 'manager')
    )
  );

CREATE POLICY "customers_delete_admin" ON customers
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid()
      AND r.name = 'admin'
    )
  );