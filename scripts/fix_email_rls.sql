-- Fix Email System RLS Policies
-- Run this if you get "policy already exists" errors

-- Drop existing policies if they exist
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

-- Recreate simplified policies
CREATE POLICY "Email templates are viewable by authenticated users" ON email_templates
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage email templates" ON email_templates
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can access email logs" ON email_logs
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage their own email settings" ON email_settings
  FOR ALL USING (auth.uid() = user_id);

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