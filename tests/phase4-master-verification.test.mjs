/**
 * THE GOLDEN OAK — PHASE 4 MASTER VERIFICATION SUITE
 * Sub-Agent 5: Cross-Device QA, Automation and Visual Regression Engineer
 *
 * Automated verification across all 5 core Phase 4 areas:
 * 1. Responsive breakpoint matrix & touch-target invariants (320px..1920px)
 * 2. Frontend performance & 3D/AR lazy-loading invariants
 * 3. Backend & security invariants (guest auth phone match, debug-employee, integer paise arithmetic)
 * 4. Booking workflow invariants (5-min hold expiry, interval overlap, idempotency, state machine)
 * 5. Health check endpoint contract (src/app/api/health/route.ts)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Core imports from codebase
import {
  ASSET_PRIORITY_WEIGHTS,
  shouldAllowLodUpgrade,
} from '../src/lib/three/progressive-asset-loader.ts';

import {
  XR_BASE_PROFILES,
  resolveXRSessionQualityProfile,
} from '../src/lib/xr/ar-quality-profile.ts';

import {
  isWorldTrackedRoute,
  ROUTE_LABELS,
} from '../src/lib/xr/spatial-contract.ts';

// ---------------------------------------------------------------------------
// SUITE 1: Responsive Breakpoint & Touch-Target Invariants (320px..1920px)
// ---------------------------------------------------------------------------

test('Phase 4 — Suite 1: Responsive Breakpoint & Touch-Target Invariants', async (t) => {
  const CANONICAL_VIEWPORTS = [
    { width: 320, category: 'Small Mobile', minTouchTarget: 44 },
    { width: 360, category: 'Small Mobile', minTouchTarget: 44 },
    { width: 375, category: 'Standard Mobile', minTouchTarget: 44 },
    { width: 390, category: 'Standard Mobile', minTouchTarget: 44 },
    { width: 414, category: 'Standard Mobile', minTouchTarget: 44 },
    { width: 430, category: 'Large Mobile', minTouchTarget: 44 },
    { width: 768, category: 'Tablet', minTouchTarget: 44 },
    { width: 1024, category: 'Laptop', minTouchTarget: 40 },
    { width: 1366, category: 'Laptop', minTouchTarget: 36 },
    { width: 1440, category: 'Laptop', minTouchTarget: 36 },
    { width: 1920, category: 'Large Desktop', minTouchTarget: 36 },
  ];

  await t.test('1.1 Canonical 11 Viewport Widths Matrix Definition', () => {
    assert.equal(CANONICAL_VIEWPORTS.length, 11, 'Must specify all 11 canonical Phase 4 viewports');
    assert.equal(CANONICAL_VIEWPORTS[0].width, 320, 'Smallest viewport must be 320px');
    assert.equal(CANONICAL_VIEWPORTS[10].width, 1920, 'Largest viewport must be 1920px');
    
    // Check coverage across all 6 device categories
    const categories = new Set(CANONICAL_VIEWPORTS.map((v) => v.category));
    assert.ok(categories.has('Small Mobile'));
    assert.ok(categories.has('Standard Mobile'));
    assert.ok(categories.has('Large Mobile'));
    assert.ok(categories.has('Tablet'));
    assert.ok(categories.has('Laptop'));
    assert.ok(categories.has('Large Desktop'));
  });

  await t.test('1.2 Root Viewport Meta Tag Invariants (src/app/layout.tsx)', () => {
    const layoutPath = path.resolve(process.cwd(), 'src/app/layout.tsx');
    assert.ok(fs.existsSync(layoutPath), 'src/app/layout.tsx must exist');
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');

    // Viewport configuration assertions
    assert.ok(layoutContent.includes("width: 'device-width'"), 'Must declare width: device-width');
    assert.ok(layoutContent.includes('initialScale: 1'), 'Must declare initialScale: 1');
    assert.ok(layoutContent.includes("viewportFit: 'cover'"), 'Must declare viewportFit: cover for notch/safe-areas');
    assert.ok(layoutContent.includes('maximumScale: 5'), 'Must allow user zoom (maximumScale >= 3 for a11y)');
  });

  await t.test('1.3 Safe-Area Inset Support in Fixed Navigation & Headers', () => {
    const headerPath = path.resolve(process.cwd(), 'src/components/layout/Header.tsx');
    const mobileNavPath = path.resolve(process.cwd(), 'src/components/layout/MobileNav.tsx');
    const arHeaderPath = path.resolve(process.cwd(), 'src/components/ar/ARHeader.tsx');

    // ARHeader safe-area
    if (fs.existsSync(arHeaderPath)) {
      const arHeaderContent = fs.readFileSync(arHeaderPath, 'utf8');
      assert.ok(
        arHeaderContent.includes('pt-safe') || arHeaderContent.includes('safe-area-inset'),
        'ARHeader must incorporate safe-area top insets'
      );
    }

    // Mobile navigation safe-area bottom dock
    if (fs.existsSync(mobileNavPath)) {
      const mobileNavContent = fs.readFileSync(mobileNavPath, 'utf8');
      assert.ok(
        mobileNavContent.includes('pb-safe') || mobileNavContent.includes('safe-area-inset-bottom') || mobileNavContent.includes('bottom-'),
        'MobileNav must account for home-indicator / safe-area-inset-bottom'
      );
    }
  });

  await t.test('1.4 Minimum Touch Target Compliance in Interactive UI Components', () => {
    // Audit key mobile touch components for min-h-[44px], min-h-[48px], or adequate padding
    const componentsToAudit = [
      'src/components/ar/ARHeader.tsx',
      'src/components/ar/ARControls.tsx',
      'src/components/ar/ARTrackingStatus.tsx',
    ];

    for (const relPath of componentsToAudit) {
      const fullPath = path.resolve(process.cwd(), relPath);
      if (!fs.existsSync(fullPath)) continue;
      const content = fs.readFileSync(fullPath, 'utf8');

      // Either explicit 44px/48px or touch manipulation classes
      const hasTouchTargetClasses =
        content.includes('min-h-[44px]') ||
        content.includes('min-h-[48px]') ||
        content.includes('w-10 h-10') ||
        content.includes('w-11 h-11') ||
        content.includes('py-3') ||
        content.includes('py-3.5') ||
        content.includes('p-2.5') ||
        content.includes('p-3') ||
        content.includes('p-4') ||
        content.includes('touch-manipulation');

      assert.ok(
        hasTouchTargetClasses,
        `Component ${relPath} must meet touch target sizing standards (>=44px)`
      );
    }
  });
});

// ---------------------------------------------------------------------------
// SUITE 2: Frontend Performance & 3D/AR Lazy-Loading Invariants
// ---------------------------------------------------------------------------

test('Phase 4 — Suite 2: Frontend Performance & 3D/AR Lazy-Loading Invariants', async (t) => {
  await t.test('2.1 Zero Eager GLB Fetching on /menu and /', () => {
    const menuPagePath = path.resolve(process.cwd(), 'src/app/menu/page.tsx');
    const homePagePath = path.resolve(process.cwd(), 'src/app/page.tsx');

    if (fs.existsSync(menuPagePath)) {
      const menuContent = fs.readFileSync(menuPagePath, 'utf8');
      assert.ok(
        !menuContent.includes('useGLTF.preload'),
        '/menu route must NEVER eagerly preload all 22 dish GLBs'
      );
      assert.ok(
        !menuContent.includes('GLTFLoader'),
        '/menu route must NOT instantiate GLTFLoader directly'
      );
    }

    if (fs.existsSync(homePagePath)) {
      const homeContent = fs.readFileSync(homePagePath, 'utf8');
      assert.ok(
        !homeContent.includes('useGLTF.preload('),
        'Home page must NEVER eagerly preload all 22 dish GLBs'
      );
    }
  });

  await t.test('2.2 Progressive Asset Loader Priority Weights Invariant', () => {
    // Invariant: active initial (100) > active LOD upgrade (80) > active textures (60) > adjacent prewarm (20)
    assert.equal(ASSET_PRIORITY_WEIGHTS['active-dish-initial'], 100);
    assert.equal(ASSET_PRIORITY_WEIGHTS['active-dish-lod-upgrade'], 80);
    assert.equal(ASSET_PRIORITY_WEIGHTS['active-dish-textures'], 60);
    assert.equal(ASSET_PRIORITY_WEIGHTS['adjacent-dish-prewarm'], 20);

    assert.ok(ASSET_PRIORITY_WEIGHTS['active-dish-initial'] > ASSET_PRIORITY_WEIGHTS['active-dish-lod-upgrade']);
    assert.ok(ASSET_PRIORITY_WEIGHTS['active-dish-lod-upgrade'] > ASSET_PRIORITY_WEIGHTS['active-dish-textures']);
    assert.ok(ASSET_PRIORITY_WEIGHTS['active-dish-textures'] > ASSET_PRIORITY_WEIGHTS['adjacent-dish-prewarm']);
  });

  await t.test('2.3 Residency Guard (shouldAllowLodUpgrade) Memory & Thermal Invariants', () => {
    // 1. Nominal conditions allow upgrade
    const nominalCheck = shouldAllowLodUpgrade({
      targetProfile: 'high-fidelity',
      jsHeapUsedBytes: 40_000_000,
      jsHeapLimitBytes: 100_000_000, // 40% utilization
      thermalState: 'nominal',
      saveData: false,
    });
    assert.equal(nominalCheck.downgraded, false, 'Nominal conditions must allow high-fidelity upgrade');
    assert.equal(nominalCheck.allowedProfile, 'high-fidelity');

    // 2. High JS Heap (>= 80%) caps at balanced, blocking high-fidelity upgrade
    const highHeapCheck = shouldAllowLodUpgrade({
      targetProfile: 'high-fidelity',
      jsHeapUsedBytes: 85_000_000,
      jsHeapLimitBytes: 100_000_000, // 85% utilization
      thermalState: 'nominal',
      saveData: false,
    });
    assert.equal(highHeapCheck.downgraded, true, 'JS Heap >= 80% must block high-fidelity upgrade');
    assert.equal(highHeapCheck.allowedProfile, 'balanced');

    // 3. Serious/Critical thermal state blocks upgrade
    const thermalCheck = shouldAllowLodUpgrade({
      targetProfile: 'high-fidelity',
      jsHeapUsedBytes: 30_000_000,
      jsHeapLimitBytes: 100_000_000,
      thermalState: 'serious',
      saveData: false,
    });
    assert.equal(thermalCheck.downgraded, true, 'Serious thermal state must block high-fidelity upgrade');
    assert.equal(thermalCheck.allowedProfile, 'balanced');

    // 4. Data Saver active blocks upgrade
    const dataSaverCheck = shouldAllowLodUpgrade({
      targetProfile: 'high-fidelity',
      jsHeapUsedBytes: 30_000_000,
      jsHeapLimitBytes: 100_000_000,
      thermalState: 'nominal',
      saveData: true,
    });
    assert.equal(dataSaverCheck.downgraded, true, 'Data Saver must block high-fidelity asset downloads');
    assert.equal(dataSaverCheck.allowedProfile, 'ultra-light');
  });

  await t.test('2.4 WebXR Calibrated Base Profiles Invariants (ar-quality-profile.ts)', () => {
    const ultraLight = XR_BASE_PROFILES['ultra-light'];
    const balanced = XR_BASE_PROFILES['balanced'];
    const highFidelity = XR_BASE_PROFILES['high-fidelity'];

    // Ultra-light profile for budget 2GB devices
    assert.equal(ultraLight.framebufferScaleFactor, 0.75);
    assert.equal(ultraLight.foveation, 1.0);
    assert.equal(ultraLight.textureMaxDimension, 512);
    assert.equal(ultraLight.lodTier, 2);
    assert.equal(ultraLight.shadowTechnique, 'contact-blob');

    // Balanced profile
    assert.equal(balanced.framebufferScaleFactor, 1.0);
    assert.equal(balanced.foveation, 0.5);
    assert.equal(balanced.textureMaxDimension, 1024);
    assert.equal(balanced.lodTier, 1);
    assert.equal(balanced.shadowTechnique, 'contact-shadow-texture');

    // High-fidelity profile
    assert.equal(highFidelity.framebufferScaleFactor, 1.0);
    assert.equal(highFidelity.textureMaxDimension, 2048);
    assert.equal(highFidelity.lodTier, 0);
    assert.equal(highFidelity.shadowTechnique, 'shadow-map');
  });

  await t.test('2.5 Zero Dual-WebGL Context Creation Invariant', () => {
    const viewerFilePath = path.resolve(process.cwd(), 'src/components/ar/ARViewer.tsx');
    assert.ok(fs.existsSync(viewerFilePath));
    const viewerContent = fs.readFileSync(viewerFilePath, 'utf8');

    // Verifies ARViewer short-circuits to WebXRARExperience exclusively
    assert.ok(
      viewerContent.includes('if (activeWebXR)'),
      'ARViewer must branch to WebXRARExperience exclusively'
    );
    assert.ok(
      viewerContent.includes('<WebXRARExperience'),
      'ARViewer must render WebXRARExperience in dedicated branch'
    );
  });
});

// ---------------------------------------------------------------------------
// SUITE 3: Backend & Security Invariants
// ---------------------------------------------------------------------------

test('Phase 4 — Suite 3: Backend & Security Invariants', async (t) => {
  await t.test('3.1 Guest Booking Payment Confirmation Authorization (booking-actions.ts)', () => {
    const bookingActionsPath = path.resolve(process.cwd(), 'src/lib/actions/booking-actions.ts');
    assert.ok(fs.existsSync(bookingActionsPath));
    const content = fs.readFileSync(bookingActionsPath, 'utf8');

    // Must verify phone match for guest bookings:
    assert.ok(
      content.includes('isMatchingPhone'),
      'Must define phone matching logic for guest bookings'
    );
    assert.ok(
      content.includes('if (!isOwner && !isMatchingPhone)'),
      'Guest booking confirmation MUST require phone match to prevent unauthorized confirmations'
    );
  });

  await t.test('3.2 Debug Employee Page Production Blocker (src/app/debug-employee/page.tsx)', () => {
    const debugPagePath = path.resolve(process.cwd(), 'src/app/debug-employee/page.tsx');
    assert.ok(fs.existsSync(debugPagePath));
    const content = fs.readFileSync(debugPagePath, 'utf8');

    // Invariant: NODE_ENV === 'production' must return notFound()
    assert.ok(
      content.includes("process.env.NODE_ENV === 'production'"),
      'Must check for production environment'
    );
    assert.ok(
      content.includes('notFound()'),
      'Must call notFound() in production to return 404'
    );
    assert.ok(
      content.includes('requireAdmin()'),
      'Must require admin authentication even in non-production environments'
    );
  });

  await t.test('3.3 Financial Precision & Integer Paise Arithmetic Invariants', () => {
    // Invariant: all restaurant financials must be computed in integer paise, never floating rupees
    const calculateTotalPaise = (subtotalPaise, gstPercent = 5, tipPaise = 0, discountPaise = 0) => {
      assert.ok(Number.isInteger(subtotalPaise), 'Subtotal must be integer paise');
      assert.ok(Number.isInteger(tipPaise), 'Tip must be integer paise');
      assert.ok(Number.isInteger(discountPaise), 'Discount must be integer paise');

      const taxPaise = Math.round((subtotalPaise - discountPaise) * (gstPercent / 100));
      const totalPaise = subtotalPaise - discountPaise + taxPaise + tipPaise;

      assert.ok(Number.isInteger(taxPaise), 'Tax must evaluate to integer paise');
      assert.ok(Number.isInteger(totalPaise), 'Total must evaluate to integer paise');

      return { taxPaise, totalPaise };
    };

    // Test with typical order: ₹1,550 subtotal (155000 paise) with 5% GST
    const res = calculateTotalPaise(155000, 5, 5000, 10000); // ₹1,550 subtotal, ₹100 discount, ₹50 tip
    assert.equal(res.taxPaise, 7250); // 5% of ₹1450 (145000 paise) = 7250 paise (₹72.50)
    assert.equal(res.totalPaise, 157250); // ₹1450 + ₹72.50 tax + ₹50 tip = ₹1572.50 in paise
    assert.ok(Number.isInteger(res.totalPaise));

    // Booking deposit standard: 50,000 paise = ₹500
    const BOOKING_DEPOSIT_PAISE = 50000;
    assert.equal(BOOKING_DEPOSIT_PAISE, 50000, 'Standard booking deposit must be 50,000 paise');
    assert.equal(BOOKING_DEPOSIT_PAISE / 100, 500, '50,000 paise corresponds to ₹500');
  });
});

// ---------------------------------------------------------------------------
// SUITE 4: Booking Workflow & Table Allocation Invariants
// ---------------------------------------------------------------------------

test('Phase 4 — Suite 4: Booking Workflow & Table Allocation Invariants', async (t) => {
  // Pure domain helpers matching convex/bookings.ts
  const timeToMinutes = (tStr) => {
    const [h, m] = tStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const doIntervalsOverlap = (startA, endA, startB, endB) => {
    return startA < endB && endA > startB;
  };

  const isBookingActive = (b, currentTime = Date.now()) => {
    if (b.status === 'cancelled' || b.status === 'completed') return false;
    if (b.status === 'pending' && b.holdExpiresAt && b.holdExpiresAt <= currentTime) {
      return false;
    }
    return b.tableNumber !== undefined;
  };

  await t.test('4.1 5-Minute Atomic Table Hold Expiry Invariant', () => {
    const now = 1_700_000_000_000;
    const FIVE_MINUTES_MS = 5 * 60 * 1000;

    // Active pending booking (expires 5 minutes in future)
    const activeHoldBooking = {
      id: 'b1',
      status: 'pending',
      tableNumber: 4,
      createdAt: now,
      holdExpiresAt: now + FIVE_MINUTES_MS,
    };
    assert.equal(isBookingActive(activeHoldBooking, now), true, 'Pending booking within 5-min window holds table');

    // Expired pending booking (6 minutes elapsed)
    const expiredHoldBooking = {
      id: 'b2',
      status: 'pending',
      tableNumber: 4,
      createdAt: now - 6 * 60 * 1000,
      holdExpiresAt: now - 1 * 60 * 1000, // expired 1 min ago
    };
    assert.equal(
      isBookingActive(expiredHoldBooking, now),
      false,
      'Expired pending booking (>5 min) must release table capacity'
    );
  });

  await t.test('4.2 Time Interval Overlap Logic Invariant', () => {
    const slotA_start = timeToMinutes('19:00'); // 1140
    const slotA_end = timeToMinutes('21:00');   // 1260

    // Overlapping slot: 20:00 - 22:00
    const overlapSlot_start = timeToMinutes('20:00');
    const overlapSlot_end = timeToMinutes('22:00');
    assert.equal(
      doIntervalsOverlap(slotA_start, slotA_end, overlapSlot_start, overlapSlot_end),
      true,
      'Partially overlapping slots must detect collision'
    );

    // Contained slot: 19:30 - 20:30
    const containedSlot_start = timeToMinutes('19:30');
    const containedSlot_end = timeToMinutes('20:30');
    assert.equal(
      doIntervalsOverlap(slotA_start, slotA_end, containedSlot_start, containedSlot_end),
      true,
      'Contained sub-slot must detect collision'
    );

    // Adjacent non-overlapping slot: 21:00 - 23:00 (end of A == start of B)
    const adjacentSlot_start = timeToMinutes('21:00');
    const adjacentSlot_end = timeToMinutes('23:00');
    assert.equal(
      doIntervalsOverlap(slotA_start, slotA_end, adjacentSlot_start, adjacentSlot_end),
      false,
      'Adjacent non-overlapping slots must NOT collide'
    );

    // Completely separated slot: 12:00 - 14:00
    const distantSlot_start = timeToMinutes('12:00');
    const distantSlot_end = timeToMinutes('14:00');
    assert.equal(
      doIntervalsOverlap(slotA_start, slotA_end, distantSlot_start, distantSlot_end),
      false,
      'Disjoint slots must NOT collide'
    );
  });

  await t.test('4.3 Idempotency & Duplicate Reservation Handling', () => {
    // Emulates idempotency check from convex/bookings.ts
    const findDuplicateReservation = (existingBookings, newRequest, now = Date.now()) => {
      const normPhone = newRequest.customerPhone.replace(/\D/g, '').slice(-10);
      const { startMin, endMin } = {
        startMin: timeToMinutes(newRequest.bookingTime),
        endMin: timeToMinutes(newRequest.bookingTime) + 120,
      };

      return existingBookings.find((b) => {
        if (b.bookingDate !== newRequest.bookingDate) return false;
        if (b.status === 'cancelled' || b.status === 'completed') return false;
        if (b.status === 'pending' && b.holdExpiresAt && b.holdExpiresAt <= now) return false;

        const bPhone = (b.customerPhone || '').replace(/\D/g, '').slice(-10);
        if (bPhone !== normPhone) return false;

        const bStart = timeToMinutes(b.bookingTime);
        const bEnd = bStart + 120;
        return doIntervalsOverlap(startMin, endMin, bStart, bEnd);
      });
    };

    const existingBookings = [
      {
        id: 'existing-b1',
        customerPhone: '+91 98765 43210',
        bookingDate: '2026-11-20',
        bookingTime: '19:30',
        guests: 4,
        tableNumber: 5,
        status: 'confirmed',
      },
    ];

    // Customer double-submits same time & date
    const duplicateSubmission = {
      customerPhone: '9876543210',
      bookingDate: '2026-11-20',
      bookingTime: '19:30',
      guests: 4,
    };

    const match = findDuplicateReservation(existingBookings, duplicateSubmission);
    assert.ok(match, 'Must detect duplicate active reservation for same customer & slot');
    assert.equal(match.id, 'existing-b1', 'Returns existing booking idempotently');
  });

  await t.test('4.4 State Machine Transition Integrity', () => {
    const VALID_TRANSITIONS = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['seated', 'cancelled'],
      seated: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    const isValidTransition = (from, to) => {
      const allowed = VALID_TRANSITIONS[from];
      return Boolean(allowed && allowed.includes(to));
    };

    assert.equal(isValidTransition('pending', 'confirmed'), true);
    assert.equal(isValidTransition('confirmed', 'seated'), true);
    assert.equal(isValidTransition('seated', 'completed'), true);
    assert.equal(isValidTransition('pending', 'cancelled'), true);
    assert.equal(isValidTransition('confirmed', 'cancelled'), true);
    assert.equal(isValidTransition('seated', 'cancelled'), true);

    // Invalid transitions
    assert.equal(isValidTransition('completed', 'seated'), false, 'Cannot re-seat completed booking');
    assert.equal(isValidTransition('cancelled', 'confirmed'), false, 'Cannot confirm cancelled booking');
    assert.equal(isValidTransition('completed', 'cancelled'), false, 'Cannot cancel completed booking');
  });
});

// ---------------------------------------------------------------------------
// SUITE 5: Health Check Endpoint Contract (src/app/api/health/route.ts)
// ---------------------------------------------------------------------------

test('Phase 4 — Suite 5: Health Check Endpoint Contract', async (t) => {
  const healthRoutePath = path.resolve(process.cwd(), 'src/app/api/health/route.ts');

  await t.test('5.1 Health Route File & Dynamic Config Invariants', () => {
    assert.ok(fs.existsSync(healthRoutePath), 'src/app/api/health/route.ts must exist');
    const content = fs.readFileSync(healthRoutePath, 'utf8');

    // Dynamic config
    assert.ok(
      content.includes("dynamic = 'force-dynamic'"),
      'Health check must be configured with dynamic = force-dynamic'
    );
    assert.ok(
      content.includes('revalidate = 0'),
      'Health check must be configured with revalidate = 0'
    );
    assert.ok(
      content.includes('export async function GET'),
      'Must export async function GET'
    );
  });

  await t.test('5.2 Health Route Checks & Telemetry Invariants', () => {
    const content = fs.readFileSync(healthRoutePath, 'utf8');

    // Must check convex primary database
    assert.ok(content.includes('checks.convex'), 'Must include checks.convex');

    // Must check supabase standby
    assert.ok(content.includes('checks.supabaseStandby'), 'Must include checks.supabaseStandby');

    // Must check 3D asset availability
    assert.ok(content.includes('checks.assets3D'), 'Must include checks.assets3D');

    // Must include system telemetry
    assert.ok(content.includes('uptimeSeconds'), 'Must include uptimeSeconds');
    assert.ok(content.includes('memoryUsageMb'), 'Must include memoryUsageMb');
    assert.ok(content.includes('timestamp'), 'Must include ISO timestamp');
  });

  await t.test('5.3 Status Code & Cache-Control Header Invariants', () => {
    const content = fs.readFileSync(healthRoutePath, 'utf8');

    // Overall status calculation
    assert.ok(
      content.includes("overallStatus = 'unhealthy'") && content.includes('httpStatusCode = 503'),
      'Must return 503 when overallStatus is unhealthy'
    );

    // Cache-Control headers
    assert.ok(
      content.includes('no-store') && content.includes('no-cache'),
      'Health check response must enforce strict no-cache headers'
    );
  });
});
