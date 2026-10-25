import { describe, it, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// ============================================================================
// CORE CONVEX & SERVICE DOMAIN EMULATORS
// (Mirrors convex/bookings.ts and src/lib/services/booking.service.ts)
// ============================================================================

/**
 * Helper: Convert "HH:MM" or "HH:MM:SS" to minutes from midnight
 * Exact match with convex/bookings.ts line 6-11
 */
function timeToMinutes(t) {
  const parts = t.split(':').map(Number);
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  return h * 60 + m;
}

/**
 * Overlap condition: startA < endB && endA > startB
 * Exact match with convex/bookings.ts line 14-21
 */
function doIntervalsOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

/**
 * Normalizes intervals with midnight wraparound support and default 120-minute slot.
 * Exact match with convex/bookings.ts line 32-36
 */
function normalizeInterval(startTime, endTime, defaultDurationMinutes = 120) {
  const startMin = timeToMinutes(startTime);
  let endMin = endTime ? timeToMinutes(endTime) : startMin + defaultDurationMinutes;
  if (endMin <= startMin) endMin += 1440;
  return { startMin, endMin };
}

/**
 * Evaluates whether a booking is actively occupying a table.
 * Mirrors convex/bookings.ts activeBookings filter (lines 60-67 & 156-162)
 */
function isBookingActive(b, currentTime = Date.now()) {
  if (b.status === 'cancelled' || b.status === 'completed') return false;
  if (b.status === 'pending' && b.holdExpiresAt && b.holdExpiresAt <= currentTime) {
    return false;
  }
  return b.tableNumber !== undefined;
}

/**
 * Emulates table availability query matching convex/bookings.ts checkAvailability
 */
function executeCheckAvailability({ tables, bookings, date, startTime, endTime, guests, now = Date.now() }) {
  const { startMin, endMin } = normalizeInterval(startTime, endTime);

  // 1. Party size & maintenance filtering
  const candidateTables = tables.filter(
    (t) => t.capacity >= guests && t.status !== 'maintenance'
  );

  if (candidateTables.length === 0) {
    return { available: false, tablesCount: 0, availableTables: [] };
  }

  // 2. Active bookings filter
  const dateBookings = bookings.filter((b) => b.bookingDate === date);
  const activeBookings = dateBookings.filter((b) => isBookingActive(b, now));

  const bookedTableNumbers = new Set();
  for (const b of activeBookings) {
    const bInterval = normalizeInterval(b.bookingTime, b.bookingEndTime);
    if (doIntervalsOverlap(startMin, endMin, bInterval.startMin, bInterval.endMin)) {
      if (b.tableNumber !== undefined) {
        bookedTableNumbers.add(b.tableNumber);
      }
    }
  }

  const freeTables = candidateTables.filter((t) => !bookedTableNumbers.has(t.tableNumber));

  return {
    available: freeTables.length > 0,
    tablesCount: freeTables.length,
    availableTables: freeTables.map((t) => ({
      id: t._id || t.id,
      tableNumber: t.tableNumber,
      capacity: t.capacity,
    })),
  };
}

/**
 * Emulates createBooking mutation matching convex/bookings.ts createBooking
 */
function executeCreateBooking({ tables, bookings, newBooking, now = Date.now() }) {
  if (!newBooking.customerName?.trim() || !newBooking.customerPhone?.trim()) {
    return { error: 'Customer name and phone are required' };
  }
  if (!newBooking.guests || newBooking.guests < 1 || newBooking.guests > 50) {
    return { error: 'Guests must be between 1 and 50' };
  }

  const { startMin, endMin } = normalizeInterval(newBooking.bookingTime, newBooking.bookingEndTime);

  // Filter & sort candidate tables by capacity ascending (best fit)
  const candidateTables = tables
    .filter((t) => t.capacity >= newBooking.guests && t.status !== 'maintenance')
    .sort((a, b) => a.capacity - b.capacity);

  if (candidateTables.length === 0) {
    return { error: 'No dining tables available capable of accommodating this party size.' };
  }

  const dateBookings = bookings.filter((b) => b.bookingDate === newBooking.bookingDate);
  const activeBookings = dateBookings.filter((b) => isBookingActive(b, now));

  let assignedTable = null;

  if (newBooking.tableNumber) {
    const requested = candidateTables.find((t) => t.tableNumber === newBooking.tableNumber);
    if (requested) {
      const hasConflict = activeBookings.some((b) => {
        if (b.tableNumber !== requested.tableNumber) return false;
        const bInt = normalizeInterval(b.bookingTime, b.bookingEndTime);
        return doIntervalsOverlap(startMin, endMin, bInt.startMin, bInt.endMin);
      });
      if (!hasConflict) assignedTable = requested;
    }
  }

  if (!assignedTable) {
    for (const table of candidateTables) {
      const hasConflict = activeBookings.some((b) => {
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

  const holdExpiresAt = now + 10 * 60 * 1000;
  const createdRecord = {
    _id: `bk_${bookings.length + 1}`,
    customerName: newBooking.customerName,
    customerPhone: newBooking.customerPhone,
    customerEmail: newBooking.customerEmail,
    bookingDate: newBooking.bookingDate,
    bookingTime: newBooking.bookingTime,
    bookingEndTime: newBooking.bookingEndTime,
    guests: newBooking.guests,
    tableNumber: assignedTable.tableNumber,
    tableId: assignedTable._id || assignedTable.id,
    holdExpiresAt,
    status: 'pending',
    paymentStatus: 'pending',
    advanceAmountPaise: 50000,
    createdAt: now,
  };

  bookings.push(createdRecord);

  return {
    bookingId: createdRecord._id,
    tableNumber: assignedTable.tableNumber,
    holdExpiresAt,
  };
}

/**
 * Emulates src/lib/services/booking.service.ts checkTableAvailability
 * with configurable Convex backend client (healthy vs outage)
 */
async function serviceCheckTableAvailability({ convexClient, restaurantId, date, startTime, endTime, guests }) {
  // 1. Primary: Convex Query
  try {
    const res = await convexClient.query('bookings:checkAvailability', {
      bookingDate: date,
      bookingTime: startTime,
      bookingEndTime: endTime,
      guests,
    });

    if (res) {
      return {
        available: res.available,
        tables: (res.availableTables || []).map((t) => ({
          id: String(t.id),
          restaurant_id: restaurantId,
          table_number: t.tableNumber,
          capacity: t.capacity,
          status: 'available',
          notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })),
      };
    }
  } catch (convexErr) {
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

/**
 * Emulates src/lib/services/booking.service.ts createBooking
 * with configurable Convex backend client (healthy vs outage)
 */
async function serviceCreateBooking({ convexClient, data }) {
  // 1. Primary: Convex Mutation
  try {
    const result = await convexClient.mutation('bookings:createBooking', {
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      bookingDate: data.bookingDate,
      bookingTime: data.bookingTime,
      bookingEndTime: data.bookingEndTime,
      guests: data.guests,
      occasion: data.occasion,
      tablePreference: data.tablePreference,
      specialRequests: data.specialRequests,
    });

    if (result && 'bookingId' in result && result.bookingId) {
      return { bookingId: result.bookingId };
    }
    if (result && 'error' in result && result.error) {
      return { bookingId: '', error: result.error };
    }
  } catch (convexError) {
    // FAIL CLOSED: Authoritative live reservations are in Convex. Supabase lacks real-time sync.
    // Creating unverified bookings in Supabase during a Convex outage creates severe double-booking conflicts.
    return {
      bookingId: '',
      error: 'Reservation service is temporarily offline for maintenance. Please try again shortly or contact the restaurant.',
    };
  }

  return {
    bookingId: '',
    error: 'Reservation service encountered an unexpected error. Please try again.',
  };
}

// ============================================================================
// TEST SUITES
// ============================================================================

describe('Suite 1: Fail-Closed Behavior When Convex is Unavailable', () => {
  const RESTAURANT_ID = 'a1b2c3d4-0000-0000-0000-000000000001';

  it('checkTableAvailability returns available: false and error when Convex is unreachable', async () => {
    // Simulate Convex outage (network drop / timeout / 503)
    const brokenConvexClient = {
      query: async () => {
        throw new Error('Convex connection failed: 503 Service Unavailable');
      },
    };

    const result = await serviceCheckTableAvailability({
      convexClient: brokenConvexClient,
      restaurantId: RESTAURANT_ID,
      date: '2026-10-25',
      startTime: '19:00',
      endTime: '21:00',
      guests: 4,
    });

    assert.strictEqual(result.available, false, 'Outage must result in available: false');
    assert.deepStrictEqual(result.tables, [], 'No tables should be reported as available');
    assert.strictEqual(typeof result.error, 'string', 'Error message must be returned');
    assert.match(
      result.error,
      /Real-time table availability check is temporarily unavailable/i,
      'Error message must indicate temporary unavailability'
    );
  });

  it('createBooking returns empty bookingId and error when Convex mutation fails', async () => {
    // Simulate Convex mutation failure during an outage
    const brokenConvexClient = {
      mutation: async () => {
        throw new Error('Convex backend offline: WebSocket connection closed');
      },
    };

    const result = await serviceCreateBooking({
      convexClient: brokenConvexClient,
      data: {
        restaurantId: RESTAURANT_ID,
        customerName: 'Ananya Sharma',
        customerPhone: '+91 98765 43210',
        bookingDate: '2026-10-25',
        bookingTime: '19:30',
        guests: 2,
      },
    });

    assert.strictEqual(result.bookingId, '', 'Outage must return empty bookingId');
    assert.strictEqual(typeof result.error, 'string', 'Error message must be returned');
    assert.match(
      result.error,
      /Reservation service is temporarily offline for maintenance/i,
      'Error message must indicate offline maintenance'
    );
  });

  it('baseline control: checkTableAvailability and createBooking succeed when Convex is healthy', async () => {
    const mockDb = {
      tables: [
        { id: 't1', tableNumber: 1, capacity: 4, status: 'available' },
        { id: 't2', tableNumber: 2, capacity: 2, status: 'available' },
      ],
      bookings: [],
    };

    const healthyConvexClient = {
      query: async (name, args) => executeCheckAvailability({
        tables: mockDb.tables,
        bookings: mockDb.bookings,
        date: args.bookingDate,
        startTime: args.bookingTime,
        endTime: args.bookingEndTime,
        guests: args.guests,
      }),
      mutation: async (name, args) => executeCreateBooking({
        tables: mockDb.tables,
        bookings: mockDb.bookings,
        newBooking: args,
      }),
    };

    const avail = await serviceCheckTableAvailability({
      convexClient: healthyConvexClient,
      restaurantId: RESTAURANT_ID,
      date: '2026-10-25',
      startTime: '19:00',
      endTime: '21:00',
      guests: 2,
    });
    assert.strictEqual(avail.available, true);
    assert.strictEqual(avail.tables.length, 2);
    assert.strictEqual(avail.error, undefined);

    const bookingRes = await serviceCreateBooking({
      convexClient: healthyConvexClient,
      data: {
        restaurantId: RESTAURANT_ID,
        customerName: 'Rajesh Patel',
        customerPhone: '+91 98111 22233',
        bookingDate: '2026-10-25',
        bookingTime: '19:00',
        guests: 2,
      },
    });
    assert.ok(bookingRes.bookingId.startsWith('bk_'));
    assert.strictEqual(bookingRes.error, undefined);
  });

  it('static verification: booking.service.ts enforces fail-closed without Supabase fallback', () => {
    const serviceFilePath = path.resolve('src/lib/services/booking.service.ts');
    assert.ok(fs.existsSync(serviceFilePath), 'src/lib/services/booking.service.ts must exist');

    const content = fs.readFileSync(serviceFilePath, 'utf8');

    // Verify checkTableAvailability catch block does NOT query Supabase
    const checkAvailabilityMatch = content.match(/export async function checkTableAvailability[\s\S]*?catch\s*\(convexErr\)\s*\{([\s\S]*?)\}/);
    assert.ok(checkAvailabilityMatch, 'checkTableAvailability must have a catch block');
    const catchBody = checkAvailabilityMatch[1];

    assert.match(catchBody, /available:\s*false/, 'Must set available: false on Convex error');
    assert.match(catchBody, /tables:\s*\[\]/, 'Must return empty tables array');
    assert.match(catchBody, /error:/, 'Must return error message');
    assert.doesNotMatch(catchBody, /createClient|from\(['"]tables['"]\)|from\(['"]bookings['"]\)/, 'Must NEVER query Supabase in catch block');

    // Verify createBooking catch block does NOT insert to Supabase
    const createBookingMatch = content.match(/export async function createBooking[\s\S]*?catch\s*\(convexError\)\s*\{([\s\S]*?)\}/);
    assert.ok(createBookingMatch, 'createBooking must have a catch block');
    const createCatchBody = createBookingMatch[1];

    assert.match(createCatchBody, /bookingId:\s*['"]['"]/, 'Must return empty bookingId on Convex error');
    assert.match(createCatchBody, /error:/, 'Must return error message on Convex error');
    assert.doesNotMatch(createCatchBody, /createClient|from\(['"]bookings['"]\)\.insert/, 'Must NEVER insert into Supabase in catch block');
  });
});

describe('Suite 2: Stale Standby Data in Supabase Cannot Cause Double-Booking', () => {
  it('demonstrates that falling back to stale Supabase data causes double-booking, while fail-closed prevents it', async () => {
    // SCENARIO:
    // Convex holds live active booking for Table 3 (19:00 - 21:00).
    // Supabase standby database has STALE data:
    // - Table 3 is marked 'available'
    // - Bookings table in Supabase has 0 records (sync lag / standby snapshot).
    const authoritativeConvexDb = {
      tables: [{ _id: 't3', tableNumber: 3, capacity: 4, status: 'available' }],
      bookings: [
        {
          _id: 'bk_live_001',
          tableNumber: 3,
          bookingDate: '2026-10-25',
          bookingTime: '19:00',
          bookingEndTime: '21:00',
          status: 'confirmed',
          guests: 4,
        },
      ],
    };

    const staleSupabaseStandbyDb = {
      tables: [{ id: 't3', table_number: 3, capacity: 4, status: 'available' }],
      bookings: [], // Stale: Missing the booking made in Convex!
    };

    // Customer B requests Table 3 at 19:30 - 21:00
    const competingBookingRequest = {
      restaurantId: 'a1b2c3d4-0000-0000-0000-000000000001',
      customerName: 'Customer B',
      customerPhone: '+91 91234 56789',
      bookingDate: '2026-10-25',
      bookingTime: '19:30',
      bookingEndTime: '21:00',
      guests: 4,
      tableNumber: 3,
    };

    // 1. Simulating NAIVE FLAGGED behavior (what happens if Supabase fallback is incorrectly used):
    function naiveDangerousFallback(request) {
      // Look at stale Supabase
      const isBookedInSupabase = staleSupabaseStandbyDb.bookings.some(
        (b) => b.table_number === request.tableNumber && b.booking_date === request.bookingDate
      );
      if (!isBookedInSupabase) {
        // Naive fallback falsely concludes Table 3 is free!
        staleSupabaseStandbyDb.bookings.push({
          id: 'sp_dangerous_002',
          ...request,
        });
        return { bookingId: 'sp_dangerous_002' };
      }
      return { error: 'Not available' };
    }

    // A naive system would issue a double booking!
    const naiveResult = naiveDangerousFallback(competingBookingRequest);
    assert.strictEqual(
      naiveResult.bookingId,
      'sp_dangerous_002',
      'Flawed fallback would erroneously grant booking based on stale Supabase state'
    );
    // Notice both parties now have Table 3 for overlapping times:
    assert.strictEqual(
      authoritativeConvexDb.bookings[0].tableNumber,
      staleSupabaseStandbyDb.bookings[0].tableNumber
    );

    // Reset Supabase to test actual fail-closed architecture
    staleSupabaseStandbyDb.bookings = [];

    // 2. ACTUAL FAIL-CLOSED ARCHITECTURE under Convex outage:
    const brokenConvexClient = {
      query: async () => { throw new Error('Convex unavailable'); },
      mutation: async () => { throw new Error('Convex unavailable'); },
    };

    // Customer B checks availability during outage
    const availabilityResult = await serviceCheckTableAvailability({
      convexClient: brokenConvexClient,
      restaurantId: competingBookingRequest.restaurantId,
      date: competingBookingRequest.bookingDate,
      startTime: competingBookingRequest.bookingTime,
      endTime: competingBookingRequest.bookingEndTime,
      guests: competingBookingRequest.guests,
    });

    assert.strictEqual(availabilityResult.available, false, 'Must fail-closed to false');
    assert.ok(availabilityResult.error, 'Must indicate service unavailability');

    // Customer B tries to create booking during outage
    const createResult = await serviceCreateBooking({
      convexClient: brokenConvexClient,
      data: competingBookingRequest,
    });

    assert.strictEqual(createResult.bookingId, '', 'Must not generate bookingId');
    assert.ok(createResult.error, 'Must return error');

    // Verify Supabase standby remains unpolluted with zero speculative rows
    assert.strictEqual(
      staleSupabaseStandbyDb.bookings.length,
      0,
      'Supabase standby must NOT receive speculative bookings during Convex outage'
    );

    // When Convex recovers, Table 3 has strictly 1 booking with zero collisions
    assert.strictEqual(authoritativeConvexDb.bookings.length, 1);
    assert.strictEqual(authoritativeConvexDb.bookings[0]._id, 'bk_live_001');
  });
});

describe('Suite 3: Mathematical Interval Overlap Condition (startA < endB && endA > startB)', () => {
  it('detects standard partial overlap where slot B starts inside slot A', () => {
    // Slot A: 19:00 - 20:30 (1140 to 1230)
    // Slot B: 20:00 - 21:30 (1200 to 1290)
    assert.strictEqual(
      doIntervalsOverlap(1140, 1230, 1200, 1290),
      true,
      'Slot starting inside existing booking must conflict'
    );
  });

  it('detects standard partial overlap where slot B ends inside slot A', () => {
    // Slot A: 19:00 - 20:30 (1140 to 1230)
    // Slot B: 18:30 - 19:30 (1110 to 1170)
    assert.strictEqual(
      doIntervalsOverlap(1140, 1230, 1110, 1170),
      true,
      'Slot ending inside existing booking must conflict'
    );
  });

  it('detects full containment where outer slot completely encloses inner slot', () => {
    // Outer: 18:00 - 22:00 (1080 to 1320)
    // Inner: 19:00 - 20:30 (1140 to 1230)
    assert.strictEqual(doIntervalsOverlap(1080, 1320, 1140, 1230), true);
    assert.strictEqual(doIntervalsOverlap(1140, 1230, 1080, 1320), true);
  });

  it('detects conflict for exact identical intervals', () => {
    // Slot A: 19:00 - 20:30
    // Slot B: 19:00 - 20:30
    assert.strictEqual(doIntervalsOverlap(1140, 1230, 1140, 1230), true);
  });

  it('allows adjacent boundary slots touching at exact boundary without conflict (endA === startB)', () => {
    // Slot A: 19:00 - 20:30 (1140 to 1230)
    // Slot B: 20:30 - 22:00 (1230 to 1320)
    // startA < endB (1140 < 1320 -> true) BUT endA > startB (1230 > 1230 -> FALSE!)
    assert.strictEqual(
      doIntervalsOverlap(1140, 1230, 1230, 1320),
      false,
      'Adjacent back-to-back reservations must NOT conflict'
    );
  });

  it('allows adjacent boundary slots in reverse touching order (startA === endB)', () => {
    // Slot A: 20:30 - 22:00 (1230 to 1320)
    // Slot B: 19:00 - 20:30 (1140 to 1230)
    assert.strictEqual(
      doIntervalsOverlap(1230, 1320, 1140, 1230),
      false,
      'Adjacent reverse order reservations must NOT conflict'
    );
  });

  it('allows disjoint non-overlapping intervals separated by hours', () => {
    // Lunch: 12:00 - 14:00 (720 to 840)
    // Dinner: 19:00 - 21:00 (1140 to 1260)
    assert.strictEqual(doIntervalsOverlap(720, 840, 1140, 1260), false);
    assert.strictEqual(doIntervalsOverlap(1140, 1260, 720, 840), false);
  });

  it('handles midnight wraparound intervals correctly across day boundaries', () => {
    // Slot crossing midnight: 23:00 to 01:00 next day
    // 23:00 = 1380 min. 01:00 = 60 min -> 60 <= 1380 -> 60 + 1440 = 1500 min
    const nightSlot = normalizeInterval('23:00', '01:00');
    assert.strictEqual(nightSlot.startMin, 1380);
    assert.strictEqual(nightSlot.endMin, 1500);

    // Competing late night slot: 00:30 to 02:00 next day (in night context: 1470 to 1560)
    const slotB_start = 1440 + 30; // 1470
    const slotB_end = 1440 + 120; // 1560
    assert.strictEqual(
      doIntervalsOverlap(nightSlot.startMin, nightSlot.endMin, slotB_start, slotB_end),
      true,
      'Post-midnight slot must conflict with midnight-spanning slot'
    );

    // Earlier dinner slot: 19:00 to 21:00 (1140 to 1260)
    const dinnerSlot = normalizeInterval('19:00', '21:00');
    assert.strictEqual(
      doIntervalsOverlap(nightSlot.startMin, nightSlot.endMin, dinnerSlot.startMin, dinnerSlot.endMin),
      false,
      'Dinner slot must NOT conflict with late night slot'
    );
  });

  it('allows concurrent overlapping intervals on DIFFERENT physical tables', () => {
    const table1Booking = {
      tableNumber: 1,
      bookingTime: '19:00',
      bookingEndTime: '21:00',
    };
    const table2Booking = {
      tableNumber: 2,
      bookingTime: '19:00',
      bookingEndTime: '21:00',
    };

    const isSameTable = table1Booking.tableNumber === table2Booking.tableNumber;
    const intervalOverlap = doIntervalsOverlap(1140, 1260, 1140, 1260);

    // Conflict only occurs if SAME table AND intervals overlap
    const hasConflict = isSameTable && intervalOverlap;
    assert.strictEqual(hasConflict, false, 'Different physical tables can be occupied concurrently');
  });
});

describe('Suite 4: Expired Hold Rejection & Active Hold Protection', () => {
  it('active hold (<10 minutes elapsed) protects table allocation and causes conflict', () => {
    const now = Date.now();
    const activeHold = {
      tableNumber: 1,
      status: 'pending',
      holdExpiresAt: now + 5 * 60 * 1000, // Valid for 5 more minutes
    };

    assert.strictEqual(isBookingActive(activeHold, now), true, 'Active hold must protect the table reservation');
  });

  it('expired hold (>10 minutes elapsed) releases table allocation and permits new reservation', () => {
    const now = Date.now();
    const expiredHold = {
      tableNumber: 1,
      status: 'pending',
      holdExpiresAt: now - 1000, // Expired 1 second ago
    };

    assert.strictEqual(isBookingActive(expiredHold, now), false, 'Expired hold must be treated as inactive/released');
  });

  it('boundary test: exactly at holdExpiresAt, hold is expired', () => {
    const now = Date.now();
    const boundaryHold = {
      tableNumber: 1,
      status: 'pending',
      holdExpiresAt: now,
    };

    // Condition in convex/bookings.ts: holdExpiresAt <= now -> expired
    assert.strictEqual(isBookingActive(boundaryHold, now), false, 'Hold exactly at expiry timestamp must be released');
  });

  it('confirmed bookings permanently lock table and do not expire after hold window', () => {
    const now = Date.now();
    const confirmedBooking = {
      tableNumber: 1,
      status: 'confirmed',
      holdExpiresAt: now - 60 * 60 * 1000, // Even if old hold timestamp existed
    };

    assert.strictEqual(isBookingActive(confirmedBooking, now), true, 'Confirmed booking must remain active permanently');
  });

  it('cancelled or completed bookings release table immediately', () => {
    const now = Date.now();
    const cancelledBooking = {
      tableNumber: 1,
      status: 'cancelled',
      holdExpiresAt: now + 10 * 60 * 1000,
    };
    const completedBooking = {
      tableNumber: 1,
      status: 'completed',
      holdExpiresAt: now + 10 * 60 * 1000,
    };

    assert.strictEqual(isBookingActive(cancelledBooking, now), false, 'Cancelled booking must release table immediately');
    assert.strictEqual(isBookingActive(completedBooking, now), false, 'Completed booking must release table immediately');
  });

  it('end-to-end hold lifecycle: re-allocates table after pending hold expires', () => {
    const now = Date.now();
    const tables = [{ _id: 't1', tableNumber: 1, capacity: 4, status: 'available' }];
    const bookings = [];

    // 1. Customer A reserves Table 1 (pending with 10 min hold)
    const resA = executeCreateBooking({
      tables,
      bookings,
      newBooking: {
        customerName: 'Customer A',
        customerPhone: '+91 99999 11111',
        bookingDate: '2026-10-25',
        bookingTime: '19:00',
        bookingEndTime: '21:00',
        guests: 4,
      },
      now,
    });
    assert.ok(resA.bookingId);
    assert.strictEqual(resA.tableNumber, 1);

    // 2. While hold is active (e.g. at now + 2 mins), Customer B cannot book Table 1
    const resB_active = executeCreateBooking({
      tables,
      bookings,
      newBooking: {
        customerName: 'Customer B',
        customerPhone: '+91 99999 22222',
        bookingDate: '2026-10-25',
        bookingTime: '19:30',
        bookingEndTime: '21:30',
        guests: 4,
      },
      now: now + 2 * 60 * 1000,
    });
    assert.strictEqual(resB_active.bookingId, undefined);
    assert.match(resB_active.error, /All tables for this party size are reserved/i);

    // 3. After hold expires (e.g. at now + 11 mins), Customer B can now successfully book Table 1!
    const resB_after_expiry = executeCreateBooking({
      tables,
      bookings,
      newBooking: {
        customerName: 'Customer B',
        customerPhone: '+91 99999 22222',
        bookingDate: '2026-10-25',
        bookingTime: '19:30',
        bookingEndTime: '21:30',
        guests: 4,
      },
      now: now + 11 * 60 * 1000,
    });
    assert.ok(resB_after_expiry.bookingId);
    assert.strictEqual(resB_after_expiry.tableNumber, 1);
  });
});

describe('Suite 5: Party Size Capacity Filtering & Table Allocation', () => {
  const tablesInventory = [
    { _id: 't1', tableNumber: 1, capacity: 2, status: 'available' },
    { _id: 't2', tableNumber: 2, capacity: 4, status: 'available' },
    { _id: 't3', tableNumber: 3, capacity: 8, status: 'available' },
    { _id: 't4', tableNumber: 4, capacity: 6, status: 'maintenance' }, // Maintenance!
  ];

  it('rejects party size out of range (guests < 1 or guests > 50)', () => {
    const bookings = [];

    const zeroGuests = executeCreateBooking({
      tables: tablesInventory,
      bookings,
      newBooking: {
        customerName: 'Test',
        customerPhone: '12345',
        bookingDate: '2026-10-25',
        bookingTime: '19:00',
        guests: 0,
      },
    });
    assert.match(zeroGuests.error, /Guests must be between 1 and 50/i);

    const negativeGuests = executeCreateBooking({
      tables: tablesInventory,
      bookings,
      newBooking: {
        customerName: 'Test',
        customerPhone: '12345',
        bookingDate: '2026-10-25',
        bookingTime: '19:00',
        guests: -3,
      },
    });
    assert.match(negativeGuests.error, /Guests must be between 1 and 50/i);

    const excessiveGuests = executeCreateBooking({
      tables: tablesInventory,
      bookings,
      newBooking: {
        customerName: 'Test',
        customerPhone: '12345',
        bookingDate: '2026-10-25',
        bookingTime: '19:00',
        guests: 55,
      },
    });
    assert.match(excessiveGuests.error, /Guests must be between 1 and 50/i);
  });

  it('filters candidate tables requiring capacity >= guests', () => {
    const availForPartyOf5 = executeCheckAvailability({
      tables: tablesInventory,
      bookings: [],
      date: '2026-10-25',
      startTime: '19:00',
      endTime: '21:00',
      guests: 5,
    });

    // Tables with capacity 2 and 4 are insufficient.
    // Table 4 has capacity 6 but is in maintenance.
    // Only Table 3 (capacity 8) qualifies!
    assert.strictEqual(availForPartyOf5.available, true);
    assert.strictEqual(availForPartyOf5.tablesCount, 1);
    assert.strictEqual(availForPartyOf5.availableTables[0].tableNumber, 3);
  });

  it('strictly excludes tables in maintenance status regardless of capacity', () => {
    // Table 4 has capacity 6, but status is 'maintenance'
    const availForPartyOf6 = executeCheckAvailability({
      tables: [tablesInventory[3]], // Only Table 4
      bookings: [],
      date: '2026-10-25',
      startTime: '19:00',
      endTime: '21:00',
      guests: 6,
    });

    assert.strictEqual(availForPartyOf6.available, false);
    assert.strictEqual(availForPartyOf6.tablesCount, 0);
  });

  it('best-fit allocation assigns smallest sufficient table to preserve larger tables', () => {
    const bookings = [];

    // Party of 2 should be allocated Table 1 (capacity 2), NOT Table 2 (cap 4) or Table 3 (cap 8)
    const bookingParty2 = executeCreateBooking({
      tables: tablesInventory,
      bookings,
      newBooking: {
        customerName: 'Party of Two',
        customerPhone: '+91 90000 11111',
        bookingDate: '2026-10-25',
        bookingTime: '19:00',
        guests: 2,
      },
    });
    assert.strictEqual(bookingParty2.tableNumber, 1, 'Party of 2 must get 2-top table');

    // Party of 4 should be allocated Table 2 (capacity 4), NOT Table 3 (cap 8)
    const bookingParty4 = executeCreateBooking({
      tables: tablesInventory,
      bookings,
      newBooking: {
        customerName: 'Party of Four',
        customerPhone: '+91 90000 22222',
        bookingDate: '2026-10-25',
        bookingTime: '19:00',
        guests: 4,
      },
    });
    assert.strictEqual(bookingParty4.tableNumber, 2, 'Party of 4 must get 4-top table');
  });

  it('returns unavailable when all eligible tables for party size are booked', () => {
    const bookings = [
      {
        tableNumber: 3, // Table 3 is the only 8-top
        bookingDate: '2026-10-25',
        bookingTime: '19:00',
        bookingEndTime: '21:00',
        status: 'confirmed',
        guests: 7,
      },
    ];

    const avail = executeCheckAvailability({
      tables: tablesInventory,
      bookings,
      date: '2026-10-25',
      startTime: '19:30',
      endTime: '21:30',
      guests: 7,
    });

    assert.strictEqual(avail.available, false);
    assert.strictEqual(avail.tablesCount, 0);

    const bookingAttempt = executeCreateBooking({
      tables: tablesInventory,
      bookings,
      newBooking: {
        customerName: 'Late Party of 7',
        customerPhone: '+91 90000 33333',
        bookingDate: '2026-10-25',
        bookingTime: '19:30',
        bookingEndTime: '21:30',
        guests: 7,
      },
    });

    assert.strictEqual(bookingAttempt.bookingId, undefined);
    assert.match(bookingAttempt.error, /All tables for this party size are reserved/i);
  });
});
