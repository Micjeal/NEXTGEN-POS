-- System Settings Table with Polymorphic Relationships
-- This table allows settings to be scoped to different entities in the system

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT CHECK (entity_type IN ('user', 'branch', 'product', 'category', 'supplier', 'customer', 'role', 'global')),
  entity_id UUID,
  key TEXT NOT NULL,
  value TEXT,
  data_type TEXT DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
  description TEXT,
  is_system_wide BOOLEAN DEFAULT FALSE,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique settings per entity or globally
  UNIQUE(entity_type, entity_id, key),

  -- For system-wide settings, entity_type and entity_id should be null
  CHECK (
    (is_system_wide = TRUE AND entity_type IS NULL AND entity_id IS NULL) OR
    (is_system_wide = FALSE AND entity_type IS NOT NULL AND entity_id IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_settings_entity ON system_settings(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_system_wide ON system_settings(is_system_wide);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read settings for entities they have access to
CREATE POLICY "users_read_settings" ON system_settings FOR SELECT TO authenticated USING (
  is_system_wide = TRUE OR
  (entity_type = 'user' AND entity_id = auth.uid()) OR
  get_user_role() IN ('admin', 'manager') OR
  (entity_type = 'branch' AND entity_id IN (
    SELECT branch_id FROM employees WHERE user_id = auth.uid()
  ))
);

-- Only admins can create/update system settings
CREATE POLICY "admin_manage_settings" ON system_settings FOR ALL TO authenticated USING (
  get_user_role() = 'admin'
) WITH CHECK (
  get_user_role() = 'admin'
);

-- Insert default global settings
INSERT INTO system_settings (key, value, data_type, description, is_system_wide) VALUES
  ('system_name', 'POS System', 'string', 'Name of the POS system', TRUE),
  ('system_description', 'Supermarket Management System', 'string', 'Description of the system', TRUE),
  ('business_address', '', 'string', 'Business address for receipts and documents', TRUE),
  ('business_phone', '', 'string', 'Business phone number', TRUE),
  ('business_email', '', 'string', 'Business email address', TRUE),
  ('tax_number', '', 'string', 'Business tax identification number', TRUE),
  ('store_logo', '', 'string', 'URL to store logo image', TRUE),
  ('currency', 'UGX', 'string', 'Default currency code', TRUE),
  ('timezone', 'Africa/Kampala', 'string', 'System timezone', TRUE),
  ('low_stock_threshold', '10', 'number', 'Default low stock alert threshold', TRUE),
  ('critical_stock_threshold', '5', 'number', 'Default critical stock alert threshold', TRUE),
  ('auto_reorder_enabled', 'false', 'boolean', 'Enable automatic reordering', TRUE),
  ('default_reorder_quantity', '50', 'number', 'Default reorder quantity', TRUE),
  ('receipt_header', 'Thank you for shopping with us!', 'string', 'Receipt header text', TRUE),
  ('receipt_footer', 'Visit us again soon!', 'string', 'Receipt footer text', TRUE),
  ('show_logo_on_receipt', 'true', 'boolean', 'Show logo on receipts', TRUE),
  ('include_tax_details', 'true', 'boolean', 'Include tax details on receipts', TRUE),
  ('receipt_paper_size', '80mm', 'string', 'Receipt paper size', TRUE),
  ('payment_gateway_enabled', 'true', 'boolean', 'Enable payment gateway integration', TRUE),
  ('barcode_scanner_enabled', 'true', 'boolean', 'Enable barcode scanner', TRUE),
  ('email_integration_enabled', 'false', 'boolean', 'Enable email integration', TRUE),
  ('sms_integration_enabled', 'false', 'boolean', 'Enable SMS integration', TRUE),
  ('enable_notifications', 'true', 'boolean', 'Enable system notifications', TRUE),
  ('enable_audit_log', 'true', 'boolean', 'Enable audit logging', TRUE),
  ('auto_backup', 'false', 'boolean', 'Enable automatic backups', TRUE),
  ('maintenance_mode', 'false', 'boolean', 'Put system in maintenance mode', TRUE)
ON CONFLICT (entity_type, entity_id, key) DO NOTHING;