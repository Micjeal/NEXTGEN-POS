-- Email System Database Schema
-- Migration: 005_email_system.sql

-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  category TEXT NOT NULL CHECK (category IN ('alerts', 'reports', 'welcome', 'marketing', 'system')),
  variables JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Logs Table for tracking delivery
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'bounced', 'complained', 'opened', 'clicked')),
  provider_message_id TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Email Settings per user/role for notification preferences
CREATE TABLE IF NOT EXISTS email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN ('low_stock', 'daily_sales', 'customer_welcome', 'birthday', 'system_updates', 'marketing')),
  enabled BOOLEAN DEFAULT TRUE,
  frequency TEXT DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'daily', 'weekly', 'monthly')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_logs_template_id ON email_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_settings_user_id ON email_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_email_settings_type ON email_settings(email_type);

-- Insert default email templates (only if table is empty)
INSERT INTO email_templates (name, subject, html_content, text_content, category, variables)
SELECT * FROM (VALUES
  ('Low Stock Alert',
   'URGENT: Low Stock Alert - {{product_name}}',
   '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Low Stock Alert</title></head><body><h2>⚠️ Low Stock Alert</h2><p>Product: {{product_name}}</p><p>Current Stock: {{current_stock}}</p></body></html>',
   'Low Stock Alert - {{product_name}}\nCurrent Stock: {{current_stock}}',
   'alerts',
   '{"product_name": "Product Name", "current_stock": "Current Stock"}'::jsonb),
  ('Daily Sales Summary',
   'Daily Sales Summary - {{date}}',
   '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Daily Sales Summary</title></head><body><h2>📊 Daily Sales Summary - {{date}}</h2><p>Total Sales: UGX {{total_sales}}</p></body></html>',
   'Daily Sales Summary - {{date}}\nTotal Sales: UGX {{total_sales}}',
   'reports',
   '{"date": "Date", "total_sales": "Total Sales"}'::jsonb),
  ('Customer Welcome',
   'Welcome to {{store_name}} - {{customer_name}}!',
   '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Welcome</title></head><body><h2>🎉 Welcome to {{store_name}}!</h2><p>Dear {{customer_name}},</p><p>Welcome!</p></body></html>',
   'Welcome to {{store_name}} - {{customer_name}}!',
   'welcome',
   '{"store_name": "Store Name", "customer_name": "Customer Name"}'::jsonb),
  ('Birthday Greeting',
   'Happy Birthday from {{store_name}} - {{customer_name}}!',
   '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Happy Birthday!</title></head><body><h2>🎂 Happy Birthday, {{customer_name}}!</h2><p>Enjoy {{birthday_discount}}% off!</p></body></html>',
   'Happy Birthday, {{customer_name}}! Enjoy {{birthday_discount}}% off!',
   'marketing',
   '{"store_name": "Store Name", "customer_name": "Customer Name", "birthday_discount": "20"}'::jsonb)
) AS v(name, subject, html_content, text_content, category, variables)
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE name = v.name);

-- Enable Row Level Security
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Email templates are viewable by authenticated users" ON email_templates;
DROP POLICY IF EXISTS "Only admins can manage email templates" ON email_templates;
DROP POLICY IF EXISTS "Admins can manage email templates" ON email_templates;
DROP POLICY IF EXISTS "Authenticated users can manage email templates" ON email_templates;

DROP POLICY IF EXISTS "Users can view their own email logs" ON email_logs;
DROP POLICY IF EXISTS "Users can view email logs" ON email_logs;
DROP POLICY IF EXISTS "System can insert email logs" ON email_logs;
DROP POLICY IF EXISTS "Authenticated users can access email logs" ON email_logs;

DROP POLICY IF EXISTS "Users can manage their own email settings" ON email_settings;
DROP POLICY IF EXISTS "Admins can view all email settings" ON email_settings;

-- RLS Policies (Simplified for initial testing)
-- Allow authenticated users to view active email templates
CREATE POLICY "Email templates are viewable by authenticated users" ON email_templates
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to manage email templates (temporary - restrict later)
CREATE POLICY "Authenticated users can manage email templates" ON email_templates
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to view and insert email logs
CREATE POLICY "Authenticated users can access email logs" ON email_logs
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Allow users to manage their own email settings
CREATE POLICY "Users can manage their own email settings" ON email_settings
  FOR ALL USING (auth.uid() = user_id);

-- Allow admins to view all email settings
CREATE POLICY "Admins can view all email settings" ON email_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('admin', 'manager')
      )
    )
  );

-- Function to update updated_at timestamp (create if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;
DROP TRIGGER IF EXISTS update_email_settings_updated_at ON email_settings;

-- Triggers for updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_settings_updated_at
  BEFORE UPDATE ON email_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();