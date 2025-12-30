-- Check if loyalty program exists and create default if needed
DO $$
BEGIN
    -- Check if any active program exists
    IF NOT EXISTS (SELECT 1 FROM loyalty_programs WHERE is_active = true) THEN
        -- Create default program if no active programs exist
        INSERT INTO loyalty_programs (name, description, points_per_currency, redemption_rate, is_active)
        VALUES ('Standard Loyalty Program', 'Earn 1 point per UGX 1 spent', 1.0, 0.01, true);
    END IF;
END $$;

-- Ensure at least one program is active (activate the first one if none are active)
UPDATE loyalty_programs
SET is_active = true
WHERE id = (
    SELECT id FROM loyalty_programs
    ORDER BY created_at ASC
    LIMIT 1
)
AND NOT EXISTS (SELECT 1 FROM loyalty_programs WHERE is_active = true);