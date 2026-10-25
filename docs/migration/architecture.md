# Architecture: Dual-Backend Strategy (Convex Primary + Supabase Cold DR Archive)

> Generated: 2026-10-25
> Architecture Pattern: Active Convex Reactive Backend + Cold Supabase Disaster Recovery Archive (Not Synchronized in Real Time)

---

## 1. System Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │          Next.js App Router            │
                      │  (AR/VR Menu, Cart, Orders, Bookings)  │
                      └──────────────────┬─────────────────────┘
                                         │
                         ┌───────────────┴───────────────┐
                         ▼                               ▼
             ┌─────────────────────────┐   ┌───────────────────────────┐
             │  Convex Primary Backend │   │  Supabase Cold DR Archive │
             │  (ACTIVE & AUTHORITATIVE)│   │ (COLD ARCHIVE / FALLBACK) │
             ├─────────────────────────┤   ├───────────────────────────┤
             │ • schema.ts             │   │ • 001_initial_schema.sql  │
             │ • queries & mutations   │   │ • Preserved Auth Users    │
             │ • reactive WebSocket    │   │ • Preserved Seed Rows     │
             │ • automatic caching     │   │ • Preserved RLS Policies  │
             │ • 100% TypeScript       │   │ • NOT real-time synced    │
             │ • Authoritative state   │   │ • Emergency failover target│
             └─────────────────────────┘   └───────────────────────────┘
```

---

## 2. Core Architectural Decisions

### 1. Cold Disaster Recovery Archive Guarantee (Supabase)
- Supabase project `jimdmvzpmawbgzodzxhv` is **NEVER** modified, truncated, or dropped.
- All original SQL migrations (`supabase/migrations/*.sql`) remain in the repository.
- Supabase is classified strictly as a **Cold Disaster Recovery Archive & Emergency Fallback**.
- **Important:** Supabase is **NOT synchronized in real time with Convex**. There is no active CDC, replication stream, or dual-write pipeline keeping Supabase in lockstep with Convex mutations.

### 2. Full Convex Backend Authority
- The Next.js frontend is wired directly to Convex through `ConvexClientProvider` (`src/app/ConvexClientProvider.tsx`).
- Convex is the **sole authoritative system of record** for all active production state: dishes, active orders, live reservations, table allocation, and employee sessions.
- Reactive hooks (`useQuery`, `useMutation`) replace static or polling Supabase requests.
- Orders Dashboard (`src/components/employee/OrdersDashboard.tsx`) uses native reactive Convex subscriptions without WebSocket configuration leaks.
- AR/3D models load directly from `/public/models/` referenced in Convex records.

### 3. Failover & Rollback Reality
- If a complete rollback is required, reverting the provider or disabling `NEXT_PUBLIC_CONVEX_URL` restores application connectivity to Supabase.
- **Data Reconciliation Requirement:** Because Supabase is a cold DR archive and not synchronized in real time, writes executed on Convex during production do not automatically exist in Supabase. Rolling back to Supabase without running the reconciliation runbook will revert the system to the pre-migration snapshot plus any emergency outage writes. 
- All data reconciliation and audit procedures are specified in [`BACKEND_AUTHORITY_AND_DISASTER_RECOVERY.md`](../BACKEND_AUTHORITY_AND_DISASTER_RECOVERY.md).

### 4. Fail-Closed Reservation Architecture
- While menu reads and emergency orders degrade gracefully, table availability and reservation creation **fail closed** during Convex outages.
- Physical dining tables cannot tolerate split-brain states; falling back to a cold Supabase database would report booked tables as vacant and cause disastrous double-bookings on the restaurant floor.
