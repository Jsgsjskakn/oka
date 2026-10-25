# The Golden Oak — AR/VR Food Menu & Restaurant Management Platform

An immersive dining and restaurant operations platform featuring **WebXR/Three.js 3D Augmented Reality food models**, live customer order tracking, real-time kitchen display systems, and robust table reservation management.

---

## 🏛️ System Architecture

*The Golden Oak* implements an active reactive cloud architecture backed by an emergency disaster recovery archive:

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

### 1. Active Authoritative Backend: Convex Cloud
- **Deployment:** `dev:tremendous-pony-619`
- **Role:** Sole authoritative system of record for all active production state.
- **Features:** 100% end-to-end TypeScript schema, sub-50ms reactive queries, WebSocket live push to kitchen displays, automatic transactional mutations with atomic dish price checks and reservation conflict detection.

### 2. Cold Disaster Recovery Archive & Emergency Fallback: Supabase
- **Project Ref:** `jimdmvzpmawbgzodzxhv`
- **Role:** Preserved Cold Disaster Recovery Archive & Emergency Fallback.
- **IMPORTANT ARCHITECTURAL TRUTH:** Supabase is **NOT synchronized in real time with Convex**. There is no live CDC, background replication daemon, or dual-write sync between Convex and Supabase.
- **Preservation Guarantee:** All original PostgreSQL tables, migrations (`supabase/migrations/*.sql`), Row-Level Security (RLS) policies, storage buckets, and initial seed rows remain fully intact as an immutable cold backup.

### 3. Fail-Closed Reservation Architecture
- While read-mostly queries (Menu, Public Settings) degrade gracefully to Supabase or static fallbacks, and emergency orders can be buffered into Supabase:
- **Table Availability & Booking Creation STRICTLY FAIL CLOSED.**
- **Why?** Physical dining tables are a finite physical resource. Because Supabase is an unsynchronized cold archive, checking availability or booking against Supabase during a Convex outage would evaluate stale data and cause catastrophic physical double-bookings on the restaurant floor.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18.17+ or 20+
- Convex Cloud account access (`dev:tremendous-pony-619`)
- Supabase account access (`jimdmvzpmawbgzodzxhv`)

### 1. Clone & Install Dependencies
```bash
git clone <repo-url> the-golden-oak
cd the-golden-oak
npm install
```

### 2. Configure Environment Variables
Create `.env.local` in the project root:

```bash
# ==============================================================================
# ACTIVE PRIMARY BACKEND: CONVEX CLOUD
# ==============================================================================
NEXT_PUBLIC_CONVEX_URL=https://tremendous-pony-619.ap-southeast-2.convex.cloud
CONVEX_DEPLOYMENT=dev:tremendous-pony-619

# ==============================================================================
# COLD DISASTER RECOVERY ARCHIVE & FALLBACK: SUPABASE (NOT SYNCED IN REAL TIME)
# ==============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://jimdmvzpmawbgzodzxhv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

### 3. Run Development Server
In one terminal, run Convex functions dev watcher:
```bash
npx convex dev
```

In another terminal, start Next.js:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the customer dining experience.

---

## 🛠️ Key Application Modules

| Module | Route | Backend Authority | Real-Time Sync |
| :--- | :--- | :--- | :--- |
| **AR/VR Menu** | `/menu`, `/menu/[slug]` | Convex (`api.menu.*`) | Automatic Query Invalidation |
| **Dish 3D Viewer** | `/menu/[slug]` (3D/AR Modal) | Local `/public/models/` + Convex metadata | Client WebXR / Three.js |
| **Cart & Checkout** | `/cart`, `/checkout` | Convex (`api.orders.placeOrder`) | Real-time price validation |
| **Order Tracking** | `/order/[id]` | Convex (`api.orders.getOrderById`) | Live Convex WebSocket |
| **Kitchen KDS** | `/employee/orders` | Convex (`api.orders.getActiveOrders`) | Live Convex WebSocket |
| **Table Booking** | `/booking` | Convex (`api.bookings.*`) | **Fail-Closed on Outage** |
| **Admin Dashboard** | `/admin` | Convex (`api.analytics.*`, `api.settings.*`) | Reactive metrics |

---

## 📚 Disaster Recovery & Architecture Documentation

For complete technical specifications, fail-closed rationale, and outage recovery procedures, refer to the authoritative documentation suite:

- 📖 [**Backend Authority & Disaster Recovery Specification**](docs/BACKEND_AUTHORITY_AND_DISASTER_RECOVERY.md): Comprehensive reference detailing domain authority, physical table integrity proofs, fail-closed boundaries, and the step-by-step outage audit & reconciliation runbook.
- 🔄 [**Dual-Backend Switching Guide**](docs/migration/backend-switching.md): How service layer switching works in code and how to operate during an emergency failover.
- 📐 [**System Architecture Reference**](docs/migration/architecture.md): Deep architectural decisions, data flow diagrams, and safety guarantees.
- 🚒 [**Rollback Runbook**](docs/migration/rollback-runbook.md): Step-by-step emergency rollback instructions and post-rollback verification.

---

## 📄 License
Proprietary - The Golden Oak Fine Dining Restaurant. All rights reserved.
