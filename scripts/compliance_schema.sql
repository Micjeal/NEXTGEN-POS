-- SMMS POS System - Compliance & Security Schema
-- GDPR, PCI DSS, and Advanced Security Features

-- =============================================
-- CONSENT LOGS TABLE (GDPR Compliance)
-- =============================================
CREATE TABLE IF NOT EXISTS consent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('marketing', 'data_processing', 'cookies', 'third_party')),
  consent_given BOOLEAN NOT NULL,
  consent_text TEXT NOT NULL, -- Store the exact consent text for audit
  ip_address TEXT,
  user_agent TEXT,
  consent_date TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TIMESTAMPTZ,
  withdrawn_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DATA SUBJECT ACCESS REQUESTS TABLE (GDPR)
-- =============================================
CREATE TABLE IF NOT EXISTS data_subject_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type TEXT NOT NULL CHECK (request_type IN ('access', 'rectification', 'erasure', 'restriction', 'portability', 'objection')),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id), -- Staff member handling the request
  request_data JSONB, -- Additional request details
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  response_data JSONB, -- Data provided in response
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- COMPLIANCE AUDITS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS compliance_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_type TEXT NOT NULL CHECK (audit_type IN ('gdpr', 'pci_dss', 'security', 'data_protection')),
  audit_date TIMESTAMPTZ DEFAULT NOW(),
  auditor_id UUID REFERENCES auth.users(id),
  findings JSONB,
  recommendations JSONB,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed', 'overdue')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SECURITY INCIDENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS security_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_type TEXT NOT NULL CHECK (incident_type IN ('unauthorized_access', 'data_breach', 'suspicious_activity', 'system_compromise')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  affected_users JSONB, -- List of affected user/customer IDs
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  reported_by UUID REFERENCES auth.users(id),
  investigated_by UUID REFERENCES auth.users(id),
  resolution TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BIOMETRIC AUTHENTICATION TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS biometric_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  biometric_type TEXT NOT NULL CHECK (biometric_type IN ('fingerprint', 'facial', 'voice', 'iris')),
  biometric_data BYTEA, -- Encrypted biometric template/hash
  device_id TEXT, -- Identifier for the device used
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, biometric_type)
);

-- =============================================
-- UPDATE PAYMENTS TABLE FOR PCI COMPLIANCE
-- =============================================
ALTER TABLE payments ADD COLUMN IF NOT EXISTS card_token TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS encrypted_metadata JSONB;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS received_amount DECIMAL(10, 2);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded'));

-- =============================================
-- ENCRYPTION KEYS MANAGEMENT (if implementing additional encryption)
-- =============================================
CREATE TABLE IF NOT EXISTS encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id TEXT NOT NULL UNIQUE,
  key_version INTEGER NOT NULL,
  key_data BYTEA NOT NULL, -- Encrypted key material
  algorithm TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('data_encryption', 'token_encryption', 'audit_encryption')),
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ENHANCED AUDIT LOGS EXTENSION
-- =============================================
-- Add additional fields to existing audit_logs table
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS compliance_flag BOOLEAN DEFAULT FALSE;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high'));
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS location_data JSONB;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_consent_logs_user ON consent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_customer ON consent_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_type ON consent_logs(consent_type);
CREATE INDEX IF NOT EXISTS idx_consent_logs_date ON consent_logs(consent_date);

CREATE INDEX IF NOT EXISTS idx_dsar_customer ON data_subject_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_dsar_status ON data_subject_requests(status);
CREATE INDEX IF NOT EXISTS idx_dsar_type ON data_subject_requests(request_type);

CREATE INDEX IF NOT EXISTS idx_compliance_audits_type ON compliance_audits(audit_type);
CREATE INDEX IF NOT EXISTS idx_compliance_audits_status ON compliance_audits(status);
CREATE INDEX IF NOT EXISTS idx_compliance_audits_date ON compliance_audits(audit_date);

CREATE INDEX IF NOT EXISTS idx_security_incidents_type ON security_incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON security_incidents(status);

CREATE INDEX IF NOT EXISTS idx_biometric_auth_user ON biometric_auth(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_auth_type ON biometric_auth(biometric_type);

CREATE INDEX IF NOT EXISTS idx_encryption_keys_purpose ON encryption_keys(purpose);
CREATE INDEX IF NOT EXISTS idx_encryption_keys_active ON encryption_keys(is_active);

-- =============================================
-- RLS POLICIES FOR COMPLIANCE TABLES
-- =============================================
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_subject_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE encryption_keys ENABLE ROW LEVEL SECURITY;

-- Consent logs: Users can see their own, admins can see all
CREATE POLICY "consent_logs_select_own_or_admin" ON consent_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "consent_logs_insert_authenticated" ON consent_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- DSAR: Only admins can manage
CREATE POLICY "dsar_select_admin" ON data_subject_requests
  FOR SELECT TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "dsar_insert_admin" ON data_subject_requests
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "dsar_update_admin" ON data_subject_requests
  FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin');

-- Compliance audits: Admin only
CREATE POLICY "compliance_audits_admin" ON compliance_audits
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin');

-- Security incidents: Admin only
CREATE POLICY "security_incidents_admin" ON security_incidents
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin');

-- Biometric auth: Users can manage their own
CREATE POLICY "biometric_auth_own" ON biometric_auth
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Encryption keys: Admin only
CREATE POLICY "encryption_keys_admin" ON encryption_keys
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin');