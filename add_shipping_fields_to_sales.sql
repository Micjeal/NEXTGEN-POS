-- Add shipping and payment fields to sales table for online orders
ALTER TABLE sales ADD COLUMN IF NOT EXISTS shipping_address JSONB;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Add comments
COMMENT ON COLUMN sales.shipping_address IS 'Shipping address for online orders (JSON format)';
COMMENT ON COLUMN sales.payment_method IS 'Payment method selected for the order';