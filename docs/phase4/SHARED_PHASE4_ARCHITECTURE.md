# THE GOLDEN OAK — PHASE 4 SHARED ARCHITECTURE & SUB-AGENT COORDINATION CONTRACT

**Workspace:** `C:\Users\Pyiush Gupta\.gemini\antigravity\scratch\the-golden-oak`  
**Git Checkpoint:** `pre-phase4-checkpoint` (`d23e532`)  
**Baseline Test Status:** `548 / 548` passing across `89` suites, `0` TypeScript errors, `0` ESLint errors.

---

## 1. Golden Rules for All Sub-Agents
1. **Do NOT break working functionality or existing tests (`548/548`).** Always run `node --test` on affected test suites after any edit.
2. **Do NOT run `npm run build`, `npm start`, `npm run dev`, or `git commit` / `git push` inside sub-agents** — only the Lead Orchestrator runs full builds, server restarts, and Git commits to prevent `.next` lock collisions. Sub-agents MAY run `npx tsc --noEmit`, `npx eslint <files>`, and `node --test <test-files>`.
3. **Strict Engineering Honesty:** Every check and result across all Phase 4 reports MUST carry one of the five canonical status badges:
   - `PASS: Verified` (Verified by automated tests, binary inspection, or live Chromium headless/emulated execution)
   - `FAIL: Not working`
   - `PARTIAL: Partially implemented`
   - `BLOCKED: Requires access or hardware` (e.g., physical 2GB Android / iPhone hardware not connected to CI, external SMTP/SMS credentials not configured)
   - `NOT TESTED: No verification performed`
4. **Never fabricate physical device results:** Browser/Puppeteer viewport and CPU/RAM throttling is **emulation** (`Browser-emulated`), never a physical handset measurement.

---

## 2. Shared Standards & Contracts

### 2.1 Responsive Breakpoint Matrix (Section 2.1 & Section 6)
Every major route (`/`, `/menu`, `/menu/[category]/[dish]`, `/3d/[dishId]`, `/ar/[dishId]`, `/booking`, `/cart`, `/checkout`, `/about`, `/contact`, `/profile`, `/auth/login`, `/admin/dashboard`, `/employee/orders`) must be verified across the 11 canonical widths:
- **Small Mobile:** `320px`, `360px`
- **Standard Mobile:** `375px`, `390px`, `414px`
- **Large Mobile:** `430px`
- **Tablet:** `768px`
- **Laptop:** `1024px`, `1366px`, `1440px`
- **Large Windows Desktop:** `1920px`

**Invariants:**
- `document.documentElement.scrollWidth <= window.innerWidth` (`0px` horizontal overflow).
- Interactive touch targets $\ge 44 \times 44\text{ px}$ on mobile/tablet (`48px` preferred).
- Safe-area inset support (`env(safe-area-inset-bottom)`) on fixed mobile bars/docks with zero overlap over primary CTAs or footers.

### 2.2 Performance & Core Web Vitals Budgets (Section 2.2 & Section 5)
| Metric | Target Budget | Verification Method |
| :--- | :--- | :--- |
| **LCP** | $\le 2,500\text{ ms}$ | Live Chromium PerformanceObserver + Navigation Timing |
| **INP / Interaction Latency** | $\le 200\text{ ms}$ | Event timing / synthetic interaction measurement |
| **CLS** | $\le 0.10$ | LayoutShift PerformanceObserver |
| **TTFB** | $\le 800\text{ ms}$ | Navigation Timing `responseStart - requestStart` |
| **Menu / Home 3D Isolation** | `0` `.glb` / `.usdz` downloads on `/menu` | Network request interception gate |
| **Memory Stability** | `0` progressive WebGL context or material leaks | 50x dish-switch & unmount residency gate |

### 2.3 Backend & Dual-Database Architecture (Section 2.3)
- **Primary Authoritative Real-Time Store:** **Convex** (`convex/schema.ts`, `convex/bookings.ts`, `convex/orders.ts`, `convex/menu.ts`, `convex/auth.ts`, `convex/tables.ts`, `convex/settings.ts`).
- **Secondary Standby / Failover Store:** **Supabase PostgreSQL** (`supabase/migrations/001..008`, `src/lib/supabase/*`).
- **Critical Fail-Closed Invariant for Reservations:** Creating or mutating live table reservations (`createBooking`) MUST fail closed if Convex is unreachable (`tests/booking-fail-closed-audit.test.mjs`, `tests/booking-outage-safety.test.mjs`) to prevent split-brain double bookings. Read queries (`/menu`, `/settings`) may fall back gracefully to cached/standby data.
- **Financial Precision:** All prices, modifiers, taxes (`5%` GST), tips, discounts, and booking advances (`50000` paise = ₹500) MUST use integer **paise** (`Math.round`), never floating-point rupees.

### 2.4 Booking State Machine (Section 2.4 & Section 7)
```
pending ──(confirmBookingPayment / updateBookingStatus)──► confirmed ──► seated ──► completed
   │                                                           │            │
   └──────────────────────(cancelBooking)──────────────────────┴────────────┴──────► cancelled
```
- **5-Minute Atomic Table Hold:** `pending` bookings hold the assigned `tableNumber` until `holdExpiresAt = createdAt + holdMinutes * 60_000`. Expired pending holds (`holdExpiresAt <= Date.now()`) automatically release capacity in `filterActiveBookings()`.
- **Idempotency & Duplicate Prevention:** Submitting the same active `(customerPhone, bookingDate, bookingTime, guests)` while an existing `pending` (unexpired) or `confirmed` reservation already exists for that customer in the same time window returns the existing reservation idempotently rather than double-allocating a second table.

---

## 3. Sub-Agent File Ownership & Deliverables Matrix

| Sub-Agent | Conversation ID | Responsibility | Owned Deliverable Report(s) in `docs/phase4/` |
| :--- | :--- | :--- | :--- |
| **Agent 1: UI/UX & Responsive Specialist** | `ff968476-d175-47db-ab1d-08f871914146` | Audit all pages/modals/drawers across 11 breakpoints (`320px`–`1920px`), verify touch targets, safe areas, typography, and zero horizontal overflow | `docs/phase4/PHASE4_RESPONSIVE_UI_UX_AUDIT.md` |
| **Agent 2: Ultra Performance & Frontend Engineer** | `74a836c8-3af1-4471-9990-26d92a0c37aa` | Bundle/chunk analysis, route code-splitting, Core Web Vitals (`LCP`, `INP`, `CLS`, `TTFB`, `FCP`, `TBT`), 2GB Android low-memory & 3D lazy-loading audit | `docs/phase4/PHASE4_FRONTEND_PERFORMANCE_REPORT.md` & `docs/phase4/PHASE4_BEFORE_AFTER_BENCHMARKS.json` |
| **Agent 3: Backend, Database & Security Architect** | `fc182d0e-aa63-4105-aa26-29210cbed6f9` | Convex + Supabase schema/index/RLS audit, API route validation, auth/RBAC hardening (`booking-actions.ts` guest auth fix), security audit | `docs/phase4/PHASE4_BACKEND_DATABASE_AUDIT.md` & `docs/phase4/PHASE4_SECURITY_AUDIT.md` |
| **Agent 4: Booking & Reservation Workflow Specialist** | `9909f45e-f0de-472a-833a-29da2cccd9ac` | 14-step booking flow, availability & overlap engine, duplicate booking idempotency, state machine, notifications audit, admin booking management | `docs/phase4/PHASE4_BOOKING_END_TO_END_REPORT.md` |
| **Agent 5: Cross-Device QA & Visual Regression Engineer** | `701cdc0e-7a02-4d03-a457-14a9c809544a` | Windows (`1920x1080`..`1366x768`), Android (`2GB..8GB+`), iOS/iPad compatibility matrix, automated Phase 4 regression test suite (`tests/phase4-master-verification.test.mjs`) | `docs/phase4/PHASE4_DEVICE_COMPATIBILITY_REPORT.md` & `tests/phase4-master-verification.test.mjs` |
| **Agent 6: DevOps, Deployment & Observability Engineer** | `b50b6e55-cf9b-46e3-bc2a-4f68b3b12a67` | Vercel deployment config, `/api/health` deep telemetry, CI/CD gates, secret hygiene, backup & rollback runbook | `docs/phase4/PHASE4_DEPLOYMENT_AND_MONITORING_REPORT.md` |
| **Agent 7: Full Repository & E-Commerce Flow Auditor** | `c5e9bd81-b621-4998-9bca-d60b78bf154a` | Repository discovery map, Menu/Cart/Checkout/Order-Success & 3D/AR entry point integrity audit | `docs/phase4/PHASE4_FULL_REPOSITORY_AUDIT.md` |
| **Lead Orchestrator** | `22cb5c35-3043-4ba7-a662-5d1b3225baa2` | Architecture coordination, code integration, full build/test/lint verification, and Final Production Readiness Report | `docs/phase4/PHASE4_FINAL_PRODUCTION_READINESS.md` |
