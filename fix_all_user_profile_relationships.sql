-- Comprehensive fix for all tables that reference auth.users but need to join with profiles
-- This ensures all APIs that join with profiles work correctly

-- =============================================
-- 1. INVENTORY ADJUSTMENTS (already fixed in schema, but migration for existing data)
-- =============================================
-- First, add a temporary column to hold the profile IDs
ALTER TABLE inventory_adjustments ADD COLUMN IF NOT EXISTS temp_profile_id UUID;

-- Populate the temporary column with the corresponding profile IDs
UPDATE inventory_adjustments
SET temp_profile_id = profiles.id
FROM profiles
WHERE inventory_adjustments.user_id = profiles.id;

-- Drop the old foreign key constraint
ALTER TABLE inventory_adjustments DROP CONSTRAINT IF EXISTS inventory_adjustments_user_id_fkey;

-- Drop the old column
ALTER TABLE inventory_adjustments DROP COLUMN user_id;

-- Rename the temporary column to user_id
ALTER TABLE inventory_adjustments RENAME COLUMN temp_profile_id TO user_id;

-- Add the new foreign key constraint to profiles
ALTER TABLE inventory_adjustments ADD CONSTRAINT inventory_adjustments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add an index on the user_id column if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_user_id ON inventory_adjustments(user_id);

-- =============================================
-- 2. STOCK TRANSFERS
-- =============================================
-- Fix requested_by column
ALTER TABLE stock_transfers ADD COLUMN IF NOT EXISTS temp_requested_by_profile_id UUID;

UPDATE stock_transfers
SET temp_requested_by_profile_id = profiles.id
FROM profiles
WHERE stock_transfers.requested_by = profiles.id;

ALTER TABLE stock_transfers DROP CONSTRAINT IF EXISTS stock_transfers_requested_by_fkey;
ALTER TABLE stock_transfers DROP COLUMN requested_by;
ALTER TABLE stock_transfers RENAME COLUMN temp_requested_by_profile_id TO requested_by;

ALTER TABLE stock_transfers ADD CONSTRAINT stock_transfers_requested_by_fkey
FOREIGN KEY (requested_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- Fix approved_by column
ALTER TABLE stock_transfers ADD COLUMN IF NOT EXISTS temp_approved_by_profile_id UUID;

UPDATE stock_transfers
SET temp_approved_by_profile_id = profiles.id
FROM profiles
WHERE stock_transfers.approved_by = profiles.id;

ALTER TABLE stock_transfers DROP CONSTRAINT IF EXISTS stock_transfers_approved_by_fkey;
ALTER TABLE stock_transfers DROP COLUMN approved_by;
ALTER TABLE stock_transfers RENAME COLUMN temp_approved_by_profile_id TO approved_by;

ALTER TABLE stock_transfers ADD CONSTRAINT stock_transfers_approved_by_fkey
FOREIGN KEY (approved_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_stock_transfers_requested_by ON stock_transfers(requested_by);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_approved_by ON stock_transfers(approved_by);

-- =============================================
-- 3. EMPLOYEES TABLE
-- =============================================
-- Fix user_id column in employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS temp_user_profile_id UUID;

UPDATE employees
SET temp_user_profile_id = profiles.id
FROM profiles
WHERE employees.user_id = profiles.id;

ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_user_id_fkey;
ALTER TABLE employees DROP COLUMN user_id;
ALTER TABLE employees RENAME COLUMN temp_user_profile_id TO user_id;

ALTER TABLE employees ADD CONSTRAINT employees_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add index
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);

-- =============================================
-- 4. CASH DRAWERS
-- =============================================
-- Fix user_id column
ALTER TABLE cash_drawers ADD COLUMN IF NOT EXISTS temp_user_profile_id UUID;

UPDATE cash_drawers
SET temp_user_profile_id = profiles.id
FROM profiles
WHERE cash_drawers.user_id = profiles.id;

ALTER TABLE cash_drawers DROP CONSTRAINT IF EXISTS cash_drawers_user_id_fkey;
ALTER TABLE cash_drawers DROP COLUMN user_id;
ALTER TABLE cash_drawers RENAME COLUMN temp_user_profile_id TO user_id;

ALTER TABLE cash_drawers ADD CONSTRAINT cash_drawers_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Fix reconciled_by column
ALTER TABLE cash_drawers ADD COLUMN IF NOT EXISTS temp_reconciled_by_profile_id UUID;

UPDATE cash_drawers
SET temp_reconciled_by_profile_id = profiles.id
FROM profiles
WHERE cash_drawers.reconciled_by = profiles.id;

ALTER TABLE cash_drawers DROP CONSTRAINT IF EXISTS cash_drawers_reconciled_by_fkey;
ALTER TABLE cash_drawers DROP COLUMN reconciled_by;
ALTER TABLE cash_drawers RENAME COLUMN temp_reconciled_by_profile_id TO reconciled_by;

ALTER TABLE cash_drawers ADD CONSTRAINT cash_drawers_reconciled_by_fkey
FOREIGN KEY (reconciled_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_cash_drawers_user_id ON cash_drawers(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_drawers_reconciled_by ON cash_drawers(reconciled_by);

-- =============================================
-- 5. SALES TABLE
-- =============================================
-- Fix user_id column
ALTER TABLE sales ADD COLUMN IF NOT EXISTS temp_user_profile_id UUID;

UPDATE sales
SET temp_user_profile_id = profiles.id
FROM profiles
WHERE sales.user_id = profiles.id;

ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_user_id_fkey;
ALTER TABLE sales DROP COLUMN user_id;
ALTER TABLE sales RENAME COLUMN temp_user_profile_id TO user_id;

ALTER TABLE sales ADD CONSTRAINT sales_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add index
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);

-- =============================================
-- 6. GIFT CARDS
-- =============================================
-- Fix issued_by column
ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS temp_issued_by_profile_id UUID;

UPDATE gift_cards
SET temp_issued_by_profile_id = profiles.id
FROM profiles
WHERE gift_cards.issued_by = profiles.id;

ALTER TABLE gift_cards DROP CONSTRAINT IF EXISTS gift_cards_issued_by_fkey;
ALTER TABLE gift_cards DROP COLUMN issued_by;
ALTER TABLE gift_cards RENAME COLUMN temp_issued_by_profile_id TO issued_by;

ALTER TABLE gift_cards ADD CONSTRAINT gift_cards_issued_by_fkey
FOREIGN KEY (issued_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add index
CREATE INDEX IF NOT EXISTS idx_gift_cards_issued_by ON gift_cards(issued_by);

-- =============================================
-- 7. GIFT CARD TRANSACTIONS
-- =============================================
-- Fix performed_by column
ALTER TABLE gift_card_transactions ADD COLUMN IF NOT EXISTS temp_performed_by_profile_id UUID;

UPDATE gift_card_transactions
SET temp_performed_by_profile_id = profiles.id
FROM profiles
WHERE gift_card_transactions.performed_by = profiles.id;

ALTER TABLE gift_card_transactions DROP CONSTRAINT IF EXISTS gift_card_transactions_performed_by_fkey;
ALTER TABLE gift_card_transactions DROP COLUMN performed_by;
ALTER TABLE gift_card_transactions RENAME COLUMN temp_performed_by_profile_id TO performed_by;

ALTER TABLE gift_card_transactions ADD CONSTRAINT gift_card_transactions_performed_by_fkey
FOREIGN KEY (performed_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_performed_by ON gift_card_transactions(performed_by);

-- =============================================
-- 8. CUSTOMER DEPOSITS
-- =============================================
-- Fix created_by column
ALTER TABLE customer_deposits ADD COLUMN IF NOT EXISTS temp_created_by_profile_id UUID;

UPDATE customer_deposits
SET temp_created_by_profile_id = profiles.id
FROM profiles
WHERE customer_deposits.created_by = profiles.id;

ALTER TABLE customer_deposits DROP CONSTRAINT IF EXISTS customer_deposits_created_by_fkey;
ALTER TABLE customer_deposits DROP COLUMN created_by;
ALTER TABLE customer_deposits RENAME COLUMN temp_created_by_profile_id TO created_by;

ALTER TABLE customer_deposits ADD CONSTRAINT customer_deposits_created_by_fkey
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add index
CREATE INDEX IF NOT EXISTS idx_customer_deposits_created_by ON customer_deposits(created_by);

-- =============================================
-- 9. DEPOSIT PAYMENTS
-- =============================================
-- Fix recorded_by column
ALTER TABLE deposit_payments ADD COLUMN IF NOT EXISTS temp_recorded_by_profile_id UUID;

UPDATE deposit_payments
SET temp_recorded_by_profile_id = profiles.id
FROM profiles
WHERE deposit_payments.recorded_by = profiles.id;

ALTER TABLE deposit_payments DROP CONSTRAINT IF EXISTS deposit_payments_recorded_by_fkey;
ALTER TABLE deposit_payments DROP COLUMN recorded_by;
ALTER TABLE deposit_payments RENAME COLUMN temp_recorded_by_profile_id TO recorded_by;

ALTER TABLE deposit_payments ADD CONSTRAINT deposit_payments_recorded_by_fkey
FOREIGN KEY (recorded_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_deposit_payments_recorded_by ON deposit_payments(recorded_by);

-- =============================================
-- 10. EMPLOYEE SHIFTS
-- =============================================
-- Fix created_by column
ALTER TABLE employee_shifts ADD COLUMN IF NOT EXISTS temp_created_by_profile_id UUID;

UPDATE employee_shifts
SET temp_created_by_profile_id = profiles.id
FROM profiles
WHERE employee_shifts.created_by = profiles.id;

ALTER TABLE employee_shifts DROP CONSTRAINT IF EXISTS employee_shifts_created_by_fkey;
ALTER TABLE employee_shifts DROP COLUMN created_by;
ALTER TABLE employee_shifts RENAME COLUMN temp_created_by_profile_id TO created_by;

ALTER TABLE employee_shifts ADD CONSTRAINT employee_shifts_created_by_fkey
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_employee_shifts_created_by ON employee_shifts(created_by);

-- =============================================
-- 11. EMPLOYEE ATTENDANCE
-- =============================================
-- Fix recorded_by column
ALTER TABLE employee_attendance ADD COLUMN IF NOT EXISTS temp_recorded_by_profile_id UUID;

UPDATE employee_attendance
SET temp_recorded_by_profile_id = profiles.id
FROM profiles
WHERE employee_attendance.recorded_by = profiles.id;

ALTER TABLE employee_attendance DROP CONSTRAINT IF EXISTS employee_attendance_recorded_by_fkey;
ALTER TABLE employee_attendance DROP COLUMN recorded_by;
ALTER TABLE employee_attendance RENAME COLUMN temp_recorded_by_profile_id TO recorded_by;

ALTER TABLE employee_attendance ADD CONSTRAINT employee_attendance_recorded_by_fkey
FOREIGN KEY (recorded_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_employee_attendance_recorded_by ON employee_attendance(recorded_by);

-- =============================================
-- 12. EMPLOYEE PERFORMANCE
-- =============================================
-- Fix reviewer_id column
ALTER TABLE employee_performance ADD COLUMN IF NOT EXISTS temp_reviewer_profile_id UUID;

UPDATE employee_performance
SET temp_reviewer_profile_id = profiles.id
FROM profiles
WHERE employee_performance.reviewer_id = profiles.id;

ALTER TABLE employee_performance DROP CONSTRAINT IF EXISTS employee_performance_reviewer_id_fkey;
ALTER TABLE employee_performance DROP COLUMN reviewer_id;
ALTER TABLE employee_performance RENAME COLUMN temp_reviewer_profile_id TO reviewer_id;

ALTER TABLE employee_performance ADD CONSTRAINT employee_performance_reviewer_id_fkey
FOREIGN KEY (reviewer_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_employee_performance_reviewer_id ON employee_performance(reviewer_id);

-- =============================================
-- 13. SALES FORECASTS
-- =============================================
-- Fix created_by column
ALTER TABLE sales_forecasts ADD COLUMN IF NOT EXISTS temp_created_by_profile_id UUID;

UPDATE sales_forecasts
SET temp_created_by_profile_id = profiles.id
FROM profiles
WHERE sales_forecasts.created_by = profiles.id;

ALTER TABLE sales_forecasts DROP CONSTRAINT IF EXISTS sales_forecasts_created_by_fkey;
ALTER TABLE sales_forecasts DROP COLUMN created_by;
ALTER TABLE sales_forecasts RENAME COLUMN temp_created_by_profile_id TO created_by;

ALTER TABLE sales_forecasts ADD CONSTRAINT sales_forecasts_created_by_fkey
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_sales_forecasts_created_by ON sales_forecasts(created_by);

-- =============================================
-- 14. BATCH TRANSACTIONS
-- =============================================
-- Fix performed_by column
ALTER TABLE batch_transactions ADD COLUMN IF NOT EXISTS temp_performed_by_profile_id UUID;

UPDATE batch_transactions
SET temp_performed_by_profile_id = profiles.id
FROM profiles
WHERE batch_transactions.performed_by = profiles.id;

ALTER TABLE batch_transactions DROP CONSTRAINT IF EXISTS batch_transactions_performed_by_fkey;
ALTER TABLE batch_transactions DROP COLUMN performed_by;
ALTER TABLE batch_transactions RENAME COLUMN temp_performed_by_profile_id TO performed_by;

ALTER TABLE batch_transactions ADD CONSTRAINT batch_transactions_performed_by_fkey
FOREIGN KEY (performed_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_batch_transactions_performed_by ON batch_transactions(performed_by);

-- =============================================
-- 15. QUALITY INSPECTIONS
-- =============================================
-- Fix inspector_id column
ALTER TABLE quality_inspections ADD COLUMN IF NOT EXISTS temp_inspector_profile_id UUID;

UPDATE quality_inspections
SET temp_inspector_profile_id = profiles.id
FROM profiles
WHERE quality_inspections.inspector_id = profiles.id;

ALTER TABLE quality_inspections DROP CONSTRAINT IF EXISTS quality_inspections_inspector_id_fkey;
ALTER TABLE quality_inspections DROP COLUMN inspector_id;
ALTER TABLE quality_inspections RENAME COLUMN temp_inspector_profile_id TO inspector_id;

ALTER TABLE quality_inspections ADD CONSTRAINT quality_inspections_inspector_id_fkey
FOREIGN KEY (inspector_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_quality_inspections_inspector_id ON quality_inspections(inspector_id);

-- =============================================
-- 16. PRODUCT RECALLS
-- =============================================
-- Fix initiated_by column
ALTER TABLE product_recalls ADD COLUMN IF NOT EXISTS temp_initiated_by_profile_id UUID;

UPDATE product_recalls
SET temp_initiated_by_profile_id = profiles.id
FROM profiles
WHERE product_recalls.initiated_by = profiles.id;

ALTER TABLE product_recalls DROP CONSTRAINT IF EXISTS product_recalls_initiated_by_fkey;
ALTER TABLE product_recalls DROP COLUMN initiated_by;
ALTER TABLE product_recalls RENAME COLUMN temp_initiated_by_profile_id TO initiated_by;

ALTER TABLE product_recalls ADD CONSTRAINT product_recalls_initiated_by_fkey
FOREIGN KEY (initiated_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add index
CREATE INDEX IF NOT EXISTS idx_product_recalls_initiated_by ON product_recalls(initiated_by);

-- =============================================
-- 17. LOYALTY TRANSACTIONS
-- =============================================
-- Fix performed_by column
ALTER TABLE loyalty_transactions ADD COLUMN IF NOT EXISTS temp_performed_by_profile_id UUID;

UPDATE loyalty_transactions
SET temp_performed_by_profile_id = profiles.id
FROM profiles
WHERE loyalty_transactions.performed_by = profiles.id;

ALTER TABLE loyalty_transactions DROP CONSTRAINT IF EXISTS loyalty_transactions_performed_by_fkey;
ALTER TABLE loyalty_transactions DROP COLUMN performed_by;
ALTER TABLE loyalty_transactions RENAME COLUMN temp_performed_by_profile_id TO performed_by;

ALTER TABLE loyalty_transactions ADD CONSTRAINT loyalty_transactions_performed_by_fkey
FOREIGN KEY (performed_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_performed_by ON loyalty_transactions(performed_by);

-- =============================================
-- 18. EMAIL TEMPLATES
-- =============================================
-- Fix created_by column
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS temp_created_by_profile_id UUID;

UPDATE email_templates
SET temp_created_by_profile_id = profiles.id
FROM profiles
WHERE email_templates.created_by = profiles.id;

ALTER TABLE email_templates DROP CONSTRAINT IF EXISTS email_templates_created_by_fkey;
ALTER TABLE email_templates DROP COLUMN created_by;
ALTER TABLE email_templates RENAME COLUMN temp_created_by_profile_id TO created_by;

ALTER TABLE email_templates ADD CONSTRAINT email_templates_created_by_fkey
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_email_templates_created_by ON email_templates(created_by);

-- =============================================
-- 19. MESSAGE TEMPLATES
-- =============================================
-- Fix created_by column
ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS temp_created_by_profile_id UUID;

UPDATE message_templates
SET temp_created_by_profile_id = profiles.id
FROM profiles
WHERE message_templates.created_by = profiles.id;

ALTER TABLE message_templates DROP CONSTRAINT IF EXISTS message_templates_created_by_fkey;
ALTER TABLE message_templates DROP COLUMN created_by;
ALTER TABLE message_templates RENAME COLUMN temp_created_by_profile_id TO created_by;

ALTER TABLE message_templates ADD CONSTRAINT message_templates_created_by_fkey
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_message_templates_created_by ON message_templates(created_by);

-- =============================================
-- 20. EMAIL SETTINGS
-- =============================================
-- Fix user_id column
ALTER TABLE email_settings ADD COLUMN IF NOT EXISTS temp_user_profile_id UUID;

UPDATE email_settings
SET temp_user_profile_id = profiles.id
FROM profiles
WHERE email_settings.user_id = profiles.id;

ALTER TABLE email_settings DROP CONSTRAINT IF EXISTS email_settings_user_id_fkey;
ALTER TABLE email_settings DROP COLUMN user_id;
ALTER TABLE email_settings RENAME COLUMN temp_user_profile_id TO user_id;

ALTER TABLE email_settings ADD CONSTRAINT email_settings_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- =============================================
-- 21. AUDIT LOGS
-- =============================================
-- Fix user_id column
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS temp_user_profile_id UUID;

UPDATE audit_logs
SET temp_user_profile_id = profiles.id
FROM profiles
WHERE audit_logs.user_id = profiles.id;

ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
ALTER TABLE audit_logs DROP COLUMN user_id;
ALTER TABLE audit_logs RENAME COLUMN temp_user_profile_id TO user_id;

ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- =============================================
-- 22. SECURITY INCIDENTS
-- =============================================
-- Fix user_id column
ALTER TABLE security_incidents ADD COLUMN IF NOT EXISTS temp_user_profile_id UUID;

UPDATE security_incidents
SET temp_user_profile_id = profiles.id
FROM profiles
WHERE security_incidents.user_id = profiles.id;

ALTER TABLE security_incidents DROP CONSTRAINT IF EXISTS security_incidents_user_id_fkey;
ALTER TABLE security_incidents DROP COLUMN user_id;
ALTER TABLE security_incidents RENAME COLUMN temp_user_profile_id TO user_id;

ALTER TABLE security_incidents ADD CONSTRAINT security_incidents_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_security_incidents_user_id ON security_incidents(user_id);

-- =============================================
-- 23. MESSAGES
-- =============================================
-- Fix sender_id and recipient_id columns
ALTER TABLE messages ADD COLUMN IF NOT EXISTS temp_sender_profile_id UUID;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS temp_recipient_profile_id UUID;

UPDATE messages
SET temp_sender_profile_id = profiles.id
FROM profiles
WHERE messages.sender_id = profiles.id;

UPDATE messages
SET temp_recipient_profile_id = profiles.id
FROM profiles
WHERE messages.recipient_id = profiles.id;

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_recipient_id_fkey;

ALTER TABLE messages DROP COLUMN sender_id;
ALTER TABLE messages DROP COLUMN recipient_id;

ALTER TABLE messages RENAME COLUMN temp_sender_profile_id TO sender_id;
ALTER TABLE messages RENAME COLUMN temp_recipient_profile_id TO recipient_id;

ALTER TABLE messages ADD CONSTRAINT messages_sender_id_fkey
FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE messages ADD CONSTRAINT messages_recipient_id_fkey
FOREIGN KEY (recipient_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);

-- =============================================
-- 24. BRANCHES
-- =============================================
-- Fix manager_id column
ALTER TABLE branches ADD COLUMN IF NOT EXISTS temp_manager_profile_id UUID;

UPDATE branches
SET temp_manager_profile_id = profiles.id
FROM profiles
WHERE branches.manager_id = profiles.id;

ALTER TABLE branches DROP CONSTRAINT IF EXISTS branches_manager_id_fkey;
ALTER TABLE branches DROP COLUMN manager_id;
ALTER TABLE branches RENAME COLUMN temp_manager_profile_id TO manager_id;

ALTER TABLE branches ADD CONSTRAINT branches_manager_id_fkey
FOREIGN KEY (manager_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_branches_manager_id ON branches(manager_id);