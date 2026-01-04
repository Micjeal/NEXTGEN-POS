-- Seed data for supplier_products table
-- This script creates relationships between suppliers and products

DO $$
DECLARE
    supplier_record RECORD;
    product_record RECORD;
    counter INTEGER := 1;
BEGIN
    -- For each supplier, assign some products
    FOR supplier_record IN SELECT id, name FROM suppliers ORDER BY created_at LIMIT 5 LOOP
        -- Assign 10-20 products per supplier
        FOR product_record IN
            SELECT id, name FROM products
            ORDER BY created_at
            LIMIT 20
            OFFSET ((counter - 1) * 20) LOOP

            INSERT INTO supplier_products (
                supplier_id,
                product_id,
                supplier_product_code,
                supplier_price,
                minimum_order_quantity,
                lead_time_days,
                is_preferred_supplier,
                created_at
            ) VALUES (
                supplier_record.id,
                product_record.id,
                'SUP-' || supplier_record.id::text || '-' || product_record.id::text,
                (SELECT price * 0.7 + random() * (price * 0.3) FROM products WHERE id = product_record.id),
                10 + (random() * 40)::int,
                3 + (random() * 10)::int,
                CASE WHEN random() < 0.3 THEN true ELSE false END,
                NOW()
            )
            ON CONFLICT (supplier_id, product_id) DO NOTHING;

        END LOOP;

        counter := counter + 1;
    END LOOP;

    RAISE NOTICE 'Seeded supplier_products relationships';
END $$;