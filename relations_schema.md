
-- Add tier_id foreign key to customer_loyalty_accounts
ALTER TABLE customer_loyalty_accounts ADD COLUMN IF NOT EXISTS tier_id UUID REFERENCES loyalty_tiers(id);

-- Populate tier_id based on existing tier text
UPDATE customer_loyalty_accounts
SET tier_id = lt.id
FROM loyalty_tiers lt
WHERE lt.tier_name = customer_loyalty_accounts.tier;

-- Drop the old tier column after data migration (uncomment when ready)
-- ALTER TABLE customer_loyalty_accounts DROP COLUMN IF EXISTS tier;

-- =============================================
-- 2. NORMALIZE CUSTOMERS MEMBERSHIP TIER
-- =============================================
-- Add membership_tier_id foreign key to customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS membership_tier_id UUID REFERENCES loyalty_tiers(id);

-- Populate membership_tier_id based on existing membership_tier text
UPDATE customers
SET membership_tier_id = lt.id
FROM loyalty_tiers lt
WHERE lt.tier_name = customers.membership_tier;

-- Drop the old membership_tier column after data migration (uncomment when ready)
-- ALTER TABLE customers DROP COLUMN IF EXISTS membership_tier;

-- =============================================
-- 3. NORMALIZE CUSTOMER ANALYTICS LOYALTY TIER
-- =============================================
-- Add loyalty_tier_id foreign key to customer_analytics
ALTER TABLE customer_analytics ADD COLUMN IF NOT EXISTS loyalty_tier_id UUID REFERENCES loyalty_tiers(id);

-- Populate loyalty_tier_id based on existing loyalty_tier text
UPDATE customer_analytics
SET loyalty_tier_id = lt.id
FROM loyalty_tiers lt
WHERE lt.tier_name = customer_analytics.loyalty_tier;

-- Drop the old loyalty_tier column after data migration (uncomment when ready)
-- ALTER TABLE customer_analytics DROP COLUMN IF EXISTS loyalty_tier;

-- =============================================
-- UPDATE TRIGGERS TO USE NEW FKs
-- =============================================
-- Update the trigger to use tier_id instead of tier text
CREATE OR REPLACE FUNCTION update_customer_loyalty_tier()
RETURNS TRIGGER AS $$
BEGIN
  -- Update tier_id in customer_loyalty_accounts based on current points
  UPDATE customer_loyalty_accounts
  SET tier_id = (
    SELECT id FROM loyalty_tiers
    WHERE NEW.current_points >= min_points
    AND (max_points IS NULL OR NEW.current_points <= max_points)
    ORDER BY min_points DESC
    LIMIT 1
  )
  WHERE id = NEW.id;

  -- Also update the membership_tier_id in customers table for consistency
  UPDATE customers
  SET membership_tier_id = (
    SELECT tier_id FROM customer_loyalty_accounts WHERE customer_id = NEW.customer_id
  )
  WHERE id = NEW.customer_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update customer_analytics trigger
CREATE OR REPLACE FUNCTION update_customer_analytics_tier()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE customer_analytics
  SET loyalty_tier_id = NEW.tier_id
  WHERE customer_id = NEW.customer_id
  AND analysis_date = CURRENT_DATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_update_customer_analytics_tier
  AFTER UPDATE OF tier_id ON customer_loyalty_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_analytics_tier();

-- =============================================
-- ADD INDEXES FOR NEW FKs
-- =============================================
CREATE INDEX IF NOT EXISTS idx_customer_loyalty_accounts_tier_id ON customer_loyalty_accounts(tier_id);
CREATE INDEX IF NOT EXISTS idx_customers_membership_tier_id ON customers(membership_tier_id);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_loyalty_tier_id ON customer_analytics(loyalty_tier_id);
