-- Complete POS Database Schema with Advanced Features
-- This is a comprehensive schema including all requested enterprise features

-- =============================================
-- 1. ROLES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  access_level TEXT NOT NULL CHECK (access_level IN ('admin', 'manager', 'cashier')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. USER PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role_id UUID REFERENCES roles(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. BRANCHES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  manager_id UUID REFERENCES auth.users(id),
  is_headquarters BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  operating_hours JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. EMPLOYEES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  address TEXT,
  city TEXT,
  hire_date DATE NOT NULL,
  termination_date DATE,
  designation TEXT NOT NULL,
  department TEXT,
  branch_id UUID REFERENCES branches(id),
  manager_id UUID REFERENCES employees(id),
  salary DECIMAL(12,2),
  hourly_rate DECIMAL(8,2),
  employment_type TEXT DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'temporary')),
  is_active BOOLEAN DEFAULT TRUE,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  bank_account_number TEXT,
  tax_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. EMPLOYEE SHIFTS
-- =============================================
CREATE TABLE IF NOT EXISTS employee_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, shift_date, start_time)
);

-- =============================================
-- 6. EMPLOYEE ATTENDANCE
-- =============================================
CREATE TABLE IF NOT EXISTS employee_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES employee_shifts(id),
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  break_start_time TIMESTAMPTZ,
  break_end_time TIMESTAMPTZ,
  total_hours DECIMAL(4,2),
  status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'early_departure', 'on_leave')),
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 7. EMPLOYEE PERFORMANCE
-- =============================================
CREATE TABLE IF NOT EXISTS employee_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id),
  rating DECIMAL(3,1) CHECK (rating >= 1.0 AND rating <= 5.0),
  goals_achievement DECIMAL(5,2),
  customer_satisfaction DECIMAL(3,1),
  sales_performance DECIMAL(5,2),
  punctuality DECIMAL(3,1),
  teamwork DECIMAL(3,1),
  comments TEXT,
  improvement_areas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 8. CATEGORIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 9. PRODUCTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  barcode TEXT UNIQUE,
  category_id UUID REFERENCES categories(id),
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  cost_price DECIMAL(10, 2) DEFAULT 0 CHECK (cost_price >= 0),
  tax_rate DECIMAL(5, 2) DEFAULT 0 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  is_active BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 10. INVENTORY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE UNIQUE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_stock_level INTEGER DEFAULT 10,
  max_stock_level INTEGER DEFAULT 1000,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 11. BRANCH INVENTORY
-- =============================================
CREATE TABLE IF NOT EXISTS branch_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_stock_level INTEGER DEFAULT 10,
  max_stock_level INTEGER DEFAULT 1000,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(branch_id, product_id)
);

-- =============================================
-- 12. SUPPLIERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS suppliers (
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

-- =============================================
-- 13. SUPPLIER PRODUCTS
-- =============================================
CREATE TABLE IF NOT EXISTS supplier_products (
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

-- =============================================
-- 14. PURCHASE ORDERS
-- =============================================
CREATE TABLE IF NOT EXISTS purchase_orders (
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

-- =============================================
-- 15. PURCHASE ORDER ITEMS
-- =============================================
CREATE TABLE IF NOT EXISTS purchase_order_items (
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

-- =============================================
-- 16. SUPPLIER INVOICES
-- =============================================
CREATE TABLE IF NOT EXISTS supplier_invoices (
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

-- =============================================
-- 17. SUPPLIER PAYMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS supplier_payments (
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

-- =============================================
-- 18. PRODUCT BATCHES
-- =============================================
CREATE TABLE IF NOT EXISTS product_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number TEXT NOT NULL UNIQUE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id),
  purchase_order_id UUID REFERENCES purchase_orders(id),
  manufacturing_date DATE,
  expiry_date DATE,
  received_date DATE NOT NULL,
  initial_quantity INTEGER NOT NULL CHECK (initial_quantity > 0),
  current_quantity INTEGER NOT NULL DEFAULT 0 CHECK (current_quantity >= 0),
  unit_cost DECIMAL(10,2),
  storage_location TEXT,
  quality_status TEXT DEFAULT 'pending' CHECK (quality_status IN ('pending', 'approved', 'rejected', 'quarantined')),
  quality_notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 19. BATCH TRANSACTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS batch_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES product_batches(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('receipt', 'sale', 'adjustment', 'transfer', 'return', 'expiry', 'recall')),
  quantity INTEGER NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  branch_id UUID REFERENCES branches(id),
  performed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 20. QUALITY INSPECTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS quality_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES product_batches(id),
  product_id UUID NOT NULL REFERENCES products(id),
  inspection_type TEXT NOT NULL CHECK (inspection_type IN ('incoming', 'in_process', 'final', 'recall_check')),
  inspector_id UUID REFERENCES auth.users(id),
  inspection_date DATE NOT NULL,
  temperature DECIMAL(5,2),
  humidity DECIMAL(5,2),
  visual_inspection TEXT,
  microbiological_test TEXT,
  chemical_test TEXT,
  overall_rating TEXT CHECK (overall_rating IN ('excellent', 'good', 'acceptable', 'poor', 'rejected')),
  comments TEXT,
  corrective_actions TEXT,
  requires_followup BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 21. PRODUCT RECALLS
-- =============================================
CREATE TABLE IF NOT EXISTS product_recalls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recall_number TEXT NOT NULL UNIQUE,
  product_id UUID NOT NULL REFERENCES products(id),
  batch_id UUID REFERENCES product_batches(id),
  recall_reason TEXT NOT NULL,
  severity_level TEXT NOT NULL CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
  affected_quantity INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  initiated_by UUID NOT NULL REFERENCES auth.users(id),
  regulatory_notification BOOLEAN DEFAULT FALSE,
  customer_notification_sent BOOLEAN DEFAULT FALSE,
  refund_offered BOOLEAN DEFAULT FALSE,
  replacement_offered BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 22. STOCK TRANSFERS
-- =============================================
CREATE TABLE IF NOT EXISTS stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number TEXT NOT NULL UNIQUE,
  from_branch_id UUID REFERENCES branches(id),
  to_branch_id UUID NOT NULL REFERENCES branches(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in_transit', 'received', 'cancelled')),
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  shipped_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 23. STOCK TRANSFER ITEMS
-- =============================================
CREATE TABLE IF NOT EXISTS stock_transfer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_transfer_id UUID NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity_requested INTEGER NOT NULL CHECK (quantity_requested > 0),
  quantity_shipped INTEGER DEFAULT 0 CHECK (quantity_shipped >= 0),
  quantity_received INTEGER DEFAULT 0 CHECK (quantity_received >= 0),
  unit_cost DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 24. PAYMENT METHODS
-- =============================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 25. CUSTOMERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Uganda',
  membership_tier TEXT DEFAULT 'bronze' CHECK (membership_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  total_spent DECIMAL(10,2) DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  last_visit_date TIMESTAMPTZ,
  first_visit_date TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 26. SALES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  customer_id UUID REFERENCES customers(id),
  branch_id UUID REFERENCES branches(id),
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 27. SALE ITEMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  batch_id UUID REFERENCES product_batches(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  line_total DECIMAL(10, 2) NOT NULL CHECK (line_total >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 28. PAYMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  payment_method_id UUID NOT NULL REFERENCES payment_methods(id),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  reference_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 29. GIFT CARDS
-- =============================================
CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_number TEXT NOT NULL UNIQUE,
  pin TEXT,
  initial_amount DECIMAL(10,2) NOT NULL CHECK (initial_amount > 0),
  current_balance DECIMAL(10,2) NOT NULL CHECK (current_balance >= 0),
  expiry_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  issued_to UUID REFERENCES customers(id),
  issued_by UUID NOT NULL REFERENCES auth.users(id),
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  notes TEXT
);

-- =============================================
-- 30. GIFT CARD TRANSACTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS gift_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'redeem', 'refund', 'expiry', 'adjustment')),
  amount DECIMAL(10,2) NOT NULL,
  balance_before DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  sale_id UUID REFERENCES sales(id),
  performed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 31. CUSTOMER DEPOSITS
-- =============================================
CREATE TABLE IF NOT EXISTS customer_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deposit_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  deposit_type TEXT NOT NULL CHECK (deposit_type IN ('layaway', 'custom_order', 'repair', 'service')),
  description TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
  deposit_amount DECIMAL(10,2) NOT NULL CHECK (deposit_amount > 0),
  balance_due DECIMAL(10,2) NOT NULL CHECK (balance_due >= 0),
  due_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'refunded')),
  completed_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 32. DEPOSIT PAYMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS deposit_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deposit_id UUID NOT NULL REFERENCES customer_deposits(id) ON DELETE CASCADE,
  payment_method_id UUID NOT NULL REFERENCES payment_methods(id),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  reference_number TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 33. MESSAGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  recipient_id UUID REFERENCES auth.users(id),
  recipient_role TEXT CHECK (recipient_role IN ('admin', 'manager', 'cashier')),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'direct' CHECK (message_type IN ('direct', 'role_based', 'broadcast', 'system')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'critical')),
  is_read BOOLEAN DEFAULT FALSE,
  parent_message_id UUID REFERENCES messages(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 34. MESSAGE TEMPLATES
-- =============================================
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 35. EMAIL TEMPLATES
-- =============================================
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  category TEXT NOT NULL CHECK (category IN ('alerts', 'reports', 'welcome', 'marketing', 'system')),
  variables JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 36. EMAIL LOGS
-- =============================================
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'bounced', 'complained', 'opened', 'clicked')),
  provider_message_id TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- =============================================
-- 37. EMAIL SETTINGS
-- =============================================
CREATE TABLE IF NOT EXISTS email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN ('low_stock', 'out_of_stock', 'daily_sales', 'weekly_report', 'customer_welcome', 'birthday', 'system_updates', 'marketing', 'transaction_alert')),
  enabled BOOLEAN DEFAULT TRUE,
  frequency TEXT DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'daily', 'weekly', 'monthly')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email_type)
);

-- =============================================
-- 38. CASH DRAWERS
-- =============================================
CREATE TABLE IF NOT EXISTS cash_drawers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  branch_id UUID REFERENCES branches(id),
  drawer_name TEXT NOT NULL DEFAULT 'Main Drawer',
  status TEXT NOT NULL DEFAULT 'closed' CHECK (status IN ('open', 'closed', 'reconciled')),
  opening_balance DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (opening_balance >= 0),
  current_balance DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (current_balance >= 0),
  expected_balance DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (expected_balance >= 0),
  opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  reconciled_at TIMESTAMPTZ,
  reconciled_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 39. SALES FORECASTS
-- =============================================
CREATE TABLE IF NOT EXISTS sales_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  category_id UUID REFERENCES categories(id),
  branch_id UUID REFERENCES branches(id),
  forecast_date DATE NOT NULL,
  forecast_period TEXT NOT NULL CHECK (forecast_period IN ('daily', 'weekly', 'monthly', 'quarterly')),
  forecasted_quantity INTEGER NOT NULL,
  forecasted_revenue DECIMAL(12,2) NOT NULL,
  confidence_level DECIMAL(5,2) CHECK (confidence_level >= 0 AND confidence_level <= 100),
  actual_quantity INTEGER,
  actual_revenue DECIMAL(12,2),
  accuracy_percentage DECIMAL(5,2),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 40. CUSTOMER LIFETIME VALUE
-- =============================================
CREATE TABLE IF NOT EXISTS customer_lifetime_value (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  calculation_date DATE NOT NULL,
  total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_orders INTEGER NOT NULL DEFAULT 0,
  average_order_value DECIMAL(10,2),
  purchase_frequency DECIMAL(5,2),
  customer_age_days INTEGER,
  predicted_clv DECIMAL(12,2),
  clv_segment TEXT CHECK (clv_segment IN ('low', 'medium', 'high', 'vip')),
  churn_probability DECIMAL(5,2) CHECK (churn_probability >= 0 AND churn_probability <= 100),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, calculation_date)
);

-- =============================================
-- 41. SEASONAL TRENDS
-- =============================================
CREATE TABLE IF NOT EXISTS seasonal_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  category_id UUID REFERENCES categories(id),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  total_sales DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_quantity INTEGER NOT NULL DEFAULT 0,
  average_price DECIMAL(10,2),
  growth_percentage DECIMAL(5,2),
  seasonal_index DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, year, month)
);

-- =============================================
-- 42. PROFIT MARGINS
-- =============================================
CREATE TABLE IF NOT EXISTS profit_margins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  category_id UUID REFERENCES categories(id),
  branch_id UUID REFERENCES branches(id),
  analysis_date DATE NOT NULL,
  cost_price DECIMAL(10,2) NOT NULL,
  selling_price DECIMAL(10,2) NOT NULL,
  gross_margin DECIMAL(5,2),
  net_margin DECIMAL(5,2),
  markup_percentage DECIMAL(5,2),
  competitive_index DECIMAL(3,1),
  recommendations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 43. AUDIT LOGS
-- =============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 44. LOGIN ATTEMPTS
-- =============================================
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  successful BOOLEAN NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 45. SECURITY INCIDENTS
-- =============================================
CREATE TABLE IF NOT EXISTS security_incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  user_id UUID REFERENCES auth.users(id),
  ip_address TEXT
);

-- =============================================
-- INDEXES (Essential ones for performance)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- =============================================
-- HELPER FUNCTIONS (Must be created before RLS policies)
-- =============================================
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT r.name FROM roles r JOIN profiles p ON p.role_id = r.id WHERE p.id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_recalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_drawers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_lifetime_value ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasonal_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE profit_margins ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;

-- =============================================
-- BASIC RLS POLICIES (Simplified)
-- =============================================
CREATE POLICY "authenticated_select" ON roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_select" ON branches FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_select" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_select" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_select" ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_select" ON sales FOR SELECT TO authenticated USING (auth.uid() = user_id OR get_user_role() IN ('admin', 'manager'));

-- =============================================
-- SEED DATA
-- =============================================
INSERT INTO roles (name, description, access_level) VALUES
  ('admin', 'Full system access', 'admin'),
  ('manager', 'Management access', 'manager'),
  ('cashier', 'POS operations', 'cashier');

INSERT INTO branches (name, code, is_headquarters) VALUES
  ('Headquarters', 'HQ', TRUE);

INSERT INTO payment_methods (name) VALUES
  ('Cash'), ('Card'), ('Mobile Payment'), ('Gift Card');

INSERT INTO categories (name, description) VALUES
  ('Beverages', 'Drinks'), ('Dairy', 'Milk products'), ('Snacks', 'Snacks'), ('Fresh Produce', 'Fruits & Vegetables');

-- =============================================
-- CUSTOMER LOYALTY SYSTEM ADDITIONS
-- =============================================

-- Update roles table constraint to include 'customer'
ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_access_level_check;
ALTER TABLE roles ADD CONSTRAINT roles_access_level_check CHECK (access_level IN ('admin', 'manager', 'cashier', 'customer'));

-- Add customer role
INSERT INTO roles (name, description, access_level) VALUES
  ('customer', 'Customer access for loyalty and profile management', 'customer')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- REGISTERED CUSTOMERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS registered_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Uganda',
  registration_date TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- REGISTERED CUSTOMER PROFILES
-- =============================================
CREATE TABLE IF NOT EXISTS registered_customer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  registered_customer_id UUID REFERENCES registered_customers(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role_id UUID REFERENCES roles(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(id),
  UNIQUE(registered_customer_id)
);

-- =============================================
-- MODIFY CUSTOMERS TABLE
-- =============================================
ALTER TABLE customers ADD COLUMN IF NOT EXISTS registered_customer_id UUID REFERENCES registered_customers(id);

-- =============================================
-- LOYALTY PROGRAMS
-- =============================================
CREATE TABLE IF NOT EXISTS loyalty_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  points_per_currency DECIMAL(10,2) DEFAULT 1.0,
  currency_to_points_rate DECIMAL(10,2) DEFAULT 1.0,
  redemption_rate DECIMAL(10,2) DEFAULT 0.01,
  minimum_points_for_redemption INTEGER DEFAULT 100,
  points_expiry_months INTEGER DEFAULT 24,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CUSTOMER LOYALTY ACCOUNTS
-- =============================================
CREATE TABLE IF NOT EXISTS customer_loyalty_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  loyalty_program_id UUID NOT NULL REFERENCES loyalty_programs(id),
  current_points INTEGER DEFAULT 0 CHECK (current_points >= 0),
  total_points_earned INTEGER DEFAULT 0 CHECK (total_points_earned >= 0),
  total_points_redeemed INTEGER DEFAULT 0 CHECK (total_points_redeemed >= 0),
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  join_date DATE DEFAULT CURRENT_DATE,
  last_activity_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, loyalty_program_id)
);

-- =============================================
-- LOYALTY TRANSACTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_loyalty_account_id UUID NOT NULL REFERENCES customer_loyalty_accounts(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'redeem', 'expire', 'adjustment')),
  points INTEGER NOT NULL,
  points_balance_before INTEGER NOT NULL,
  points_balance_after INTEGER NOT NULL,
  sale_id UUID REFERENCES sales(id),
  description TEXT,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- LOYALTY TIERS CONFIGURATION
-- =============================================
CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL UNIQUE CHECK (tier_name IN ('bronze', 'silver', 'gold', 'platinum')),
  min_points INTEGER NOT NULL DEFAULT 0,
  max_points INTEGER,
  earning_multiplier DECIMAL(3,2) DEFAULT 1.0,
  redemption_multiplier DECIMAL(3,2) DEFAULT 1.0,
  benefits JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CUSTOMER ANALYTICS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS customer_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  analysis_date DATE NOT NULL,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  average_order_value DECIMAL(10,2),
  purchase_frequency DECIMAL(5,2),
  customer_age_days INTEGER,
  predicted_clv DECIMAL(12,2),
  clv_segment TEXT CHECK (clv_segment IN ('low', 'medium', 'high', 'vip')),
  churn_probability DECIMAL(5,2) CHECK (churn_probability >= 0 AND churn_probability <= 100),
  loyalty_tier TEXT CHECK (loyalty_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  points_balance INTEGER DEFAULT 0,
  last_purchase_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, analysis_date)
);

-- =============================================
-- ADDITIONAL INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_registered_customers_user_id ON registered_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_registered_customers_phone ON registered_customers(phone);
CREATE INDEX IF NOT EXISTS idx_registered_customers_email ON registered_customers(email);
CREATE INDEX IF NOT EXISTS idx_registered_customer_profiles_id ON registered_customer_profiles(id);
CREATE INDEX IF NOT EXISTS idx_registered_customer_profiles_registered_customer_id ON registered_customer_profiles(registered_customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_registered_customer_id ON customers(registered_customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_customer_id ON customer_analytics(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_date ON customer_analytics(analysis_date);

-- =============================================
-- ENABLE RLS ON NEW TABLES
-- =============================================
ALTER TABLE registered_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE registered_customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_analytics ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES FOR NEW TABLES
-- =============================================
-- Registered Customers
CREATE POLICY "customer_select_own_registered_customers" ON registered_customers FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR get_user_role() IN ('admin', 'manager', 'cashier')
);
CREATE POLICY "customer_update_own_registered_customers" ON registered_customers FOR UPDATE TO authenticated USING (
  user_id = auth.uid() OR get_user_role() IN ('admin', 'manager')
) WITH CHECK (
  user_id = auth.uid() OR get_user_role() IN ('admin', 'manager')
);
CREATE POLICY "admin_manager_insert_registered_customers" ON registered_customers FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('admin', 'manager'));
CREATE POLICY "admin_manager_delete_registered_customers" ON registered_customers FOR DELETE TO authenticated USING (get_user_role() IN ('admin', 'manager'));

-- Registered Customer Profiles
CREATE POLICY "customer_select_own_profiles" ON registered_customer_profiles FOR SELECT TO authenticated USING (
  id = auth.uid() OR get_user_role() IN ('admin', 'manager', 'cashier')
);
CREATE POLICY "customer_update_own_profiles" ON registered_customer_profiles FOR UPDATE TO authenticated USING (
  id = auth.uid() OR get_user_role() IN ('admin', 'manager')
) WITH CHECK (
  id = auth.uid() OR get_user_role() IN ('admin', 'manager')
);
CREATE POLICY "admin_manager_manage_profiles" ON registered_customer_profiles FOR ALL TO authenticated USING (get_user_role() IN ('admin', 'manager'));

-- Loyalty Programs
CREATE POLICY "authenticated_select_loyalty_programs" ON loyalty_programs FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manage_loyalty_programs" ON loyalty_programs FOR ALL TO authenticated USING (get_user_role() = 'admin');

-- Customer Loyalty Accounts
CREATE POLICY "customer_select_own_loyalty_accounts" ON customer_loyalty_accounts FOR SELECT TO authenticated USING (
  customer_id IN (
    SELECT c.id FROM customers c
    JOIN registered_customers rc ON c.registered_customer_id = rc.id
    WHERE rc.user_id = auth.uid()
  ) OR get_user_role() IN ('admin', 'manager', 'cashier')
);
CREATE POLICY "admin_manager_manage_loyalty_accounts" ON customer_loyalty_accounts FOR ALL TO authenticated USING (get_user_role() IN ('admin', 'manager'));

-- Loyalty Transactions
CREATE POLICY "customer_select_own_loyalty_transactions" ON loyalty_transactions FOR SELECT TO authenticated USING (
  customer_loyalty_account_id IN (
    SELECT cla.id FROM customer_loyalty_accounts cla
    JOIN customers c ON cla.customer_id = c.id
    JOIN registered_customers rc ON c.registered_customer_id = rc.id
    WHERE rc.user_id = auth.uid()
  ) OR get_user_role() IN ('admin', 'manager', 'cashier')
);
CREATE POLICY "admin_manager_manage_loyalty_transactions" ON loyalty_transactions FOR ALL TO authenticated USING (get_user_role() IN ('admin', 'manager'));

-- Loyalty Tiers
CREATE POLICY "authenticated_select_loyalty_tiers" ON loyalty_tiers FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manage_loyalty_tiers" ON loyalty_tiers FOR ALL TO authenticated USING (get_user_role() = 'admin');

-- Customer Analytics
CREATE POLICY "customer_select_own_analytics" ON customer_analytics FOR SELECT TO authenticated USING (
  customer_id IN (
    SELECT c.id FROM customers c
    JOIN registered_customers rc ON c.registered_customer_id = rc.id
    WHERE rc.user_id = auth.uid()
  ) OR get_user_role() IN ('admin', 'manager')
);
CREATE POLICY "admin_manager_manage_customer_analytics" ON customer_analytics FOR ALL TO authenticated USING (get_user_role() IN ('admin', 'manager'));

-- =============================================
-- FUNCTIONS
-- =============================================
-- Extended get_user_role function
CREATE OR REPLACE FUNCTION get_customer_role()
RETURNS TEXT AS $$
BEGIN
  -- Check if user is a registered customer
  IF EXISTS (SELECT 1 FROM registered_customer_profiles WHERE id = auth.uid()) THEN
    RETURN 'customer';
  ELSE
    RETURN get_user_role();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create customer from registered customer
CREATE OR REPLACE FUNCTION create_customer_from_registered(customer_phone TEXT, customer_email TEXT)
RETURNS UUID AS $$
DECLARE
  reg_customer_id UUID;
  new_customer_id UUID;
BEGIN
  -- Find registered customer
  SELECT id INTO reg_customer_id
  FROM registered_customers
  WHERE (phone = customer_phone OR (phone IS NULL AND customer_phone IS NULL))
  AND (email = customer_email OR (email IS NULL AND customer_email IS NULL))
  LIMIT 1;

  IF reg_customer_id IS NOT NULL THEN
    -- Check if customer already exists
    SELECT id INTO new_customer_id
    FROM customers
    WHERE registered_customer_id = reg_customer_id;

    IF new_customer_id IS NULL THEN
      -- Create customer record
      INSERT INTO customers (
        phone, email, full_name, date_of_birth, gender, address, city, country,
        registered_customer_id, first_visit_date
      )
      SELECT phone, email, full_name, date_of_birth, gender, address, city, country,
             id, NOW()
      FROM registered_customers
      WHERE id = reg_customer_id
      RETURNING id INTO new_customer_id;

      -- Create loyalty account
      INSERT INTO customer_loyalty_accounts (customer_id, loyalty_program_id)
      SELECT new_customer_id, id FROM loyalty_programs WHERE is_active = true LIMIT 1;
    END IF;

    RETURN new_customer_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================
-- Trigger to create registered customer profile
CREATE OR REPLACE FUNCTION create_registered_customer_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO registered_customer_profiles (id, registered_customer_id, email, full_name, role_id)
  SELECT NEW.user_id, NEW.id, NEW.email, NEW.full_name, r.id
  FROM roles r
  WHERE r.name = 'customer';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_create_registered_customer_profile
  AFTER INSERT ON registered_customers
  FOR EACH ROW
  EXECUTE FUNCTION create_registered_customer_profile();

-- Trigger to update tier when points change
CREATE OR REPLACE FUNCTION update_customer_loyalty_tier()
RETURNS TRIGGER AS $$
BEGIN
  -- Update tier in customer_loyalty_accounts based on current points
  UPDATE customer_loyalty_accounts
  SET tier = (
    SELECT tier_name FROM loyalty_tiers
    WHERE NEW.current_points >= min_points
    AND (max_points IS NULL OR NEW.current_points <= max_points)
    ORDER BY min_points DESC
    LIMIT 1
  )
  WHERE id = NEW.id;

  -- Also update the membership_tier in customers table for consistency
  UPDATE customers
  SET membership_tier = (
    SELECT tier FROM customer_loyalty_accounts WHERE customer_id = NEW.customer_id
  )
  WHERE id = NEW.customer_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_update_loyalty_tier
  AFTER UPDATE OF current_points ON customer_loyalty_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_loyalty_tier();

-- =============================================
-- SEED DATA FOR LOYALTY SYSTEM
-- =============================================
INSERT INTO loyalty_programs (name, description, points_per_currency, redemption_rate) VALUES
  ('Standard Loyalty Program', 'Earn 1 point per UGX 1 spent', 1.0, 0.01)
ON CONFLICT DO NOTHING;

INSERT INTO loyalty_tiers (tier_name, min_points, max_points, earning_multiplier, redemption_multiplier, benefits) VALUES
  ('bronze', 0, 999, 1.0, 1.0, '{"birthday_discount": false, "free_delivery": false, "priority_support": false}'),
  ('silver', 1000, 4999, 1.1, 1.05, '{"birthday_discount": true, "free_delivery": false, "priority_support": false}'),
  ('gold', 5000, 9999, 1.2, 1.1, '{"birthday_discount": true, "free_delivery": true, "priority_support": true}'),
  ('platinum', 10000, NULL, 1.3, 1.15, '{"birthday_discount": true, "free_delivery": true, "priority_support": true, "personal_shopper": true}')
ON CONFLICT (tier_name) DO NOTHING;

-- =============================================
-- VIEWS
-- =============================================

-- Customer Purchase History View
CREATE OR REPLACE VIEW customer_purchase_history AS
SELECT
  c.id as customer_id,
  c.full_name,
  c.phone,
  c.email,
  c.membership_tier,
  s.id as sale_id,
  s.invoice_number,
  s.created_at as purchase_date,
  s.total,
  s.subtotal,
  s.tax_amount,
  s.discount_amount,
  si.product_name,
  si.quantity,
  si.unit_price,
  si.line_total,
  COALESCE(lt.points, 0) as points_earned
FROM customers c
LEFT JOIN sales s ON s.customer_id = c.id
LEFT JOIN sale_items si ON si.sale_id = s.id
LEFT JOIN loyalty_transactions lt ON lt.sale_id = s.id AND lt.transaction_type = 'earn'
ORDER BY c.id, s.created_at DESC;

-- Customer Loyalty Dashboard View
CREATE OR REPLACE VIEW customer_loyalty_dashboard AS
SELECT
  rc.id as registered_customer_id,
  rc.user_id,
  rc.full_name,
  rc.phone,
  rc.email,
  c.id as customer_id,
  COALESCE(c.membership_tier, 'none') as membership_tier,
  COALESCE(c.total_spent, 0) as total_spent,
  COALESCE(c.total_visits, 0) as total_visits,
  c.last_visit_date,
  COALESCE(cla.current_points, 0) as current_points,
  COALESCE(cla.total_points_earned, 0) as total_points_earned,
  COALESCE(cla.total_points_redeemed, 0) as total_points_redeemed,
  COALESCE(cla.tier, 'none') as tier,
  cla.join_date,
  COALESCE(lt.benefits, '{}') as tier_benefits
FROM registered_customers rc
LEFT JOIN customers c ON c.registered_customer_id = rc.id
LEFT JOIN customer_loyalty_accounts cla ON cla.customer_id = c.id
LEFT JOIN loyalty_tiers lt ON lt.tier_name = cla.tier;

-- Enable RLS on views
ALTER VIEW customer_purchase_history SET (security_barrier = true);
ALTER VIEW customer_loyalty_dashboard SET (security_barrier = true);

-- RLS Policies for views
CREATE POLICY "customer_view_own_purchase_history" ON customer_purchase_history
FOR SELECT TO authenticated
USING (
  customer_id IN (
    SELECT c.id FROM customers c
    JOIN registered_customers rc ON c.registered_customer_id = rc.id
    WHERE rc.user_id = auth.uid()
  ) OR get_user_role() IN ('admin', 'manager', 'cashier')
);

CREATE POLICY "customer_view_own_loyalty_dashboard" ON customer_loyalty_dashboard
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR get_user_role() IN ('admin', 'manager', 'cashier')
);