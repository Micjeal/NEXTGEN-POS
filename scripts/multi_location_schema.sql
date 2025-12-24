-- Multi-Location Inventory Support Schema

-- Locations table
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add location_id to inventory if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'location_id') THEN
    ALTER TABLE inventory ADD COLUMN location_id UUID REFERENCES locations(id);
  END IF;
END $$;

-- Insert default location if not exists
INSERT INTO locations (name, address) 
SELECT 'Main Store', 'Default Location'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Main Store');

-- Update existing inventory to default location if location_id is null
UPDATE inventory SET location_id = (SELECT id FROM locations WHERE name = 'Main Store' LIMIT 1) WHERE location_id IS NULL;

-- Make location_id not null
ALTER TABLE inventory ALTER COLUMN location_id SET NOT NULL;

-- Drop old unique constraint if exists
ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_product_id_key;

-- Add new unique constraint
ALTER TABLE inventory ADD CONSTRAINT inventory_product_location_unique UNIQUE (product_id, location_id);

-- Stock transfers table
CREATE TABLE IF NOT EXISTS stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_location_id UUID NOT NULL REFERENCES locations(id),
  to_location_id UUID NOT NULL REFERENCES locations(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  transfer_number TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  requested_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory(location_id);
CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(is_active);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_from_location ON stock_transfers(from_location_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_to_location ON stock_transfers(to_location_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_product ON stock_transfers(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_status ON stock_transfers(status);

-- RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on locations" ON locations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations on stock_transfers" ON stock_transfers FOR ALL USING (auth.role() = 'authenticated');

-- Function to generate transfer number
CREATE OR REPLACE FUNCTION generate_stock_transfer_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  transfer_number TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW())::TEXT;
  SELECT COALESCE(MAX(CAST(SUBSTRING(transfer_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO next_number
  FROM stock_transfers
  WHERE transfer_number LIKE 'ST-' || current_year || '-%';
  transfer_number := 'ST-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
  RETURN transfer_number;
END;
$$ LANGUAGE plpgsql;