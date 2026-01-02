-- Add expiry_date column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_date DATE;