-- Fix payment method relations
-- Add foreign key constraint if it doesn't exist and ensure data integrity

-- First, ensure payment_methods table exists with proper structure
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure payments table exists with proper structure
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    payment_method_id UUID NOT NULL REFERENCES payment_methods(id),
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    reference_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    -- Check if the foreign key constraint exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'payments_payment_method_id_fkey'
        AND table_name = 'payments'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE payments
        ADD CONSTRAINT payments_payment_method_id_fkey
        FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id);
    END IF;
END $$;

-- Ensure payment_methods table has data
INSERT INTO payment_methods (name, is_active) VALUES
    ('Cash', true),
    ('Card', true),
    ('Mobile Payment', true),
    ('Gift Card', true)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_sale_id ON payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method_id ON payments(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_name ON payment_methods(name);

-- Enable RLS on payment_methods if not already enabled
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for payment_methods
DROP POLICY IF EXISTS "authenticated_select_payment_methods" ON payment_methods;
CREATE POLICY "authenticated_select_payment_methods" ON payment_methods FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_manage_payment_methods" ON payment_methods;
CREATE POLICY "admin_manage_payment_methods" ON payment_methods FOR ALL TO authenticated USING (
    get_user_role() = 'admin'
);

-- Verify the relation works
SELECT
    p.id,
    p.amount,
    pm.name as payment_method_name,
    s.invoice_number
FROM payments p
JOIN payment_methods pm ON p.payment_method_id = pm.id
LEFT JOIN sales s ON p.sale_id = s.id
LIMIT 5;