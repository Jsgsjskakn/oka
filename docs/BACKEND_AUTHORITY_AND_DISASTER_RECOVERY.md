# Backend Authority & Disaster Recovery Specification
## The Golden Oak: Architectural Source of Truth, Fail-Closed Boundaries, and Post-Outage Reconciliation Runbook

> **Document Classification:** Core Architecture Specification & SRE Operational Runbook  
> **Target System:** The Golden Oak AR/VR Dining & Restaurant Operations Platform  
> **Active Primary Backend:** Convex Cloud (`dev:tremendous-pony-619`)  
> **Cold Disaster Recovery Archive & Fallback:** Supabase (`jimdmvzpmawbgzodzxhv`)  
> **Last Updated:** October 25, 2026  
> **Status:** APPROVED & AUTHORITATIVE

---

## 1. Executive Summary & System Model

This specification establishes the definitive architectural contract governing data authority, state management, failure mode boundaries, and disaster recovery procedures for *The Golden Oak*.

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

### 1.1 The Dual-Backend Model Defined
*The Golden Oak* employs a dual-backend topology designed to maximize real-time client performance while ensuring absolute business continuity:
1. **Active Primary Backend (Convex Cloud):** Convex is the **sole authoritative system of record** for all active production state: menu items, pricing, live orders, kitchen ticket lifecycles, table reservations, floor table states, runtime settings, and employee authentication sessions. All frontend React components and server actions prioritize Convex.
2. **Cold Disaster Recovery Archive & Emergency Fallback (Supabase):** The original PostgreSQL database hosted on Supabase (`jimdmvzpmawbgzodzxhv`) has been 100% preserved. Zero tables were dropped, zero rows deleted, and all 8 migrations remain intact.

### 1.2 Refuting the "Real-Time Synchronized Standby" Fallacy
Prior migration drafts occasionally mischaracterized Supabase as a "live synchronized standby" or claimed that Convex and Supabase were "synchronized in real time." **This claim is architecturally false and dangerously misleading.**

- **No Continuous Replication:** There is **no active Change Data Capture (CDC)**, no streaming replication daemon, and no distributed dual-write pipeline keeping Supabase in lockstep with Convex mutations.
- **Why Active-Active Dual-Write Was Rejected:** Distributed dual-writing between two independent cloud databases without two-phase commit creates catastrophic race conditions, partial failure modes, and split-brain states—particularly around finite physical assets like dining tables.
- **Accurate Classification:** Supabase is classified strictly as a **Cold Disaster Recovery Archive & Emergency Write Buffer**.
  - Its catalog, settings, and table structures represent an immutable snapshot preserved at migration time.
  - In an outage, Supabase acts as an emergency write sink for customer orders and an emergency read source for static menu items.
  - Transactions committed in Convex do **NOT** automatically appear in Supabase without explicit data reconciliation.

### 1.3 Target Reliability Metrics
- **RTO (Recovery Time Objective):**
  - *Menu Browsing & Catalog Reads:* **0 seconds** (instant automatic fallback to Supabase / local static fixtures).
  - *Order Intake:* **0 seconds** (instant automatic fallback to Supabase emergency write logging).
  - *Table Booking & Reservation Creation:* **Fail-Closed** during Convex outage; restored immediately upon Convex recovery or controlled manual triage.
- **RPO (Recovery Point Objective):**
  - *Table Reservations:* **RPO = 0** (guaranteed by Fail-Closed architecture; zero unverified or colliding bookings permitted).
  - *Orders:* **RPO = 0** (emergency orders captured in Supabase are audited and backfilled to Convex via the reconciliation runbook).

---

## 2. Domain Authority Matrix

Every business domain in *The Golden Oak* has a strictly defined source of truth, fallback path, and failure mode:

| Domain | Authoritative Source of Truth | Primary Endpoint / File | Fallback Target | Fallback Mechanism | Failure Mode | Consistency Model |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Dishes & Menu** | **Convex Cloud** | `convex/menu.ts`<br>`api.menu.*` | Supabase `dishes` & `categories`<br>$\rightarrow$ Static Mock Data | Service layer try/catch (`menu.service.ts`) | **Fail-Open** (Graceful Read Degradation) | Eventual Consistency on Fallback |
| **Orders & Items** | **Convex Cloud** | `convex/orders.ts`<br>`api.orders.*` | Supabase `orders` & `order_items` | Emergency write logging (`order.service.ts`) | **Degraded Write Buffer** (Requires Post-Outage Sync) | Strong in Convex; Buffered in Supabase |
| **Bookings** | **Convex Cloud** | `convex/bookings.ts`<br>`api.bookings.*` | **NONE FOR WRITES**<br>(Read-only phone history in Supabase) | Explicit try/catch barrier (`booking.service.ts`) | **STRICT FAIL-CLOSED** (Physical Table Protection) | Strict Linearizability; Zero Stale Writes |
| **Dining Tables** | **Convex Cloud** | `convex/tables.ts`<br>`api.tables.*` | Supabase `tables` | Read-only layout fallback (`tables` table) | **Fail-Closed for Allocation** | Master Registry in Convex |
| **Settings** | **Convex Cloud** | `convex/settings.ts`<br>`api.settings.*` | Supabase `restaurant_settings`<br>$\rightarrow$ Hardcoded defaults | Service layer fallback (`settings.service.ts`) | **Fail-Safe Default** | Read Fallback to Snapshot |
| **Auth & Sessions** | **Convex Cloud** | `convex/auth.ts`<br>`api.auth.*` | Supabase Auth + `profiles` table | Cookie check cascade (`admin-auth.ts`) | **Graceful Dual-Check** | Convex Primary Token, Supabase JWT Secondary |

---

### Detailed Domain Breakdown

### 2.1 Dishes & Menu Domain
- **Authoritative System:** Convex Cloud (`dishes`, `categories`, embedded `sizes`, `addOns`).
- **Data Model:**
  - `dishes`: Stores dish name, slug, description, price in paise, dietary flags (`isVeg`), spice level, 3D model path (`/models/[slug].glb`), image URL, availability status, and sorting order.
  - `categories`: Stores category name, slug, icon name, active status, and sort order.
- **Access Pattern:** High read-to-write ratio.
- **Outage Fallback:** If Convex is unreachable during `getCategories` or `getAllDishes`, `menu.service.ts` queries Supabase `dishes` and `categories`. If Supabase is also unreachable, it serves static fixtures from `src/data/mock-menu.ts`. 
- **Integrity Rule:** Menu browsing must never break. Even if both cloud backends undergo simultaneous outages, customers can view the food menu and 3D models locally.

### 2.2 Orders Domain
- **Authoritative System:** Convex Cloud (`orders`).
- **Data Model:**
  - `orders`: Stores customer name, phone, email, order type (`dine-in` vs `takeaway`), table number, status (`pending`, `confirmed`, `preparing`, `ready`, `delivered`, `completed`, `cancelled`), payment status, payment method (`upi` vs `cash`), itemized items array (with size, modifiers, add-ons, removed ingredients, line totals), subtotal, tax, tip, total in paise, idempotency key, and timestamps.
- **Normal Flow:** Orders are placed via `fetchMutation(api.orders.placeOrder)`. Convex atomically validates dish prices against its internal dish records to prevent client-side price tampering. Kitchen staff receive real-time push updates via `useQuery(api.orders.getActiveOrders)` over Convex WebSockets.
- **Outage Fallback (Emergency Logging):**
  - If Convex Cloud fails during `createOrder`, `order.service.ts` catches the exception and executes an emergency insert into Supabase `orders`, `order_items`, and `order_item_customizations`.
  - Idempotency is enforced in Supabase via `idempotency_key` unique constraints.
  - **Critical Note:** Supabase orders created during an outage are *unreconciled emergency records*. They must be ingested into Convex once Convex is restored (see Section 4).

### 2.3 Bookings / Reservations Domain
- **Authoritative System:** Convex Cloud (`bookings`).
- **Data Model:**
  - `bookings`: Stores customer name, phone, email, booking date (`YYYY-MM-DD`), booking time (`HH:MM`), booking end time, guest count, table number, status (`pending`, `confirmed`, `seated`, `cancelled`, `completed`), hold expiration timestamp (`holdExpiresAt`), advance amount in paise, payment status, and special requests.
- **Normal Flow:** Customer requests a time slot $\rightarrow$ `api.bookings.checkAvailability` computes overlapping reservations against physical tables $\rightarrow$ `api.bookings.createBooking` locks the table for a 15-minute hold window.
- **Outage Fallback: STRICT FAIL-CLOSED.**
  - If Convex is unavailable, **`checkAvailability` returns `available: false`** with an explicit maintenance error.
  - If Convex is unavailable, **`createBooking` rejects the request** and returns an error asking the customer to call the restaurant or try again shortly.
  - **NEVER Fall Back to Supabase for Booking Creation:** See Section 3 for the mathematical and operational proof of why failing open causes catastrophic double-booking.

### 2.4 Tables Domain
- **Authoritative System:** Convex Cloud (`tables`).
- **Data Model:**
  - `tables`: Stores table number, physical seat capacity, status (`available`, `occupied`, `reserved`, `maintenance`), and notes.
- **Integrity Rule:** Physical tables are a finite, immovable resource. Table definitions in Convex represent the live ground truth of restaurant floor seating.

### 2.5 Settings Domain
- **Authoritative System:** Convex Cloud (`restaurant_settings`).
- **Data Model:** Key-value pairs (`tax_rate_percent`, `advance_booking_amount_paise`, `table_hold_time_mins`, `cancellation_window_minutes`, `rush_mode_buffer_mins`, etc.).
- **Outage Fallback:** Reads fall back to Supabase `restaurant_settings`, and finally to compile-time code defaults.

### 2.6 Authentication & Sessions Domain
- **Authoritative System:** Convex Cloud (`employee_sessions`, `users`).
- **Data Model:** Cookie-based session tokens (`golden_oak_session`) validated via PBKDF2 WebCrypto hashing against Convex session records.
- **Outage Fallback:** Legacy Supabase Auth cookies and `profiles` table remain accessible via `admin-auth.ts` as an emergency secondary authentication channel for staff.

---

## 3. Deep Dive: The Fail-Closed Reservation Architecture

### 3.1 The Physical Table Integrity Problem
Unlike digital goods (which can be back-ordered) or analytics events (which can be eventually consistent), **restaurant dining tables are physical, non-fungible spatial assets bound to exact time windows**.

Consider the physical reality of *The Golden Oak*:
- The dining room has a fixed inventory of tables (e.g., Table 1 to 15) with specific capacities (2-seater, 4-seater, 6-seater, 8-seater private booth).
- A reservation guarantees a specific party exclusive occupancy of a table from $T_{start}$ to $T_{end}$.
- Two parties cannot occupy the same physical table simultaneously.

### 3.2 The Stale Cold-Archive Trap
Assume the following realistic sequence:
1. At 10:00 AM, Party A books Table 4 for 7:30 PM tonight via Convex. Convex commits this booking into `bookings`.
2. Supabase is a **cold DR archive** and is **NOT synchronized in real time**. Therefore, Supabase has **zero record** of Party A's reservation.
3. At 2:00 PM, Convex experiences a temporary cloud network partition or upstream outage.
4. At 2:05 PM, Party B visits the website wanting to book a table for 7:30 PM tonight.

**What happens if the system FAILS OPEN (falls back to Supabase)?**
- The booking service queries Supabase for table availability at 7:30 PM.
- Because Supabase was not synced in real time, Supabase sees Table 4 as completely empty and unreserved.
- The system reports Table 4 as "Available" to Party B!
- Party B completes checkout, pays their advance deposit, and receives a confirmed reservation for Table 4 at 7:30 PM.
- **The Catastrophe at 7:30 PM:** Both Party A and Party B arrive at *The Golden Oak* with valid confirmation receipts for Table 4. One party must be turned away at the door, resulting in severe reputational damage, customer escalation, and front-of-house operational collapse.

### 3.3 Mathematical Proof of the Fail-Closed Necessity
Let $S_{tables}$ be the finite set of physical tables.
Let $R(t)$ be the set of active reservations covering time slot $t$.
Under Convex (authoritative state $C$), the true set of available tables is:
$$A_C(t) = S_{tables} \setminus \{ \text{table}(r) \mid r \in R_C(t) \}$$

Under Supabase (cold archive state $S$ with replication lag $\Delta t \to \infty$):
$$R_S(t) \subset R_C(t) \quad \text{and} \quad R_S(t) \neq R_C(t)$$

Therefore:
$$A_S(t) = S_{tables} \setminus \{ \text{table}(r) \mid r \in R_S(t) \} \supset A_C(t)$$

Because $A_S(t)$ is a strict superset of true available tables $A_C(t)$, any reservation created using $A_S(t)$ has a non-zero probability of selecting a table $k \in A_S(t) \setminus A_C(t)$:
$$P(\text{Double Booking}) = \frac{|A_S(t) \setminus A_C(t)|}{|A_S(t)|} > 0$$

To guarantee $P(\text{Double Booking}) = 0$ during an outage where state $C$ is unreachable, the system must enforce:
$$A(t) = \emptyset \quad \forall t$$
This is the formal definition of **Failing Closed**.

### 3.4 Service Layer Implementation
This fail-closed boundary is enforced directly in `src/lib/services/booking.service.ts`:

```typescript
// Excerpt from src/lib/services/booking.service.ts

export async function checkTableAvailability(
  restaurantId: string,
  date: string,
  startTime: string,
  endTime: string,
  guests: number
): Promise<{ available: boolean; tables: RestaurantTable[]; error?: string }> {
  // 1. Primary: Convex Query
  try {
    const res = await fetchQuery(api.bookings.checkAvailability, {
      bookingDate: date,
      bookingTime: startTime,
      bookingEndTime: endTime,
      guests,
    });

    if (res) {
      return {
        available: res.available,
        tables: (res.availableTables || []).map(...),
      };
    }
  } catch (convexErr) {
    console.warn('[booking.service] Convex checkAvailability failed, failing closed to prevent double-booking:', convexErr);
    // FAIL CLOSED: Authoritative reservations are managed in Convex Cloud.
    // Supabase does not have real-time sync with Convex bookings.
    // Falling back to Supabase would report tables as free when they are actually booked in Convex,
    // leading to severe double-booking collisions.
    return {
      available: false,
      tables: [],
      error: 'Real-time table availability check is temporarily unavailable. Please try again in a few moments.',
    };
  }

  return { available: false, tables: [] };
}

export async function createBooking(data: CreateBookingInput): Promise<{ bookingId: string; error?: string }> {
  // 1. Primary: Convex Mutation
  try {
    const result = await fetchMutation(api.bookings.createBooking, { ... });
    if (result && 'bookingId' in result && result.bookingId) {
      return { bookingId: result.bookingId };
    }
  } catch (convexError) {
    console.warn('[booking.service] Convex createBooking failed, failing closed:', convexError);
    // FAIL CLOSED: Creating unverified bookings in Supabase during a Convex outage creates severe double-booking conflicts.
    return {
      bookingId: '',
      error: 'Reservation service is temporarily offline for maintenance. Please try again shortly or contact the restaurant.',
    };
  }
}
```

### 3.5 Customer Experience During Fail-Closed State
When a customer attempts to check availability or reserve during an outage:
1. The UI displays an informative, polished banner: *"Our live reservation system is temporarily undergoing brief maintenance. Please try again in a few minutes or call our host desk directly at +91 98765 43210."*
2. No credit card or advance UPI payments are initiated.
3. Phone numbers of guests who attempted to book can be optionally buffered for immediate host desk callback once systems normalize.

---

## 4. Outage Recovery Runbook: Audit & Write Reconciliation

When Convex Cloud recovers following a network interruption, service disruption, or maintenance window, operators and engineers must execute the following structured reconciliation protocol.

```
+-------------------------------------------------------------+
|               OUTAGE RECOVERY FLOWCHART                     |
+-------------------------------------------------------------+
                              |
                     [ 1. HEALTH VERIFICATION ]
                     * Test Convex HTTP & WS endpoints
                     * Record Outage Window [T_start, T_end]
                              |
                              v
                     [ 2. DISCREPANCY AUDIT ]
                     * Query Supabase orders in window
                     * Check audit_logs in Supabase
                     * Confirm zero unverified bookings
                              |
                              v
                     [ 3. DATA RECONCILIATION ]
                     * Check idempotency keys in Convex
                     * Ingest missing emergency orders
                     * Resolve status discrepancies
                     * Audit payment gateway webhooks
                              |
                              v
                     [ 4. SYSTEM NORMALIZATION ]
                     * Verify Kitchen KDS live WebSockets
                     * Verify table availability checks
                     * Close incident & document findings
```

---

### Step 1: Health & Connectivity Verification

Before initiating any data reconciliation, verify that Convex Cloud is completely healthy, responsive, and accepting mutations:

1. **Ping Convex Query Endpoint:**
   ```bash
   # From project directory
   npx convex run menu:getCategories
   ```
   *Expected Result:* Returns valid JSON category records with HTTP 200 within <100ms.

2. **Verify Table Registry:**
   ```bash
   npx convex run tables:getAllTables
   ```
   *Expected Result:* Returns all 15 active dining tables.

3. **Establish Outage Timestamps:**
   Determine the exact start and resolution timestamps of the outage:
   - $T_{start}$: Timestamp of first recorded Convex error in application logs.
   - $T_{end}$: Timestamp when Convex returned to healthy status.

---

### Step 2: Emergency Outage Writes Audit

During the outage window $[T_{start}, T_{end}]$, the service layer routed new customer orders to Supabase as an emergency write buffer. 

Execute the following SQL query in the Supabase SQL Editor (`jimdmvzpmawbgzodzxhv`) to identify all emergency orders created during the downtime:

```sql
-- Audit all emergency orders placed during the outage window
SELECT 
    o.id AS supabase_order_id,
    o.created_at,
    o.customer_name,
    o.customer_phone,
    o.order_type,
    o.table_id,
    o.status,
    o.payment_status,
    o.payment_method,
    o.total_paise,
    o.idempotency_key,
    COUNT(oi.id) AS item_count
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE o.created_at >= '2026-10-25T12:00:00Z' -- Replace with T_start
  AND o.created_at <= '2026-10-25T13:30:00Z' -- Replace with T_end
GROUP BY o.id
ORDER BY o.created_at ASC;
```

#### Verification Check: Confirm Booking Fail-Closed Integrity
Run this query to guarantee that zero rogue bookings were written to Supabase during the outage:

```sql
-- Verify no bookings were created in Supabase during the outage window
SELECT COUNT(*) AS rogue_booking_count
FROM bookings
WHERE created_at >= '2026-10-25T12:00:00Z' -- Replace with T_start
  AND created_at <= '2026-10-25T13:30:00Z'; -- Replace with T_end
```
*Expected Result:* `rogue_booking_count = 0`. If any bookings exist (e.g., entered manually via SQL), flag them immediately for host desk phone confirmation.

---

### Step 3: Order Backfill & Ingestion into Convex

For every emergency order identified in Supabase during Step 2:

1. **Idempotency Check:**
   Query Convex using the `idempotencyKey` to confirm whether the order was already received by Convex before the connection severed:
   ```typescript
   // Check if order already exists in Convex
   const existingOrder = await fetchQuery(api.orders.getOrderById, { orderId: order.idempotencyKey });
   ```
2. **Backfill Mutation:**
   If the order does not exist in Convex, execute an administrative backfill mutation in Convex:
   ```typescript
   // Administrative backfill script (or run via npx convex run)
   await fetchMutation(api.orders.placeOrder, {
     customerName: supabaseOrder.customer_name,
     customerPhone: supabaseOrder.customer_phone,
     customerEmail: supabaseOrder.customer_email,
     orderType: supabaseOrder.order_type,
     tableNumber: supabaseOrder.table_number,
     paymentMethod: supabaseOrder.payment_method,
     pickupTime: supabaseOrder.pickup_time,
     notes: `[EMERGENCY OUTAGE BACKFILL] ${supabaseOrder.notes || ''}`,
     tipPaise: supabaseOrder.tip_paise,
     idempotencyKey: supabaseOrder.idempotency_key,
     items: supabaseOrderItems.map(item => ({
       dishId: item.dish_id,
       dishName: item.dish_name,
       dishPricePaise: item.dish_price_paise,
       quantity: item.quantity,
       sizeName: item.size_name,
       sizePriceModifierPaise: item.size_price_modifier_paise,
       lineTotalPaise: item.line_total_paise,
       specialInstructions: item.special_instructions,
       addons: item.customizations,
     })),
   });
   ```
3. **Mark Reconciled in Supabase:**
   Log the reconciliation in Supabase `audit_logs` to ensure audit traceability:
   ```sql
   INSERT INTO audit_logs (
       restaurant_id, 
       entity_type, 
       entity_id, 
       action, 
       new_value
   ) VALUES (
       'a1b2c3d4-0000-0000-0000-000000000001',
       'orders',
       '<supabase_order_id>',
       'RECONCILED_TO_CONVEX',
       jsonb_build_object('reconciled_at', NOW(), 'convex_deployment', 'dev:tremendous-pony-619')
   );
   ```

---

### Step 4: Order Status Discrepancy Reconciliation

If the kitchen fulfilled or cancelled orders while the system was in degraded mode, the order status in Supabase may differ from Convex.

**State Machine Hierarchy:**
$$\text{pending} \longrightarrow \text{confirmed} \longrightarrow \text{preparing} \longrightarrow \text{ready} \longrightarrow \text{delivered} \ (\text{or } \text{cancelled})$$

**Conflict Resolution Rules:**
1. **Terminal State Rule:** If an order was marked `delivered`, `completed`, or `cancelled` in either backend, that terminal status **ALWAYS WINS**.
2. **Progressive Monotonicity Rule:** An order status never rolls backward (e.g., from `ready` back to `preparing`).
3. **Timestamp Precedence:** If both backends report in-flight non-terminal statuses, the status with the most recent `updated_at` timestamp takes precedence.

---

### Step 5: Financial & Payment Gateway Reconciliation

To ensure zero billing discrepancies:
1. Export transaction logs from the payment gateway (Razorpay / UPI provider) covering $[T_{start}, T_{end}]$.
2. Cross-reference Payment Gateway `transaction_id` against:
   - Convex `orders` (`totalPaise`, `paymentStatus = 'paid'`)
   - Supabase emergency `orders`
3. Any order marked `paid` in the payment gateway but `pending` in the database must be updated to `paid` with the corresponding payment ID recorded.

---

### Step 6: Post-Recovery Normalization Checklist

Complete each check before declaring normal operations restored:

- [ ] **Convex Query Health:** Menu categories and 10 dishes query successfully in <50ms.
- [ ] **Kitchen Display System (KDS):** Navigate to `/employee/orders`. Verify active orders stream live over Convex WebSockets without manual browser refresh.
- [ ] **Customer Tracker:** Open an active order at `/order/[id]`. Verify status badge updates reactively when changed by staff.
- [ ] **Booking Availability Engine:** Navigate to `/booking`. Perform test availability queries for today and tomorrow. Confirm green availability slots render with correct table numbers.
- [ ] **Test Reservation:** Create a test booking. Verify it locks table allocation in Convex `bookings` table and releases correctly upon cancellation.
- [ ] **Audit Completeness:** Confirm all emergency orders in Supabase have corresponding records in Convex with status parity.
- [ ] **Alerts Cleared:** Reset incident banners or maintenance notices on the frontend.

---

## 5. Summary & Architecture Governance

1. **Convex Cloud is the sole authoritative system of record.**
2. **Supabase is a Cold Disaster Recovery Archive & Emergency Fallback; it is NEVER synchronized in real time.**
3. **Table Bookings & Availability strictly FAIL CLOSED to protect physical dining table integrity.**
4. **All emergency orders written to Supabase during outages must be audited and backfilled to Convex using the Outage Recovery Runbook.**

For questions or escalation regarding this specification, contact the Architecture and SRE team.
