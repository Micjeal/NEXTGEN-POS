-- SMMS POS System Seed Data

-- =============================================
-- SEED ROLES
-- =============================================
INSERT INTO roles (name, description) VALUES
  ('admin', 'Full system access - all modules'),
  ('manager', 'Manage products, inventory, view reports'),
  ('cashier', 'POS access only')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- SEED PAYMENT METHODS
-- =============================================
INSERT INTO payment_methods (name, is_active) VALUES
  ('Cash', TRUE),
  ('Card', TRUE),
  ('Mobile Payment', TRUE),
  ('Store Credit', TRUE)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- SEED CATEGORIES
-- =============================================
INSERT INTO categories (name, description) VALUES
  ('Beverages', 'Drinks and liquid refreshments'),
  ('Dairy', 'Milk, cheese, yogurt and dairy products'),
  ('Bakery', 'Bread, pastries and baked goods'),
  ('Snacks', 'Chips, cookies and snack items'),
  ('Frozen Foods', 'Frozen meals and ice cream'),
  ('Fresh Produce', 'Fruits and vegetables'),
  ('Meat & Seafood', 'Fresh meat and seafood'),
  ('Canned Goods', 'Canned and preserved foods'),
  ('Household', 'Cleaning and household supplies'),
  ('Personal Care', 'Health and beauty products')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- SEED SAMPLE PRODUCTS
-- =============================================
INSERT INTO products (name, barcode, category_id, price, cost_price, tax_rate, is_active) 
SELECT 
  'Coca-Cola 500ml',
  '5449000000996',
  c.id,
  2.50,
  1.50,
  8.00,
  TRUE
FROM categories c WHERE c.name = 'Beverages'
ON CONFLICT (barcode) DO NOTHING;

INSERT INTO products (name, barcode, category_id, price, cost_price, tax_rate, is_active) 
SELECT 
  'Pepsi 500ml',
  '4060800001234',
  c.id,
  2.25,
  1.40,
  8.00,
  TRUE
FROM categories c WHERE c.name = 'Beverages'
ON CONFLICT (barcode) DO NOTHING;

INSERT INTO products (name, barcode, category_id, price, cost_price, tax_rate, is_active) 
SELECT 
  'Whole Milk 1L',
  '5000112637922',
  c.id,
  3.99,
  2.50,
  0.00,
  TRUE
FROM categories c WHERE c.name = 'Dairy'
ON CONFLICT (barcode) DO NOTHING;

INSERT INTO products (name, barcode, category_id, price, cost_price, tax_rate, is_active) 
SELECT 
  'Cheddar Cheese 200g',
  '5000112637923',
  c.id,
  5.99,
  3.50,
  0.00,
  TRUE
FROM categories c WHERE c.name = 'Dairy'
ON CONFLICT (barcode) DO NOTHING;

INSERT INTO products (name, barcode, category_id, price, cost_price, tax_rate, is_active) 
SELECT 
  'White Bread Loaf',
  '5000112637924',
  c.id,
  2.49,
  1.20,
  0.00,
  TRUE
FROM categories c WHERE c.name = 'Bakery'
ON CONFLICT (barcode) DO NOTHING;

INSERT INTO products (name, barcode, category_id, price, cost_price, tax_rate, is_active) 
SELECT 
  'Potato Chips 150g',
  '5000112637925',
  c.id,
  3.49,
  2.00,
  8.00,
  TRUE
FROM categories c WHERE c.name = 'Snacks'
ON CONFLICT (barcode) DO NOTHING;

INSERT INTO products (name, barcode, category_id, price, cost_price, tax_rate, is_active) 
SELECT 
  'Vanilla Ice Cream 1L',
  '5000112637926',
  c.id,
  6.99,
  4.00,
  8.00,
  TRUE
FROM categories c WHERE c.name = 'Frozen Foods'
ON CONFLICT (barcode) DO NOTHING;

INSERT INTO products (name, barcode, category_id, price, cost_price, tax_rate, is_active) 
SELECT 
  'Fresh Apples 1kg',
  '5000112637927',
  c.id,
  4.99,
  2.50,
  0.00,
  TRUE
FROM categories c WHERE c.name = 'Fresh Produce'
ON CONFLICT (barcode) DO NOTHING;

INSERT INTO products (name, barcode, category_id, price, cost_price, tax_rate, is_active) 
SELECT 
  'Chicken Breast 500g',
  '5000112637928',
  c.id,
  8.99,
  5.50,
  0.00,
  TRUE
FROM categories c WHERE c.name = 'Meat & Seafood'
ON CONFLICT (barcode) DO NOTHING;

INSERT INTO products (name, barcode, category_id, price, cost_price, tax_rate, is_active) 
SELECT 
  'Tomato Soup Can',
  '5000112637929',
  c.id,
  1.99,
  1.00,
  8.00,
  TRUE
FROM categories c WHERE c.name = 'Canned Goods'
ON CONFLICT (barcode) DO NOTHING;

-- =============================================
-- UPDATE INVENTORY FOR SEEDED PRODUCTS
-- =============================================
UPDATE inventory SET quantity = 100 WHERE product_id IN (SELECT id FROM products);

-- =============================================
-- SEED MESSAGE TEMPLATES
-- =============================================
INSERT INTO message_templates (name, subject, content, category, created_by) VALUES
  ('Shift Handover', 'Shift Handover Notes', 'Dear team member,

I am handing over my shift. Here are the key points:

- Current stock levels: [Add details]
- Any issues encountered: [Add details]
- Special notes: [Add details]

Please review and continue with the operations.

Best regards,
[Your Name]', 'operations', (SELECT id FROM auth.users LIMIT 1)),

  ('Low Stock Alert', 'URGENT: Low Stock Alert', 'Attention Team,

The following items are running low on stock:

[Item Name] - Current stock: [Quantity]

Please restock immediately to avoid stockouts.

This is an automated alert from the inventory system.', 'inventory', (SELECT id FROM auth.users LIMIT 1)),

  ('New User Welcome', 'Welcome to SMMS POS', 'Welcome to the Supermarket Management System!

Your account has been created with the following details:
- Username: [Username]
- Role: [Role]
- Access Level: [Access Level]

Please change your password upon first login and familiarize yourself with the system.

If you have any questions, please contact your administrator.

Best regards,
SMMS POS Team', 'announcements', (SELECT id FROM auth.users LIMIT 1)),

  ('System Maintenance', 'Scheduled System Maintenance', 'Dear Team,

We will be performing scheduled maintenance on the SMMS POS system.

Maintenance Window: [Date/Time]
Expected Duration: [Duration]
Impact: System will be unavailable during this period

Please complete all transactions before the maintenance window.

Thank you for your understanding.

Best regards,
IT Team', 'announcements', (SELECT id FROM auth.users LIMIT 1)),

  ('Sales Target Reminder', 'Weekly Sales Target Update', 'Hello Team,

Here is your weekly sales performance update:

Current Sales: $[Current Amount]
Target: $[Target Amount]
Progress: [Percentage]%

[Motivational message or additional notes]

Keep up the great work!

Best regards,
Management', 'operations', (SELECT id FROM auth.users LIMIT 1)),

  ('Inventory Count Request', 'Monthly Inventory Count Required', 'Dear Team,

It is time for our monthly inventory count.

Count Schedule:
- Date: [Date]
- Time: [Time]
- Areas to count: [List areas]

Please ensure all counting is accurate and complete.

Instructions:
1. Count all items in your assigned area
2. Record counts in the system
3. Report any discrepancies immediately

Thank you for your attention to detail.

Best regards,
Inventory Manager', 'inventory', (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT (name) DO NOTHING;
