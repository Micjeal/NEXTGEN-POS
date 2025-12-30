-- Seed data for 500 products with related tables
-- This script inserts 500 products divided across categories,
-- along with corresponding inventory and profit margin records

-- First, get category IDs
DO $$
DECLARE
    beverages_id UUID;
    dairy_id UUID;
    snacks_id UUID;
    produce_id UUID;
BEGIN
    SELECT id INTO beverages_id FROM categories WHERE name = 'Beverages' LIMIT 1;
    SELECT id INTO dairy_id FROM categories WHERE name = 'Dairy' LIMIT 1;
    SELECT id INTO snacks_id FROM categories WHERE name = 'Snacks' LIMIT 1;
    SELECT id INTO produce_id FROM categories WHERE name = 'Fresh Produce' LIMIT 1;

    -- Insert 500 products
    INSERT INTO products (name, barcode, category_id, price, cost_price, tax_rate, is_active, created_at, updated_at)
    SELECT
        CASE
            WHEN i <= 125 THEN 'Beverage ' || i
            WHEN i <= 250 THEN 'Dairy Product ' || (i - 125)
            WHEN i <= 375 THEN 'Snack ' || (i - 250)
            ELSE 'Produce Item ' || (i - 375)
        END,
        'BAR' || LPAD(i::text, 6, '0'),
        CASE
            WHEN i <= 125 THEN beverages_id
            WHEN i <= 250 THEN dairy_id
            WHEN i <= 375 THEN snacks_id
            ELSE produce_id
        END,
        50 + (i % 50) * 10 + (random() * 100)::int,  -- Price between 50 and 1050
        GREATEST(1, 30 + (i % 30) * 8 + (random() * 80)::int),   -- Ensure cost_price is at least 1
        CASE
            WHEN i % 4 = 0 THEN 18.0
            WHEN i % 4 = 1 THEN 16.0
            WHEN i % 4 = 2 THEN 0.0
            ELSE 8.0
        END,
        true,
        NOW() - (random() * interval '365 days'),
        NOW()
    FROM generate_series(1, 500) AS i;

    -- Insert inventory for each product
    INSERT INTO inventory (product_id, quantity, min_stock_level, max_stock_level, updated_at)
    SELECT
        p.id,
        50 + (random() * 200)::int,  -- Quantity between 50 and 250
        10,
        500,
        NOW()
    FROM products p
    WHERE p.id NOT IN (SELECT product_id FROM inventory);

    -- Insert profit margins for each product with safe calculations
    WITH margin_data AS (
        SELECT
            p.id AS product_id,
            p.category_id,
            p.cost_price,
            p.price,
            p.tax_rate,
            -- Ensure we don't divide by zero and cap values
            CASE 
                WHEN p.cost_price > 0 AND p.price > 0 THEN 
                    LEAST(999.99, ((p.price - p.cost_price) / NULLIF(p.cost_price, 0)) * 100)
                ELSE 0 
            END AS markup_percentage
        FROM products p
        WHERE p.id NOT IN (SELECT product_id FROM profit_margins)
    )
    INSERT INTO profit_margins (
        product_id, 
        category_id, 
        branch_id, 
        analysis_date, 
        cost_price, 
        selling_price, 
        gross_margin, 
        net_margin, 
        markup_percentage, 
        competitive_index, 
        recommendations, 
        created_at
    )
    SELECT
        md.product_id,
        md.category_id,
        (SELECT id FROM branches LIMIT 1),
        CURRENT_DATE,
        md.cost_price,
        md.price,
        CASE WHEN md.price > 0 THEN ((md.price - md.cost_price) / md.price) * 100 ELSE 0 END,
        CASE WHEN md.price > 0 THEN ((md.price - md.cost_price - (md.price * md.tax_rate / 100)) / md.price) * 100 ELSE 0 END,
        LEAST(999.99, md.markup_percentage),  -- Cap at 999.99
        3.0 + (random() * 2)::decimal(3,1),  -- Competitive index between 3.0 and 5.0
        CASE
            WHEN ((md.price - md.cost_price) / NULLIF(md.price, 0)) * 100 < 20 THEN 'Consider price increase or cost reduction'
            WHEN ((md.price - md.cost_price) / NULLIF(md.price, 0)) * 100 > 50 THEN 'High margin - monitor competition'
            ELSE 'Margin is acceptable'
        END,
        NOW()
    FROM margin_data md
    WHERE md.markup_percentage <= 999.99;  -- Only insert records with valid markup

    -- Insert some sales forecasts
    INSERT INTO sales_forecasts (product_id, category_id, branch_id, forecast_date, forecast_period, forecasted_quantity, forecasted_revenue, confidence_level, created_by, created_at)
    SELECT
        p.id,
        p.category_id,
        (SELECT id FROM branches LIMIT 1),
        CURRENT_DATE + interval '1 month',
        'monthly',
        100 + (random() * 200)::int,
        (100 + (random() * 200)::int) * p.price,
        75 + (random() * 20)::int,  -- Confidence 75-95%
        (SELECT id FROM profiles LIMIT 1),
        NOW()
    FROM products p
    TABLESAMPLE BERNOULLI(10);  -- Sample 10% of products for forecasts

    -- Insert seasonal trends for some products
    INSERT INTO seasonal_trends (product_id, category_id, year, month, total_sales, total_quantity, average_price, growth_percentage, seasonal_index, created_at)
    SELECT
        p.id,
        p.category_id,
        EXTRACT(YEAR FROM CURRENT_DATE),
        EXTRACT(MONTH FROM CURRENT_DATE),
        (random() * 10000)::decimal(12,2),
        (random() * 500)::int,
        p.price + (random() * 50)::decimal(10,2),
        (random() * 20 - 10)::decimal(5,2),  -- Growth -10% to +10%
        0.8 + (random() * 0.4)::decimal(5,2),  -- Seasonal index 0.8-1.2
        NOW()
    FROM products p
    TABLESAMPLE BERNOULLI(5);  -- Sample 5% of products

END $$;