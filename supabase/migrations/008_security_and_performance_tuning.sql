-- ============================================================
-- Migration 008: Security & Performance Tuning
-- Addresses all Supabase Database Linter & Security Advisor alerts:
-- 1. Function search_path hardening
-- 2. Revoking unauthorized EXECUTE on SECURITY DEFINER functions
-- 3. Optimizing RLS policies (subselect auth.uid() pattern)
-- 4. Foreign key covering indexes for joins and cascade performance
-- ============================================================

-- ============================================================
-- 1. SECURITY DEFINER HARDENING & SEARCH_PATH ENFORCEMENT
-- ============================================================

-- Fix search_path on all functions to prevent search_path injection
ALTER FUNCTION public.get_my_role() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_admin() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_employee() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_active_staff() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'confirm_booking' AND pronamespace = 'public'::regnamespace
  ) THEN
    ALTER FUNCTION public.confirm_booking(uuid, text, text) SET search_path = public, pg_temp;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'cancel_booking' AND pronamespace = 'public'::regnamespace
  ) THEN
    ALTER FUNCTION public.cancel_booking(uuid, text, text) SET search_path = public, pg_temp;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'insert_audit_log' AND pronamespace = 'public'::regnamespace
  ) THEN
    ALTER FUNCTION public.insert_audit_log(uuid, uuid, text, text, text, text, text, jsonb, jsonb) SET search_path = public, pg_temp;
  END IF;
END $$;

-- Revoke default public execute on sensitive trigger & management functions
-- handle_new_user should ONLY be executed by auth trigger (postgres role)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- confirm_booking & cancel_booking perform sensitive financial/table operations
-- They must not be directly callable by anonymous visitors
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'confirm_booking' AND pronamespace = 'public'::regnamespace
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.confirm_booking(uuid, text, text) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.confirm_booking(uuid, text, text) TO authenticated, service_role;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'cancel_booking' AND pronamespace = 'public'::regnamespace
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.cancel_booking(uuid, text, text) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.cancel_booking(uuid, text, text) TO authenticated, service_role;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'insert_audit_log' AND pronamespace = 'public'::regnamespace
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.insert_audit_log(uuid, uuid, text, text, text, text, text, jsonb, jsonb) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.insert_audit_log(uuid, uuid, text, text, text, text, text, jsonb, jsonb) TO authenticated, service_role;
  END IF;
END $$;

-- ============================================================
-- 2. COVERING INDEXES ON FOREIGN KEYS
-- Prevents slow sequential table scans during JOINs, UPDATEs, and CASCADE DELETEs
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_fk_profiles_restaurant_id ON public.profiles(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_fk_categories_restaurant_id ON public.categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_fk_dishes_category_id ON public.dishes(category_id);
CREATE INDEX IF NOT EXISTS idx_fk_dishes_restaurant_id ON public.dishes(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_fk_dish_ingredients_dish_id ON public.dish_ingredients(dish_id);
CREATE INDEX IF NOT EXISTS idx_fk_dish_ingredients_ingredient_id ON public.dish_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_fk_dish_sizes_dish_id ON public.dish_sizes(dish_id);
CREATE INDEX IF NOT EXISTS idx_fk_dish_addons_dish_id ON public.dish_addons(dish_id);
CREATE INDEX IF NOT EXISTS idx_fk_dish_models_dish_id ON public.dish_models(dish_id);
CREATE INDEX IF NOT EXISTS idx_fk_dish_hotspots_model_id ON public.dish_hotspots(dish_model_id);
CREATE INDEX IF NOT EXISTS idx_fk_tables_restaurant_id ON public.tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_fk_bookings_restaurant_id ON public.bookings(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_fk_bookings_table_id ON public.bookings(table_id);
CREATE INDEX IF NOT EXISTS idx_fk_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_fk_orders_restaurant_id ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_fk_orders_table_id ON public.orders(table_id);
CREATE INDEX IF NOT EXISTS idx_fk_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_fk_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_fk_order_items_dish_id ON public.order_items(dish_id);
CREATE INDEX IF NOT EXISTS idx_fk_order_items_dish_size_id ON public.order_items(dish_size_id);
CREATE INDEX IF NOT EXISTS idx_fk_order_customizations_item_id ON public.order_item_customizations(order_item_id);
CREATE INDEX IF NOT EXISTS idx_fk_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_fk_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_fk_audit_logs_restaurant_id ON public.audit_logs(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_fk_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_fk_asset_requests_dish_id ON public.asset_requests(dish_id);
CREATE INDEX IF NOT EXISTS idx_fk_employees_auth_id ON public.employees(auth_id);

-- ============================================================
-- 3. RLS INITPLAN OPTIMIZATION: (SELECT auth.uid())
-- Prevents re-evaluating auth.uid() function for every single table row scanned
-- ============================================================

-- Profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()));

-- Orders
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
CREATE POLICY "Customers can view own orders"
  ON public.orders FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Bookings
DROP POLICY IF EXISTS "Customers can view own bookings" ON public.bookings;
CREATE POLICY "Customers can view own bookings"
  ON public.bookings FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Customers can update own pending bookings" ON public.bookings;
CREATE POLICY "Customers can update own pending bookings"
  ON public.bookings FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()) AND status = 'pending');

-- Employees
DROP POLICY IF EXISTS "Employees can read own row" ON public.employees;
CREATE POLICY "Employees can read own row"
  ON public.employees FOR SELECT TO authenticated
  USING (auth_id = (SELECT auth.uid()));
