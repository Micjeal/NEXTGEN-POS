-- Fix missing RLS policies for products table
-- Add INSERT, UPDATE, DELETE policies for authenticated users

-- Allow authenticated users to insert products
CREATE POLICY "authenticated_insert_products" ON products
FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update products
CREATE POLICY "authenticated_update_products" ON products
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete products
CREATE POLICY "authenticated_delete_products" ON products
FOR DELETE TO authenticated
USING (true);