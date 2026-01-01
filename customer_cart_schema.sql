-- Customer Shopping Cart Schema
-- This table allows customers to add products to their shopping cart

CREATE TABLE IF NOT EXISTS customer_cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_cart_customer_id ON customer_cart(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_cart_product_id ON customer_cart(product_id);
CREATE INDEX IF NOT EXISTS idx_customer_cart_updated_at ON customer_cart(updated_at DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE customer_cart ENABLE ROW LEVEL SECURITY;

-- Policy: Customers can only see their own cart items
CREATE POLICY "Customers can view own cart" ON customer_cart
  FOR SELECT USING (
    customer_id IN (
      SELECT c.id FROM customers c
      WHERE c.registered_customer_id IN (
        SELECT rc.id FROM registered_customers rc
        WHERE rc.user_id = auth.uid()
      )
    )
  );

-- Policy: Customers can insert their own cart items
CREATE POLICY "Customers can add to own cart" ON customer_cart
  FOR INSERT WITH CHECK (
    customer_id IN (
      SELECT c.id FROM customers c
      WHERE c.registered_customer_id IN (
        SELECT rc.id FROM registered_customers rc
        WHERE rc.user_id = auth.uid()
      )
    )
  );

-- Policy: Customers can update their own cart items
CREATE POLICY "Customers can update own cart" ON customer_cart
  FOR UPDATE USING (
    customer_id IN (
      SELECT c.id FROM customers c
      WHERE c.registered_customer_id IN (
        SELECT rc.id FROM registered_customers rc
        WHERE rc.user_id = auth.uid()
      )
    )
  );

-- Policy: Customers can delete their own cart items
CREATE POLICY "Customers can remove from own cart" ON customer_cart
  FOR DELETE USING (
    customer_id IN (
      SELECT c.id FROM customers c
      WHERE c.registered_customer_id IN (
        SELECT rc.id FROM registered_customers rc
        WHERE rc.user_id = auth.uid()
      )
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_customer_cart_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_customer_cart_updated_at
  BEFORE UPDATE ON customer_cart
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_cart_updated_at();