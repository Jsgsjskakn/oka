'use server';

import { createClient } from '@/lib/supabase/server';
import { sb, type QR } from '@/lib/supabase/typed';
import { requireAdmin } from '@/lib/auth/admin-auth';

const RESTAURANT_ID = 'a1b2c3d4-0000-0000-0000-000000000001';

export async function createBookingAction(formData: {
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
}): Promise<{ bookingId?: string; error?: string }> {
  try {
    const { createBooking } = await import('@/lib/services/booking.service');
    const result = await createBooking({
      ...formData,
      restaurantId: RESTAURANT_ID,
    });

    if (result.error) return { error: result.error };
    return { bookingId: result.bookingId };
  } catch {
    return { error: 'Failed to create booking' };
  }
}

export async function confirmBookingPayment(bookingId: string, paymentMethod: 'upi' | 'cash', reference?: string, adminId?: string, adminName?: string): Promise<{ error?: string }> {
  const admin = await requireAdmin();

  // 1. Primary: Try Convex
  try {
    const { fetchMutation } = await import('convex/nextjs');
    const { api } = await import('@/../convex/_generated/api');
    const res = await fetchMutation(api.bookings.confirmBookingPayment, {
      bookingId,
      reference,
      sessionToken: admin.sessionToken,
    });
    if (res && res.success) {
      return {};
    }
    if (res && res.error) {
      return { error: res.error };
    }
  } catch (convexErr) {
    console.warn('[booking-actions] Convex confirmBookingPayment failed, trying Supabase:', convexErr);
  }

  // 2. Secondary: Supabase Fallback
  try {
    const db = sb(await createClient());
    const { data: booking }: QR<{ id: string; status: string; advance_amount_paise: number }> = await db.from('bookings').select('id, status, advance_amount_paise').eq('id', bookingId).single();
    if (!booking) return { error: 'Booking not found' };
    if (booking.status !== 'pending') return { error: 'Not in pending state' };

    const { error }: QR<null> = await db.from('bookings').update({ status: 'confirmed', payment_status: 'paid' }).eq('id', bookingId);
    if (error) return { error: 'Failed to confirm' };

    await db.from('payments').insert({ booking_id: bookingId, payment_method: paymentMethod, amount_paise: booking.advance_amount_paise ?? 50000, tip_paise: 0, status: 'paid', reference: reference ?? null });
    await db.from('audit_logs').insert({ restaurant_id: RESTAURANT_ID, actor_id: adminId ?? null, actor_name: adminName ?? 'Admin', actor_role: 'admin', action: 'BOOKING_PAYMENT_CONFIRMED', entity_type: 'bookings', entity_id: bookingId, old_value: null, new_value: { status: 'confirmed', payment_method: paymentMethod }, ip_address: null });
    return {};
  } catch { return { error: 'Failed to confirm payment' }; }
}

export async function cancelBookingByAdmin(bookingId: string, reason?: string, adminId?: string, adminName?: string): Promise<{ error?: string }> {
  const admin = await requireAdmin();

  // 1. Primary: Try Convex
  try {
    const { fetchMutation } = await import('convex/nextjs');
    const { api } = await import('@/../convex/_generated/api');
    const res = await fetchMutation(api.bookings.cancelBooking, {
      bookingId,
      reason,
      sessionToken: admin.sessionToken,
    });
    if (res && res.success) {
      return {};
    }
    if (res && res.error) {
      return { error: res.error };
    }
  } catch (convexErr) {
    console.warn('[booking-actions] Convex cancelBooking failed, trying Supabase:', convexErr);
  }

  // 2. Secondary: Supabase Fallback
  try {
    const db = sb(await createClient());
    const { error }: QR<null> = await db.from('bookings').update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancelled_by: adminId ?? 'admin', cancellation_reason: reason ?? null }).eq('id', bookingId);
    if (error) return { error: 'Failed to cancel booking' };
    await db.from('audit_logs').insert({ restaurant_id: RESTAURANT_ID, actor_id: adminId ?? null, actor_name: adminName ?? 'Admin', actor_role: 'admin', action: 'BOOKING_CANCELLED_BY_ADMIN', entity_type: 'bookings', entity_id: bookingId, old_value: null, new_value: { status: 'cancelled', reason }, ip_address: null });
    return {};
  } catch { return { error: 'Failed to cancel booking' }; }
}

export async function customerConfirmBookingPayment(bookingId: string, paymentMethod: 'upi', reference: string, customerPhone?: string): Promise<{ error?: string }> {
  try {
    // Try Convex first
    const { fetchMutation } = await import('convex/nextjs');
    const { api } = await import('@/../convex/_generated/api');
    const { getSessionToken } = await import('@/lib/auth/admin-auth');
    const sessionToken = await getSessionToken();
    try {
      const res = await fetchMutation(api.bookings.confirmBookingPayment, {
        bookingId,
        reference,
        sessionToken,
        customerPhone,
      });
      if (res && res.success) {
        return {};
      }
      if (res && res.error) {
        return { error: res.error };
      }
    } catch {
      // Fall through to Supabase
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const db = sb(supabase);
    const { data: booking }: QR<{ id: string; status: string; advance_amount_paise: number; user_id: string | null }> = await db
      .from('bookings')
      .select('id, status, advance_amount_paise, user_id')
      .eq('id', bookingId)
      .single();

    if (!booking) return { error: 'Booking not found' };
    if (booking.user_id !== user.id) return { error: 'Unauthorized: Not your booking' };
    if (booking.status !== 'pending') return { error: 'Not in pending state' };

    const { error } = await db.from('bookings').update({ status: 'confirmed', payment_status: 'paid' }).eq('id', bookingId);
    if (error) return { error: 'Failed to confirm' };

    await db.from('payments').insert({
      booking_id: bookingId,
      payment_method: paymentMethod,
      amount_paise: booking.advance_amount_paise ?? 50000,
      tip_paise: 0,
      status: 'paid',
      reference: reference
    });
    
    return {};
  } catch {
    return { error: 'Failed to confirm payment' };
  }
}

export async function updateBookingStatusAction(
  bookingId: string,
  status: 'confirmed' | 'seated' | 'completed' | 'cancelled',
  reason?: string
): Promise<{ success?: boolean; error?: string }> {
  const admin = await requireAdmin();

  // 1. Try Convex first
  try {
    const { fetchMutation } = await import('convex/nextjs');
    const { api } = await import('@/../convex/_generated/api');
    const res = await fetchMutation(api.bookings.updateBookingStatus, {
      bookingId: bookingId as any,
      status,
      reason,
      actor: 'Admin',
      sessionToken: admin.sessionToken,
    });
    if (res && res.error) {
      return { error: res.error };
    }
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/admin/bookings');
    return { success: true };
  } catch (convexErr) {
    console.warn('[booking-actions] Convex updateBookingStatus failed, trying Supabase:', convexErr);
  }

  // 2. Supabase Fallback
  try {
    const db = sb(await createClient());
    const updates: Record<string, unknown> = { status };
    if (status === 'cancelled') {
      updates.cancelled_at = new Date().toISOString();
      updates.cancelled_by = 'admin';
      updates.cancellation_reason = reason ?? null;
    }
    const { error } = await db.from('bookings').update(updates as any).eq('id', bookingId);
    if (error) return { error: 'Failed to update booking status' };
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/admin/bookings');
    return { success: true };
  } catch {
    return { error: 'Failed to update booking status' };
  }
}
