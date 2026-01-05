-- Fix Security Issues from Supabase Database Linter
-- This script addresses security warnings that could pose risks

-- =============================================
-- 1. FIX FUNCTION SEARCH_PATH MUTABLE
-- =============================================

-- Add explicit search_path to functions to prevent search_path attacks
ALTER FUNCTION public.refresh_timezone_cache() SET search_path = public;
ALTER FUNCTION public.update_customer_analytics_tier() SET search_path = public;
ALTER FUNCTION public.update_customer_cart_updated_at() SET search_path = public;
ALTER FUNCTION public.refresh_metadata_cache() SET search_path = public;
ALTER FUNCTION public.get_customer_role() SET search_path = public;
ALTER FUNCTION public.create_customer_from_registered(customer_phone TEXT, customer_email TEXT) SET search_path = public;
ALTER FUNCTION public.create_registered_customer_profile() SET search_path = public;
ALTER FUNCTION public.update_customer_loyalty_tier() SET search_path = public;
ALTER FUNCTION public.get_user_role() SET search_path = public;

-- =============================================
-- 2. RESTRICT MATERIALIZED VIEWS FROM API ACCESS
-- =============================================

-- Revoke select permissions from anon and authenticated roles on materialized views
REVOKE SELECT ON public.cached_timezone_names FROM anon;
REVOKE SELECT ON public.cached_timezone_names FROM authenticated;

REVOKE SELECT ON public.mv_timezone_names FROM anon;
REVOKE SELECT ON public.mv_timezone_names FROM authenticated;

-- =============================================
-- 3. NOTE: AUTH LEAKED PASSWORD PROTECTION
-- =============================================

-- This setting needs to be enabled in Supabase Auth settings, not via SQL
-- Go to Authentication > Settings in your Supabase dashboard and enable "Leaked password protection"