-- Optimize Slow Queries from pg_stat_statements
-- This script adds indexes and optimizations for frequently slow queries

-- =============================================
-- 1. OPTIMIZE TIMEZONE QUERY
-- =============================================

-- The query "SELECT name FROM pg_timezone_names" is slow
-- Create a cached version or add index if possible
-- Since pg_timezone_names is a view, create a materialized view for caching

CREATE MATERIALIZED VIEW IF NOT EXISTS cached_timezone_names AS
SELECT name FROM pg_timezone_names;

-- Create index on the materialized view
CREATE INDEX IF NOT EXISTS idx_cached_timezone_names_name ON cached_timezone_names(name);

-- Refresh function for the materialized view
CREATE OR REPLACE FUNCTION refresh_timezone_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW cached_timezone_names;
END;
$$;

-- =============================================
-- 2. OPTIMIZE METADATA QUERIES
-- =============================================

-- Note: Cannot add indexes to system catalog tables in Supabase
-- The following optimizations use materialized views and functions instead
-- System table indexes would require superuser privileges

-- =============================================
-- 3. OPTIMIZE STATISTICS QUERIES
-- =============================================

-- Note: Cannot modify pg_stat_statements or other extension tables
-- Optimization must be done at application level by reducing query frequency

-- =============================================
-- 4. OPTIMIZE PUBLICATION TABLES QUERY
-- =============================================

-- Note: Cannot add indexes to pg_publication_tables

-- =============================================
-- 5. OPTIMIZE EXTENSIONS QUERY
-- =============================================

-- Note: Cannot add indexes to pg_available_extensions

-- =============================================
-- 6. OPTIMIZE TYPE QUERIES
-- =============================================

-- Note: Cannot add indexes to pg_type

-- =============================================
-- 7. CREATE CACHED VIEWS FOR FREQUENT QUERIES
-- =============================================

-- Note: Advanced caching with system functions not available in Supabase
-- The timezone cache above is the main optimization available

-- =============================================
-- 8. SCHEDULE CACHE REFRESH
-- =============================================

-- Note: For production, consider setting up a cron job or trigger to refresh caches periodically
-- Example: Refresh caches every hour using Supabase Edge Functions or external scheduler

-- To refresh manually:
-- SELECT refresh_timezone_cache();