import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { authenticateCaller, STAFF_ROLES } from "./authUtils";

// Helper: Convert "HH:MM" or "HH:MM:SS" to minutes from midnight
function timeToMinutes(t: string): number {
  const parts = t.split(":").map(Number);
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  return h * 60 + m;
}

// Overlap condition: startA < endB && endA > startB
function doIntervalsOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && endA > startB;
}

// Check availability for a specific party size and time window
export const checkAvailability = query({
  args: {
    bookingDate: v.string(),
    bookingTime: v.string(),
    bookingEndTime: v.optional(v.string()),
    guests: v.number(),
  },
  handler: async (ctx, args) => {
    const startMin = timeToMinutes(args.bookingTime);
    let endMin = args.bookingEndTime
      ? timeToMinutes(args.bookingEndTime)
      : startMin + 120; // 2 hour default slot
    if (endMin <= startMin) endMin += 1440;

    // Get all dining tables that fit the party
    const candidateTables = await ctx.db
      .query("tables")
      .filter((q) =>
        q.and(
          q.gte(q.field("capacity"), args.guests),
          q.neq(q.field("status"), "maintenance")
        )
      )
      .collect();

    if (candidateTables.length === 0) {
      return { available: false, tablesCount: 0, availableTables: [] };
    }

    // Get active bookings on that date
    const dateBookings = await ctx.db
      .query("bookings")
      .withIndex("by_date", (q) => q.eq("bookingDate", args.bookingDate))
      .collect();

    const now = Date.now();
    const activeBookings = dateBookings.filter((b) => {
      if (b.status === "cancelled" || b.status === "completed") return false;
      // Pending bookings expire after hold window
      if (b.status === "pending" && b.holdExpiresAt && b.holdExpiresAt <= now) {
        return false;
      }
      return b.tableNumber !== undefined;
    });

    const bookedTableNumbers = new Set<number>();
    for (const b of activeBookings) {
      const bStart = timeToMinutes(b.bookingTime);
      let bEnd = b.bookingEndTime
        ? timeToMinutes(b.bookingEndTime)
        : bStart + 120;
      if (bEnd <= bStart) bEnd += 1440;

      if (doIntervalsOverlap(startMin, endMin, bStart, bEnd)) {
        if (b.tableNumber !== undefined) {
          bookedTableNumbers.add(b.tableNumber);
        }
      }
    }

    const freeTables = candidateTables.filter(
      (t) => !bookedTableNumbers.has(t.tableNumber)
    );

    return {
      available: freeTables.length > 0,
      tablesCount: freeTables.length,
      availableTables: freeTables.map((t) => ({
        id: t._id,
        tableNumber: t.tableNumber,
        capacity: t.capacity,
      })),
    };
  },
});

// Create a table reservation (Atomic table allocation with OCC interval conflict protection)
export const createBooking = mutation({
  args: {
    customerName: v.string(),
    customerPhone: v.string(),
    customerEmail: v.optional(v.string()),
    bookingDate: v.string(),
    bookingTime: v.string(),
    bookingEndTime: v.optional(v.string()),
    guests: v.number(),
    occasion: v.optional(v.string()),
    tablePreference: v.optional(v.string()),
    specialRequests: v.optional(v.string()),
    tableNumber: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // 1. Basic validation
    if (!args.customerName.trim() || !args.customerPhone.trim()) {
      return { error: "Customer name and phone are required" };
    }
    if (args.guests < 1 || args.guests > 50) {
      return { error: "Guests must be between 1 and 50" };
    }

    const startMin = timeToMinutes(args.bookingTime);
    let endMin = args.bookingEndTime
      ? timeToMinutes(args.bookingEndTime)
      : startMin + 120;
    if (endMin <= startMin) endMin += 1440;

    // 2. Fetch candidate tables with capacity >= guests
    const candidateTables = await ctx.db
      .query("tables")
      .filter((q) =>
        q.and(
          q.gte(q.field("capacity"), args.guests),
          q.neq(q.field("status"), "maintenance")
        )
      )
      .collect();

    if (candidateTables.length === 0) {
      return {
        error: "No dining tables available capable of accommodating this party size.",
      };
    }

    candidateTables.sort((a, b) => a.capacity - b.capacity);

    // 3. Check active bookings on the same date
    const dateBookings = await ctx.db
      .query("bookings")
      .withIndex("by_date", (q) => q.eq("bookingDate", args.bookingDate))
      .collect();

    const now = Date.now();
    const activeBookings = dateBookings.filter((b) => {
      if (b.status === "cancelled" || b.status === "completed") return false;
      if (b.status === "pending" && b.holdExpiresAt && b.holdExpiresAt <= now) {
        return false;
      }
      return b.tableNumber !== undefined;
    });

    // 4. Match or allocate a table
    let assignedTable: (typeof candidateTables)[0] | null = null;

    if (candidateTables.length > 0) {
      // If customer requested a specific tableNumber
      if (args.tableNumber) {
        const requested = candidateTables.find(
          (t) => t.tableNumber === args.tableNumber
        );
        if (requested) {
          const hasConflict = activeBookings.some((b) => {
            if (b.tableNumber !== requested.tableNumber) return false;
            const bStart = timeToMinutes(b.bookingTime);
            let bEnd = b.bookingEndTime
              ? timeToMinutes(b.bookingEndTime)
              : bStart + 120;
            if (bEnd <= bStart) bEnd += 1440;
            return doIntervalsOverlap(startMin, endMin, bStart, bEnd);
          });
          if (!hasConflict) {
            assignedTable = requested;
          }
        }
      }

      // If no specific table requested or requested table unavailable, find best fit
      if (!assignedTable) {
        for (const table of candidateTables) {
          const hasConflict = activeBookings.some((b) => {
            if (b.tableNumber !== table.tableNumber) return false;
            const bStart = timeToMinutes(b.bookingTime);
            let bEnd = b.bookingEndTime
              ? timeToMinutes(b.bookingEndTime)
              : bStart + 120;
            if (bEnd <= bStart) bEnd += 1440;
            return doIntervalsOverlap(startMin, endMin, bStart, bEnd);
          });

          if (!hasConflict) {
            assignedTable = table;
            break;
          }
        }
      }

      if (!assignedTable) {
        return {
          error: "All tables for this party size are reserved during this time slot.",
        };
      }
    }

    // 5. Default advance fee from settings
    const advanceSetting = await ctx.db
      .query("restaurant_settings")
      .withIndex("by_key", (q) => q.eq("key", "advance_booking_amount_paise"))
      .first();
    const advanceAmountPaise = advanceSetting
      ? Number(advanceSetting.value) || 50000
      : 50000;

    const holdExpiresAt = now + 10 * 60 * 1000; // 10 minute payment hold

    const bookingId = await ctx.db.insert("bookings", {
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      customerEmail: args.customerEmail,
      bookingDate: args.bookingDate,
      bookingTime: args.bookingTime,
      bookingEndTime: args.bookingEndTime,
      guests: args.guests,
      occasion: args.occasion,
      tablePreference: args.tablePreference,
      specialRequests: args.specialRequests,
      tableNumber: assignedTable ? assignedTable.tableNumber : args.tableNumber,
      tableId: assignedTable ? assignedTable._id : undefined,
      holdExpiresAt,
      status: "pending",
      paymentStatus: "pending",
      advanceAmountPaise,
      createdAt: now,
    });

    return {
      bookingId,
      tableNumber: assignedTable ? assignedTable.tableNumber : args.tableNumber,
      holdExpiresAt,
      success: true,
    };
  },
});

// Get all bookings (Staff / Admin dashboard)
export const getAllBookings = query({
  args: {},
  handler: async (ctx) => {
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_date")
      .order("desc")
      .take(100);

    return bookings;
  },
});

// Get bookings by phone number or email (Customer lookup)
export const getBookingsByPhone = query({
  args: { phone: v.optional(v.string()), email: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.phone) {
      return await ctx.db
        .query("bookings")
        .withIndex("by_phone", (q) => q.eq("customerPhone", args.phone!))
        .order("desc")
        .take(20);
    }
    if (args.email) {
      const all = await ctx.db.query("bookings").order("desc").take(50);
      return all.filter((b) => b.customerEmail?.toLowerCase() === args.email!.toLowerCase());
    }
    return [];
  },
});

// Get single booking by ID
export const getBookingById = query({
  args: { bookingId: v.string() },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("bookings", args.bookingId);
    if (!id) return null;
    return await ctx.db.get(id);
  },
});

// Valid state machine transitions
const VALID_BOOKING_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["seated", "cancelled"],
  seated: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

// Update booking status with state machine & table floor sync (Staff action)
export const updateBookingStatus = mutation({
  args: {
    bookingId: v.id("bookings"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("seated"),
      v.literal("cancelled"),
      v.literal("completed")
    ),
    reason: v.optional(v.string()),
    actor: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateCaller(ctx, args.sessionToken, STAFF_ROLES);
    if (!auth.authorized) return { error: auth.error };

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return { error: "Booking not found" };

    if (booking.status === args.status) {
      return { success: true };
    }

    const allowed = VALID_BOOKING_TRANSITIONS[booking.status] || [];
    if (!allowed.includes(args.status)) {
      return {
        error: `Invalid transition from '${booking.status}' to '${args.status}'.`,
      };
    }

    const updates: Record<string, unknown> = { status: args.status };
    if (args.status === "cancelled") {
      updates.cancelledAt = Date.now();
      updates.cancelledBy = args.actor || auth.user.name || "staff";
      updates.cancellationReason = args.reason || "Cancelled by staff";
    }

    await ctx.db.patch(args.bookingId, updates);

    // Sync physical table status if assigned
    if (booking.tableId) {
      const normalizedTableId = ctx.db.normalizeId("tables", booking.tableId);
      if (normalizedTableId) {
        if (args.status === "seated") {
          await ctx.db.patch(normalizedTableId, { status: "occupied" });
        } else if (args.status === "completed" || args.status === "cancelled") {
          await ctx.db.patch(normalizedTableId, { status: "available" });
        }
      }
    }

    return { success: true };
  },
});

// Confirm booking payment with UTR persistence (Staff or verified Customer)
export const confirmBookingPayment = mutation({
  args: {
    bookingId: v.string(),
    reference: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("bookings", args.bookingId);
    if (!id) return { error: "Invalid booking ID" };
    const booking = await ctx.db.get(id);
    if (!booking) return { error: "Booking not found" };

    // Authorization: Staff session OR verified customer phone
    let isAuthorized = false;
    if (args.sessionToken) {
      const auth = await authenticateCaller(ctx, args.sessionToken, [
        ...STAFF_ROLES,
        "customer",
      ]);
      if (auth.authorized) {
        if (STAFF_ROLES.includes(auth.user.role as any)) {
          isAuthorized = true;
        } else if (
          auth.user.phone &&
          booking.customerPhone &&
          auth.user.phone.replace(/\D/g, "").slice(-10) ===
            booking.customerPhone.replace(/\D/g, "").slice(-10)
        ) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized && args.customerPhone) {
      const inputDigits = args.customerPhone.replace(/\D/g, "").slice(-10);
      const bookingDigits = booking.customerPhone.replace(/\D/g, "").slice(-10);
      if (inputDigits.length === 10 && inputDigits === bookingDigits) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return {
        error:
          "Unauthorized: Staff session or verified customer phone required to confirm booking payment.",
      };
    }

    if (booking.status !== "pending") {
      return { error: `Booking is not pending (current status: ${booking.status})` };
    }
    if (booking.holdExpiresAt && booking.holdExpiresAt < Date.now()) {
      return { error: "Reservation hold has expired. Please create a new booking." };
    }

    await ctx.db.patch(id, {
      status: "confirmed",
      paymentStatus: "paid",
      paymentReference: args.reference || undefined,
    });
    return { success: true };
  },
});

// Cancel booking with audit reason and table release (Staff or verified Customer)
export const cancelBooking = mutation({
  args: {
    bookingId: v.string(),
    reason: v.optional(v.string()),
    actor: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("bookings", args.bookingId);
    if (!id) return { error: "Invalid booking ID" };
    const booking = await ctx.db.get(id);
    if (!booking) return { error: "Booking not found" };

    let isStaff = false;
    let isAuthorized = false;

    if (args.sessionToken) {
      const auth = await authenticateCaller(ctx, args.sessionToken, [
        ...STAFF_ROLES,
        "customer",
      ]);
      if (auth.authorized) {
        if (STAFF_ROLES.includes(auth.user.role as any)) {
          isStaff = true;
          isAuthorized = true;
        } else if (
          auth.user.phone &&
          booking.customerPhone &&
          auth.user.phone.replace(/\D/g, "").slice(-10) ===
            booking.customerPhone.replace(/\D/g, "").slice(-10)
        ) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized && args.customerPhone) {
      const inputDigits = args.customerPhone.replace(/\D/g, "").slice(-10);
      const bookingDigits = booking.customerPhone.replace(/\D/g, "").slice(-10);
      if (inputDigits.length === 10 && inputDigits === bookingDigits) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return {
        error:
          "Unauthorized: Staff session or verified customer phone required to cancel booking.",
      };
    }

    if (booking.status === "completed" || booking.status === "cancelled") {
      return { error: `Booking cannot be cancelled from '${booking.status}'` };
    }

    await ctx.db.patch(id, {
      status: "cancelled",
      cancelledAt: Date.now(),
      cancelledBy: args.actor || (isStaff ? "staff" : "customer"),
      cancellationReason: args.reason || undefined,
    });

    if (booking.tableId) {
      const normalizedTableId = ctx.db.normalizeId("tables", booking.tableId);
      if (normalizedTableId) {
        await ctx.db.patch(normalizedTableId, { status: "available" });
      }
    }

    return { success: true };
  },
});

