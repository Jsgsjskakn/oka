# Dual-Backend Architecture & Switching Guide
## The Golden Oak: Convex Active Backend & Preserved Cold DR Fallback

This document details the architectural design of the dual-backend system implemented for *The Golden Oak* AR/VR Food Menu application, and explains how traffic routes between **Convex (Active Primary Backend)** and **Supabase (Preserved Cold DR Archive & Emergency Fallback)**.

---

## 1. Architectural Overview

```
                      [ Client / Browser ]
                                |
             +------------------+------------------+
             |                                     |
   [ Next.js SSR / Server Actions ]     [ Client React Components ]
             |                                     |
    (Dual-Route Service Layer)              (Convex React Hooks)
      * menu.service.ts                       * useQuery(api.orders.getActiveOrders)
      * order.service.ts                      * useQuery(api.orders.getOrderById)
      * booking.service.ts (Fail-Closed)
      * settings.service.ts
             |                                     |
     +-------+-------+                             |
     |               |                             |
     v               v                             v
[ Convex Cloud ]  [ Supabase (Cold DR) ]     [ Convex WebSocket ]
(Active Primary)  (Cold Archive / Fallback)   (Live real-time sync)
(Authoritative)   (NOT synced in real time)
```

### Key Principles:
1. **Active Primary Route:** All live queries, orders, bookings, menus, and configuration settings execute against Convex Cloud (`dev:tremendous-pony-619`). Live real-time UI synchronization is powered exclusively by Convex WebSockets.
2. **Cold Disaster Recovery Status (Supabase):** Supabase (`jimdmvzpmawbgzodzxhv`) is maintained strictly as a **Cold Disaster Recovery Archive & Emergency Fallback**. It is **NOT** synchronized in real time with Convex. There is no active CDC, continuous replication daemon, or dual-write pipeline keeping Supabase in lockstep with Convex.
3. **Fail-Closed vs. Fail-Open Boundaries:**
   - **Read-Mostly Data (Menu, Public Settings):** Gracefully degrades to Supabase or static fallback assets during an outage to keep the digital catalog visible.
   - **Emergency Orders:** Falls back to Supabase emergency write logging with strict idempotency keys, recording orders as an emergency buffer for post-outage reconciliation.
   - **Table Bookings & Availability:** **STRICTLY FAILS CLOSED**. Booking creation and availability checks do **NOT** fall back to Supabase. Because Supabase is a cold archive without real-time synchronization, falling back would evaluate stale data and cause catastrophic physical table double-bookings.
4. **Preservation Guarantee:** Supabase tables, migrations, RLS policies, auth records, and buckets were **never dropped, truncated, or modified destructively**, remaining intact for cold recovery.

---

## 2. Environment Variables Configuration

The application reads backend configuration from `.env.local`:

```bash
# ==============================================================================
# ACTIVE PRIMARY BACKEND: CONVEX CLOUD
# ==============================================================================
NEXT_PUBLIC_CONVEX_URL=https://tremendous-pony-619.ap-southeast-2.convex.cloud
CONVEX_DEPLOYMENT=dev:tremendous-pony-619

# ==============================================================================
# PRESERVED FALLBACK BACKEND: SUPABASE
# ==============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://jimdmvzpmawbgzodzxhv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

---

## 3. How Switching Works in Code

### A. Menu Service (`src/lib/services/menu.service.ts`)
- **Convex Query:** Calls `fetchQuery(api.menu.getCategories)` and `fetchQuery(api.menu.getAllDishes)`.
- **Fallback:** If Convex fails or returns empty during cold startup, it falls back to `db.from('categories')` / `db.from('dishes')`, and finally to static mock fixtures if both are unreachable.

### B. Order Service (`src/lib/services/order.service.ts`)
- **Convex Mutation:** Calls `fetchMutation(api.orders.placeOrder, ...)` with automatic price validation against dishes stored in Convex.
- **Client Realtime:** Kitchen dashboard (`OrdersDashboard.tsx`) and Customer Tracker (`OrderStatusSummary.tsx`) subscribe to `api.orders.getActiveOrders` and `api.orders.getOrderById` via Convex WebSocket channels (replacing fragile Supabase Postgres CDC subscriptions).
- **Emergency Fallback:** If Convex fails, mutations route to Supabase `orders` and `order_items` tables as an emergency write buffer. These emergency orders must be reconciled back to Convex upon recovery (see `docs/BACKEND_AUTHORITY_AND_DISASTER_RECOVERY.md`).

### C. Booking Service (`src/lib/services/booking.service.ts`)
- **Convex Mutation & Query:** Calls `fetchMutation(api.bookings.createBooking, ...)` and `fetchQuery(api.bookings.checkAvailability, ...)`.
- **Validation:** Automatic check for guest counts, slot overlaps, table capacity, and default advance fees stored in `restaurant_settings`.
- **Fail-Closed Protection:** Table availability checks and new booking creations **fail closed** when Convex is offline. They do **NOT** fall back to Supabase. Because Supabase is a cold DR archive without real-time synchronization, querying or inserting into Supabase would evaluate stale availability and cause physical double-bookings on the restaurant floor.
- **Read Fallback:** Historical booking lookups by phone (`getBookingsByPhone`) or admin historical listing (`getAllBookings`) gracefully query Supabase as a read fallback if Convex is unreachable.

---

## 4. How to Force Run in Supabase-Only Mode (Emergency Disaster Recovery)

If you ever need to disable Convex and force the application to operate in Supabase-only mode during an extended Convex disaster recovery event:

1. In `.env.local`, temporarily comment out or rename `NEXT_PUBLIC_CONVEX_URL`:
   ```bash
   # NEXT_PUBLIC_CONVEX_URL=https://tremendous-pony-619.ap-southeast-2.convex.cloud
   ```
2. The service layer (`menu.service.ts`, `order.service.ts`, `settings.service.ts`) detects that the Convex client is unconfigured or returns an error, and diverts reads and emergency order writes to Supabase without crashing.
3. **Important DR Constraint:** Because Supabase is a cold archive and not real-time synchronized, bookings will remain fail-closed until an administrator executes the data reconciliation procedure detailed in `docs/BACKEND_AUTHORITY_AND_DISASTER_RECOVERY.md`.
4. To re-enable Convex, simply restore `NEXT_PUBLIC_CONVEX_URL` and execute the post-outage reconciliation runbook.
