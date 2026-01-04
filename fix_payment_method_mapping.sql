-- Fix payment method mapping issue
-- The frontend sends payment_method values that don't match the database names

-- First, add missing payment methods
INSERT INTO payment_methods (name, is_active) VALUES
    ('Bank Transfer', true)
ON CONFLICT (name) DO NOTHING;

-- Update existing payment method names to match frontend expectations
-- Note: This will update the names to match what the frontend sends
UPDATE payment_methods SET name = 'cash_on_delivery' WHERE name = 'Cash';
UPDATE payment_methods SET name = 'card' WHERE name = 'Card';
UPDATE payment_methods SET name = 'mobile_money' WHERE name = 'Mobile Payment';
UPDATE payment_methods SET name = 'bank_transfer' WHERE name = 'Bank Transfer';

-- Alternatively, if you prefer to keep the display names but map in code,
-- you could create a view or just update the API to map the values.
-- But for simplicity, updating the names to match frontend is fine.

-- Verify the payment methods
SELECT id, name, is_active FROM payment_methods ORDER BY name;