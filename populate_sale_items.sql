-- Populate sale_items for existing sales that don't have them
-- This script adds sample items to sales that are missing sale_items records

DO $$
DECLARE
    sale_record RECORD;
    product_record RECORD;
    item_count INTEGER;
    total_quantity INTEGER;
    item_quantity INTEGER;
    current_total DECIMAL(10,2) := 0;
BEGIN
    -- Loop through all sales that don't have sale_items
    FOR sale_record IN
        SELECT s.id, s.total, s.subtotal, s.invoice_number
        FROM sales s
        LEFT JOIN sale_items si ON s.id = si.sale_id
        WHERE si.id IS NULL
        ORDER BY s.created_at
    LOOP
        -- Get available products
        SELECT COUNT(*) INTO item_count FROM products WHERE is_active = true;

        IF item_count = 0 THEN
            RAISE NOTICE 'No active products found. Skipping sale %', sale_record.invoice_number;
            CONTINUE;
        END IF;

        -- Decide how many different items this sale should have (1-3 items)
        item_count := LEAST(3, GREATEST(1, (random() * 3)::INTEGER + 1));

        -- Reset current total
        current_total := 0;

        -- Add items to this sale
        FOR i IN 1..item_count LOOP
            -- Get a random product
            SELECT * INTO product_record
            FROM products
            WHERE is_active = true
            ORDER BY random()
            LIMIT 1;

            IF NOT FOUND THEN
                CONTINUE;
            END IF;

            -- Calculate quantity (1-5 items)
            item_quantity := GREATEST(1, (random() * 5)::INTEGER + 1);

            -- Calculate line total
            DECLARE
                line_total DECIMAL(10,2);
                tax_amount DECIMAL(10,2);
            BEGIN
                tax_amount := (product_record.price * item_quantity * product_record.tax_rate) / 100;
                line_total := (product_record.price * item_quantity) + tax_amount;

                -- Insert sale_item
                INSERT INTO sale_items (
                    sale_id,
                    product_id,
                    product_name,
                    quantity,
                    unit_price,
                    tax_rate,
                    tax_amount,
                    discount_amount,
                    line_total
                ) VALUES (
                    sale_record.id,
                    product_record.id,
                    product_record.name,
                    item_quantity,
                    product_record.price,
                    product_record.tax_rate,
                    tax_amount,
                    0, -- No discount
                    line_total
                );

                current_total := current_total + line_total;
            END;
        END LOOP;

        RAISE NOTICE 'Added % items to sale % (total: %)', item_count, sale_record.invoice_number, current_total;
    END LOOP;

    -- Update sales totals if needed (this is a simplified version)
    -- In a real scenario, you'd recalculate totals based on the items

    RAISE NOTICE 'Sale items population completed';
END $$;

-- Verify the results
SELECT
    s.invoice_number,
    COUNT(si.id) as item_count,
    SUM(si.quantity) as total_quantity,
    SUM(si.line_total) as calculated_total,
    s.total as sale_total
FROM sales s
LEFT JOIN sale_items si ON s.id = si.sale_id
GROUP BY s.id, s.invoice_number, s.total
ORDER BY s.created_at DESC
LIMIT 10;