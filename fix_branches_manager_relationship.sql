-- Fix the branches.manager_id relationship to reference employees instead of auth.users
-- This ensures that branch managers are properly linked to employee records

-- Step 1: First, set any invalid manager_id values to NULL
-- This prevents foreign key constraint violations
UPDATE branches
SET manager_id = NULL
WHERE manager_id IS NOT NULL
AND manager_id NOT IN (SELECT id FROM employees);

-- Step 2: Drop the existing foreign key constraint
ALTER TABLE branches DROP CONSTRAINT IF EXISTS branches_manager_id_fkey;

-- Step 3: Add the new foreign key constraint to reference employees.id
ALTER TABLE branches ADD CONSTRAINT branches_manager_id_fkey
    FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;

-- Optional: If you have data where manager_id should be mapped from user_id to employee.id,
-- you can run this update after setting up some employees:
-- UPDATE branches
-- SET manager_id = (
--     SELECT e.id
--     FROM employees e
--     WHERE e.user_id = branches.manager_id
--     AND branches.manager_id IS NOT NULL
-- )
-- WHERE manager_id IS NOT NULL;