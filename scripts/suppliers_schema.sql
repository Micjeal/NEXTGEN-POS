-- Suppliers Management Schema for POS Supermarket System

-- Suppliers table
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Uganda',
  tax_id VARCHAR(50),
  payment_terms VARCHAR(100) DEFAULT 'Net 30',
  credit_limit DECIMAL(10,2) DEFAULT 0,
  supplier_category VARCHAR(50) DEFAULT 'local',
  rating DECIMAL(2,1) DEFAULT 5.0 CHECK (rating >= 1.0 AND rating <= 5.0),
  -- Performance tracking fields
  total_orders INTEGER DEFAULT 0,
  on_time_delivery_rate DECIMAL(5,2) DEFAULT 100.00 CHECK (on_time_delivery_rate >= 0 AND on_time_delivery_rate <= 100),
  quality_score DECIMAL(3,1) DEFAULT 5.0 CHECK (quality_score >= 1.0 AND quality_score <= 5.0),
  average_lead_time_days INTEGER DEFAULT 7,
  last_order_date DATE,
  total_spent DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplier products (products supplied by each supplier)
CREATE TABLE supplier_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  supplier_product_code VARCHAR(100),
  supplier_price DECIMAL(10,2),
  minimum_order_quantity INTEGER DEFAULT 1,
  lead_time_days INTEGER DEFAULT 7,
  is_preferred_supplier BOOLEAN DEFAULT false,
  last_ordered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(supplier_id, product_id)
);

-- Purchase orders
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'ordered', 'partially_received', 'received', 'cancelled')),
  total_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  payment_terms VARCHAR(100),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase order items
CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity_ordered INTEGER NOT NULL CHECK (quantity_ordered > 0),
  quantity_received INTEGER DEFAULT 0 CHECK (quantity_received >= 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  tax_rate DECIMAL(5,2) DEFAULT 0,
  discount_rate DECIMAL(5,2) DEFAULT 0,
  product_name VARCHAR(255) NOT NULL,
  line_total DECIMAL(10,2) GENERATED ALWAYS AS (
    (quantity_ordered * unit_price) +
    ((quantity_ordered * unit_price * tax_rate) / 100) -
    ((quantity_ordered * unit_price * discount_rate) / 100)
  ) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplier invoices
CREATE TABLE supplier_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id),
  purchase_order_id UUID REFERENCES purchase_orders(id),
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,
  total_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partially_paid', 'paid', 'overdue', 'cancelled')),
  payment_terms VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplier payments
CREATE TABLE supplier_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_invoice_id UUID REFERENCES supplier_invoices(id),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50),
  reference_number VARCHAR(100),
  notes TEXT,
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_is_active ON suppliers(is_active);
CREATE INDEX idx_supplier_products_supplier_id ON supplier_products(supplier_id);
CREATE INDEX idx_supplier_products_product_id ON supplier_products(product_id);
CREATE INDEX idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_created_at ON purchase_orders(created_at DESC);
CREATE INDEX idx_purchase_order_items_purchase_order_id ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_supplier_invoices_supplier_id ON supplier_invoices(supplier_id);
CREATE INDEX idx_supplier_invoices_status ON supplier_invoices(status);
CREATE INDEX idx_supplier_payments_invoice_id ON supplier_payments(supplier_invoice_id);

-- Row Level Security (RLS) policies
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all authenticated users for now)
CREATE POLICY "Allow all operations on suppliers" ON suppliers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations on supplier_products" ON supplier_products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations on purchase_orders" ON purchase_orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations on purchase_order_items" ON purchase_order_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations on supplier_invoices" ON supplier_invoices FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations on supplier_payments" ON supplier_payments FOR ALL USING (auth.role() = 'authenticated');

-- Functions and Triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supplier_invoices_updated_at BEFORE UPDATE ON supplier_invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate purchase order number
CREATE OR REPLACE FUNCTION generate_purchase_order_number()
RETURNS TEXT AS $$
DECLARE
    current_year TEXT;
    next_number INTEGER;
    order_number TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM NOW())::TEXT;

    -- Get the next number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO next_number
    FROM purchase_orders
    WHERE order_number LIKE 'PO-' || current_year || '-%';

    -- Format: PO-2024-0001
    order_number := 'PO-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');

    RETURN order_number;
END;
$$ LANGUAGE plpgsql;

-- Function to update purchase order totals
CREATE OR REPLACE FUNCTION update_purchase_order_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the total_amount in purchase_orders based on items
    UPDATE purchase_orders
    SET
        total_amount = (
            SELECT COALESCE(SUM(line_total), 0)
            FROM purchase_order_items
            WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update purchase order totals when items change
CREATE TRIGGER update_purchase_order_totals_trigger
    AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
    FOR EACH ROW EXECUTE FUNCTION update_purchase_order_totals();

-- Function to update supplier invoice paid amount
CREATE OR REPLACE FUNCTION update_supplier_invoice_paid_amount()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE supplier_invoices
    SET
        paid_amount = (
            SELECT COALESCE(SUM(amount), 0)
            FROM supplier_payments
            WHERE supplier_invoice_id = COALESCE(NEW.supplier_invoice_id, OLD.supplier_invoice_id)
        ),
        status = CASE
            WHEN (
                SELECT COALESCE(SUM(amount), 0)
                FROM supplier_payments
                WHERE supplier_invoice_id = COALESCE(NEW.supplier_invoice_id, OLD.supplier_invoice_id)
            ) >= total_amount THEN 'paid'
            WHEN (
                SELECT COALESCE(SUM(amount), 0)
                FROM supplier_payments
                WHERE supplier_invoice_id = COALESCE(NEW.supplier_invoice_id, OLD.supplier_invoice_id)
            ) > 0 THEN 'partially_paid'
            ELSE 'unpaid'
        END,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.supplier_invoice_id, OLD.supplier_invoice_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update supplier invoice paid amount
CREATE TRIGGER update_supplier_invoice_paid_amount_trigger
    AFTER INSERT OR UPDATE OR DELETE ON supplier_payments
    FOR EACH ROW EXECUTE FUNCTION update_supplier_invoice_paid_amount();

-- Sample data for testing
INSERT INTO suppliers (name, contact_person, phone, email, address, city, supplier_category, payment_terms, credit_limit) VALUES
('Fresh Produce Ltd', 'John Mukasa', '+256700123456', 'john@freshproduce.co.ug', 'Plot 123, Kampala Road', 'Kampala', 'local', 'Net 30', 500000.00),
('Global Foods Inc', 'Sarah Nakato', '+256701234567', 'sarah@globalfoods.com', 'Industrial Area, Plot 456', 'Kampala', 'international', 'Net 45', 1000000.00),
('Local Dairy Co', 'David Ochieng', '+256702345678', 'david@localdairy.ug', 'Nakawa, Plot 789', 'Kampala', 'local', 'Net 15', 300000.00),
('Beverage Distributors', 'Grace Akello', '+256703456789', 'grace@beverages.ug', 'Lugogo, Plot 101', 'Kampala', 'local', 'Net 30', 750000.00),
('Bakery Supplies Ltd', 'Michael Ssebuufu', '+256704567890', 'michael@bakery.ug', 'Ntinda, Plot 202', 'Kampala', 'local', 'Net 21', 400000.00);