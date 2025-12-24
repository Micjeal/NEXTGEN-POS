-- Temporarily disable RLS for testing email functionality
-- WARNING: This removes security restrictions - only use for testing!

-- Disable RLS on email tables
ALTER TABLE email_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_settings DISABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users
GRANT ALL ON email_templates TO authenticated;
GRANT ALL ON email_logs TO authenticated;
GRANT ALL ON email_settings TO authenticated;

-- Grant sequence permissions if needed
GRANT USAGE ON SCHEMA public TO authenticated;