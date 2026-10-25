-- ============================================================
-- Migration 003: Seed Data
-- The Golden Oak — Phase 10.1
-- Run AFTER 001 and 002
-- ============================================================

-- ============================================================
-- RESTAURANT
-- ============================================================
insert into public.restaurants (id, name, tagline, description, address, phone, email, currency, timezone, opening_hours, rating, review_count)
values (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'The Golden Oak',
  'Gourmet Indian Fusion & Artisanal Dining',
  'Experience luxury dining with premium Indian fusion flavors, hand-stretched wood-fired pizzas, handcrafted burgers, and signature street fare made from organic local ingredients.',
  '45 Golden Oak Boulevard, Indiranagar, Bengaluru, Karnataka 560038',
  '+91 98765 43210',
  'concierge@thegoldenoak.in',
  'INR',
  'Asia/Kolkata',
  '12:00 PM - 11:30 PM (Daily)',
  4.8,
  1240
) on conflict (id) do nothing;

-- ============================================================
-- RESTAURANT SETTINGS
-- ============================================================
insert into public.restaurant_settings (restaurant_id, key, value) values
  ('a1b2c3d4-0000-0000-0000-000000000001', 'customer_cancellation_enabled', 'false'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'cancellation_window_minutes', '10'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'advance_booking_amount_paise', '50000'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'tax_rate_percent', '5'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'tip_presets_percent', '[10, 15, 20]')
on conflict (restaurant_id, key) do nothing;

-- ============================================================
-- CATEGORIES
-- ============================================================
insert into public.categories (id, restaurant_id, name, slug, icon, sort_order, is_active) values
  ('c470000-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'Pizzas',   'pizza',    'pizza',       1, true),
  ('c470000-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'Burgers',  'burger',   'burger',      2, true),
  ('c470000-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'Chinese',  'chinese',  'utensils',    3, true),
  ('c470000-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'Starters', 'starters', 'flame',       4, true),
  ('c470000-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'Desserts', 'desserts', 'ice-cream',   5, false),
  ('c470000-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'Drinks',   'drinks',   'coffee',      6, false)
on conflict (restaurant_id, slug) do nothing;

-- ============================================================
-- DISHES (price in paise: 1 ₹ = 100 paise)
-- ============================================================
insert into public.dishes (id, restaurant_id, category_id, name, slug, description, price_paise, original_price_paise, image_url, is_veg, is_available, is_featured, is_best_seller, spice_level, calories, preparation_time, allergens, has_3d_model, sort_order) values

-- PIZZAS (5)
('d15400-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'c470000-0000-0000-0000-000000000001',
 'Tandoori Paneer Pizza', 'tandoori-paneer-pizza',
 'Charcoal-grilled cottage cheese marinated in aromatic spices, topped with bell peppers, smoked mozzarella, and signature makhani glaze on artisan sourdough crust.',
 44900, 49900, '/images/dishes/placeholder.jpg',
 true, true, true, true, 'medium', 780, '20-25 mins', ARRAY['Dairy', 'Gluten'], true, 1),

('d15400-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'c470000-0000-0000-0000-000000000001',
 'Chicken Tikka Pizza', 'chicken-tikka-pizza',
 'Tandoor-smoked chicken tikka with pickled onions, aged cheddar, and smoky mint chutney drizzle on stone-baked base.',
 49900, null, '/images/dishes/placeholder.jpg',
 false, true, true, true, 'medium', 850, '22-28 mins', ARRAY['Dairy', 'Gluten'], true, 2),

('d15400-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'c470000-0000-0000-0000-000000000001',
 'Mushroom Truffle Pizza', 'mushroom-truffle-pizza',
 'Wild mushroom medley with black truffle oil, aged parmesan, fresh thyme, and buffalo mozzarella on a thin artisan base.',
 54900, null, '/images/dishes/placeholder.jpg',
 true, true, true, false, 'mild', 720, '20-25 mins', ARRAY['Dairy', 'Gluten'], false, 3),

('d15400-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'c470000-0000-0000-0000-000000000001',
 'Peri Peri Fiesta Pizza', 'peri-peri-fiesta-pizza',
 'Spicy peri peri sauce base with roasted capsicum, corn, black olives, and a fresh herb salsa topping.',
 42900, null, '/images/dishes/placeholder.jpg',
 true, true, false, false, 'hot', 760, '20-25 mins', ARRAY['Gluten'], false, 4),

('d15400-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'c470000-0000-0000-0000-000000000001',
 'BBQ Chicken Overload', 'bbq-chicken-overload',
 'Slow-cooked BBQ chicken with caramelized onions, smoked bacon bits, jalapeños, and house BBQ sauce.',
 52900, null, '/images/dishes/placeholder.jpg',
 false, true, false, true, 'hot', 920, '22-28 mins', ARRAY['Dairy', 'Gluten'], false, 5),

-- BURGERS (3)
('d15400-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'c470000-0000-0000-0000-000000000001',
 'Golden Oak Signature Burger', 'golden-oak-signature-burger',
 'Premium wagyu beef patty with truffle aioli, aged cheddar, caramelized onions, and house-pickled cucumbers on a toasted brioche bun.',
 42900, null, '/images/dishes/placeholder.jpg',
 false, true, true, true, 'mild', 890, '15-20 mins', ARRAY['Dairy', 'Gluten', 'Egg'], true, 1),

('d15400-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'c470000-0000-0000-0000-000000000001',
 'Classic Smash Burger', 'classic-smash-burger',
 'Double smashed beef patties with American cheese, shredded lettuce, pickles, and signature smash sauce.',
 29900, null, '/images/dishes/placeholder.jpg',
 false, true, false, true, 'mild', 820, '12-15 mins', ARRAY['Dairy', 'Gluten'], false, 2),

('d15400-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'c470000-0000-0000-0000-000000000001',
 'Crispy Paneer Burger', 'crispy-paneer-burger',
 'Golden-fried paneer cutlet with mint chutney, coleslaw, and sweet chilli glaze on a sesame brioche bun.',
 28900, null, '/images/dishes/placeholder.jpg',
 true, true, false, false, 'medium', 740, '12-15 mins', ARRAY['Dairy', 'Gluten'], false, 3),

-- CHINESE (1)
('d15400-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'c470000-0000-0000-0000-000000000001',
 'Wok-Tossed Chow Mein', 'wok-tossed-chow-mein',
 'Hand-pulled egg noodles wok-tossed with seasonal vegetables, soy-ginger sauce, toasted sesame, and crispy spring onions.',
 28900, null, '/images/dishes/placeholder.jpg',
 true, true, false, true, 'medium', 620, '12-15 mins', ARRAY['Gluten', 'Soy'], false, 1),

-- STARTERS (1)
('d15400-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'c470000-0000-0000-0000-000000000001',
 'Dynamite Chilli Potatoes', 'dynamite-chilli-potatoes',
 'Crispy baby potatoes tossed in a fiery dynamite sauce with bell peppers, spring onion, and toasted sesame garnish.',
 24900, null, '/images/dishes/placeholder.jpg',
 true, true, false, true, 'hot', 540, '10-12 mins', null, false, 1)

on conflict (restaurant_id, slug) do nothing;

-- ============================================================
-- DISH SIZES (for pizzas)
-- ============================================================
insert into public.dish_sizes (dish_id, name, price_modifier_paise, sort_order) values
-- Tandoori Paneer Pizza
('d15400-0000-0000-0000-000000000001', 'Small (8")',   -5000, 1),
('d15400-0000-0000-0000-000000000001', 'Medium (10")',      0, 2),
('d15400-0000-0000-0000-000000000001', 'Large (12")',  15000, 3),
-- Chicken Tikka Pizza
('d15400-0000-0000-0000-000000000001', 'Small (8")',   -5000, 1),
('d15400-0000-0000-0000-000000000001', 'Medium (10")',      0, 2),
('d15400-0000-0000-0000-000000000001', 'Large (12")',  15000, 3),
-- Mushroom Truffle
('d15400-0000-0000-0000-000000000001', 'Small (8")',   -5000, 1),
('d15400-0000-0000-0000-000000000001', 'Medium (10")',      0, 2),
('d15400-0000-0000-0000-000000000001', 'Large (12")',  15000, 3);

-- ============================================================
-- DISH ADDONS
-- ============================================================
insert into public.dish_addons (dish_id, name, price_paise) values
('d15400-0000-0000-0000-000000000001', 'Extra Cheese',    5000),
('d15400-0000-0000-0000-000000000001', 'Jalapeños',       4000),
('d15400-0000-0000-0000-000000000001', 'Extra Cheese',    5000),
('d15400-0000-0000-0000-000000000001', 'Extra Chicken',   8000),
('d15400-0000-0000-0000-000000000001', 'Extra Patty',    12000),
('d15400-0000-0000-0000-000000000001', 'Bacon',           6000),
('d15400-0000-0000-0000-000000000001', 'Extra Patty',    10000),
('d15400-0000-0000-0000-000000000001', 'Extra Cheese',    4000);

-- ============================================================
-- DISH MODELS (3D) — 3 dishes have models
-- ============================================================
insert into public.dish_models (dish_id, model_path, initial_scale, initial_rotation_x, initial_rotation_y, initial_rotation_z, camera_distance, is_active, version) values
('d15400-0000-0000-0000-000000000001', '/models/tandoori-paneer-pizza.glb',   2.5, 0, 0, 0, 3.5, true, 1),
('d15400-0000-0000-0000-000000000001', '/models/chicken-tikka-pizza.glb',     2.5, 0, 0, 0, 3.5, true, 1),
('d15400-0000-0000-0000-000000000001', '/models/golden-oak-burger.glb',       2.5, 0, 0, 0, 3.0, true, 1);

-- ============================================================
-- DISH HOTSPOTS (AR ingredient labels)
-- ============================================================
insert into public.dish_hotspots (dish_id, label, description, pos_x, pos_y, pos_z, is_active, sort_order) values
-- Tandoori Paneer Pizza
('d15400-0000-0000-0000-000000000001', 'Tandoori Paneer',  'Charcoal-grilled cottage cheese with aromatic spices',  0.3,  0.15,  0.1,  true, 1),
('d15400-0000-0000-0000-000000000001', 'Smoked Mozzarella','Artisan smoked mozzarella, melted to perfection',       -0.2, 0.12, -0.25, true, 2),
('d15400-0000-0000-0000-000000000001', 'Makhani Glaze',    'Signature creamy butter sauce glaze',                   0.0,  0.1,   0.3,  true, 3),
('d15400-0000-0000-0000-000000000001', 'Bell Peppers',     'Fresh tri-color bell peppers, thinly sliced',          -0.35, 0.13,  0.15, true, 4),
-- Chicken Tikka Pizza
('d15400-0000-0000-0000-000000000001', 'Chicken Tikka',    'Tandoor-smoked chicken in yogurt marinade',             0.25, 0.14, -0.1,  true, 1),
('d15400-0000-0000-0000-000000000001', 'Aged Cheddar',     'Sharp aged cheddar with mozzarella blend',             -0.15, 0.12,  0.2,  true, 2),
('d15400-0000-0000-0000-000000000001', 'Pickled Onions',   'House-pickled red onion rings',                         0.1,  0.13,  0.35, true, 3),
-- Signature Burger
('d15400-0000-0000-0000-000000000001', 'Wagyu Patty',      'Premium wagyu beef, flame-grilled',                     0.0,  0.15,  0.0,  true, 1),
('d15400-0000-0000-0000-000000000001', 'Truffle Aioli',    'Black truffle and garlic aioli',                        0.2,  0.25,  0.1,  true, 2),
('d15400-0000-0000-0000-000000000001', 'Brioche Bun',      'Toasted artisan brioche bun',                           0.0,  0.35,  0.0,  true, 3);

-- ============================================================
-- TABLES (15 total: 10 x capacity 2, 5 x capacity 4)
-- ============================================================
insert into public.tables (restaurant_id, table_number, capacity, status) values
('a1b2c3d4-0000-0000-0000-000000000001', 1,  2, 'available'),
('a1b2c3d4-0000-0000-0000-000000000001', 2,  2, 'available'),
('a1b2c3d4-0000-0000-0000-000000000001', 3,  2, 'available'),
('a1b2c3d4-0000-0000-0000-000000000001', 4,  2, 'available'),
('a1b2c3d4-0000-0000-0000-000000000001', 5,  2, 'available'),
('a1b2c3d4-0000-0000-0000-000000000001', 6,  2, 'available'),
('a1b2c3d4-0000-0000-0000-000000000001', 7,  2, 'available'),
('a1b2c3d4-0000-0000-0000-000000000001', 8,  2, 'available'),
('a1b2c3d4-0000-0000-0000-000000000001', 9,  2, 'available'),
('a1b2c3d4-0000-0000-0000-000000000001', 10, 2, 'available'),
('a1b2c3d4-0000-0000-0000-000000000001', 11, 4, 'available'),
('a1b2c3d4-0000-0000-0000-000000000001', 12, 4, 'available'),
('a1b2c3d4-0000-0000-0000-000000000001', 13, 4, 'available'),
('a1b2c3d4-0000-0000-0000-000000000001', 14, 4, 'available'),
('a1b2c3d4-0000-0000-0000-000000000001', 15, 4, 'available')
on conflict (restaurant_id, table_number) do nothing;
