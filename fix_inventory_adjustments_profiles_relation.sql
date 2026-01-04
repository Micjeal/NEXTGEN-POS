-- Fix the relationship between inventory_adjustments and profiles
-- The inventory_adjustments table currently references auth.users(id) for user_id,
-- but the API needs to join with profiles table. Since profiles.id references auth.users(id),
-- we need to change the foreign key to reference profiles directly.

-- First, add a temporary column to hold the profile IDs
ALTER TABLE inventory_adjustments ADD COLUMN temp_profile_id UUID;

-- Populate the temporary column with the corresponding profile IDs
UPDATE inventory_adjustments
SET temp_profile_id = profiles.id
FROM profiles
WHERE inventory_adjustments.user_id = profiles.id;

-- Drop the old foreign key constraint
ALTER TABLE inventory_adjustments DROP CONSTRAINT IF EXISTS inventory_adjustments_user_id_fkey;

-- Drop the old column
ALTER TABLE inventory_adjustments DROP COLUMN user_id;

-- Rename the temporary column to user_id
ALTER TABLE inventory_adjustments RENAME COLUMN temp_profile_id TO user_id;

-- Add the new foreign key constraint to profiles
ALTER TABLE inventory_adjustments ADD CONSTRAINT inventory_adjustments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add an index on the user_id column if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_user_id ON inventory_adjustments(user_id);