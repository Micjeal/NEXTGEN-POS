-- Customer Wishlist Schema
-- This table allows customers to save products for later

CREATE TABLE IF NOT EXISTS customer_wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_wishlists_customer_id ON customer_wishlists(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_wishlists_product_id ON customer_wishlists(product_id);
CREATE INDEX IF NOT EXISTS idx_customer_wishlists_added_at ON customer_wishlists(added_at DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE customer_wishlists ENABLE ROW LEVEL SECURITY;

-- Policy: Customers can only see their own wishlist items
CREATE POLICY "Customers can view own wishlist" ON customer_wishlists
  FOR SELECT USING (
    customer_id IN (
      SELECT c.id FROM customers c
      WHERE c.registered_customer_id IN (
        SELECT rc.id FROM registered_customers rc
        WHERE rc.user_id = auth.uid()
      )
    )
  );

-- Policy: Customers can insert their own wishlist items
CREATE POLICY "Customers can add to own wishlist" ON customer_wishlists
  FOR INSERT WITH CHECK (
    customer_id IN (
      SELECT c.id FROM customers c
      WHERE c.registered_customer_id IN (
        SELECT rc.id FROM registered_customers rc
        WHERE rc.user_id = auth.uid()
      )
    )
  );

-- Policy: Customers can delete their own wishlist items
CREATE POLICY "Customers can remove from own wishlist" ON customer_wishlists
  FOR DELETE USING (
    customer_id IN (
      SELECT c.id FROM customers c
      WHERE c.registered_customer_id IN (
        SELECT rc.id FROM registered_customers rc
        WHERE rc.user_id = auth.uid()
      )
    )
  );