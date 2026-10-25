-- Migration 005: Fix Seed Data and Booking Duration
-- Deletes broken seed data and reinserts with unique UUIDs
-- Adds booking_end_time to bookings and updates confirm_booking

-- Part A: Fix the UUID collision bug

-- 1. DELETE existing broken seed data
-- Using cascade to remove dependent records in dish_sizes, dish_addons, etc.
DELETE FROM public.categories WHERE restaurant_id = 'a1b2c3d4-0000-0000-0000-000000000001';
DELETE FROM public.dishes WHERE restaurant_id = 'a1b2c3d4-0000-0000-0000-000000000001';

-- Re-insert categories with UNIQUE UUIDs
insert into public.categories (id, restaurant_id, name, slug, icon, sort_order, is_active) values
  ('c4700001-0001-4000-8000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'Pizzas',   'pizza',    'pizza',       1, true),
  ('c4700001-0002-4000-8000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001', 'Burgers',  'burger',   'burger',      2, true),
  ('c4700001-0003-4000-8000-000000000003', 'a1b2c3d4-0000-0000-0000-000000000001', 'Chinese',  'chinese',  'utensils',    3, true),
  ('c4700001-0004-4000-8000-000000000004', 'a1b2c3d4-0000-0000-0000-000000000001', 'Starters', 'starters', 'flame',       4, true),
  ('c4700001-0005-4000-8000-000000000005', 'a1b2c3d4-0000-0000-0000-000000000001', 'Desserts', 'desserts', 'ice-cream',   5, false),
  ('c4700001-0006-4000-8000-000000000006', 'a1b2c3d4-0000-0000-0000-000000000001', 'Drinks',   'drinks',   'coffee',      6, false);

-- Re-insert dishes with UNIQUE UUIDs and correct category_id
insert into public.dishes (id, restaurant_id, category_id, name, slug, description, price_paise, original_price_paise, image_url, is_veg, is_available, is_featured, is_best_seller, spice_level, calories, preparation_time, allergens, has_3d_model, sort_order) values

-- PIZZAS (5)
('d1540001-0001-4000-8000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'c4700001-0001-4000-8000-000000000001',
 'Tandoori Paneer Pizza', 'tandoori-paneer-pizza',
 'Charcoal-grilled cottage cheese marinated in aromatic spices, topped with bell peppers, smoked mozzarella, and signature makhani glaze on artisan sourdough crust.',
 44900, 49900, '/images/dishes/placeholder.jpg',
 true, true, true, true, 'medium', 780, '20-25 mins', ARRAY['Dairy', 'Gluten'], true, 1),

('d1540001-0002-4000-8000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001', 'c4700001-0001-4000-8000-000000000001',
 'Chicken Tikka Pizza', 'chicken-tikka-pizza',
 'Tandoor-smoked chicken tikka with pickled onions, aged cheddar, and smoky mint chutney drizzle on stone-baked base.',
 49900, null, '/images/dishes/placeholder.jpg',
 false, true, true, true, 'medium', 850, '22-28 mins', ARRAY['Dairy', 'Gluten'], true, 2),

('d1540001-0003-4000-8000-000000000003', 'a1b2c3d4-0000-0000-0000-000000000001', 'c4700001-0001-4000-8000-000000000001',
 'Mushroom Truffle Pizza', 'mushroom-truffle-pizza',
 'Wild mushroom medley with black truffle oil, aged parmesan, fresh thyme, and buffalo mozzarella on a thin artisan base.',
 54900, null, '/images/dishes/placeholder.jpg',
 true, true, true, false, 'mild', 720, '20-25 mins', ARRAY['Dairy', 'Gluten'], false, 3),

('d1540001-0004-4000-8000-000000000004', 'a1b2c3d4-0000-0000-0000-000000000001', 'c4700001-0001-4000-8000-000000000001',
 'Peri Peri Fiesta Pizza', 'peri-peri-fiesta-pizza',
 'Spicy peri peri sauce base with roasted capsicum, corn, black olives, and a fresh herb salsa topping.',
 42900, null, '/images/dishes/placeholder.jpg',
 true, true, false, false, 'hot', 760, '20-25 mins', ARRAY['Gluten'], false, 4),

('d1540001-0005-4000-8000-000000000005', 'a1b2c3d4-0000-0000-0000-000000000001', 'c4700001-0001-4000-8000-000000000001',
 'BBQ Chicken Overload', 'bbq-chicken-overload',
 'Slow-cooked BBQ chicken with caramelized onions, smoked bacon bits, jalapeños, and house BBQ sauce.',
 52900, null, '/images/dishes/placeholder.jpg',
 false, true, false, true, 'hot', 920, '22-28 mins', ARRAY['Dairy', 'Gluten'], false, 5),

-- BURGERS (3)
('d1540001-0006-4000-8000-000000000006', 'a1b2c3d4-0000-0000-0000-000000000001', 'c4700001-0002-4000-8000-000000000002',
 'Golden Oak Signature Burger', 'golden-oak-signature-burger',
 'Premium wagyu beef patty with truffle aioli, aged cheddar, caramelized onions, and house-pickled cucumbers on a toasted brioche bun.',
 42900, null, '/images/dishes/placeholder.jpg',
 false, true, true, true, 'mild', 890, '15-20 mins', ARRAY['Dairy', 'Gluten', 'Egg'], true, 1),

('d1540001-0007-4000-8000-000000000007', 'a1b2c3d4-0000-0000-0000-000000000001', 'c4700001-0002-4000-8000-000000000002',
 'Classic Smash Burger', 'classic-smash-burger',
 'Double smashed beef patties with American cheese, shredded lettuce, pickles, and signature smash sauce.',
 29900, null, '/images/dishes/placeholder.jpg',
 false, true, false, true, 'mild', 820, '12-15 mins', ARRAY['Dairy', 'Gluten'], false, 2),

('d1540001-0008-4000-8000-000000000008', 'a1b2c3d4-0000-0000-0000-000000000001', 'c4700001-0002-4000-8000-000000000002',
 'Crispy Paneer Burger', 'crispy-paneer-burger',
 'Golden-fried paneer cutlet with mint chutney, coleslaw, and sweet chilli glaze on a sesame brioche bun.',
 28900, null, '/images/dishes/placeholder.jpg',
 true, true, false, false, 'medium', 740, '12-15 mins', ARRAY['Dairy', 'Gluten'], false, 3),

-- CHINESE (1)
('d1540001-0009-4000-8000-000000000009', 'a1b2c3d4-0000-0000-0000-000000000001', 'c4700001-0003-4000-8000-000000000003',
 'Wok-Tossed Chow Mein', 'wok-tossed-chow-mein',
 'Hand-pulled egg noodles wok-tossed with seasonal vegetables, soy-ginger sauce, toasted sesame, and crispy spring onions.',
 28900, null, '/images/dishes/placeholder.jpg',
 true, true, false, true, 'medium', 620, '12-15 mins', ARRAY['Gluten', 'Soy'], false, 1),

-- STARTERS (1)
('d1540001-000a-4000-8000-00000000000a', 'a1b2c3d4-0000-0000-0000-000000000001', 'c4700001-0004-4000-8000-000000000004',
 'Dynamite Chilli Potatoes', 'dynamite-chilli-potatoes',
 'Crispy baby potatoes tossed in a fiery dynamite sauce with bell peppers, spring onion, and toasted sesame garnish.',
 24900, null, '/images/dishes/placeholder.jpg',
 true, true, false, true, 'hot', 540, '10-12 mins', null, false, 1);

-- DISH SIZES (for pizzas)
insert into public.dish_sizes (dish_id, name, price_modifier_paise, sort_order) values
-- Tandoori Paneer Pizza
('d1540001-0001-4000-8000-000000000001', 'Small (8")',   -5000, 1),
('d1540001-0001-4000-8000-000000000001', 'Medium (10")',      0, 2),
('d1540001-0001-4000-8000-000000000001', 'Large (12")',  15000, 3),
-- Chicken Tikka Pizza
('d1540001-0002-4000-8000-000000000002', 'Small (8")',   -5000, 1),
('d1540001-0002-4000-8000-000000000002', 'Medium (10")',      0, 2),
('d1540001-0002-4000-8000-000000000002', 'Large (12")',  15000, 3),
-- Mushroom Truffle
('d1540001-0003-4000-8000-000000000003', 'Small (8")',   -5000, 1),
('d1540001-0003-4000-8000-000000000003', 'Medium (10")',      0, 2),
('d1540001-0003-4000-8000-000000000003', 'Large (12")',  15000, 3);

-- DISH ADDONS
insert into public.dish_addons (dish_id, name, price_paise) values
('d1540001-0001-4000-8000-000000000001', 'Extra Cheese',    5000),
('d1540001-0001-4000-8000-000000000001', 'Jalapeños',       4000),
('d1540001-0002-4000-8000-000000000002', 'Extra Cheese',    5000),
('d1540001-0002-4000-8000-000000000002', 'Extra Chicken',   8000),
('d1540001-0006-4000-8000-000000000006', 'Extra Patty',    12000),
('d1540001-0006-4000-8000-000000000006', 'Bacon',           6000),
('d1540001-0007-4000-8000-000000000007', 'Extra Patty',    10000),
('d1540001-0007-4000-8000-000000000007', 'Extra Cheese',    4000);

-- DISH MODELS (3D)
insert into public.dish_models (dish_id, model_path, initial_scale, initial_rotation_x, initial_rotation_y, initial_rotation_z, camera_distance, is_active, version) values
('d1540001-0001-4000-8000-000000000001', '/models/tandoori-paneer-pizza.glb',   2.5, 0, 0, 0, 3.5, true, 1),
('d1540001-0002-4000-8000-000000000002', '/models/chicken-tikka-pizza.glb',     2.5, 0, 0, 0, 3.5, true, 1),
('d1540001-0006-4000-8000-000000000006', '/models/golden-oak-burger.glb',       2.5, 0, 0, 0, 3.0, true, 1);

-- DISH HOTSPOTS
insert into public.dish_hotspots (dish_id, label, description, pos_x, pos_y, pos_z, is_active, sort_order) values
-- Tandoori Paneer Pizza
('d1540001-0001-4000-8000-000000000001', 'Tandoori Paneer',  'Charcoal-grilled cottage cheese with aromatic spices',  0.3,  0.15,  0.1,  true, 1),
('d1540001-0001-4000-8000-000000000001', 'Smoked Mozzarella','Artisan smoked mozzarella, melted to perfection',       -0.2, 0.12, -0.25, true, 2),
('d1540001-0001-4000-8000-000000000001', 'Makhani Glaze',    'Signature creamy butter sauce glaze',                   0.0,  0.1,   0.3,  true, 3),
('d1540001-0001-4000-8000-000000000001', 'Bell Peppers',     'Fresh tri-color bell peppers, thinly sliced',          -0.35, 0.13,  0.15, true, 4),
-- Chicken Tikka Pizza
('d1540001-0002-4000-8000-000000000002', 'Chicken Tikka',    'Tandoor-smoked chicken in yogurt marinade',             0.25, 0.14, -0.1,  true, 1),
('d1540001-0002-4000-8000-000000000002', 'Aged Cheddar',     'Sharp aged cheddar with mozzarella blend',             -0.15, 0.12,  0.2,  true, 2),
('d1540001-0002-4000-8000-000000000002', 'Pickled Onions',   'House-pickled red onion rings',                         0.1,  0.13,  0.35, true, 3),
-- Signature Burger
('d1540001-0006-4000-8000-000000000006', 'Wagyu Patty',      'Premium wagyu beef, flame-grilled',                     0.0,  0.15,  0.0,  true, 1),
('d1540001-0006-4000-8000-000000000006', 'Truffle Aioli',    'Black truffle and garlic aioli',                        0.2,  0.25,  0.1,  true, 2),
('d1540001-0006-4000-8000-000000000006', 'Brioche Bun',      'Toasted artisan brioche bun',                           0.0,  0.35,  0.0,  true, 3);

-- Part B: Add booking duration support
alter table public.bookings add column if not exists booking_end_time time;

-- Part C: Update confirm_booking() function
create or replace function public.confirm_booking(
  p_booking_id uuid,
  p_payment_method text,
  p_reference text default null
)
returns jsonb as $$
declare
  v_booking public.bookings%rowtype;
  v_table_id uuid;
  v_payment_id uuid;
begin
  -- Get booking with lock
  select * into v_booking from public.bookings
  where id = p_booking_id for update;
  
  if not found then
    return jsonb_build_object('error', 'Booking not found');
  end if;
  
  if v_booking.status != 'pending' then
    return jsonb_build_object('error', 'Booking is not in pending state');
  end if;
  
  -- Find available table for date+time+capacity
  select t.id into v_table_id
  from public.tables t
  where t.restaurant_id = v_booking.restaurant_id
    and t.capacity >= v_booking.guests
    and t.status = 'available'
    and t.id not in (
      select b2.table_id from public.bookings b2
      where b2.table_id is not null
        and b2.status = 'confirmed'
        and b2.booking_date = v_booking.booking_date
        and (
          (v_booking.booking_end_time is not null and b2.booking_time < v_booking.booking_end_time and coalesce(b2.booking_end_time, b2.booking_time + interval '2 hours') > v_booking.booking_time)
          or
          (v_booking.booking_end_time is null and abs(extract(epoch from (b2.booking_time::time - v_booking.booking_time::time))) < 7200)
        )
        and b2.id != p_booking_id
    )
  order by t.capacity asc
  limit 1;
  
  -- Update booking
  update public.bookings set
    status = 'confirmed',
    payment_status = 'paid',
    table_id = v_table_id,
    updated_at = now()
  where id = p_booking_id;
  
  -- Mark table as booked if assigned
  if v_table_id is not null then
    update public.tables set status = 'booked', updated_at = now()
    where id = v_table_id;
  end if;
  
  -- Insert payment record
  insert into public.payments (booking_id, payment_method, amount_paise, tip_paise, status, reference)
  values (p_booking_id, p_payment_method, v_booking.advance_amount_paise, 0, 'paid', p_reference)
  returning id into v_payment_id;
  
  return jsonb_build_object(
    'success', true,
    'tableId', v_table_id,
    'paymentId', v_payment_id
  );
end;
$$ language plpgsql security definer;
