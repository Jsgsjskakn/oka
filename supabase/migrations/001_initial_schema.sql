-- ============================================================
-- Migration 001: Initial Schema
-- The Golden Oak — Phase 10.1
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- Enable required extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ============================================================
-- RESTAURANTS
-- ============================================================
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tagline text,
  description text,
  address text,
  phone text,
  email text,
  currency text not null default 'INR',
  timezone text not null default 'Asia/Kolkata',
  opening_hours text,
  rating numeric(3,1),
  review_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- RESTAURANT SETTINGS (key-value config)
-- ============================================================
create table if not exists public.restaurant_settings (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  key text not null,
  value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(restaurant_id, key)
);

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  restaurant_id uuid references public.restaurants(id) on delete set null,
  role text not null default 'customer' check (role in ('admin', 'employee', 'customer')),
  name text,
  phone text,
  email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- CATEGORIES
-- ============================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  slug text not null,
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(restaurant_id, slug)
);

create index if not exists idx_categories_restaurant on public.categories(restaurant_id);
create index if not exists idx_categories_active on public.categories(restaurant_id, is_active);

-- ============================================================
-- DISHES
-- ============================================================
create table if not exists public.dishes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  slug text not null,
  description text,
  price_paise integer not null check (price_paise >= 0),
  original_price_paise integer check (original_price_paise >= 0),
  image_url text,
  thumbnail_url text,
  is_veg boolean not null default true,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  is_best_seller boolean not null default false,
  spice_level text check (spice_level in ('mild', 'medium', 'hot', 'extra-hot')),
  calories integer,
  preparation_time text,
  allergens text[],
  has_3d_model boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(restaurant_id, slug)
);

create index if not exists idx_dishes_restaurant on public.dishes(restaurant_id);
create index if not exists idx_dishes_category on public.dishes(category_id);
create index if not exists idx_dishes_available on public.dishes(restaurant_id, is_available);
create index if not exists idx_dishes_featured on public.dishes(restaurant_id, is_featured);

-- ============================================================
-- INGREDIENTS
-- ============================================================
create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  is_allergen boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- DISH INGREDIENTS
-- ============================================================
create table if not exists public.dish_ingredients (
  id uuid primary key default gen_random_uuid(),
  dish_id uuid not null references public.dishes(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  is_removable boolean not null default false,
  sort_order integer not null default 0,
  unique(dish_id, ingredient_id)
);

create index if not exists idx_dish_ingredients_dish on public.dish_ingredients(dish_id);

-- ============================================================
-- DISH SIZES
-- ============================================================
create table if not exists public.dish_sizes (
  id uuid primary key default gen_random_uuid(),
  dish_id uuid not null references public.dishes(id) on delete cascade,
  name text not null,
  price_modifier_paise integer not null default 0,
  sort_order integer not null default 0
);

create index if not exists idx_dish_sizes_dish on public.dish_sizes(dish_id);

-- ============================================================
-- DISH ADDONS
-- ============================================================
create table if not exists public.dish_addons (
  id uuid primary key default gen_random_uuid(),
  dish_id uuid not null references public.dishes(id) on delete cascade,
  name text not null,
  price_paise integer not null default 0 check (price_paise >= 0),
  is_available boolean not null default true
);

create index if not exists idx_dish_addons_dish on public.dish_addons(dish_id);

-- ============================================================
-- DISH MODELS (3D/AR) — Developer managed
-- ============================================================
create table if not exists public.dish_models (
  id uuid primary key default gen_random_uuid(),
  dish_id uuid not null references public.dishes(id) on delete cascade,
  model_path text not null,
  initial_scale numeric not null default 1.0,
  initial_rotation_x numeric not null default 0,
  initial_rotation_y numeric not null default 0,
  initial_rotation_z numeric not null default 0,
  camera_distance numeric not null default 3.5,
  is_active boolean not null default true,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dish_models_dish on public.dish_models(dish_id);

-- ============================================================
-- DISH HOTSPOTS (AR ingredient markers) — Developer managed
-- ============================================================
create table if not exists public.dish_hotspots (
  id uuid primary key default gen_random_uuid(),
  dish_id uuid not null references public.dishes(id) on delete cascade,
  ingredient_id uuid references public.ingredients(id) on delete set null,
  label text not null,
  description text,
  pos_x numeric not null default 0,
  pos_y numeric not null default 0,
  pos_z numeric not null default 0,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_dish_hotspots_dish on public.dish_hotspots(dish_id);

-- ============================================================
-- TABLES (physical restaurant tables)
-- ============================================================
create table if not exists public.tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_number integer not null,
  capacity integer not null default 2,
  status text not null default 'available' check (status in ('available', 'booked', 'unavailable')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(restaurant_id, table_number)
);

create index if not exists idx_tables_restaurant on public.tables(restaurant_id);
create index if not exists idx_tables_status on public.tables(restaurant_id, status);

-- ============================================================
-- BOOKINGS
-- ============================================================
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_id uuid references public.tables(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  booking_date date not null,
  booking_time time not null,
  guests integer not null check (guests > 0),
  occasion text,
  table_preference text,
  special_requests text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  advance_amount_paise integer not null default 0,
  cancelled_at timestamptz,
  cancelled_by text,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bookings_restaurant on public.bookings(restaurant_id);
create index if not exists idx_bookings_date on public.bookings(restaurant_id, booking_date);
create index if not exists idx_bookings_status on public.bookings(restaurant_id, status);
create index if not exists idx_bookings_phone on public.bookings(customer_phone);

-- ============================================================
-- ORDERS
-- ============================================================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_id uuid references public.tables(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  order_type text not null check (order_type in ('dine-in', 'takeaway')),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  payment_method text not null check (payment_method in ('upi', 'cash')),
  pickup_time text,
  notes text,
  subtotal_paise integer not null default 0 check (subtotal_paise >= 0),
  tax_paise integer not null default 0 check (tax_paise >= 0),
  tip_paise integer not null default 0 check (tip_paise >= 0),
  total_paise integer not null default 0 check (total_paise >= 0),
  idempotency_key text unique,
  cancelled_at timestamptz,
  cancelled_by text,
  cancellation_reason text,
  processed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_restaurant on public.orders(restaurant_id);
create index if not exists idx_orders_status on public.orders(restaurant_id, status);
create index if not exists idx_orders_created on public.orders(restaurant_id, created_at desc);
create index if not exists idx_orders_phone on public.orders(customer_phone);
create index if not exists idx_orders_idempotency on public.orders(idempotency_key) where idempotency_key is not null;

-- ============================================================
-- ORDER ITEMS
-- ============================================================
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  dish_id uuid references public.dishes(id) on delete set null,
  dish_name text not null,
  dish_price_paise integer not null check (dish_price_paise >= 0),
  quantity integer not null check (quantity > 0),
  size_name text,
  size_price_modifier_paise integer not null default 0,
  special_instructions text,
  line_total_paise integer not null check (line_total_paise >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_order_items_dish on public.order_items(dish_id) where dish_id is not null;

-- ============================================================
-- ORDER ITEM CUSTOMIZATIONS
-- ============================================================
create table if not exists public.order_item_customizations (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  type text not null check (type in ('addon', 'removed_ingredient')),
  name text not null,
  price_paise integer not null default 0
);

-- ============================================================
-- PAYMENTS
-- ============================================================
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade,
  payment_method text not null check (payment_method in ('upi', 'cash')),
  amount_paise integer not null check (amount_paise >= 0),
  tip_paise integer not null default 0 check (tip_paise >= 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payments_order on public.payments(order_id) where order_id is not null;
create index if not exists idx_payments_booking on public.payments(booking_id) where booking_id is not null;

-- ============================================================
-- AUDIT LOGS
-- ============================================================
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id) on delete cascade,
  actor_id uuid,
  actor_role text,
  actor_name text,
  action text not null,
  entity_type text not null,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_restaurant on public.audit_logs(restaurant_id);
create index if not exists idx_audit_logs_created on public.audit_logs(created_at desc);
create index if not exists idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);

-- ============================================================
-- ASSET REQUESTS (developer workflow)
-- ============================================================
create table if not exists public.asset_requests (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  dish_id uuid references public.dishes(id) on delete set null,
  request_type text not null check (request_type in ('dish_image', '3d_model', 'ar_config', 'hotspots', 'asset_replacement', 'broken_asset')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  title text not null,
  description text,
  requested_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_asset_requests_restaurant on public.asset_requests(restaurant_id);
create index if not exists idx_asset_requests_status on public.asset_requests(status);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'restaurants', 'restaurant_settings', 'profiles',
    'categories', 'dishes', 'dish_models', 'tables',
    'bookings', 'orders', 'payments', 'asset_requests'
  ] loop
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function public.handle_updated_at()',
      tbl
    );
  end loop;
end
$$;

-- ============================================================
-- AUTO-CREATE PROFILE ON AUTH SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::text, 'customer')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
