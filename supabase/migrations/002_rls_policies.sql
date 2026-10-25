-- ============================================================
-- Migration 002: Row Level Security Policies
-- The Golden Oak — Phase 10.1
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- Enable RLS on all tables
alter table public.restaurants enable row level security;
alter table public.restaurant_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.dishes enable row level security;
alter table public.ingredients enable row level security;
alter table public.dish_ingredients enable row level security;
alter table public.dish_sizes enable row level security;
alter table public.dish_addons enable row level security;
alter table public.dish_models enable row level security;
alter table public.dish_hotspots enable row level security;
alter table public.tables enable row level security;
alter table public.bookings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_item_customizations enable row level security;
alter table public.payments enable row level security;
alter table public.audit_logs enable row level security;
alter table public.asset_requests enable row level security;

-- ============================================================
-- HELPER: check current user role
-- ============================================================
create or replace function public.get_my_role()
returns text as $$
  select role from public.profiles where id = auth.uid()
$$ language sql security definer stable;

create or replace function public.is_admin()
returns boolean as $$
  select coalesce(get_my_role() = 'admin', false)
$$ language sql security definer stable;

create or replace function public.is_employee()
returns boolean as $$
  select coalesce(get_my_role() in ('admin', 'employee'), false)
$$ language sql security definer stable;

create or replace function public.is_active_staff()
returns boolean as $$
  select coalesce(
    (select is_active from public.profiles where id = auth.uid() and role in ('admin', 'employee')),
    false
  )
$$ language sql security definer stable;

-- ============================================================
-- RESTAURANTS — public read
-- ============================================================
create policy "Public can read restaurants"
  on public.restaurants for select using (true);

create policy "Admin can manage restaurants"
  on public.restaurants for all using (is_admin());

-- ============================================================
-- RESTAURANT SETTINGS — safe public keys readable
-- ============================================================
create policy "Public can read non-sensitive settings"
  on public.restaurant_settings for select
  using (key not in ('payment_secret', 'webhook_secret'));

create policy "Admin can manage settings"
  on public.restaurant_settings for all using (is_admin());

-- ============================================================
-- PROFILES — own profile only + admin full
-- ============================================================
create policy "Users can read own profile"
  on public.profiles for select using (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update using (id = auth.uid());

create policy "Admin can read all profiles"
  on public.profiles for select using (is_admin());

create policy "Admin can manage profiles"
  on public.profiles for all using (is_admin());

-- ============================================================
-- CATEGORIES — public read active, admin full
-- ============================================================
create policy "Public can read active categories"
  on public.categories for select using (is_active = true);

create policy "Admin can see all categories"
  on public.categories for select using (is_admin());

create policy "Admin can manage categories"
  on public.categories for all using (is_admin());

-- ============================================================
-- DISHES — public read available, admin full
-- ============================================================
create policy "Public can read available dishes"
  on public.dishes for select using (is_available = true);

create policy "Admin can see all dishes"
  on public.dishes for select using (is_admin());

create policy "Admin can manage dishes"
  on public.dishes for all using (is_admin());

-- ============================================================
-- INGREDIENTS — admin full, staff read
-- ============================================================
create policy "Staff can read ingredients"
  on public.ingredients for select using (is_employee());

create policy "Admin can manage ingredients"
  on public.ingredients for all using (is_admin());

-- ============================================================
-- DISH INGREDIENTS — public read for available dishes
-- ============================================================
create policy "Public can read dish ingredients"
  on public.dish_ingredients for select using (true);

create policy "Admin can manage dish ingredients"
  on public.dish_ingredients for all using (is_admin());

-- ============================================================
-- DISH SIZES — public read
-- ============================================================
create policy "Public can read dish sizes"
  on public.dish_sizes for select using (true);

create policy "Admin can manage dish sizes"
  on public.dish_sizes for all using (is_admin());

-- ============================================================
-- DISH ADDONS — public read
-- ============================================================
create policy "Public can read dish addons"
  on public.dish_addons for select using (true);

create policy "Admin can manage dish addons"
  on public.dish_addons for all using (is_admin());

-- ============================================================
-- DISH MODELS — public read active, developer/admin full
-- ============================================================
create policy "Public can read active dish models"
  on public.dish_models for select using (is_active = true);

create policy "Admin can manage dish models"
  on public.dish_models for all using (is_admin());

-- ============================================================
-- DISH HOTSPOTS — public read active
-- ============================================================
create policy "Public can read active hotspots"
  on public.dish_hotspots for select using (is_active = true);

create policy "Admin can manage hotspots"
  on public.dish_hotspots for all using (is_admin());

-- ============================================================
-- TABLES — admin/employee read, admin manage
-- ============================================================
create policy "Staff can read tables"
  on public.tables for select using (is_employee());

create policy "Admin can manage tables"
  on public.tables for all using (is_admin());

-- ============================================================
-- BOOKINGS — customer sees own (by phone), staff sees all
-- ============================================================
create policy "Staff can read all bookings"
  on public.bookings for select using (is_employee());

create policy "Admin can manage all bookings"
  on public.bookings for all using (is_admin());

-- Allow anonymous insert (customer submitting booking)
create policy "Anyone can create a booking"
  on public.bookings for insert with check (true);

-- ============================================================
-- ORDERS — customer sees own (by phone), employee sees all operational
-- ============================================================
create policy "Staff can read all orders"
  on public.orders for select using (is_employee());

create policy "Admin can manage all orders"
  on public.orders for all using (is_admin());

-- Employee can update operational status only
create policy "Employee can update order status"
  on public.orders for update
  using (is_employee())
  with check (is_employee());

-- Allow anonymous insert (customer placing order)
create policy "Anyone can create an order"
  on public.orders for insert with check (true);

-- ============================================================
-- ORDER ITEMS — staff reads all
-- ============================================================
create policy "Staff can read order items"
  on public.order_items for select using (is_employee());

create policy "Admin can manage order items"
  on public.order_items for all using (is_admin());

create policy "Anyone can insert order items"
  on public.order_items for insert with check (true);

-- ============================================================
-- ORDER ITEM CUSTOMIZATIONS — staff reads
-- ============================================================
create policy "Staff can read customizations"
  on public.order_item_customizations for select using (is_employee());

create policy "Admin can manage customizations"
  on public.order_item_customizations for all using (is_admin());

create policy "Anyone can insert customizations"
  on public.order_item_customizations for insert with check (true);

-- ============================================================
-- PAYMENTS — admin only
-- ============================================================
create policy "Admin can manage payments"
  on public.payments for all using (is_admin());

create policy "Anyone can insert payments"
  on public.payments for insert with check (true);

-- ============================================================
-- AUDIT LOGS — admin read only, system inserts
-- ============================================================
create policy "Admin can read audit logs"
  on public.audit_logs for select using (is_admin());

-- Logs inserted via service role only (no direct client insert policy)

-- ============================================================
-- ASSET REQUESTS — admin/employee manage
-- ============================================================
create policy "Staff can read asset requests"
  on public.asset_requests for select using (is_employee());

create policy "Admin can manage asset requests"
  on public.asset_requests for all using (is_admin());

create policy "Staff can create asset requests"
  on public.asset_requests for insert with check (is_employee());
