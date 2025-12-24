-- SMMS POS Messaging System Schema
-- Run this after the main schema to add messaging functionality

-- =============================================
-- MESSAGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_role TEXT CHECK (recipient_role IN ('admin', 'manager', 'cashier')),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'direct' CHECK (message_type IN ('direct', 'role_based', 'broadcast', 'system')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'critical')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  parent_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure either recipient_id or recipient_role is set, but not both for direct messages
  CONSTRAINT message_recipient_check CHECK (
    (message_type = 'direct' AND recipient_id IS NOT NULL AND recipient_role IS NULL) OR
    (message_type IN ('role_based', 'broadcast', 'system') AND recipient_role IS NOT NULL) OR
    (message_type = 'system' AND recipient_id IS NOT NULL)
  )
);

-- =============================================
-- MESSAGE RECIPIENTS TABLE (for broadcasts and complex routing)
-- =============================================
CREATE TABLE IF NOT EXISTS message_recipients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(message_id, recipient_id)
);

-- =============================================
-- MESSAGE TEMPLATES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_role ON messages(recipient_role);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_parent ON messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_message ON message_recipients(message_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_recipient ON message_recipients(recipient_id);
CREATE INDEX IF NOT EXISTS idx_message_templates_category ON message_templates(category);
CREATE INDEX IF NOT EXISTS idx_message_templates_active ON message_templates(is_active);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES FOR MESSAGES
-- =============================================

-- Users can view messages sent to them or their role
CREATE POLICY "messages_select_own_or_recipient" ON messages
  FOR SELECT TO authenticated
  USING (
    sender_id = auth.uid() OR
    recipient_id = auth.uid() OR
    recipient_role IN (
      SELECT roles.name FROM profiles
      JOIN roles ON profiles.role_id = roles.id
      WHERE profiles.id = auth.uid()
    ) OR
    message_type IN ('broadcast', 'system')
  );

-- Users can send messages
CREATE POLICY "messages_insert_authenticated" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Users can update their own messages (for read status)
CREATE POLICY "messages_update_own" ON messages
  FOR UPDATE TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- =============================================
-- RLS POLICIES FOR MESSAGE RECIPIENTS
-- =============================================

-- Users can view their own message recipients
CREATE POLICY "message_recipients_select_own" ON message_recipients
  FOR SELECT TO authenticated
  USING (recipient_id = auth.uid());

-- System can manage message recipients
CREATE POLICY "message_recipients_insert_authenticated" ON message_recipients
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Users can update their own read status
CREATE POLICY "message_recipients_update_own" ON message_recipients
  FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid());

-- =============================================
-- RLS POLICIES FOR MESSAGE TEMPLATES
-- =============================================

-- All authenticated users can view active templates
CREATE POLICY "message_templates_select_authenticated" ON message_templates
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Only admins and managers can create/edit templates
CREATE POLICY "message_templates_insert_manager_admin" ON message_templates
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN roles ON profiles.role_id = roles.id
      WHERE profiles.id = auth.uid()
      AND roles.name IN ('admin', 'manager')
    )
  );

-- Users can update their own templates, admins can update all
CREATE POLICY "message_templates_update_own_or_admin" ON message_templates
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      JOIN roles ON profiles.role_id = roles.id
      WHERE profiles.id = auth.uid()
      AND roles.name = 'admin'
    )
  );

-- Only admins can delete templates
CREATE POLICY "message_templates_delete_admin" ON message_templates
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN roles ON profiles.role_id = roles.id
      WHERE profiles.id = auth.uid()
      AND roles.name = 'admin'
    )
  );

-- =============================================
-- SAMPLE MESSAGE TEMPLATES
-- =============================================
INSERT INTO message_templates (name, subject, content, category, created_by) VALUES
  ('Shift Handover', 'Shift Handover Notes', 'Dear team member,

I am handing over my shift. Here are the key points:

- Current stock levels: [Add details]
- Any issues encountered: [Add details]
- Special notes: [Add details]

Please review and continue with the operations.

Best regards,
[Your Name]', 'operations', (SELECT id FROM auth.users LIMIT 1)),

  ('Low Stock Alert', 'URGENT: Low Stock Alert', 'Attention Team,

The following items are running low on stock:

[Item Name] - Current stock: [Quantity]

Please restock immediately to avoid stockouts.

This is an automated alert from the inventory system.', 'inventory', (SELECT id FROM auth.users LIMIT 1)),

  ('New User Welcome', 'Welcome to SMMS POS', 'Welcome to the Supermarket Management System!

Your account has been created with the following details:
- Username: [Username]
- Role: [Role]
- Access Level: [Access Level]

Please change your password upon first login and familiarize yourself with the system.

If you have any questions, please contact your administrator.

Best regards,
SMMS POS Team', 'announcements', (SELECT id FROM auth.users LIMIT 1)),

  ('System Maintenance', 'Scheduled System Maintenance', 'Dear Team,

We will be performing scheduled maintenance on the SMMS POS system.

Maintenance Window: [Date/Time]
Expected Duration: [Duration]
Impact: System will be unavailable during this period

Please complete all transactions before the maintenance window.

Thank you for your understanding.

Best regards,
IT Team', 'announcements', (SELECT id FROM auth.users LIMIT 1)),

  ('Sales Target Reminder', 'Weekly Sales Target Update', 'Hello Team,

Here is your weekly sales performance update:

Current Sales: $[Current Amount]
Target: $[Target Amount]
Progress: [Percentage]%

[Motivational message or additional notes]

Keep up the great work!

Best regards,
Management', 'operations', (SELECT id FROM auth.users LIMIT 1)),

  ('Inventory Count Request', 'Monthly Inventory Count Required', 'Dear Team,

It is time for our monthly inventory count.

Count Schedule:
- Date: [Date]
- Time: [Time]
- Areas to count: [List areas]

Please ensure all counting is accurate and complete.

Instructions:
1. Count all items in your assigned area
2. Record counts in the system
3. Report any discrepancies immediately

Thank you for your attention to detail.

Best regards,
Inventory Manager', 'inventory', (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT (name) DO NOTHING;