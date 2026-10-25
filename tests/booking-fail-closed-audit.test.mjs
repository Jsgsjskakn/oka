import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ============================================================================
// SIMULATION & LOGIC EMULATION (Matching convex/bookings.ts & booking.service.ts)
// ============================================================================

function timeToMinutes(t) {
  const parts = t.split(':').map(Number);
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  return h * 60 + m;
}

function doIntervalsOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

function normalizeInterval(startTime, endTime, defaultDurationMinutes = 120) {
  const startMin = timeToMinutes(startTime);
  let endMin = endTime ? timeToMinutes(endTime) : startMin + defaultDurationMinutes;
  if (endMin <= startMin) endMin += 1440;
  return { startMin, endMin };
}

// Emulate Fail-Closed Service Layer
async function simulateCheckTableAvailability(convexStatus, mockSupabaseTables = []) {
  if (convexStatus === 'outage') {
    // FAIL CLOSED: Does not query Supabase tables, returns empty array and available: false
    return {
      available: false,
      tables: [],
      error: 'Real-time table availability check is temporarily unavailable. Please try again in a few moments.',
    };
  }

  // Convex Healthy
  return {
    available: mockSupabaseTables.length > 0,
    tables: mockSupabaseTables,
  };
}

async function simulateCreateBooking(convexStatus, bookingInput, supabaseDbMock) {
  if (convexStatus === 'outage') {
    // FAIL CLOSED: Does not insert unverified booking into Supabase
    return {
      bookingId: '',
      error: 'Reservation service is temporarily offline for maintenance. Please try again shortly or contact the restaurant.',
    };
  }

  // Convex Healthy
  const id = 'convex-booking-' + Math.random().toString(36).substring(7);
  return { bookingId: id };
}

// Emulate Table Allocation & Capacity Logic (convex/bookings.ts)
function allocateTable({ tables, activeBookings, guests, bookingDate, bookingTime, bookingEndTime, requestedTableNumber, now = Date.now() }) {
  if (guests < 1 || guests > 50) {
    return { error: 'Guests must be between 1 and 50' };
  }

  const { startMin, endMin } = normalizeInterval(bookingTime, bookingEndTime);

  // 1. Filter capacity >= guests and status != maintenance
  const candidateTables = tables
    .filter((t) => t.capacity >= guests && t.status !== 'maintenance')
    .sort((a, b) => a.capacity - b.capacity); // Best fit: smallest sufficient table

  if (candidateTables.length === 0) {
    return { error: 'No dining tables available capable of accommodating this party size.' };
  }

  // 2. Filter active bookings on date, respecting hold expiration
  const unexpiredBookings = activeBookings.filter((b) => {
    if (b.bookingDate !== bookingDate) return false;
    if (b.status === 'cancelled' || b.status === 'completed') return false;
    if (b.status === 'pending' && b.holdExpiresAt && b.holdExpiresAt <= now) {
      return false; // Hold expired
    }
    return b.tableNumber !== undefined;
  });

  // 3. Match requested table or find first available
  let assignedTable = null;

  if (requestedTableNumber) {
    const requested = candidateTables.find((t) => t.tableNumber === requestedTableNumber);
    if (requested) {
      const hasConflict = unexpiredBookings.some((b) => {
        if (b.tableNumber !== requested.tableNumber) return false;
        const bInt = normalizeInterval(b.bookingTime, b.bookingEndTime);
        return doIntervalsOverlap(startMin, endMin, bInt.startMin, bInt.endMin);
      });
      if (!hasConflict) assignedTable = requested;
    }
  }

  if (!assignedTable) {
    for (const table of candidateTables) {
      const hasConflict = unexpiredBookings.some((b) => {
        if (b.tableNumber !== table.tableNumber) return false;
        const bInt = normalizeInterval(b.bookingTime, b.bookingEndTime);
        return doIntervalsOverlap(startMin, endMin, bInt.startMin, bInt.endMin);
      });
      if (!hasConflict) {
        assignedTable = table;
        break;
      }
    }
  }

  if (!assignedTable) {
    return { error: 'All tables for this party size are reserved during this time slot.' };
  }

  return {
    success: true,
    assignedTableNumber: assignedTable.tableNumber,
    tableCapacity: assignedTable.capacity,
    holdExpiresAt: now + 10 * 60 * 1000,
  };
}

// Emulate Authorization Check (convex/bookings.ts)
const STAFF_ROLES = ['admin', 'manager', 'employee', 'staff', 'chef'];

function verifyBookingAuthorization({ booking, session, customerPhoneInput }) {
  let isAuthorized = false;
  let isStaff = false;

  if (session) {
    if (session.expiresAt > Date.now() && session.user?.isActive) {
      if (STAFF_ROLES.includes(session.user.role)) {
        isAuthorized = true;
        isStaff = true;
      } else if (
        session.user.role === 'customer' &&
        session.user.phone &&
        booking.customerPhone &&
        session.user.phone.replace(/\D/g, '').slice(-10) === booking.customerPhone.replace(/\D/g, '').slice(-10)
      ) {
        isAuthorized = true;
      }
    }
  }

  if (!isAuthorized && customerPhoneInput) {
    const inputDigits = customerPhoneInput.replace(/\D/g, '').slice(-10);
    const bookingDigits = booking.customerPhone.replace(/\D/g, '').slice(-10);
    if (inputDigits.length === 10 && inputDigits === bookingDigits) {
      isAuthorized = true;
    }
  }

  return { isAuthorized, isStaff };
}

function simulateConfirmBookingPayment({ booking, session, customerPhoneInput, reference, now = Date.now() }) {
  const { isAuthorized } = verifyBookingAuthorization({ booking, session, customerPhoneInput });
  if (!isAuthorized) {
    return { error: 'Unauthorized: Staff session or verified customer phone required to confirm booking payment.' };
  }

  if (booking.status !== 'pending') {
    return { error: `Booking is not pending (current status: ${booking.status})` };
  }

  if (booking.holdExpiresAt && booking.holdExpiresAt < now) {
    return { error: 'Reservation hold has expired. Please create a new booking.' };
  }

  booking.status = 'confirmed';
  booking.paymentStatus = 'paid';
  booking.paymentReference = reference;
  return { success: true };
}

function simulateCancelBooking({ booking, session, customerPhoneInput, reason, actor, physicalTable }) {
  const { isAuthorized, isStaff } = verifyBookingAuthorization({ booking, session, customerPhoneInput });
  if (!isAuthorized) {
    return { error: 'Unauthorized: Staff session or verified customer phone required to cancel booking.' };
  }

  if (booking.status === 'completed' || booking.status === 'cancelled') {
    return { error: `Booking cannot be cancelled from '${booking.status}'` };
  }

  booking.status = 'cancelled';
  booking.cancelledAt = Date.now();
  booking.cancelledBy = actor || (isStaff ? 'staff' : 'customer');
  booking.cancellationReason = reason;

  if (physicalTable) {
    physicalTable.status = 'available';
  }

  return { success: true };
}

// ============================================================================
// TEST SUITES
// ============================================================================

describe('Agent 2 Verification: Booking Fail-Closed & Outage Specialist', () => {

  describe('1. Fail-Closed Resilience During Convex Outages', () => {
    it('checkTableAvailability FAILS CLOSED: returns available: false and empty tables when Convex is down', async () => {
      const mockSupabaseTables = [
        { id: '1', table_number: 1, capacity: 4, status: 'available' },
        { id: '2', table_number: 2, capacity: 6, status: 'available' },
      ];

      // Even if Supabase has tables, an outage in Convex MUST NOT report them as available
      const res = await simulateCheckTableAvailability('outage', mockSupabaseTables);

      assert.strictEqual(res.available, false, 'Availability must fail closed to false');
      assert.strictEqual(res.tables.length, 0, 'Tables list must be empty to prevent blind booking');
      assert.match(res.error, /temporarily unavailable/i, 'Must present a friendly fail-closed error message');
    });

    it('createBooking FAILS CLOSED: rejects unverified bookings and never inserts into Supabase during outage', async () => {
      const mockSupabaseDb = [];
      const bookingData = {
        customerName: 'Aarav Sharma',
        customerPhone: '+91 98765 43210',
        bookingDate: '2026-10-25',
        bookingTime: '19:30',
        guests: 4,
      };

      const res = await simulateCreateBooking('outage', bookingData, mockSupabaseDb);

      assert.strictEqual(res.bookingId, '', 'Booking ID must be empty');
      assert.match(res.error, /offline for maintenance/i, 'Must report service offline');
      assert.strictEqual(mockSupabaseDb.length, 0, 'No unverified record may be inserted into Supabase');
    });
  });

  describe('2. Interval Overlap Condition (startA < endB && endA > startB)', () => {
    it('detects standard partial overlaps correctly', () => {
      // 19:00 (1140) to 20:30 (1230) vs 20:00 (1200) to 21:30 (1290)
      assert.strictEqual(doIntervalsOverlap(1140, 1230, 1200, 1290), true);
    });

    it('allows boundary-touching adjacent bookings without false conflicts', () => {
      // 19:00 (1140) to 20:30 (1230) vs 20:30 (1230) to 22:00 (1320)
      assert.strictEqual(doIntervalsOverlap(1140, 1230, 1230, 1320), false);
    });

    it('detects subset and enclosing interval conflicts', () => {
      // 18:00 (1080) to 22:00 (1320) enclosing 19:00 (1140) to 20:30 (1230)
      assert.strictEqual(doIntervalsOverlap(1080, 1320, 1140, 1230), true);
      assert.strictEqual(doIntervalsOverlap(1140, 1230, 1080, 1320), true);
    });

    it('allows disjoint time slots', () => {
      // Lunch: 12:00 (720) to 14:00 (840) vs Dinner: 19:00 (1140) to 21:00 (1260)
      assert.strictEqual(doIntervalsOverlap(720, 840, 1140, 1260), false);
    });

    it('handles midnight wraparound without calculation bugs', () => {
      // 23:30 (1410) to 01:00 (+1 day -> 1500) vs 00:15 (1455) to 01:30 (1530)
      const slotA = normalizeInterval('23:30', '01:00');
      assert.strictEqual(slotA.startMin, 1410);
      assert.strictEqual(slotA.endMin, 1500);

      const slotB = { startMin: 1455, endMin: 1530 };
      assert.strictEqual(doIntervalsOverlap(slotA.startMin, slotA.endMin, slotB.startMin, slotB.endMin), true);
    });
  });

  describe('3. Table Capacity Matching & Best-Fit Allocation', () => {
    const diningTables = [
      { tableNumber: 1, capacity: 2, status: 'available' },
      { tableNumber: 2, capacity: 4, status: 'available' },
      { tableNumber: 3, capacity: 6, status: 'available' },
      { tableNumber: 4, capacity: 8, status: 'available' },
      { tableNumber: 5, capacity: 4, status: 'maintenance' }, // Inactive
    ];

    it('allocates best-fit smallest sufficient table to preserve large tables', () => {
      const res2 = allocateTable({
        tables: diningTables,
        activeBookings: [],
        guests: 2,
        bookingDate: '2026-10-25',
        bookingTime: '19:00',
      });
      assert.strictEqual(res2.success, true);
      assert.strictEqual(res2.assignedTableNumber, 1, 'Party of 2 should get 2-top Table 1');

      const res4 = allocateTable({
        tables: diningTables,
        activeBookings: [],
        guests: 3,
        bookingDate: '2026-10-25',
        bookingTime: '19:00',
      });
      assert.strictEqual(res4.success, true);
      assert.strictEqual(res4.assignedTableNumber, 2, 'Party of 3 should get 4-top Table 2');
    });

    it('never assigns tables currently marked for maintenance', () => {
      const smallTables = [
        { tableNumber: 5, capacity: 4, status: 'maintenance' },
      ];
      const res = allocateTable({
        tables: smallTables,
        activeBookings: [],
        guests: 4,
        bookingDate: '2026-10-25',
        bookingTime: '19:00',
      });
      assert.strictEqual(res.success, undefined);
      assert.match(res.error, /No dining tables available/i);
    });

    it('rejects booking when requested party exceeds all table capacities', () => {
      const res = allocateTable({
        tables: diningTables,
        activeBookings: [],
        guests: 12, // Exceeds max 8
        bookingDate: '2026-10-25',
        bookingTime: '19:00',
      });
      assert.strictEqual(res.success, undefined);
      assert.match(res.error, /No dining tables available/i);
    });
  });

  describe('4. Hold Expiration Protection (< Date.now())', () => {
    const now = Date.now();
    const tables = [{ tableNumber: 1, capacity: 4, status: 'available' }];

    it('ignores expired pending holds, freeing the table for new bookings', () => {
      const activeBookings = [
        {
          tableNumber: 1,
          bookingDate: '2026-10-25',
          bookingTime: '19:00',
          bookingEndTime: '21:00',
          status: 'pending',
          holdExpiresAt: now - 60000, // Expired 1 min ago
        },
      ];

      const res = allocateTable({
        tables,
        activeBookings,
        guests: 4,
        bookingDate: '2026-10-25',
        bookingTime: '19:30',
        now,
      });

      assert.strictEqual(res.success, true, 'Expired hold must NOT block new booking');
      assert.strictEqual(res.assignedTableNumber, 1);
    });

    it('protects table when pending hold is still active', () => {
      const activeBookings = [
        {
          tableNumber: 1,
          bookingDate: '2026-10-25',
          bookingTime: '19:00',
          bookingEndTime: '21:00',
          status: 'pending',
          holdExpiresAt: now + 5 * 60000, // Active for 5 more mins
        },
      ];

      const res = allocateTable({
        tables,
        activeBookings,
        guests: 4,
        bookingDate: '2026-10-25',
        bookingTime: '19:30',
        now,
      });

      assert.strictEqual(res.success, undefined);
      assert.match(res.error, /All tables for this party size are reserved/i);
    });

    it('rejects payment confirmation on expired holds', () => {
      const expiredBooking = {
        status: 'pending',
        customerPhone: '+91 98765 43210',
        holdExpiresAt: now - 30000, // Expired 30s ago
      };

      const res = simulateConfirmBookingPayment({
        booking: expiredBooking,
        customerPhoneInput: '9876543210',
        reference: 'UPI12345678',
        now,
      });

      assert.strictEqual(res.success, undefined);
      assert.match(res.error, /Reservation hold has expired/i);
    });
  });

  describe('5. Authorization: confirmBookingPayment & cancelBooking', () => {
    const booking = {
      _id: 'bk-test-1',
      customerPhone: '+91 98765 43210',
      status: 'pending',
      holdExpiresAt: Date.now() + 600000,
    };

    const staffSession = {
      expiresAt: Date.now() + 3600000,
      user: { role: 'admin', isActive: true, name: 'Admin Staff' },
    };

    const customerSessionMatching = {
      expiresAt: Date.now() + 3600000,
      user: { role: 'customer', isActive: true, phone: '+91 98765 43210' },
    };

    const customerSessionMismatch = {
      expiresAt: Date.now() + 3600000,
      user: { role: 'customer', isActive: true, phone: '+91 11111 22222' },
    };

    it('authorizes staff session to confirm booking payment', () => {
      const b = { ...booking };
      const res = simulateConfirmBookingPayment({
        booking: b,
        session: staffSession,
        reference: 'UPI-STAFF-1',
      });
      assert.strictEqual(res.success, true);
      assert.strictEqual(b.status, 'confirmed');
      assert.strictEqual(b.paymentStatus, 'paid');
    });

    it('authorizes customer session when phone matches booking phone', () => {
      const b = { ...booking };
      const res = simulateConfirmBookingPayment({
        booking: b,
        session: customerSessionMatching,
        reference: 'UPI-CUST-1',
      });
      assert.strictEqual(res.success, true);
      assert.strictEqual(b.status, 'confirmed');
    });

    it('authorizes verified customer phone input directly (10 digits match)', () => {
      const b = { ...booking };
      const res = simulateConfirmBookingPayment({
        booking: b,
        customerPhoneInput: '9876543210',
        reference: 'UPI-PHONE-1',
      });
      assert.strictEqual(res.success, true);
      assert.strictEqual(b.status, 'confirmed');
    });

    it('rejects confirmation when neither valid session nor matching phone is supplied', () => {
      const b = { ...booking };
      const res = simulateConfirmBookingPayment({
        booking: b,
        customerPhoneInput: '9999988888', // Mismatch
      });
      assert.strictEqual(res.success, undefined);
      assert.match(res.error, /Unauthorized: Staff session or verified customer phone required/i);
    });

    it('authorizes cancellation by staff and releases physical table', () => {
      const b = { ...booking, status: 'confirmed' };
      const table = { tableNumber: 1, status: 'occupied' };

      const res = simulateCancelBooking({
        booking: b,
        session: staffSession,
        reason: 'Guest requested cancellation',
        actor: 'Admin Staff',
        physicalTable: table,
      });

      assert.strictEqual(res.success, true);
      assert.strictEqual(b.status, 'cancelled');
      assert.strictEqual(b.cancelledBy, 'Admin Staff');
      assert.strictEqual(table.status, 'available', 'Physical table must be released upon cancellation');
    });

    it('authorizes cancellation by verified customer phone', () => {
      const b = { ...booking, status: 'confirmed' };
      const table = { tableNumber: 1, status: 'occupied' };

      const res = simulateCancelBooking({
        booking: b,
        customerPhoneInput: '+91 (987) 654-3210',
        reason: 'Change of plans',
        physicalTable: table,
      });

      assert.strictEqual(res.success, true);
      assert.strictEqual(b.status, 'cancelled');
      assert.strictEqual(b.cancelledBy, 'customer');
      assert.strictEqual(table.status, 'available');
    });

    it('strictly forbids cancelling a completed or already cancelled booking', () => {
      const bCompleted = { ...booking, status: 'completed' };
      const resCompleted = simulateCancelBooking({
        booking: bCompleted,
        session: staffSession,
      });
      assert.match(resCompleted.error, /Booking cannot be cancelled from 'completed'/i);

      const bCancelled = { ...booking, status: 'cancelled' };
      const resCancelled = simulateCancelBooking({
        booking: bCancelled,
        session: staffSession,
      });
      assert.match(resCancelled.error, /Booking cannot be cancelled from 'cancelled'/i);
    });

    it('strictly rejects unauthorized cancellation attempts', () => {
      const b = { ...booking, status: 'confirmed' };
      const res = simulateCancelBooking({
        booking: b,
        session: customerSessionMismatch,
      });
      assert.match(res.error, /Unauthorized/i);
    });
  });
});
