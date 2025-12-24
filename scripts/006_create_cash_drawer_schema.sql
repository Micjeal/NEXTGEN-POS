-- Cash Drawer Management Schema
-- Tables for managing cash drawers, transactions, and audit trails

-- =============================================
-- 1. CASH DRAWERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS cash_drawers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  location_id UUID, -- For multi-location support (can be NULL for single location)
  drawer_name TEXT NOT NULL DEFAULT 'Main Drawer',
  status TEXT NOT NULL DEFAULT 'closed' CHECK (status IN ('open', 'closed', 'reconciled')),
  opening_balance DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (opening_balance >= 0),
  current_balance DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (current_balance >= 0),
  expected_balance DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (expected_balance >= 0),
  opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  reconciled_at TIMESTAMPTZ,
  reconciled_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. CASH TRANSACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS cash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drawer_id UUID NOT NULL REFERENCES cash_drawers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('opening_float', 'cash_in', 'cash_out', 'sale', 'refund', 'withdrawal', 'deposit', 'adjustment')),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount != 0),
  description TEXT NOT NULL,
  reference_id UUID, -- Can reference sales, refunds, etc.
  reference_type TEXT CHECK (reference_type IN ('sale', 'refund', 'manual', 'system')),
  balance_before DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. CASH DRAWER AUDIT LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS cash_drawer_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drawer_id UUID REFERENCES cash_drawers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('opened', 'closed', 'reconciled', 'transaction_added', 'transaction_edited', 'transaction_deleted')),
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_cash_drawers_user ON cash_drawers(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_drawers_status ON cash_drawers(status);
CREATE INDEX IF NOT EXISTS idx_cash_drawers_opened_at ON cash_drawers(opened_at);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_drawer ON cash_transactions(drawer_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_user ON cash_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_type ON cash_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_created ON cash_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_cash_drawer_audit_logs_drawer ON cash_drawer_audit_logs(drawer_id);
CREATE INDEX IF NOT EXISTS idx_cash_drawer_audit_logs_user ON cash_drawer_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_drawer_audit_logs_action ON cash_drawer_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_cash_drawer_audit_logs_created ON cash_drawer_audit_logs(created_at);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Cash Drawers: Users can only see their own drawers
ALTER TABLE cash_drawers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own cash drawers" ON cash_drawers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cash drawers" ON cash_drawers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cash drawers" ON cash_drawers
  FOR UPDATE USING (auth.uid() = user_id);

-- Cash Transactions: Users can only see transactions for their drawers
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view transactions for their drawers" ON cash_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cash_drawers
      WHERE cash_drawers.id = cash_transactions.drawer_id
      AND cash_drawers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert transactions for their drawers" ON cash_transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM cash_drawers
      WHERE cash_drawers.id = cash_transactions.drawer_id
      AND cash_drawers.user_id = auth.uid()
    )
  );

-- Audit Logs: Users can only see audit logs for their actions or their drawers
ALTER TABLE cash_drawer_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view audit logs for their drawers" ON cash_drawer_audit_logs
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM cash_drawers
      WHERE cash_drawers.id = cash_drawer_audit_logs.drawer_id
      AND cash_drawers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert audit logs" ON cash_drawer_audit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cash_drawers_updated_at
  BEFORE UPDATE ON cash_drawers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();