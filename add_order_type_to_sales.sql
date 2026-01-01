-- Add order_type column to sales table to distinguish online vs in-store orders
ALTER TABLE sales ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'in-store' CHECK (order_type IN ('in-store', 'online'));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_order_type ON sales(order_type);

-- Add comment
COMMENT ON COLUMN sales.order_type IS 'Type of order: in-store or online';