-- Seed specific products for each supplier

DO $$
DECLARE
    supplier_id UUID;
    category_id UUID;
    product_id UUID;
BEGIN
    -- Bulk Wholesale Co - Beverages
    SELECT id INTO supplier_id FROM suppliers WHERE name = 'Bulk Wholesale Co' LIMIT 1;
    SELECT id INTO category_id FROM categories WHERE name = 'Beverages' LIMIT 1;

    IF supplier_id IS NOT NULL AND category_id IS NOT NULL THEN
        INSERT INTO products (name, barcode, category_id, price, cost_price, tax_rate, is_active, created_at, updated_at)
        VALUES ('Coca Cola 500ml', 'BW001', category_id, 1500, 1200, 18, true, NOW(), NOW())
        RETURNING id INTO product_id;

        INSERT INTO supplier_products (supplier_id, product_id, supplier_product_code, supplier_price, minimum_order_quantity, lead_time_days, is_preferred_supplier)
        VALUES (supplier_id, product_id, 'BW-001', 1200, 50, 7, true);
    END IF;

    -- Dairy Distributors Ltd - Dairy products
    SELECT id INTO supplier_id FROM suppliers WHERE name = 'Dairy Distributors Ltd' LIMIT 1;
    SELECT id INTO category_id FROM categories WHERE name = 'Dairy' LIMIT 1;

    IF supplier_id IS NOT NULL AND category_id IS NOT NULL THEN
        INSERT INTO products (name, barcode, category_id, price, cost_price, tax_rate, is_active, created_at, updated_at)
        VALUES ('Fresh Milk 1L', 'DD001', category_id, 2500, 2000, 18, true, NOW(), NOW())
        RETURNING id INTO product_id;

        INSERT INTO supplier_products (supplier_id, product_id, supplier_product_code, supplier_price, minimum_order_quantity, lead_time_days, is_preferred_supplier)
        VALUES (supplier_id, product_id, 'DD-001', 2125, 20, 3, true);
    END IF;

    -- Fresh Foods Ltd - Fresh Produce
    SELECT id INTO supplier_id FROM suppliers WHERE name = 'Fresh Foods Ltd' LIMIT 1;
    SELECT id INTO category_id FROM categories WHERE name = 'Fresh Produce' LIMIT 1;

    IF supplier_id IS NOT NULL AND category_id IS NOT NULL THEN
        INSERT INTO products (name, barcode, category_id, price, cost_price, tax_rate, is_active, created_at, updated_at)
        VALUES ('Bananas 1kg', 'FF001', category_id, 2000, 1500, 0, true, NOW(), NOW())
        RETURNING id INTO product_id;

        INSERT INTO supplier_products (supplier_id, product_id, supplier_product_code, supplier_price, minimum_order_quantity, lead_time_days, is_preferred_supplier)
        VALUES (supplier_id, product_id, 'FF-001', 1800, 10, 2, true);
    END IF;

    -- Global Beverages Inc - International Beverages
    SELECT id INTO supplier_id FROM suppliers WHERE name = 'Global Beverages Inc' LIMIT 1;
    SELECT id INTO category_id FROM categories WHERE name = 'Beverages' LIMIT 1;

    IF supplier_id IS NOT NULL AND category_id IS NOT NULL THEN
        INSERT INTO products (name, barcode, category_id, price, cost_price, tax_rate, is_active, created_at, updated_at)
        VALUES ('Red Bull 250ml', 'GB001', category_id, 2500, 2000, 18, true, NOW(), NOW())
        RETURNING id INTO product_id;

        INSERT INTO supplier_products (supplier_id, product_id, supplier_product_code, supplier_price, minimum_order_quantity, lead_time_days, is_preferred_supplier)
        VALUES (supplier_id, product_id, 'GB-001', 1875, 25, 14, false);
    END IF;

    -- Snack Masters Ltd - Snacks
    SELECT id INTO supplier_id FROM suppliers WHERE name = 'Snack Masters Ltd' LIMIT 1;
    SELECT id INTO category_id FROM categories WHERE name = 'Snacks' LIMIT 1;

    IF supplier_id IS NOT NULL AND category_id IS NOT NULL THEN
        INSERT INTO products (name, barcode, category_id, price, cost_price, tax_rate, is_active, created_at, updated_at)
        VALUES ('Potato Chips 150g', 'SM001', category_id, 2500, 2000, 18, true, NOW(), NOW())
        RETURNING id INTO product_id;

        INSERT INTO supplier_products (supplier_id, product_id, supplier_product_code, supplier_price, minimum_order_quantity, lead_time_days, is_preferred_supplier)
        VALUES (supplier_id, product_id, 'SM-001', 2125, 30, 5, true);
    END IF;

    RAISE NOTICE 'Seeded specific products for suppliers';
END $$;