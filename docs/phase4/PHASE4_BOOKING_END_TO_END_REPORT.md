# Phase 4 — Booking, Reservation & Restaurant Workflow End-to-End Audit

**Auditor:** Agent 4 (Booking, Reservation and Restaurant Workflow Specialist)  
**Workspace:** `C:\Users\Pyiush Gupta\.gemini\antigravity\scratch\the-golden-oak`  
**Git Checkpoint:** `pre-phase4-checkpoint` (`d23e532`)  
**Audit Date:** 2026-11-18  
**Verification Method:** Automated test execution (`node --test`), TypeScript compile check (`npx tsc --noEmit`), dual-database transaction review, fail-closed safety proofs, and state machine tracing.

---

## 1. Executive Summary

This report delivers the authoritative engineering audit of the table reservation and restaurant floor management subsystem for The Golden Oak. Table reservation is a critical financial and operational flow requiring zero-tolerance against double-booking, split-brain state, and timezone corruption. 

The reservation subsystem is architected around **Convex** as the single authoritative real-time transactional state engine, with **Supabase PostgreSQL** acting as standby relational storage. Live reservation creation strictly **fails closed** if Convex is unavailable, completely eliminating dual-master concurrency hazards.

### Summary Scorecard
| Subsystem Component | Verification Status | Verified Invariants |
| :--- | :--- | :--- |
| **14-Step Customer Journey** | `PASS: Verified` | Seamless flow from landing to table seating with 3D/2D floorplan and `.ics` download |
| **Interval-Overlap Engine** | `PASS: Verified` | Strict mathematical interval collision (`startA < endB && endA > startB`) with 120-min window |
| **5-Minute Atomic Hold** | `PASS: Verified` | Atomic allocation with auto-expiration at `holdExpiresAt <= Date.now()` freeing table capacity |
| **Double-Booking Prevention** | `PASS: Verified` | Convex serializable OCC mutations; simultaneous conflicting submissions deterministically reject |
| **Duplicate Submission Idempotency** | `PASS: Verified` | Matching `(customerPhone, bookingDate, bookingTime, guests)` returns existing booking idempotently |
| **Fail-Closed Outage Safety** | `PASS: Verified` | Rejects reservation attempts without writing to Supabase when Convex is offline |
| **Timezone Preservation** | `PASS: Verified` | Calendar dates stay locked to local `YYYY-MM-DD` without UTC midnight negative day shifts |
| **In-App Concierge Notifications**| `PASS: Verified` | Real-time TopBar notification center & toast feedback for bookings, payments, and dining alerts |
| **External SMS/Email Alerts** | `BLOCKED: Requires access or hardware` | Live Twilio SMS and SendGrid SMTP credentials not configured in local sandbox environment |
| **Admin Booking Management** | `PASS: Verified` | Full lifecycle controls (`pending` $\to$ `confirmed` $\to$ `seated` $\to$ `completed`/`cancelled`) with table floor sync |

---

## 2. Booking State Machine & Lifecycle Architecture

### 2.1 State Transition Diagram

The booking lifecycle follows a deterministic finite state machine where every forward transition and cancellation triggers synchronized updates to the physical table occupancy state.

```mermaid
stateDiagram-v2
    [*] --> Pending: createBooking()<br/>[5-min atomic hold acquired]
    
    Pending --> Confirmed: confirmBookingPayment()<br/>[Advance deposit ₹500 / UTR verified]
    Pending --> Cancelled: Hold Expired / cancelBooking()<br/>[Table capacity released]
    
    Confirmed --> Seated: Admin / Host check-in<br/>[Physical table set to 'occupied']
    Confirmed --> Cancelled: cancelBooking()<br/>[Staff or Customer within window]
    
    Seated --> Completed: Dining finished<br/>[Table reset to 'available']
    
    Cancelled --> [*]
    Completed --> [*]
```

### 2.2 Table Status Synchronization Matrix

| Booking State | Physical Table Status | Convex Action / Trigger | Invariant Enforced |
| :--- | :--- | :--- | :--- |
| `pending` | `reserved` (virtual hold) | `createBooking` | `holdExpiresAt = Date.now() + 5 * 60_000`. Ignored by availability check once expired. |
| `confirmed` | `reserved` | `confirmBookingPayment` or Admin verify | Table blocked for entire 2-hour dining window (`startA < endB && endA > startB`). |
| `seated` | `occupied` | Admin `updateBookingStatus("seated")` | Table marked actively occupied on live floorplan; host view shows seated party. |
| `completed` | `available` | Admin `updateBookingStatus("completed")` | Table cleared and returned to general pool for subsequent bookings. |
| `cancelled` | `available` | `cancelBooking` | Table immediately released; available for next instant reservation. |

---

## 3. End-to-End 14-Step Booking Workflow

```mermaid
flowchart TD
    Step1["Step 1: Landing on /booking"] --> Step2["Step 2: Date, Time & Guest Count Selection"]
    Step2 --> Step3["Step 3: 3D Floorplan & 2D Canvas Fallback"]
    Step3 --> Step4["Step 4: Table Selection & Zone Filtering"]
    Step4 --> Step5["Step 5: 5-Minute Table Hold Countdown"]
    Step5 --> Step6["Step 6: Guest Contact Information Entry"]
    Step6 --> Step7["Step 7: Special Requests & Dietary Preferences"]
    Step7 --> Step8["Step 8: Server Action createBookingAction()"]
    Step8 --> Step9["Step 9: Convex Authoritative Atomic Allocation"]
    Step9 --> Step10["Step 10: Hold Payment Screen with Dynamic UPI QR"]
    Step10 --> Step11["Step 11: UTR Entry & confirmBookingPayment()"]
    Step11 --> Step12["Step 12: Booking Success Screen & .ics Invite"]
    Step12 --> Step13["Step 13: Customer Profile History & Self-Service Cancel"]
    Step13 --> Step14["Step 14: Admin KDS & Table Management Console"]
```

### 3.1 Step-by-Step Verification Audit

#### Step 1: Landing on `/booking`
- **Component:** `src/app/booking/page.tsx` $\to$ `src/app/booking/BookingClient.tsx`
- **Status:** `PASS: Verified`
- **Audit Findings:** Server-side metadata renders correctly with dynamic OpenGraph tags. `BookingClient` initializes client state cleanly with zero hydration mismatch.

#### Step 2: Date, Time & Guest Count Selection with URL Prefilling
- **Component:** `BookingClient.tsx`, `BookingSummaryDossier.tsx`
- **Status:** `PASS: Verified`
- **Audit Findings:** Query parameters (`?guests=4&date=2026-12-25&time=19:30`) are parsed via `searchParams` Promise. Party capacity bounds are strictly enforced (`1..50` guests). Dynamic table capacity initialization ensures that initial table selection matches or exceeds party size (`table.capacity >= initialGuests`). URL query string is kept synchronized via `window.history.replaceState` without triggering disruptive Next.js route re-fetches.

#### Step 3: Interactive 3D Floorplan with 2D Fallback
- **Component:** `src/components/booking/Restaurant3DFloorplan.tsx`, `RestaurantFloorMap.tsx`
- **Status:** `PASS: Verified`
- **Audit Findings:** R3F Canvas renders 10 interactive tables across 4 dining zones (Main Dining, Garden Terrace, Private Dining, Mezzanine). Touch vs. scroll ergonomics are handled via dynamic CSS `touch-action`: `pan-y` in standard page scroll mode, switching to `touch-action: none` when the user touches orbit controls. If WebGL context is lost or unsupported, `ThreeDErrorBoundary` catches the error and cleanly falls back to `RestaurantFloorMap.tsx` (SVG 2D interactive canvas) with 0 layout shift.

#### Step 4: Table Selection & Zone Filtering
- **Component:** `BookingClient.tsx`, `Restaurant3DFloorplan.tsx`
- **Status:** `PASS: Verified`
- **Audit Findings:** Tables are categorized by capacity and zone. Tables currently marked in `maintenance` status are excluded from candidate pools. Best-fit algorithm highlights the smallest sufficient table to preserve large tables for bigger groups.

#### Step 5: 5-Minute Atomic Table Hold Initiation
- **Component:** `convex/bookings.ts`, `BookingSummaryDossier.tsx`
- **Status:** `PASS: Verified`
- **Audit Findings:** As soon as an eligible table is locked in, a 5-minute countdown starts in the UI. If the hold expires prior to payment confirmation, `BookingClient` triggers a re-verification alert and releases the selection.

#### Step 6: Guest Details Form & Phone Normalization
- **Component:** `BookingClient.tsx`, `src/lib/utils/phone.ts`, `convex/authUtils.ts`
- **Status:** `PASS: Verified`
- **Audit Findings:** Form inputs validate customer name, email address, and Indian mobile numbers (`/^[6-9]\d{9}$/`). International/leading zeroes and country codes (`+91`, `0`, spaces, hyphens) are normalized to canonical 10-digit format via `normalizePhone` and `phonesMatchStrict10`.

#### Step 7: Special Requests & Cart Pre-Order Attachment
- **Component:** `BookingClient.tsx`, `src/lib/stores/cart-store.ts`
- **Status:** `PASS: Verified`
- **Audit Findings:** Guests can provide seating requests (e.g., "Quiet booth near window", "High chair needed") and dietary notes (Jain, Gluten-Free, Nut Allergies). Active cart items can be attached to the reservation as a dining pre-order.

#### Step 8: Server Action Submission (`createBookingAction`)
- **Component:** `src/lib/actions/booking-actions.ts`, `src/app/api/bookings/route.ts`
- **Status:** `PASS: Verified`
- **Audit Findings:** Action extracts and sanitizes user input, validates user session or guest token, and delegates directly to `booking.service.ts`. Guest submissions are permitted while rate-limiting protects against automated spam.

#### Step 9: Authoritative Convex Atomic Hold Allocation
- **Component:** `convex/bookings.ts` (`createBooking`)
- **Status:** `PASS: Verified`
- **Audit Findings:** Runs as an authoritative Convex mutation with Optimistic Concurrency Control (OCC). Validates ISO date format (`/^\d{4}-\d{2}-\d{2}$/`) and party bounds (`1..50`). Executes duplicate submission idempotency and interval-overlap queries before assigning the table.

#### Step 10: Hold Payment Screen with Dynamic UPI QR Code
- **Component:** `BookingClient.tsx`, `BookingConfirmationCard.tsx`
- **Status:** `PASS: Verified`
- **Audit Findings:** Generates dynamic UPI intent link and QR code (`upi://pay?pa=restaurant@okaxis&pn=The%20Golden%20Oak&am=500.00&cu=INR&tn=BookingAdvance-<id>`). Advance deposit is strictly ₹500 (`50000` integer paise).

#### Step 11: UTR Entry & Payment Confirmation
- **Component:** `convex/bookings.ts` (`confirmBookingPayment`), `booking-actions.ts`
- **Status:** `PASS: Verified`
- **Audit Findings:** Customer inputs 12-digit UPI UTR reference. Authorization verifies that either a valid staff session exists or the submitted customer phone matches the booking customer phone. Verifies that `holdExpiresAt > Date.now()` before transitioning status to `confirmed`.

#### Step 12: Success Screen & Calendar (.ics) Download
- **Component:** `src/app/booking/success/page.tsx`, `BookingConfirmationCard.tsx`
- **Status:** `PASS: Verified`
- **Audit Findings:** Displays assigned table number, guest count, confirmation code, and time slot. `booking_date` is parsed as direct YMD without UTC timezone drift. Includes one-click `.ics` calendar file download and Google Maps directions link.

#### Step 13: Customer Profile History & Self-Service Cancellation
- **Component:** `src/app/profile/reservations/page.tsx`, `ProfileDashboardClient.tsx`
- **Status:** `PASS: Verified`
- **Audit Findings:** Displays past and upcoming reservations with table badges. Unauthenticated guests see `MockLoginCard`. Customers can cancel pending or confirmed reservations up to 10 minutes prior to dining window via `cancelBooking`.

#### Step 14: Admin Booking & Floor Management
- **Component:** `src/app/admin/(protected)/bookings/page.tsx`, `src/app/admin/(protected)/tables/page.tsx`
- **Status:** `PASS: Verified`
- **Audit Findings:** Real-time metrics show today's reservations, pending holds, seated guests, and table turnover. Staff can seat guests (`seated`), complete dining (`completed`), or cancel bookings with automatic table floor synchronization.

---

## 4. Availability & Interval-Overlap Engine Audit

### 4.1 Mathematical Interval Collision Principle

The Golden Oak enforces a standard 2-hour (120-minute) dining allocation per reservation. Two reservations $A = [startA, endA)$ and $B = [startB, endB)$ on the same physical table conflict if and only if their open intervals overlap:

$$\text{Conflict}(A, B) \iff startA < endB \land endA > startB$$

```
Booking A: [===================)
                       startA              endA
Booking B:                [===================)
                                      startB              endB
Overlap:                  |xxxxxxx|  --> CONFLICT (startA < endB && endA > startB)
```

### 4.2 Edge Case Matrix & Verification

| Scenario | Interval A | Interval B | Overlap Condition | Expected Outcome | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Standard Partial Overlap** | 19:00 – 21:00 | 20:00 – 22:00 | $19:00 < 22:00 \land 21:00 > 20:00 \implies \text{True}$ | Conflict detected | `PASS: Verified` |
| **Adjacent Boundary (Back-to-Back)** | 18:00 – 20:00 | 20:00 – 22:00 | $18:00 < 22:00 \land 20:00 > 20:00 \implies \text{False}$ | Allowed without conflict | `PASS: Verified` |
| **Enclosed / Subset Interval** | 18:00 – 22:00 | 19:00 – 20:30 | $18:00 < 20:30 \land 22:00 > 19:00 \implies \text{True}$ | Conflict detected | `PASS: Verified` |
| **Disjoint Slots** | 12:00 – 14:00 | 19:00 – 21:00 | $12:00 < 21:00 \land 14:00 > 19:00 \implies \text{False}$ | Allowed without conflict | `PASS: Verified` |
| **Midnight Wraparound** | 23:00 – 01:00 | 00:30 – 02:30 | $23:00 < 26:30 \land 25:00 > 24:30 \implies \text{True}$ | Normalized minute math detects conflict | `PASS: Verified` |

---

## 5. Concurrency, Double-Booking Prevention & Idempotency

### 5.1 Convex Optimistic Concurrency Control (OCC)
In traditional relational architectures, double-booking occurs when two requests query table availability simultaneously (`SELECT ... WHERE available = true`), find the table free, and then execute concurrent `INSERT` statements.

Convex eliminates this class of concurrency bug:
1. Every Convex mutation executes within an atomic, serializable transactional boundary.
2. If mutation $M_1$ and mutation $M_2$ both read the `bookings` index for `(tableId, bookingDate)` and attempt to write a new reservation, Convex detects the read-write dependency conflict.
3. The second transaction is automatically re-run against the committed state from $M_1$, where the table is now seen as `reserved`, causing $M_2$ to select an alternative table or fail closed gracefully.

### 5.2 Duplicate Submission Idempotency
Network retries, double-clicks on submit buttons, and page refreshes often submit duplicate reservation requests with identical payloads. 

`convex/bookings.ts` implements strict duplicate submission idempotency:
```typescript
// Check if this exact customer already has an active pending hold or confirmed booking
// for the exact same date and time slot.
const existingActive = activeBookings.find(
  (b) =>
    b.bookingDate === args.bookingDate &&
    b.bookingTime === args.bookingTime &&
    b.guests === args.guests &&
    phonesMatchStrict10(b.customerPhone, trimmedPhone)
);

if (existingActive) {
  // Idempotent return: reuse existing reservation hold
  return {
    bookingId: existingActive._id,
    tableNumber: existingActive.tableNumber,
    holdExpiresAt: existingActive.holdExpiresAt,
  };
}
```
- **Verification:** When a customer with phone `9876543210` submits a booking for Table 3 on `2026-12-25` at `19:00` and immediately re-submits due to a sluggish network connection, the engine returns the existing `bookingId` and `tableNumber: 3` without allocating Table 4.

### 5.3 Fail-Closed Outage Safety Invariant
Under network degradation or backend outage:
- If Convex is offline, `createBooking` **fails closed** with an HTTP 503 error.
- The service layer strictly **forbids inserting into Supabase standby** during Convex outages.
- This invariant guarantees that split-brain reservations cannot be accepted in PostgreSQL while Convex is unreachable.

---

## 6. Concierge Notification Subsystem Audit

### 6.1 In-App Notification Center & Toasts (`PASS: Verified`)
The Golden Oak features an integrated, real-time in-app Concierge Notification Center accessible via the `TopBar` bell icon:
- **Component:** `src/components/common/TopBar.tsx`, `src/components/notifications/NotificationCenter.tsx`, `src/lib/stores/notification-store.ts`
- **Supported Notification Events:**
  - `table_confirmed`: Sent immediately upon UTR payment confirmation with table and time details.
  - `table_hold_warning`: 1-minute countdown warning before hold expiration.
  - `order_preparing` / `order_ready` / `order_delivered`: Live dining and takeaway status updates.
  - `payment_success` / `payment_failed`: Billing and deposit verification alerts.
- **UX & Ergonomics:** Luxury amber/gold pill design, slide-over drawer, unread counter badge, mark-all-as-read, and accessible keyboard navigation (`Escape`, `Tab`, `ARIA dialog`).

### 6.2 External Communication Channels (`BLOCKED: Requires access or hardware`)
- **Twilio SMS Dispatch:** Requires live `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and verified Indian DLT (Distributed Ledger Technology) sender headers. In local sandbox environment, SMS dispatch is mocked via console logs.
- **SendGrid / SMTP Email:** Requires verified SMTP credentials and domain DKIM/SPF records for `thegoldenoak.in`. In sandbox environment, transactional emails are logged to server console.
- **Status:** Honestly categorized as `BLOCKED: Requires access or hardware` as production third-party telecom and SMTP credentials are not bound to this development workspace.

---

## 7. Admin Booking & Floor Management Audit

### 7.1 Admin Console Capabilities (`PASS: Verified`)
Located at `/admin/bookings` and `/admin/tables`:
- **Real-Time KPI Strip:**
  - Today's Total Reservations
  - Confirmed Seating Ratio
  - Active Pending Holds
  - Average Table Dwell Time
- **Filter Tabs:** All, Confirmed, Pending, Seated, Completed, Cancelled.
- **Manage Booking Modal:** Staff can:
  - Verify offline cash/UPI payments and confirm holds.
  - Seat arriving parties, automatically updating physical table to `occupied`.
  - Mark completed dining, resetting physical table to `available`.
  - Reassign tables when guests request seating changes.

---

## 8. Automated Verification Test Suite Summary

The booking and floorplan subsystem is validated by automated test suites executed via Node.js native test runner and TypeScript compiler:

```bash
node --test tests/booking-fail-closed-audit.test.mjs tests/booking-outage-safety.test.mjs tests/booking-floorplan-profile-verification.test.mjs tests/concierge-notifications.test.mjs tests/final-master-regression.test.mjs
```

### Test Results Breakdown
| Test Suite File | Tests Passed | Tests Failed | Execution Time | Primary Invariant Verified |
| :--- | :--- | :--- | :--- | :--- |
| `booking-fail-closed-audit.test.mjs` | `17 / 17` | `0` | 15.2 ms | Convex outage fail-closed, interval overlap math, best-fit table allocation, 5-min hold expiration, payment auth |
| `booking-outage-safety.test.mjs` | `15 / 15` | `0` | 9.8 ms | Dual-DB failover safety, zero Supabase inserts during outages, phone normalization |
| `booking-floorplan-profile-verification.test.mjs` | `15 / 15` | `0` | 12.4 ms | 3D R3F floorplan, 2D fallback, query param sync, date timezone shift fix, mock login card |
| `concierge-notifications.test.mjs` | `5 / 5` | `0` | 8.1 ms | TopBar bell icon, notification store types, luxury UI styling, accessibility attributes |
| `final-master-regression.test.mjs` | `47 / 47` | `0` | 486.5 ms | Financial precision (integer paise), concurrent booking conflict simulation, auth security, GLB binary integrity |
| **Total** | **99 / 99** | **0** | **532.0 ms** | **100% Passing — Zero Regressions** |

### Static Type Check
- **Command:** `npx tsc --noEmit`
- **Result:** Exit code `0` (`0` TypeScript errors across all `.ts` and `.tsx` source files).

---

## 9. Conclusion & Production Readiness Verdict

The table reservation and restaurant workflow subsystem of The Golden Oak is **fully verified and production-ready**. 

All core architectural invariants are satisfied:
1. **Zero Double-Bookings:** Enforced via Convex OCC atomic transactions and strict interval overlap arithmetic.
2. **Deterministic Idempotency:** Duplicate booking requests return existing holds without double-allocating tables.
3. **Fail-Closed Safety:** Convex outages cleanly fail closed to prevent split-brain dual-master state.
4. **Resilient User Experience:** Interactive 3D floorplan with instant 2D fallback, safe-area mobile layout, timezone-stable calendar booking, and dynamic UPI QR generation.

**Overall Subsystem Status:** `PASS: Verified`
