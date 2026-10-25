# Supabase Rollback Runbook
## The Golden Oak: Cold Disaster Recovery & Fallback Guide

This runbook provides step-by-step instructions to return the active application to Supabase if an extended disaster recovery event requires falling back from Convex Cloud.

> **CRITICAL ARCHITECTURAL NOTICE:**
> Supabase is a **Cold Disaster Recovery Archive & Emergency Fallback**. It is **NOT synchronized in real time with Convex**.
> Any transactions, orders, or setting changes made in Convex during active operation do not exist in Supabase until reconciled.
> Follow the post-outage reconciliation procedures in [`docs/BACKEND_AUTHORITY_AND_DISASTER_RECOVERY.md`](../BACKEND_AUTHORITY_AND_DISASTER_RECOVERY.md) when executing or reverting a rollback.

---

## 1. Safety Guarantee Verification

Before performing any rollback, verify that the original Supabase infrastructure is completely intact:

1. **Database Schema & Migrations:**
   All 8 migrations in `supabase/migrations/` remain untouched:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - `003_seed_data.sql`
   - `004_fix_rls_recursion.sql`
   - `005_fix_order_creation_rls.sql`
   - `006_fix_public_menu_rls.sql`
   - `007_fix_guest_orders.sql`
   - `008_comprehensive_security_hardening.sql`

2. **Data & Buckets:**
   - Zero tables were dropped.
   - Zero rows were deleted or truncated.
   - 3D models and image assets are stored locally in `public/models` and `public/images/dishes`, ensuring zero dependency on cloud object storage availability.

---

## 2. Emergency Rollback Procedure

Because the migration was implemented with a **dual-backend architecture**, fallback requires **no database restoration, no schema reconstruction, and zero destructive changes**.

### Step 1: Disable Convex Cloud URL in `.env.local`
Open `.env.local` and comment out or remove the Convex deployment keys:

```bash
# Convex Backend (Commented out to force Supabase fallback)
# NEXT_PUBLIC_CONVEX_URL=https://tremendous-pony-619.ap-southeast-2.convex.cloud
# CONVEX_DEPLOYMENT=dev:tremendous-pony-619
```

### Step 2: Verify Supabase Credentials in `.env.local`
Ensure the existing Supabase environment variables are present and uncommented:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://jimdmvzpmawbgzodzxhv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<preserved-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<preserved-service-role-key>
```

### Step 3: Restart Next.js Application
Restart the development server or trigger a redeployment in your production hosting:

```bash
npm run dev
# or for production:
npm run build && npm start
```

### Step 4: Verification Checklist & Operational Notes
After restarting:
- [ ] Navigate to `/menu`: Verify categories and dishes load from the Supabase database.
- [ ] Place a test order on `/checkout`: Verify order and order items are inserted into Supabase `orders` and `order_items` tables.
- [ ] Check Kitchen Dashboard at `/employee/orders`: Verify active orders load from Supabase.
- [ ] Check Booking page at `/booking`: **Verify that the reservation system fails closed** with the maintenance notice ("Reservation service is temporarily offline for maintenance...").
  > *Note on Reservations:* Table reservations intentionally fail closed to preserve physical dining table integrity and avoid double-booking against stale Supabase table data. To accept bookings during an extended outage, front-of-house staff must take phone reservations manually and audit existing Convex reservations.

---

## 3. Data Reconciliation After Restoring Convex

When Convex Cloud recovers, do NOT simply flip `.env.local` back on without auditing data!
1. Execute the reconciliation runbook in `docs/BACKEND_AUTHORITY_AND_DISASTER_RECOVERY.md`.
2. Backfill any emergency orders placed in Supabase during the outage into Convex.
3. Re-enable `NEXT_PUBLIC_CONVEX_URL` and restart the application.

---

## 4. Contact & Support References
- **Supabase Project Ref:** `jimdmvzpmawbgzodzxhv`
- **Dashboard:** `https://supabase.com/dashboard/project/jimdmvzpmawbgzodzxhv`
- **Convex Deployment:** `dev:tremendous-pony-619`
- **Convex Dashboard:** `https://dashboard.convex.dev/deployment/tremendous-pony-619`
