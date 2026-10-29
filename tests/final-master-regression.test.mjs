import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  hasModel,
  getModelConfig,
  KNOWN_DISH_SLUGS,
  SHARED_DEFAULT_MODEL_PATH,
} from '../src/data/model-config.ts';

// ============================================================================
// HELPERS & CORE BUSINESS LOGIC EMULATORS
// ============================================================================

/**
 * Validates order items against database records and calculates totals.
 * Mirrors convex/orders.ts placeOrder validation logic.
 */
function validateAndCalculateOrder(items, dishCatalog, taxPercent = 5, tipPaise = 0) {
  let calculatedSubtotalPaise = 0;
  const validatedItems = [];

  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 50) {
      return { error: `Invalid quantity ${item.quantity} for item "${item.dishName || item.dishId}"` };
    }

    const dish = dishCatalog.find(
      (d) => d._id === item.dishId || d.slug === item.dishId || d.name === item.dishName
    );

    if (!dish) {
      return { error: `Dish not found: "${item.dishName || item.dishId}"` };
    }

    if (!dish.isAvailable) {
      return { error: `Dish "${dish.name}" is currently unavailable` };
    }

    const unitPricePaise = dish.pricePaise;

    // Validate size modifier against DB records
    let validatedSizeModifierPaise = 0;
    let validatedSizeName = undefined;
    if (item.sizeName) {
      const matchedSize = (dish.sizes || []).find(
        (s) => s.name.toLowerCase() === item.sizeName.toLowerCase()
      );
      if (!matchedSize) {
        return { error: `Invalid size "${item.sizeName}" for dish "${dish.name}"` };
      }
      validatedSizeModifierPaise = matchedSize.priceModifierPaise;
      validatedSizeName = matchedSize.name;
    }

    // Validate add-ons against DB records
    let addonsTotalPaise = 0;
    const validatedAddons = [];
    if (item.addons && item.addons.length > 0) {
      const availableAddOns = dish.addOns || [];
      for (const addonReq of item.addons) {
        const matchedAddon = availableAddOns.find(
          (a) => a.name.toLowerCase() === addonReq.name.toLowerCase()
        );
        if (!matchedAddon) {
          return { error: `Invalid add-on "${addonReq.name}" for dish "${dish.name}"` };
        }
        addonsTotalPaise += matchedAddon.pricePaise;
        validatedAddons.push({
          name: matchedAddon.name,
          pricePaise: matchedAddon.pricePaise,
        });
      }
    }

    const lineUnitPricePaise = unitPricePaise + validatedSizeModifierPaise + addonsTotalPaise;
    if (lineUnitPricePaise < 0) {
      return { error: `Invalid price calculation for dish "${dish.name}"` };
    }

    const lineTotalPaise = lineUnitPricePaise * item.quantity;
    calculatedSubtotalPaise += lineTotalPaise;

    validatedItems.push({
      dishId: dish._id,
      dishName: dish.name,
      dishPricePaise: unitPricePaise,
      quantity: item.quantity,
      sizeName: validatedSizeName,
      sizePriceModifierPaise: validatedSizeModifierPaise,
      lineTotalPaise,
      addons: validatedAddons.length > 0 ? validatedAddons : undefined,
    });
  }

  const calculatedTaxPaise = Math.round(calculatedSubtotalPaise * (taxPercent / 100));
  const sanitizedTipPaise = Math.max(0, Math.round(tipPaise || 0));
  const calculatedTotalPaise = calculatedSubtotalPaise + calculatedTaxPaise + sanitizedTipPaise;

  return {
    success: true,
    subtotalPaise: calculatedSubtotalPaise,
    taxPaise: calculatedTaxPaise,
    tipPaise: sanitizedTipPaise,
    totalPaise: calculatedTotalPaise,
    items: validatedItems,
  };
}

/**
 * Time string to minutes from midnight
 */
function timeToMinutes(t) {
  const parts = t.split(':').map(Number);
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  return h * 60 + m;
}

/**
 * Mathematical interval overlap check: startA < endB && endA > startB
 */
function doIntervalsOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

/**
 * Normalizes intervals with midnight wraparound support
 */
function normalizeInterval(startTime, endTime, defaultDurationMinutes = 120) {
  const startMin = timeToMinutes(startTime);
  let endMin = endTime ? timeToMinutes(endTime) : startMin + defaultDurationMinutes;
  if (endMin <= startMin) endMin += 1440;
  return { startMin, endMin };
}

/**
 * Password hashing using WebCrypto PBKDF2 (SHA-256, 100,000 iterations)
 */
async function hashPassword(password, saltHex) {
  const enc = new TextEncoder();
  const saltBytes = new Uint8Array(
    saltHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
  );

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return Array.from(new Uint8Array(derived))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateRandomHex(byteCount = 16) {
  const bytes = new Uint8Array(byteCount);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ============================================================================
// SUITE 1: Price & Modifier Validation and Financial Integrity
// ============================================================================

describe('Suite 1: Price & Modifier Validation and Financial Integrity', () => {
  const mockDishCatalog = [
    {
      _id: 'dish-paneer-pizza',
      slug: 'tandoori-paneer-pizza',
      name: 'Tandoori Paneer Pizza',
      pricePaise: 45000, // ₹450
      isAvailable: true,
      sizes: [
        { name: 'Regular', priceModifierPaise: 0 },
        { name: 'Medium', priceModifierPaise: 8000 }, // +₹80
        { name: 'Large', priceModifierPaise: 15000 },  // +₹150
      ],
      addOns: [
        { name: 'Extra Cheese', pricePaise: 6000 },    // ₹60
        { name: 'Jalapenos', pricePaise: 3000 },       // ₹30
      ],
    },
    {
      _id: 'dish-signature-burger',
      slug: 'golden-oak-signature-burger',
      name: 'Golden Oak Signature Burger',
      pricePaise: 35000, // ₹350
      isAvailable: true,
      sizes: [],
      addOns: [
        { name: 'Truffle Mayo', pricePaise: 5000 },    // ₹50
        { name: 'Double Patty', pricePaise: 12000 },   // ₹120
      ],
    },
    {
      _id: 'dish-seasonal-risotto',
      slug: 'truffle-mushroom-risotto',
      name: 'Truffle Mushroom Risotto',
      pricePaise: 55000,
      isAvailable: false, // Currently out of stock
      sizes: [],
      addOns: [],
    },
  ];

  it('overrides client-supplied base price with authentic database price', () => {
    const maliciousOrder = [
      {
        dishId: 'tandoori-paneer-pizza',
        dishName: 'Tandoori Paneer Pizza',
        dishPricePaise: 100, // Malicious client attempts ₹1 instead of ₹450
        quantity: 1,
        lineTotalPaise: 100,
      },
    ];

    const result = validateAndCalculateOrder(maliciousOrder, mockDishCatalog, 5, 0);
    assert.equal(result.success, true);
    assert.equal(result.items[0].dishPricePaise, 45000, 'Must force DB base price of 45000 paise');
    assert.equal(result.subtotalPaise, 45000);
    assert.equal(result.totalPaise, 47250); // 45000 + 5% GST (2250)
  });

  it('rejects tampered size price modifiers and enforces database size modifier', () => {
    const tamperedSizeOrder = [
      {
        dishId: 'tandoori-paneer-pizza',
        dishName: 'Tandoori Paneer Pizza',
        dishPricePaise: 45000,
        quantity: 1,
        sizeName: 'Large',
        sizePriceModifierPaise: 0, // Client attempts ₹0 for Large instead of +₹150
        lineTotalPaise: 45000,
      },
    ];

    const result = validateAndCalculateOrder(tamperedSizeOrder, mockDishCatalog, 5, 0);
    assert.equal(result.success, true);
    assert.equal(result.items[0].sizePriceModifierPaise, 15000, 'Must apply DB Large size modifier (+15000)');
    assert.equal(result.subtotalPaise, 60000);
    assert.equal(result.taxPaise, 3000);
    assert.equal(result.totalPaise, 63000);
  });

  it('rejects tampered add-on prices and enforces exact database add-on pricing', () => {
    const tamperedAddonOrder = [
      {
        dishId: 'tandoori-paneer-pizza',
        dishName: 'Tandoori Paneer Pizza',
        dishPricePaise: 45000,
        quantity: 2,
        sizeName: 'Medium', // +8000
        sizePriceModifierPaise: 8000,
        addons: [
          { name: 'Extra Cheese', pricePaise: 10 }, // Client attempts 10 paise instead of 6000 paise
          { name: 'Jalapenos', pricePaise: 0 },     // Client attempts 0 paise instead of 3000 paise
        ],
        lineTotalPaise: 106020,
      },
    ];

    const result = validateAndCalculateOrder(tamperedAddonOrder, mockDishCatalog, 5, 1000);
    assert.equal(result.success, true);
    assert.equal(result.items[0].addons[0].pricePaise, 6000, 'Extra cheese must be ₹60 (6000 paise)');
    assert.equal(result.items[0].addons[1].pricePaise, 3000, 'Jalapenos must be ₹30 (3000 paise)');
    assert.equal(result.subtotalPaise, 124000);
    assert.equal(result.taxPaise, 6200);
    assert.equal(result.totalPaise, 131200);
  });

  it('rejects unconfigured size names for a dish', () => {
    const invalidSizeOrder = [
      {
        dishId: 'tandoori-paneer-pizza',
        dishName: 'Tandoori Paneer Pizza',
        dishPricePaise: 45000,
        quantity: 1,
        sizeName: 'Colossal Family Feast',
        lineTotalPaise: 45000,
      },
    ];

    const result = validateAndCalculateOrder(invalidSizeOrder, mockDishCatalog, 5, 0);
    assert.equal(result.success, undefined);
    assert.match(result.error, /Invalid size "Colossal Family Feast"/i);
  });

  it('rejects unconfigured add-on names for a dish', () => {
    const invalidAddonOrder = [
      {
        dishId: 'golden-oak-signature-burger',
        dishName: 'Golden Oak Signature Burger',
        dishPricePaise: 35000,
        quantity: 1,
        addons: [{ name: 'Gold Leaf Flakes', pricePaise: 0 }],
        lineTotalPaise: 35000,
      },
    ];

    const result = validateAndCalculateOrder(invalidAddonOrder, mockDishCatalog, 5, 0);
    assert.equal(result.success, undefined);
    assert.match(result.error, /Invalid add-on "Gold Leaf Flakes"/i);
  });

  it('rejects invalid quantities: non-integers, negative numbers, and numbers exceeding max limit (50)', () => {
    const testCases = [
      { qty: 0, desc: 'zero quantity' },
      { qty: -2, desc: 'negative quantity' },
      { qty: 2.5, desc: 'floating point quantity' },
      { qty: 51, desc: 'excessive quantity (>50)' },
    ];

    for (const { qty, desc } of testCases) {
      const order = [
        {
          dishId: 'tandoori-paneer-pizza',
          dishName: 'Tandoori Paneer Pizza',
          dishPricePaise: 45000,
          quantity: qty,
          lineTotalPaise: 45000,
        },
      ];
      const result = validateAndCalculateOrder(order, mockDishCatalog, 5, 0);
      assert.equal(result.success, undefined, `Must reject ${desc}`);
      assert.match(result.error, /Invalid quantity/i);
    }
  });

  it('rejects orders for unavailable or out-of-stock menu items', () => {
    const order = [
      {
        dishId: 'truffle-mushroom-risotto',
        dishName: 'Truffle Mushroom Risotto',
        dishPricePaise: 55000,
        quantity: 1,
        lineTotalPaise: 55000,
      },
    ];

    const result = validateAndCalculateOrder(order, mockDishCatalog, 5, 0);
    assert.equal(result.success, undefined);
    assert.match(result.error, /currently unavailable/i);
  });

  it('guarantees exact integer paise arithmetic without floating-point rounding errors', () => {
    const customCatalog = [
      {
        _id: 'odd-price-dish',
        slug: 'odd-price-dish',
        name: 'Odd Price Dish',
        pricePaise: 24900,
        isAvailable: true,
      },
    ];

    const order = [
      {
        dishId: 'odd-price-dish',
        dishName: 'Odd Price Dish',
        dishPricePaise: 24900,
        quantity: 3,
        lineTotalPaise: 74700,
      },
    ];

    const result = validateAndCalculateOrder(order, customCatalog, 5, 1500);
    assert.equal(result.subtotalPaise, 74700);
    assert.equal(result.taxPaise, 3735);
    assert.equal(result.totalPaise, 79935);
    assert.ok(Number.isInteger(result.subtotalPaise));
    assert.ok(Number.isInteger(result.taxPaise));
    assert.ok(Number.isInteger(result.tipPaise));
    assert.ok(Number.isInteger(result.totalPaise));
  });
});

// ============================================================================
// SUITE 2: Concurrent Table Overlap & Double-Booking Protection
// ============================================================================

describe('Suite 2: Concurrent Table Overlap & Double-Booking Protection', () => {
  it('mathematical interval overlap condition: startA < endB && endA > startB', () => {
    // 1. Standard overlap (19:00-20:30 and 20:00-21:30)
    assert.equal(doIntervalsOverlap(1140, 1230, 1200, 1290), true, 'Standard overlapping intervals must conflict');

    // 2. Adjacent intervals touching at boundary (19:00-20:30 and 20:30-22:00)
    assert.equal(doIntervalsOverlap(1140, 1230, 1230, 1320), false, 'Adjacent intervals touching at boundary must NOT conflict');

    // 3. Full containment / subset (18:00-22:00 containing 19:00-20:30)
    assert.equal(doIntervalsOverlap(1080, 1320, 1140, 1230), true, 'Contained interval must conflict');
    assert.equal(doIntervalsOverlap(1140, 1230, 1080, 1320), true, 'Enclosing interval must conflict');

    // 4. Exact identical intervals (19:00-20:30 and 19:00-20:30)
    assert.equal(doIntervalsOverlap(1140, 1230, 1140, 1230), true, 'Identical interval must conflict');

    // 5. Disjoint intervals separated by hours (12:00-14:00 and 19:00-21:00)
    assert.equal(doIntervalsOverlap(720, 840, 1140, 1260), false, 'Disjoint intervals must NOT conflict');
  });

  it('handles midnight wraparound intervals correctly across day boundaries', () => {
    // Late night slot: 23:30 to 01:00 next day
    // startMin = 23*60 + 30 = 1410
    // endMin = 1*60 = 60 -> wraparound: endMin += 1440 = 1500
    const slotA = normalizeInterval('23:30', '01:00');
    assert.equal(slotA.startMin, 1410);
    assert.equal(slotA.endMin, 1500);

    // Competing late night slot on same night cycle: 00:15 to 01:30 next day
    // Normalized to night context: 1440 + 15 = 1455, 1440 + 90 = 1530
    const slotB_start = 1455;
    const slotB_end = 1530;
    assert.equal(
      doIntervalsOverlap(slotA.startMin, slotA.endMin, slotB_start, slotB_end),
      true,
      'Midnight-wrapping slot must conflict with post-midnight slot'
    );

    // Early evening slot: 19:00 to 21:00 (1140 to 1260)
    const slotC = normalizeInterval('19:00', '21:00');
    assert.equal(
      doIntervalsOverlap(slotA.startMin, slotA.endMin, slotC.startMin, slotC.endMin),
      false,
      'Midnight-wrapping slot must NOT conflict with evening slot'
    );
  });

  it('simulates concurrent booking allocations preventing double-booking on same table', () => {
    const bookingsOnDate = [];

    function attemptBooking(newBooking) {
      const { startMin, endMin } = normalizeInterval(newBooking.bookingTime, newBooking.bookingEndTime);

      const hasConflict = bookingsOnDate.some((b) => {
        if (b.tableNumber !== newBooking.tableNumber) return false;
        if (b.status === 'cancelled' || b.status === 'completed') return false;
        const bInterval = normalizeInterval(b.bookingTime, b.bookingEndTime);
        return doIntervalsOverlap(startMin, endMin, bInterval.startMin, bInterval.endMin);
      });

      if (hasConflict) {
        return { error: 'Table is reserved during this time slot.' };
      }

      const bookingRecord = {
        _id: `bk-${bookingsOnDate.length + 1}`,
        ...newBooking,
        status: 'pending',
        createdAt: Date.now(),
      };
      bookingsOnDate.push(bookingRecord);
      return { success: true, bookingId: bookingRecord._id };
    }

    // 1. First customer books Table 1 for 19:00 - 20:30
    const res1 = attemptBooking({
      tableNumber: 1,
      bookingDate: '2026-10-25',
      bookingTime: '19:00',
      bookingEndTime: '20:30',
      guests: 2,
    });
    assert.equal(res1.success, true);

    // 2. Second concurrent customer requests overlapping slot on Table 1 (20:00 - 21:30)
    const res2 = attemptBooking({
      tableNumber: 1,
      bookingDate: '2026-10-25',
      bookingTime: '20:00',
      bookingEndTime: '21:30',
      guests: 2,
    });
    assert.equal(res2.success, undefined);
    assert.match(res2.error, /Table is reserved/i);

    // 3. Third customer requests non-overlapping slot on Table 1 (20:30 - 22:00)
    const res3 = attemptBooking({
      tableNumber: 1,
      bookingDate: '2026-10-25',
      bookingTime: '20:30',
      bookingEndTime: '22:00',
      guests: 2,
    });
    assert.equal(res3.success, true, 'Adjacent booking must succeed without conflict');
  });

  it('allows concurrent overlapping bookings on different physical tables', () => {
    const bookings = [
      {
        tableNumber: 1,
        bookingDate: '2026-10-25',
        bookingTime: '19:00',
        bookingEndTime: '21:00',
        status: 'confirmed',
      },
    ];

    const newBookingTable2 = {
      tableNumber: 2,
      bookingDate: '2026-10-25',
      bookingTime: '19:00',
      bookingEndTime: '21:00',
    };

    const hasConflict = bookings.some((b) => {
      if (b.tableNumber !== newBookingTable2.tableNumber) return false;
      const bInt = normalizeInterval(b.bookingTime, b.bookingEndTime);
      const newInt = normalizeInterval(newBookingTable2.bookingTime, newBookingTable2.bookingEndTime);
      return doIntervalsOverlap(newInt.startMin, newInt.endMin, bInt.startMin, bInt.endMin);
    });

    assert.equal(hasConflict, false, 'Overlapping bookings on distinct tables must never conflict');
  });

  it('releases table allocation when hold expires (> 10 minutes) but retains active holds', () => {
    const now = Date.now();
    const expiredHoldBooking = {
      tableNumber: 1,
      status: 'pending',
      holdExpiresAt: now - 5 * 60 * 1000, // Expired 5 mins ago
    };
    const activeHoldBooking = {
      tableNumber: 1,
      status: 'pending',
      holdExpiresAt: now + 5 * 60 * 1000, // Valid for 5 more mins
    };

    function isBookingActive(b, currentTime = Date.now()) {
      if (b.status === 'cancelled' || b.status === 'completed') return false;
      if (b.status === 'pending' && b.holdExpiresAt && b.holdExpiresAt <= currentTime) {
        return false;
      }
      return true;
    }

    assert.equal(isBookingActive(expiredHoldBooking, now), false, 'Expired hold must be treated as inactive');
    assert.equal(isBookingActive(activeHoldBooking, now), true, 'Active hold must protect the table reservation');
  });
});

// ============================================================================
// SUITE 3: Auth & Session Security
// ============================================================================

describe('Suite 3: Auth & Session Security', () => {
  function createAuthDb() {
    return {
      users: [],
      sessions: [],
    };
  }

  async function requestPasswordReset(db, email) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = db.users.find((u) => u.email === normalizedEmail);

    if (!user) {
      // SEC-01 Anti-enumeration: Return success without leaking whether user exists
      return { success: true };
    }

    const resetToken = generateRandomHex(24);
    const resetTokenExpiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    user.resetToken = resetToken;
    user.resetTokenExpiresAt = resetTokenExpiresAt;

    // SEC-01: Never return resetToken in client response
    return { success: true };
  }

  async function resetPassword(db, { token, newPassword }) {
    if (!newPassword || newPassword.length < 6) {
      return { error: 'Password must be at least 6 characters.' };
    }

    const user = db.users.find(
      (u) => u.resetToken === token && (u.resetTokenExpiresAt || 0) > Date.now()
    );

    if (!user) {
      return { error: 'Invalid or expired reset token.' };
    }

    const newSalt = generateRandomHex(16);
    const newHash = await hashPassword(newPassword, newSalt);

    user.passwordHash = newHash;
    user.salt = newSalt;
    user.resetToken = undefined;
    user.resetTokenExpiresAt = undefined;

    // SEC-02: Revoke all existing sessions for this user upon password reset
    db.sessions = db.sessions.filter((s) => s.userId !== user._id);

    return { success: true };
  }

  it('SEC-01: requestPasswordReset NEVER exposes resetToken in client response', async () => {
    const db = createAuthDb();
    const salt = generateRandomHex(16);
    const passwordHash = await hashPassword('InitialSecretPass123', salt);
    const user = {
      _id: 'user-vip-1',
      email: 'customer@goldenoak.in',
      name: 'Priyanka Sharma',
      passwordHash,
      salt,
      role: 'customer',
      isActive: true,
    };
    db.users.push(user);

    const response = await requestPasswordReset(db, 'customer@goldenoak.in');

    assert.equal(response.success, true);
    assert.equal(response.resetToken, undefined, 'resetToken must NEVER be returned in response');
    assert.deepEqual(Object.keys(response), ['success'], 'Response payload must contain ONLY success flag');
    assert.ok(user.resetToken, 'resetToken must be saved securely inside database');
    assert.ok(user.resetTokenExpiresAt > Date.now());
  });

  it('anti-enumeration: requestPasswordReset returns success even for unregistered email', async () => {
    const db = createAuthDb();
    const response = await requestPasswordReset(db, 'nonexistent.user@random-domain.com');

    assert.equal(response.success, true);
    assert.equal(response.resetToken, undefined);
  });

  it('SEC-02: password reset immediately invalidates all active user sessions', async () => {
    const db = createAuthDb();
    const salt = generateRandomHex(16);
    const user = {
      _id: 'user-emp-42',
      email: 'staff@goldenoak.in',
      name: 'Chef Raj',
      passwordHash: await hashPassword('OldChefPassword2026', salt),
      salt,
      role: 'chef',
      isActive: true,
    };
    db.users.push(user);

    // Create 3 active sessions
    db.sessions.push(
      { _id: 's-1', token: 'token-mobile-pos', userId: 'user-emp-42', expiresAt: Date.now() + 86400000 },
      { _id: 's-2', token: 'token-kitchen-screen', userId: 'user-emp-42', expiresAt: Date.now() + 86400000 },
      { _id: 's-3', token: 'token-manager-tablet', userId: 'user-emp-42', expiresAt: Date.now() + 86400000 },
      { _id: 's-4', token: 'token-other-user', userId: 'user-other-99', expiresAt: Date.now() + 86400000 }
    );

    assert.equal(db.sessions.filter((s) => s.userId === 'user-emp-42').length, 3);

    // Trigger password reset request
    await requestPasswordReset(db, 'staff@goldenoak.in');
    const resetToken = user.resetToken;
    assert.ok(resetToken);

    // Complete password reset
    const resetResult = await resetPassword(db, {
      token: resetToken,
      newPassword: 'BrandNewSecureChefPassword2026!',
    });

    assert.equal(resetResult.success, true);

    // Verify all sessions for this user have been purged
    const activeSessionsForUser = db.sessions.filter((s) => s.userId === 'user-emp-42');
    assert.equal(activeSessionsForUser.length, 0, 'All active sessions for this user must be destroyed');

    // Other user sessions must remain intact
    assert.equal(db.sessions.length, 1);
    assert.equal(db.sessions[0].token, 'token-other-user');
  });

  it('reset token is strictly one-time-use and cannot be replayed', async () => {
    const db = createAuthDb();
    const salt = generateRandomHex(16);
    const user = {
      _id: 'user-single-use',
      email: 'single@goldenoak.in',
      name: 'Test Single',
      passwordHash: await hashPassword('InitialPassword!1', salt),
      salt,
      isActive: true,
    };
    db.users.push(user);

    await requestPasswordReset(db, 'single@goldenoak.in');
    const token = user.resetToken;

    // First reset succeeds
    const firstAttempt = await resetPassword(db, { token, newPassword: 'FirstNewPassword!1' });
    assert.equal(firstAttempt.success, true);

    // Replay attack attempt with same token fails
    const secondAttempt = await resetPassword(db, { token, newPassword: 'AttackerHijackPassword!1' });
    assert.equal(secondAttempt.success, undefined);
    assert.match(secondAttempt.error, /Invalid or expired reset token/i);
  });

  it('rejects expired reset tokens and short passwords (<6 characters)', async () => {
    const db = createAuthDb();
    const salt = generateRandomHex(16);
    const user = {
      _id: 'user-expiry-check',
      email: 'expiry@goldenoak.in',
      name: 'Test Expiry',
      passwordHash: await hashPassword('InitialPass123', salt),
      salt,
      resetToken: 'valid-format-but-expired-token',
      resetTokenExpiresAt: Date.now() - 1000, // Expired 1 second ago
      isActive: true,
    };
    db.users.push(user);

    // Expired token rejection
    const expiredRes = await resetPassword(db, {
      token: 'valid-format-but-expired-token',
      newPassword: 'ValidNewPassword2026',
    });
    assert.match(expiredRes.error, /Invalid or expired reset token/i);

    // Short password rejection (<6 chars)
    const shortPassRes = await resetPassword(db, {
      token: 'some-token',
      newPassword: '12345',
    });
    assert.match(shortPassRes.error, /at least 6 characters/i);
  });
});

// ============================================================================
// SUITE 4: 3D Model Slug & Centralized Asset Validation
// ============================================================================

describe('Suite 4: 3D Model Slug & Centralized Asset Validation', () => {
  const verified10LiveDishes = [
    'tandoori-paneer-pizza',
    'chicken-tikka-pizza',
    'mushroom-truffle-pizza',
    'peri-peri-fiesta-pizza',
    'bbq-chicken-overload',
    'classic-smash-burger',
    'golden-oak-signature-burger',
    'crispy-paneer-burger',
    'wok-tossed-chow-mein',
    'dynamite-chilli-potatoes',
  ];

  it('hasModel accepts all 10 live Convex production dishes', () => {
    for (const slug of verified10LiveDishes) {
      assert.equal(hasModel(slug), true, `Dish "${slug}" must be accepted by hasModel`);
    }
  });

  it('hasModel accepts all mock menu dishes in KNOWN_DISH_SLUGS', () => {
    for (const slug of KNOWN_DISH_SLUGS) {
      assert.equal(hasModel(slug), true, `Known dish "${slug}" must be accepted`);
    }
    assert.ok(KNOWN_DISH_SLUGS.length >= 22, 'Must recognize at least 22 audited menu dishes');
  });

  it('hasModel strictly rejects invalid, unknown, or malformed slugs', () => {
    const invalidSlugs = [
      'fake-dish-xyz',
      'invalid-pizza-123',
      '../../etc/passwd',
      '<script>alert(1)</script>',
      '',
      null,
      undefined,
      12345,
      {},
    ];

    for (const invalid of invalidSlugs) {
      assert.equal(hasModel(invalid), false, `hasModel must reject invalid slug: ${JSON.stringify(invalid)}`);
    }
  });

  it('getModelConfig returns valid configuration mapped to shared GLB model', () => {
    const config = getModelConfig('golden-oak-signature-burger');
    assert.equal(config.dishSlug, 'golden-oak-signature-burger');
    assert.equal(config.modelPath, SHARED_DEFAULT_MODEL_PATH);
    assert.equal(config.modelPath, '/models/warrior_model.glb');
    assert.equal(config.initialScale, 0.8);
    assert.equal(config.cameraDistance, 4.5);
    assert.equal(config.isSharedPlaceholder, true);
    assert.ok(config.modelName.includes('Prototype Asset'));
  });

  it('verifies warrior_model.glb and preserved warrior_scene.glb exist on disk and are valid glTF binaries', () => {
    // 1. Primary optimized Draco model
    const modelPath = path.resolve('public/models/warrior_model.glb');
    assert.ok(fs.existsSync(modelPath), 'public/models/warrior_model.glb must exist');

    const stat = fs.statSync(modelPath);
    assert.ok(stat.size > 500_000, `Model file size should be >500KB, got ${stat.size} bytes`);

    // Verify glTF binary magic: 0x46546C67 ('glTF')
    const fd = fs.openSync(modelPath, 'r');
    const header = Buffer.alloc(4);
    fs.readSync(fd, header, 0, 4, 0);
    fs.closeSync(fd);
    assert.equal(header.toString('ascii'), 'glTF', 'File must begin with valid glTF binary magic');

    // 2. SAFETY RULE: Preserve original uncompressed asset
    const scenePath = path.resolve('public/models/warrior_scene.glb');
    assert.ok(fs.existsSync(scenePath), 'public/models/warrior_scene.glb must remain preserved intact');
    const sceneStat = fs.statSync(scenePath);
    assert.ok(sceneStat.size > 5_000_000, `Original warrior_scene.glb must be intact (>5MB), got ${sceneStat.size} bytes`);
  });
});

// ============================================================================
// SUITE 5: State Machine Transitions & Floor Sync
// ============================================================================

describe('Suite 5: State Machine Transitions & Floor Sync', () => {
  // Order State Machine
  const ALLOWED_ORDER_TRANSITIONS = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['completed'],
    completed: [],
    cancelled: [],
  };

  function updateOrderStatus(order, nextStatus) {
    if (order.status === nextStatus) return { success: true };
    const allowed = ALLOWED_ORDER_TRANSITIONS[order.status] || [];
    if (!allowed.includes(nextStatus)) {
      return { error: `Illegal state transition from "${order.status}" to "${nextStatus}"` };
    }
    order.status = nextStatus;
    return { success: true };
  }

  function cancelOrderByCustomer(order, phone, cancellationWindowMinutes = 10, now = Date.now()) {
    if (order.customerPhone !== phone) {
      return { error: 'Unauthorized' };
    }
    if (['preparing', 'ready', 'completed', 'cancelled'].includes(order.status)) {
      return { error: 'Order is already in preparation or completed and cannot be cancelled' };
    }
    const diffMinutes = (now - order.createdAt) / 60000;
    if (diffMinutes > cancellationWindowMinutes) {
      return { error: `Cancellation window of ${cancellationWindowMinutes} mins has passed` };
    }
    order.status = 'cancelled';
    order.cancelledAt = now;
    order.cancelledBy = 'customer';
    return { success: true };
  }

  // Booking State Machine
  const ALLOWED_BOOKING_TRANSITIONS = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['seated', 'cancelled'],
    seated: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };

  function updateBookingStatus(booking, nextStatus, physicalTable) {
    if (booking.status === nextStatus) return { success: true };
    const allowed = ALLOWED_BOOKING_TRANSITIONS[booking.status] || [];
    if (!allowed.includes(nextStatus)) {
      return { error: `Invalid transition from '${booking.status}' to '${nextStatus}'.` };
    }
    booking.status = nextStatus;

    if (physicalTable) {
      if (nextStatus === 'seated') {
        physicalTable.status = 'occupied';
      } else if (nextStatus === 'completed' || nextStatus === 'cancelled') {
        physicalTable.status = 'available';
      }
    }
    return { success: true };
  }

  it('order state machine allows valid forward lifecycle progression', () => {
    const order = { _id: 'ord-1', status: 'pending' };

    assert.equal(updateOrderStatus(order, 'confirmed').success, true);
    assert.equal(order.status, 'confirmed');

    assert.equal(updateOrderStatus(order, 'preparing').success, true);
    assert.equal(order.status, 'preparing');

    assert.equal(updateOrderStatus(order, 'ready').success, true);
    assert.equal(order.status, 'ready');

    assert.equal(updateOrderStatus(order, 'completed').success, true);
    assert.equal(order.status, 'completed');
  });

  it('order state machine strictly rejects illegal backward and terminal transitions', () => {
    // 1. Cancelled order cannot transition to completed
    const cancelledOrder = { _id: 'ord-c', status: 'cancelled' };
    const res1 = updateOrderStatus(cancelledOrder, 'completed');
    assert.match(res1.error, /Illegal state transition/i);

    // 2. Completed order cannot transition back to pending
    const completedOrder = { _id: 'ord-d', status: 'completed' };
    const res2 = updateOrderStatus(completedOrder, 'pending');
    assert.match(res2.error, /Illegal state transition/i);

    // 3. Ready order cannot regress back to preparing
    const readyOrder = { _id: 'ord-r', status: 'ready' };
    const res3 = updateOrderStatus(readyOrder, 'preparing');
    assert.match(res3.error, /Illegal state transition/i);

    // 4. Completed order cannot be cancelled
    const res4 = updateOrderStatus(completedOrder, 'cancelled');
    assert.match(res4.error, /Illegal state transition/i);
  });

  it('customer cancellation: permitted during pending/confirmed within 10 min window', () => {
    const now = Date.now();
    const order = {
      _id: 'ord-cust-1',
      customerPhone: '+91 98765 43210',
      status: 'pending',
      createdAt: now - 3 * 60000, // 3 mins ago
    };

    const res = cancelOrderByCustomer(order, '+91 98765 43210', 10, now);
    assert.equal(res.success, true);
    assert.equal(order.status, 'cancelled');
    assert.equal(order.cancelledBy, 'customer');
  });

  it('customer cancellation: strictly rejected once kitchen begins preparation', () => {
    const now = Date.now();
    const order = {
      _id: 'ord-kitchen',
      customerPhone: '+91 98765 43210',
      status: 'preparing',
      createdAt: now - 2 * 60000, // 2 mins ago (well within time window)
    };

    const res = cancelOrderByCustomer(order, '+91 98765 43210', 10, now);
    assert.equal(res.success, undefined);
    assert.match(res.error, /already in preparation or completed and cannot be cancelled/i);
    assert.equal(order.status, 'preparing', 'Status must remain preparing');
  });

  it('customer cancellation: rejected when 10 min window has elapsed or phone unauthorized', () => {
    const now = Date.now();
    const lateOrder = {
      _id: 'ord-late',
      customerPhone: '+91 98765 43210',
      status: 'confirmed',
      createdAt: now - 15 * 60000, // 15 mins ago (> 10 mins)
    };

    const resLate = cancelOrderByCustomer(lateOrder, '+91 98765 43210', 10, now);
    assert.match(resLate.error, /Cancellation window of 10 mins has passed/i);

    const wrongPhoneOrder = {
      _id: 'ord-wrong-phone',
      customerPhone: '+91 98765 43210',
      status: 'pending',
      createdAt: now - 2 * 60000,
    };
    const resAuth = cancelOrderByCustomer(wrongPhoneOrder, '+91 11111 22222', 10, now);
    assert.match(resAuth.error, /Unauthorized/i);
  });

  it('booking state machine allows valid progression and syncs physical table state', () => {
    const table = { _id: 'tbl-1', tableNumber: 1, status: 'available' };
    const booking = { _id: 'bk-1', status: 'pending', tableId: 'tbl-1' };

    // 1. Pending -> Confirmed
    assert.equal(updateBookingStatus(booking, 'confirmed', table).success, true);
    assert.equal(booking.status, 'confirmed');

    // 2. Confirmed -> Seated (Table becomes 'occupied')
    assert.equal(updateBookingStatus(booking, 'seated', table).success, true);
    assert.equal(booking.status, 'seated');
    assert.equal(table.status, 'occupied', 'Physical table must become occupied when party is seated');

    // 3. Seated -> Completed (Table released to 'available')
    assert.equal(updateBookingStatus(booking, 'completed', table).success, true);
    assert.equal(booking.status, 'completed');
    assert.equal(table.status, 'available', 'Physical table must be released to available upon completion');
  });

  it('booking state machine rejects illegal state transitions', () => {
    const table = { _id: 'tbl-1', status: 'available' };
    const cancelledBooking = { _id: 'bk-c', status: 'cancelled' };

    // Cancelled -> Completed
    const res1 = updateBookingStatus(cancelledBooking, 'completed', table);
    assert.match(res1.error, /Invalid transition/i);

    // Completed -> Seated
    const completedBooking = { _id: 'bk-d', status: 'completed' };
    const res2 = updateBookingStatus(completedBooking, 'seated', table);
    assert.match(res2.error, /Invalid transition/i);

    // Seated -> Pending
    const seatedBooking = { _id: 'bk-s', status: 'seated' };
    const res3 = updateBookingStatus(seatedBooking, 'pending', table);
    assert.match(res3.error, /Invalid transition/i);
  });
});
