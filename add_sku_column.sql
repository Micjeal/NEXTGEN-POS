-- Add sku column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE;

-- Populate existing products with sku based on barcode
UPDATE products SET sku = barcode WHERE sku IS NULL AND barcode IS NOT NULL;