import { query, mutation, type MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { v } from "convex/values";
import {
  authenticateCaller,
  buildPhoneCandidates,
  normalizePhone,
  phonesMatch,
  type Role,
  STAFF_ROLES,
} from "./authUtils";

// Helper: Convert "HH:MM", "HH:MM:SS", or "h:mm AM/PM" to minutes from midnight
function timeToMinutes(t: string): number {
  const trimmed = t.trim().toUpperCase();
  const isPM = trimmed.endsWith("PM");
  const isAM = trimmed.endsWith("AM");
  const numericPart = trimmed.replace(/\s*(AM|PM)$/i, "");
  const parts = numericPart.split(":").map((p) => Number(p));
  let h = Number.isFinite(parts[0]) ? parts[0] : 0;
  const m = Number.isFinite(parts[1]) ? parts[1] : 0;
  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;
  return h * 60 + m;
}

function normalizeInterval(
  bookingTime: string,
  bookingEndTime?: string
): { startMin: number; endMin: number } {
  const startMin = timeToMinutes(bookingTime);
  let endMin = bookingEndTime ? timeToMinutes(bookingEndTime) : startMin + 120;
  if (endMin <= startMin) endMin += 1440;
  return { startMin, endMin };
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

function filterActiveBookings(
  dateBookings: Doc<"bookings">[],
  now: number
): Doc<"bookings">[] {
  return dateBookings.filter((b) => {
    if (b.status === "cancelled" || b.status === "completed") return false;
    // Pending bookings expire after hold window
    if (b.status === "pending" && b.holdExpiresAt && b.holdExpiresAt <= now) {
      return false;
    }
    return b.tableNumber !== undefined;
  });
}

function hasTableConflict(
  activeBookings: Doc<"bookings">[],
  tableNumber: number,
  startMin: number,
  endMin: number
): boolean {
  return activeBookings.some((b) => {
    if (b.tableNumber !== tableNumber) return false;
    const { startMin: bStart, endMin: bEnd } = normalizeInterval(
      b.bookingTime,
      b.bookingEndTime
    );
    return doIntervalsOverlap(startMin, endMin, bStart, bEnd);
  });
}

function phonesMatchStrict10(
  a: string | undefined | null,
  b: string | undefined | null
): boolean {
  if (!a || !b) return false;
  const digitsA = a.replace(/\D/g, "").slice(-10);
  const digitsB = b.replace(/\D/g, "").slice(-10);
  return digitsA.length === 10 && digitsA === digitsB;
}

async function authorizeBookingActor(
  ctx: MutationCtx,
  booking: Doc<"bookings">,
  sessionToken: string | undefined,
  customerPhone: string | undefined
): Promise<{ isAuthorized: boolean; isStaff: boolean }> {
  if (sessionToken) {
    const auth = await authenticateCaller(ctx, sessionToken, [
      ...STAFF_ROLES,
      "customer",
    ]);
    if (auth.authorized) {
      if (STAFF_ROLES.includes(auth.user.role as Role)) {
        return { isAuthorized: true, isStaff: true };
      }
      if (phonesMatchStrict10(auth.user.phone, booking.customerPhone)) {
        return { isAuthorized: true, isStaff: false };
      }
    }
  }

  if (phonesMatchStrict10(customerPhone, booking.customerPhone)) {
    return { isAuthorized: true, isStaff: false };
  }

  return { isAuthorized: false, isStaff: false };
}

async function syncPhysicalTableStatus(
  ctx: MutationCtx,
  tableId: string | undefined,
  nextStatus: "available" | "occupied"
): Promise<void> {
  if (!tableId) return;
  const normalizedTableId = ctx.db.normalizeId("tables", tableId);
  if (!normalizedTableId) return;
  const tableDoc = await ctx.db.get(normalizedTableId);
  if (!tableDoc || tableDoc.status === "maintenance") return;
  await ctx.db.patch(normalizedTableId, { status: nextStatus });
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
    if (!Number.isInteger(args.guests) || args.guests < 1 || args.guests > 50) {
      return { available: false, tablesCount: 0, availableTables: [] };
    }

    const { startMin, endMin } = normalizeInterval(
      args.bookingTime,
      args.bookingEndTime
    );

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

    const activeBookings = filterActiveBookings(dateBookings, Date.now());
    const freeTables = candidateTables.filter(
      (t) => !hasTableConflict(activeBookings, t.tableNumber, startMin, endMin)
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
    const trimmedName = args.customerName.trim();
    const trimmedPhone = args.customerPhone.trim();
    if (!trimmedName || !trimmedPhone) {
      return { error: "Customer name and phone are required" };
    }
    if (!Number.isInteger(args.guests) || args.guests < 1 || args.guests > 50) {
      return { error: "Guests must be between 1 and 50" };
    }

    const { startMin, endMin } = normalizeInterval(
      args.bookingTime,
      args.bookingEndTime
    );

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
    const activeBookings = filterActiveBookings(dateBookings, now);

    // 4. Match requested table or allocate best-fit available table
    let assignedTable: Doc<"tables"> | null = null;

    if (args.tableNumber !== undefined) {
      const requested = candidateTables.find(
        (t) => t.tableNumber === args.tableNumber
      );
      if (
        requested &&
        !hasTableConflict(activeBookings, requested.tableNumber, startMin, endMin)
      ) {
        assignedTable = requested;
      }
    }

    if (!assignedTable) {
      for (const table of candidateTables) {
        if (!hasTableConflict(activeBookings, table.tableNumber, startMin, endMin)) {
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

    // 5. Advance fee & hold window from settings (defaults: ₹500 and 5 minutes)
    const [advanceSetting, holdSetting] = await Promise.all([
      ctx.db
        .query("restaurant_settings")
        .withIndex("by_key", (q) => q.eq("key", "advance_booking_amount_paise"))
        .first(),
      ctx.db
        .query("restaurant_settings")
        .withIndex("by_key", (q) => q.eq("key", "booking_hold_minutes"))
        .first(),
    ]);

    const parsedAdvance = advanceSetting ? Number(advanceSetting.value) : NaN;
    const advanceAmountPaise =
      Number.isFinite(parsedAdvance) && parsedAdvance >= 0 ? parsedAdvance : 50000;

    const parsedHold = holdSetting ? Number(holdSetting.value) : NaN;
    const holdMinutes = Number.isFinite(parsedHold) && parsedHold > 0 ? parsedHold : 5;
    const holdExpiresAt = now + holdMinutes * 60 * 1000;

    const normalizedEmail = args.customerEmail?.trim().toLowerCase() || undefined;

    const bookingId = await ctx.db.insert("bookings", {
      customerName: trimmedName,
      customerPhone: trimmedPhone,
      customerEmail: normalizedEmail,
      bookingDate: args.bookingDate,
      bookingTime: args.bookingTime,
      bookingEndTime: args.bookingEndTime,
      guests: args.guests,
      occasion: args.occasion,
      tablePreference: args.tablePreference,
      specialRequests: args.specialRequests,
      tableNumber: assignedTable.tableNumber,
      tableId: assignedTable._id,
      holdExpiresAt,
      status: "pending",
      paymentStatus: "pending",
      advanceAmountPaise,
      createdAt: now,
    });

    return {
      bookingId,
      tableNumber: assignedTable.tableNumber,
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
    const seen = new Map<string, Doc<"bookings">>();

    if (args.phone && args.phone.trim()) {
      const candidates = buildPhoneCandidates(args.phone);
      const exactList = candidates.length > 0 ? candidates : [args.phone.trim()];
      for (const candidate of exactList) {
        const matches = await ctx.db
          .query("bookings")
          .withIndex("by_phone", (q) => q.eq("customerPhone", candidate))
          .order("desc")
          .take(25);
        for (const b of matches) {
          seen.set(b._id, b);
        }
      }
      // Also catch formatting edge cases on recent bookings when few exact matches found
      if (normalizePhone(args.phone) && seen.size === 0) {
        const recent = await ctx.db.query("bookings").order("desc").take(100);
        for (const b of recent) {
          if (phonesMatch(b.customerPhone, args.phone)) {
            seen.set(b._id, b);
          }
        }
      }
    }

    if (args.email && args.email.trim()) {
      const trimmedEmail = args.email.trim();
      const lowerEmail = trimmedEmail.toLowerCase();
      const emailCandidates =
        trimmedEmail === lowerEmail ? [lowerEmail] : [lowerEmail, trimmedEmail];
      for (const emailVal of emailCandidates) {
        const matches = await ctx.db
          .query("bookings")
          .withIndex("by_email", (q) => q.eq("customerEmail", emailVal))
          .order("desc")
          .take(25);
        for (const b of matches) {
          seen.set(b._id, b);
        }
      }
    }

    return Array.from(seen.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 50);
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

    // Sync physical table status if assigned (without overriding maintenance)
    if (args.status === "seated") {
      await syncPhysicalTableStatus(ctx, booking.tableId, "occupied");
    } else if (args.status === "completed" || args.status === "cancelled") {
      await syncPhysicalTableStatus(ctx, booking.tableId, "available");
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
    const { isAuthorized } = await authorizeBookingActor(
      ctx,
      booking,
      args.sessionToken,
      args.customerPhone
    );

    if (!isAuthorized) {
      return {
        error:
          "Unauthorized: Staff session or verified customer phone required to confirm booking payment.",
      };
    }

    if (booking.status !== "pending") {
      return { error: `Booking is not pending (current status: ${booking.status})` };
    }
    if (booking.holdExpiresAt && booking.holdExpiresAt <= Date.now()) {
      return { error: "Reservation hold has expired. Please create a new booking." };
    }

    await ctx.db.patch(id, {
      status: "confirmed",
      paymentStatus: "paid",
      paymentReference: args.reference?.trim() || undefined,
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

    const { isAuthorized, isStaff } = await authorizeBookingActor(
      ctx,
      booking,
      args.sessionToken,
      args.customerPhone
    );

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

    await syncPhysicalTableStatus(ctx, booking.tableId, "available");

    return { success: true };
  },
});

