import { getSetting } from '@/lib/services/settings.service';
import { getCurrentUser } from '@/lib/auth/convex-auth-actions';
import BookingClient from './BookingClient';

export const dynamic = 'force-dynamic';

const RESTAURANT_ID = 'a1b2c3d4-0000-0000-0000-000000000001';
const ALLOWED_DINING_SLOTS = [
  '07:00 PM',
  '07:30 PM',
  '08:00 PM',
  '08:30 PM',
  '09:00 PM',
  '09:30 PM',
  '10:00 PM',
  '10:30 PM',
];

function toLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseInitialGuests(raw?: string): number {
  if (!raw) return 2;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) return 2;
  return Math.min(10, Math.max(1, parsed));
}

function parseInitialDateStr(raw?: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 90);

  if (!raw) return toLocalYmd(today);
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();

  if (lower.startsWith('today')) {
    return toLocalYmd(today);
  }
  if (lower.startsWith('tomorrow')) {
    const tmr = new Date(today);
    tmr.setDate(tmr.getDate() + 1);
    return toLocalYmd(tmr);
  }

  const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) {
    const candidate = new Date(
      Number.parseInt(ymdMatch[1], 10),
      Number.parseInt(ymdMatch[2], 10) - 1,
      Number.parseInt(ymdMatch[3], 10)
    );
    candidate.setHours(0, 0, 0, 0);
    if (!Number.isNaN(candidate.getTime()) && candidate >= today && candidate <= maxDate) {
      return toLocalYmd(candidate);
    }
    return toLocalYmd(today);
  }

  const withoutWeekday = trimmed.replace(/^[A-Za-z]+,\s*/, '');
  const parsed = new Date(withoutWeekday);
  if (!Number.isNaN(parsed.getTime())) {
    parsed.setHours(0, 0, 0, 0);
    if (parsed >= today && parsed <= maxDate) {
      return toLocalYmd(parsed);
    }
  }

  return toLocalYmd(today);
}

function normalizeInitialTime(raw?: string): string {
  if (!raw) return '08:00 PM';
  const match = raw.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return '08:00 PM';

  let hours = Number.parseInt(match[1], 10);
  const mins = Number.parseInt(match[2], 10);
  let meridiem = match[3]?.toUpperCase();

  if (!meridiem) {
    if (hours < 0 || hours > 23 || mins < 0 || mins > 59) return '08:00 PM';
    meridiem = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
  } else if (hours < 1 || hours > 12 || mins < 0 || mins > 59) {
    return '08:00 PM';
  }

  const formatted = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${meridiem}`;
  return ALLOWED_DINING_SLOTS.includes(formatted) ? formatted : '08:00 PM';
}

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ guests?: string; date?: string; time?: string }>;
}) {
  const params = await searchParams;
  const initialGuests = parseInitialGuests(params?.guests);
  const initialDateStr = parseInitialDateStr(params?.date);
  const initialTime = normalizeInitialTime(params?.time);

  let userId = '';
  let userName = '';
  let userEmail = '';
  let userPhone = '';

  // 1. Check Convex user primary
  const convexUser = await getCurrentUser();
  if (convexUser) {
    userId = convexUser.userId;
    userName = convexUser.name;
    userEmail = convexUser.email;
    userPhone = convexUser.phone || '';
  } else {
    // 2. Fallback to Supabase
    try {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        userId = user.id;
        userEmail = user.email || '';
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, full_name, email, phone')
          .eq('id', user.id)
          .single() as { data: any, error: any };
        userName =
          profile?.name ||
          profile?.full_name ||
          user.user_metadata?.full_name ||
          user.email?.split('@')[0] ||
          '';
        userPhone = profile?.phone || user.phone || '';
      }
    } catch {
      // ignore
    }
  }

  // Note: Guest booking is fully supported. If logged in, details are pre-filled; otherwise guest enters their details directly.

  const advanceAmountRaw = await getSetting(RESTAURANT_ID, 'advance_booking_amount_paise');
  const advanceAmount = typeof advanceAmountRaw === 'number' ? advanceAmountRaw : 50000;

  return (
    <BookingClient
      userId={userId}
      userName={userName}
      userEmail={userEmail}
      userPhone={userPhone}
      advanceAmountPaise={advanceAmount}
      initialGuests={initialGuests}
      initialDateStr={initialDateStr}
      initialTime={initialTime}
    />
  );
}
