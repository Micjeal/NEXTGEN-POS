-- SMMS POS System Triggers and Functions

-- =============================================
-- FUNCTION: Auto-create profile on user signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cashier_role_id UUID;
BEGIN
  -- Get the default cashier role
  SELECT id INTO cashier_role_id FROM roles WHERE name = 'cashier';
  
  INSERT INTO public.profiles (id, email, full_name, role_id, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'New User'),
    cashier_role_id,
    TRUE
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- FUNCTION: Auto-create inventory record for new product
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_product()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO inventory (product_id, quantity, min_stock_level, max_stock_level)
  VALUES (NEW.id, 0, 10, 1000)
  ON CONFLICT (product_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_product_created ON products;
CREATE TRIGGER on_product_created
  AFTER INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_product();

-- =============================================
-- FUNCTION: Update timestamps
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_inventory_updated_at ON inventory;
CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- FUNCTION: Generate invoice number
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  today_count INTEGER;
  invoice_num TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO today_count
  FROM sales
  WHERE DATE(created_at) = CURRENT_DATE;
  
  invoice_num := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(today_count::TEXT, 4, '0');
  
  RETURN invoice_num;
END;
$$;
