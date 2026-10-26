import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { api } from '@/../convex/_generated/api';
import { createClient } from '@/lib/supabase/server';
import { sb, type QR } from '@/lib/supabase/typed';
import type { Database } from '@/lib/db/types';

type Booking = Database['public']['Tables']['bookings']['Row'];
type RestaurantTable = Database['public']['Tables']['tables']['Row'];

export type BookingStatus = 'pending' | 'confirmed' | 'seated' | 'cancelled' | 'completed';
export type BookingWithTable = Booking & { tables: RestaurantTable | null };

export interface CreateBookingInput {
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  bookingDate: string;
  bookingTime: string;
  bookingEndTime?: string;
  durationMinutes?: number;
  guests: number;
  occasion?: string;
  tablePreference?: string;
  specialRequests?: string;
}

export interface BookingFilters {
  status?: BookingStatus;
  phone?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getBookingById(bookingId: string): Promise<Booking | null> {
  // 1. Primary: Convex Query
  try {
    const booking = await fetchQuery(api.bookings.getBookingById, { bookingId });
    if (booking) {
      return {
        id: booking._id,
        restaurant_id: 'a1b2c3d4-0000-0000-0000-000000000001',
        table_id: null,
        customer_name: booking.customerName,
        customer_phone: booking.customerPhone,
        customer_email: booking.customerEmail || null,
        booking_date: booking.bookingDate,
        booking_time: booking.bookingTime,
        booking_end_time: booking.bookingEndTime || null,
        guests: booking.guests,
        occasion: booking.occasion || null,
        table_preference: booking.tablePreference || null,
        special_requests: booking.specialRequests || null,
        status: booking.status,
        payment_status: booking.paymentStatus,
        advance_amount_paise: booking.advanceAmountPaise,
        cancelled_at: null,
        cancelled_by: null,
        cancellation_reason: null,
        created_at: new Date(booking.createdAt).toISOString(),
        updated_at: new Date(booking.createdAt).toISOString(),
      };
    }
  } catch (err) {
    console.warn('[booking.service] Convex getBookingById failed, trying Supabase:', err);
  }

  // 2. Supabase Fallback
  try {
    const db = sb(await createClient());
    const { data }: QR<Booking> = await db.from('bookings').select('*').eq('id', bookingId).single();
    return data ?? null;
  } catch {
    return null;
  }
}

export async function createBooking(data: CreateBookingInput): Promise<{ bookingId: string; error?: string }> {
  // 1. Primary: Convex Mutation
  try {
    const result = await fetchMutation(api.bookings.createBooking, {
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
    console.warn('[booking.service] Convex createBooking failed, failing closed:', convexError);
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

export async function getBookingsByPhone(phone?: string, email?: string): Promise<Booking[]> {
  // 1. Primary: Convex Query
  try {
    const bookings = await fetchQuery(api.bookings.getBookingsByPhone, {
      phone: phone || undefined,
      email: email || undefined,
    });
    if (bookings && bookings.length > 0) {
      return bookings.map((b: any) => ({
        id: b._id,
        restaurant_id: 'a1b2c3d4-0000-0000-0000-000000000001',
        table_id: null,
        customer_name: b.customerName,
        customer_phone: b.customerPhone,
        customer_email: b.customerEmail || null,
        booking_date: b.bookingDate,
        booking_time: b.bookingTime,
        booking_end_time: b.bookingEndTime || null,
        guests: b.guests,
        occasion: b.occasion || null,
        table_preference: b.tablePreference || null,
        special_requests: b.specialRequests || null,
        status: b.status,
        payment_status: b.paymentStatus,
        advance_amount_paise: b.advanceAmountPaise,
        cancelled_at: null,
        cancelled_by: null,
        cancellation_reason: null,
        created_at: new Date(b.createdAt).toISOString(),
        updated_at: new Date(b.createdAt).toISOString(),
      }));
    }
  } catch {
    // continue to Supabase
  }

  // 2. Supabase Fallback
  try {
    const db = sb(await createClient());
    let query = db.from('bookings').select('*').order('created_at', { ascending: false });
    if (phone) {
      query = query.eq('customer_phone', phone);
    } else if (email) {
      query = query.eq('customer_email', email);
    }
    const { data }: QR<Booking[]> = await query;
    return data ?? [];
  } catch { return []; }
}

export async function getAllBookings(restaurantId: string, filters?: BookingFilters): Promise<BookingWithTable[]> {
  // 1. Primary: Convex Query
  try {
    const bookings = await fetchQuery(api.bookings.getAllBookings, {});
    if (bookings && bookings.length > 0) {
      return bookings.map((b: any) => ({
        id: b._id,
        restaurant_id: restaurantId,
        table_id: null,
        customer_name: b.customerName,
        customer_phone: b.customerPhone,
        customer_email: b.customerEmail || null,
        booking_date: b.bookingDate,
        booking_time: b.bookingTime,
        booking_end_time: b.bookingEndTime || null,
        guests: b.guests,
        occasion: b.occasion || null,
        table_preference: b.tablePreference || null,
        special_requests: b.specialRequests || null,
        status: b.status,
        payment_status: b.paymentStatus,
        advance_amount_paise: b.advanceAmountPaise,
        cancelled_at: null,
        cancelled_by: null,
        cancellation_reason: null,
        created_at: new Date(b.createdAt).toISOString(),
        updated_at: new Date(b.createdAt).toISOString(),
        tables: null,
      }));
    }
  } catch {
    // continue to Supabase
  }

  // 2. Supabase Fallback
  try {
    const db = sb(await createClient());
    let q = db.from('bookings').select('*, tables(*)').eq('restaurant_id', restaurantId);
    if (filters?.status) q = q.eq('status', filters.status);
    if (filters?.phone) q = q.eq('customer_phone', filters.phone);
    if (filters?.dateFrom) q = q.gte('booking_date', filters.dateFrom);
    if (filters?.dateTo) q = q.lte('booking_date', filters.dateTo);
    const { data }: QR<BookingWithTable[]> = await q.order('booking_date', { ascending: true }).order('booking_time', { ascending: true });
    return data ?? [];
  } catch { return []; }
}

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  actorId?: string,
  cancelReason?: string,
  sessionToken?: string
): Promise<{ error?: string }> {
  // 1. Primary: Convex Mutation
  try {
    let token = sessionToken;
    if (!token) {
      try {
        const { getSessionToken } = await import('@/lib/auth/admin-auth');
        token = await getSessionToken();
      } catch {
        // no cookie context
      }
    }

    const res: any = await fetchMutation(api.bookings.updateBookingStatus, {
      bookingId: bookingId as any,
      status: status as any,
      reason: cancelReason,
      actor: actorId,
      sessionToken: token,
    });
    if (res && 'error' in res && res.error) {
      return { error: res.error };
    }
    return {};
  } catch (convexError) {
    console.warn('[booking.service] Convex updateBookingStatus failed, trying Supabase:', convexError);
  }

  // 2. Supabase Fallback
  try {
    const db = sb(await createClient());
    const update: Record<string, unknown> = { status };
    if (cancelReason) update.cancellation_reason = cancelReason;
    if (status === 'cancelled') { update.cancelled_at = new Date().toISOString(); update.cancelled_by = actorId ?? 'admin'; }

    const { error }: QR<null> = await db.from('bookings').update(update).eq('id', bookingId);
    if (error) throw error;

    await db.from('audit_logs').insert({ restaurant_id: 'a1b2c3d4-0000-0000-0000-000000000001', entity_type: 'bookings', entity_id: bookingId, action: 'BOOKING_STATUS_UPDATED', actor_id: actorId ?? null, actor_role: null, actor_name: null, old_value: null, new_value: { status, cancel_reason: cancelReason }, ip_address: null });
    return {};
  } catch { return { error: 'Failed to update booking status' }; }
}

export async function confirmBookingPayment(
  bookingId: string,
  reference?: string,
  sessionToken?: string,
  customerPhone?: string
): Promise<{ success?: boolean; error?: string }> {
  // 1. Primary: Convex Mutation
  try {
    const res: any = await fetchMutation(api.bookings.confirmBookingPayment, {
      bookingId,
      reference,
      sessionToken,
      customerPhone,
    });
    if (res && 'error' in res && res.error) {
      return { error: res.error };
    }
    return { success: true };
  } catch (convexError) {
    console.warn('[booking.service] Convex confirmBookingPayment failed, trying Supabase fallback:', convexError);
  }

  // 2. Supabase Fallback
  try {
    const db = sb(await createClient());
    const { data: booking }: QR<{ id: string; status: string; advance_amount_paise: number }> = await db
      .from('bookings')
      .select('id, status, advance_amount_paise')
      .eq('id', bookingId)
      .single();
    if (!booking) return { error: 'Booking not found' };
    if (booking.status !== 'pending') return { error: `Booking is not pending (status: ${booking.status})` };

    const { error } = await db.from('bookings').update({ status: 'confirmed', payment_status: 'paid' }).eq('id', bookingId);
    if (error) return { error: 'Failed to confirm' };

    await db.from('payments').insert({
      booking_id: bookingId,
      payment_method: 'upi',
      amount_paise: booking.advance_amount_paise ?? 50000,
      tip_paise: 0,
      status: 'paid',
      reference: reference ?? null,
    });
    return { success: true };
  } catch {
    return { error: 'Failed to confirm booking payment' };
  }
}

export async function cancelBooking(
  bookingId: string,
  reason?: string,
  actor?: string,
  sessionToken?: string,
  customerPhone?: string
): Promise<{ success?: boolean; error?: string }> {
  // 1. Primary: Convex Mutation
  try {
    const res: any = await fetchMutation(api.bookings.cancelBooking, {
      bookingId,
      reason,
      actor,
      sessionToken,
      customerPhone,
    });
    if (res && 'error' in res && res.error) {
      return { error: res.error };
    }
    return { success: true };
  } catch (convexError) {
    console.warn('[booking.service] Convex cancelBooking failed, trying Supabase fallback:', convexError);
  }

  // 2. Supabase Fallback
  try {
    const db = sb(await createClient());
    const { error } = await db
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: actor ?? 'staff',
        cancellation_reason: reason ?? null,
      })
      .eq('id', bookingId);
    if (error) return { error: 'Failed to cancel booking' };
    return { success: true };
  } catch {
    return { error: 'Failed to cancel booking' };
  }
}

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
        tables: (res.availableTables || []).map((t: any) => ({
          id: String(t.id),
          restaurant_id: restaurantId,
          table_number: t.tableNumber,
          capacity: t.capacity,
          status: 'available' as const,
          notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })),
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
