-- Fix for loyalty trigger subquery error
-- When a customer has multiple loyalty accounts, the subquery returns multiple rows

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
  SET membership_tier = NEW.tier
  WHERE id = NEW.customer_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;