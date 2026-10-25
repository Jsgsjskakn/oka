# Supabase to Convex Migration: Inventory Audit

> Generated: 2026-10-25
> Project: The Golden Oak (Next.js 16 + React 19 + TypeScript)
> Primary Target: Convex (`dev:tremendous-pony-619`)
> Fallback: Supabase (`jimdmvzpmawbgzodzxhv` - Cold DR Archive, not synced in real time)

---

## 1. Environment & Stack Inventory

| Component | Current Stack | Migration Target | Notes |
|---|---|---|---|
| Frontend Framework | Next.js 16.3.0 (App Router) | Next.js 16.3.0 | Unchanged |
| UI Library | React 19.2.8 | React 19.2.8 | Supported by Convex React client |
| Styling | Tailwind CSS 4 | Tailwind CSS 4 | Unchanged |
| 3D / AR | Three.js + @react-three/fiber + @react-three/drei | Three.js | Models in `/public/models/*.glb` |
| State Management | Zustand 5.0.14 | Zustand + Convex Hooks | Unchanged |
| Active Backend | Supabase (`@supabase/ssr`, `@supabase/supabase-js`) | Convex (`convex` 1.48.0) | Migrating active traffic |
| Fallback Backend | Supabase | Supabase (Cold DR Archive) | Preserved, NOT real-time synced |

---

## 2. Supabase Tables & Schema Inventory

From `001_initial_schema.sql`, `006_phase10_fixes.sql`, `007_employee_management.sql`:

| Table Name | Primary Purpose | Key Fields | Convex Destination Table |
|---|---|---|---|
| `restaurants` | Restaurant branding & metadata | id, name, tagline, address, phone, email | `restaurants` |
| `restaurant_settings` | Key-value settings (tax, timings) | restaurant_id, key, value | `restaurant_settings` |
| `categories` | Menu categories | id, name, slug, icon, sort_order, is_active | `categories` |
| `dishes` | Food items & 3D flags | id, category_id, name, slug, price_paise, is_veg, has_3d_model | `dishes` |
| `dish_sizes` | Size modifiers | dish_id, name, price_modifier_paise | Embedded in `dishes.sizes` / `dish_sizes` |
| `dish_addons` | Extra toppings / add-ons | dish_id, name, price_paise | Embedded in `dishes.addons` / `dish_addons` |
| `dish_models` | 3D GLB model paths & configs | dish_id, model_path, initial_scale | Embedded in `dishes` / `dish_models` |
| `dish_hotspots` | 3D AR annotation hotspots | dish_id, title, description, position | `dish_hotspots` |
| `tables` | Physical dining tables | restaurant_id, table_number, capacity, status | `tables` |
| `bookings` | Table reservations | customer_name, customer_phone, date, time, guests, status | `bookings` |
| `orders` | Dine-in & Takeaway orders | customer_name, customer_phone, status, total_paise, type | `orders` |
| `order_items` | Individual items in order | order_id, dish_id, quantity, line_total_paise | `order_items` (or embedded) |
| `order_item_customizations` | Item add-ons / instructions | order_item_id, name, price_paise | Embedded in `order_items` |
| `payments` | Settlement records (cash/UPI) | order_id, booking_id, amount_paise, status | `payments` |
| `profiles` | User profiles & roles | id, role (admin/employee/customer), name, email | `profiles` |
| `employees` | Staff roster & auth link | id, auth_id, name, role, email, phone | `employees` |
| `audit_logs` | Security & operational logs | actor_name, action, entity_type, entity_id | `audit_logs` |
| `asset_requests` | 3D model / image requests | dish_id, request_type, status | `asset_requests` |

---

## 3. Storage Assets Inventory

- **3D Models:** Stored locally in `public/models/`:
  - `chicken-tikka-pizza.glb`
  - `classic-smash-burger.glb`
  - `golden-oak-burger.glb`
  - `tandoori-paneer-pizza.glb`
  - `warrior_model.glb`
- **Dish Images:** Stored locally in `public/images/dishes/` (`.webp` / `.jpg`).
- **Supabase Storage Dependency:** None required for core dishes; local assets are fast, offline-capable, and zero-cost.

---

## 4. Codebase Supabase Call Site Inventory (49 Files)

1. `src/lib/supabase/client.ts` — Browser anon client
2. `src/lib/supabase/server.ts` — Server cookie client
3. `src/lib/supabase/admin.ts` — Privileged service role client
4. `src/lib/supabase/typed.ts` — Query helper
5. `src/middleware.ts` — Session refresh
6. `src/lib/services/menu.service.ts` — Category & dish queries
7. `src/lib/services/order.service.ts` — Order placement & fetching
8. `src/lib/services/booking.service.ts` — Booking queries & availability
9. `src/lib/services/employee.service.ts` — Staff management
10. `src/lib/services/settings.service.ts` — Key/value configs
11. `src/lib/services/analytics.service.ts` — Sales analytics
12. `src/lib/actions/order-actions.ts` — Server actions
13. `src/lib/actions/booking-actions.ts` — Booking actions
14. `src/lib/actions/employee-actions.ts` — Password setup & staff management
15. `src/lib/auth/admin-auth.ts` — `requireAdmin`, `requireStaff`
16. `src/lib/auth/employee-auth.ts` — `requireEmployee`
17. `src/components/employee/OrdersDashboard.tsx` — Realtime orders dashboard
18. `src/components/checkout/OrderStatusSummary.tsx` — Realtime single order status
19. `src/components/employee/EmployeeRealtimeStatus.tsx` — Ping channel
20. `src/app/order/success/page.tsx` — Success confirmation
21. All admin & employee routes (`src/app/admin/*`, `src/app/employee/*`)
22. Customer auth routes (`src/app/auth/*`, `src/app/profile/*`)
