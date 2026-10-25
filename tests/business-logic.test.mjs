import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Core business logic helpers
function calculateOrderTotals(items, taxRate = 0.05, tipPaise = 0) {
  const subtotalPaise = items.reduce((sum, item) => {
    const itemBase = item.dishPricePaise + (item.sizeModifierPaise || 0);
    const addonsTotal = (item.addons || []).reduce((aSum, a) => aSum + a.pricePaise, 0);
    return sum + (itemBase + addonsTotal) * item.quantity;
  }, 0);

  const taxPaise = Math.round(subtotalPaise * taxRate);
  const totalPaise = subtotalPaise + taxPaise + tipPaise;

  return { subtotalPaise, taxPaise, tipPaise, totalPaise };
}

function hasBookingConflict(existingBooking, newBooking) {
  // Existing booking times
  const existingStart = new Date(`${existingBooking.date}T${existingBooking.startTime}`);
  const existingEnd = new Date(existingStart.getTime() + existingBooking.durationMinutes * 60000);

  // New booking times
  const newStart = new Date(`${newBooking.date}T${newBooking.startTime}`);
  const newEnd = new Date(newStart.getTime() + newBooking.durationMinutes * 60000);

  // Overlap condition: StartA < EndB && EndA > StartB
  const isOverlap = existingStart < newEnd && existingEnd > newStart;
  const isSameTable = existingBooking.tableId === newBooking.tableId;

  return isSameTable && isOverlap;
}

function isHoldExpired(holdExpiresAtIso, currentTime = new Date()) {
  return new Date(holdExpiresAtIso).getTime() <= currentTime.getTime();
}

describe('Restaurant Business Logic - Pricing & Paise Calculations', () => {
  it('correctly calculates subtotal, 5% GST tax, and total in integer paise', () => {
    const items = [
      {
        dishPricePaise: 45000, // ₹450
        quantity: 2,
        sizeModifierPaise: 5000, // ₹50
        addons: [{ name: 'Extra Cheese', pricePaise: 6000 }], // ₹60
      },
      {
        dishPricePaise: 25000, // ₹250
        quantity: 1,
        sizeModifierPaise: 0,
        addons: [],
      },
    ];

    // Item 1: (45000 + 5000 + 6000) * 2 = 56000 * 2 = 112000 paise (₹1120)
    // Item 2: 25000 * 1 = 25000 paise (₹250)
    // Subtotal: 112000 + 25000 = 137000 paise (₹1370)
    // Tax (5%): 137000 * 0.05 = 6850 paise (₹68.50)
    // Tip: 2000 paise (₹20)
    // Total: 137000 + 6850 + 2000 = 145850 paise (₹1458.50)

    const totals = calculateOrderTotals(items, 0.05, 2000);

    assert.equal(totals.subtotalPaise, 137000);
    assert.equal(totals.taxPaise, 6850);
    assert.equal(totals.tipPaise, 2000);
    assert.equal(totals.totalPaise, 145850);
    assert.ok(Number.isInteger(totals.totalPaise), 'Total paise must be an integer');
  });
});

describe('Restaurant Booking - Conflict Detection & Double-Booking Prevention', () => {
  it('detects overlapping bookings on the same table', () => {
    const existing = {
      tableId: 'table-101',
      date: '2026-10-25',
      startTime: '19:00:00',
      durationMinutes: 90, // 19:00 - 20:30
    };

    const conflicting = {
      tableId: 'table-101',
      date: '2026-10-25',
      startTime: '20:00:00', // Overlaps by 30 mins
      durationMinutes: 90,
    };

    assert.equal(hasBookingConflict(existing, conflicting), true);
  });

  it('allows non-overlapping bookings on the same table', () => {
    const existing = {
      tableId: 'table-101',
      date: '2026-10-25',
      startTime: '19:00:00',
      durationMinutes: 90, // 19:00 - 20:30
    };

    const nextSlot = {
      tableId: 'table-101',
      date: '2026-10-25',
      startTime: '20:30:00', // Starts exactly when previous ends
      durationMinutes: 90,
    };

    assert.equal(hasBookingConflict(existing, nextSlot), false);
  });

  it('allows concurrent bookings on different tables', () => {
    const existing = {
      tableId: 'table-101',
      date: '2026-10-25',
      startTime: '19:00:00',
      durationMinutes: 90,
    };

    const differentTable = {
      tableId: 'table-102',
      date: '2026-10-25',
      startTime: '19:00:00',
      durationMinutes: 90,
    };

    assert.equal(hasBookingConflict(existing, differentTable), false);
  });
});

describe('Booking Hold Expiration', () => {
  it('correctly flags an expired hold time', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60000).toISOString();
    assert.equal(isHoldExpired(fiveMinutesAgo), true);
  });

  it('correctly keeps active holds valid', () => {
    const fiveMinutesFuture = new Date(Date.now() + 5 * 60000).toISOString();
    assert.equal(isHoldExpired(fiveMinutesFuture), false);
  });
});
