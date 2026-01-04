-- Seed data for suppliers table

INSERT INTO suppliers (
    name,
    contact_person,
    phone,
    email,
    address,
    city,
    country,
    payment_terms,
    credit_limit,
    supplier_category,
    rating,
    is_active,
    created_at,
    updated_at
) VALUES
    ('Bulk Wholesale Co', 'Robert Bulk', '+256701777888', 'robert@bulkwholesale.com', 'Kampala', 'Kampala', 'Uganda', 'Net 60', 15000000.00, 'local', 4.0, true, NOW(), NOW()),
    ('Dairy Distributors Ltd', 'Michael Dairy', '+256701333444', 'michael@dairydist.co.ug', 'Entebbe', 'Entebbe', 'Uganda', 'Net 30', 3000000.00, 'local', 4.7, true, NOW(), NOW()),
    ('Fresh Foods Ltd', 'David Supplier', '+256700999000', 'david@freshfoods.co.ug', 'Kampala', 'Kampala', 'Uganda', 'Net 30', 5000000.00, 'local', 4.5, true, NOW(), NOW()),
    ('Fresh Produce Distributors', 'Michael Brown', '+256 414 345678', 'michael@freshproduce.com', 'Kampala', 'Kampala', 'Uganda', 'Net 30', 2000000.00, 'local', 4.7, true, NOW(), NOW()),
    ('Global Beverages Inc', 'Sarah International', '+256701111222', 'sarah@globalbev.com', 'Kampala', 'Kampala', 'Uganda', 'Net 45', 10000000.00, 'international', 4.2, true, NOW(), NOW()),
    ('Global Foods Ltd', 'John Smith', '+256 414 123456', 'john@globalfoods.com', 'Kampala', 'Kampala', 'Uganda', 'Net 30', 5000000.00, 'local', 4.5, true, NOW(), NOW()),
    ('International Supplies Co', 'Sarah Johnson', '+256 414 234567', 'sarah@intsupplies.com', 'Kampala', 'Kampala', 'Uganda', 'Net 15', 3000000.00, 'international', 4.2, true, NOW(), NOW()),
    ('Local Traders Ltd', 'David Wilson', '+256 414 567890', 'david@localtraders.com', 'Kampala', 'Kampala', 'Uganda', 'Net 30', 1500000.00, 'local', 4.3, true, NOW(), NOW()),
    ('Mugisha Michael', 'Mugisha Michael', '0761686836', 'micknick168@gmail.com', 'Kampala', 'Kampala', 'Uganda', '20', 5000000.00, 'international', 3.0, true, NOW(), NOW()),
    ('Quality Goods Inc', 'Emma Davis', '+256 414 456789', 'emma@qualitygoods.com', 'Kampala', 'Kampala', 'Uganda', 'Net 45', 4000000.00, 'international', 4.0, true, NOW(), NOW()),
    ('Snack Masters Ltd', 'Jennifer Snacks', '+256701555666', 'jennifer@snackmasters.co.ug', 'Jinja', 'Jinja', 'Uganda', 'Net 30', 2000000.00, 'local', 4.3, true, NOW(), NOW())
ON CONFLICT DO NOTHING;