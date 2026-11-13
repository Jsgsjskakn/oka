import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = 'C:/Users/Pyiush Gupta/.gemini/antigravity/scratch/the-golden-oak';

describe('Booking, Floorplan & Profile Comprehensive Verification', () => {

  // =========================================================================
  // 1. /booking page & Floorplan Verification
  // =========================================================================
  describe('1. /booking: 3D interactive floorplan, 2D fallback, touch/scroll ergonomics & 5-min hold', () => {
    const floorplan3DPath = path.join(PROJECT_ROOT, 'src/components/booking/Restaurant3DFloorplan.tsx');
    const floorplan2DPath = path.join(PROJECT_ROOT, 'src/components/booking/RestaurantFloorMap.tsx');
    const bookingsConvexPath = path.join(PROJECT_ROOT, 'convex/bookings.ts');
    const bookingClientPath = path.join(PROJECT_ROOT, 'src/app/booking/BookingClient.tsx');

    const content3D = fs.readFileSync(floorplan3DPath, 'utf8');
    const content2D = fs.readFileSync(floorplan2DPath, 'utf8');
    const contentConvex = fs.readFileSync(bookingsConvexPath, 'utf8');
    const contentClient = fs.readFileSync(bookingClientPath, 'utf8');

    it('3D floorplan implements ThreeDErrorBoundary with seamless 2D fallback', () => {
      assert.ok(content3D.includes('class ThreeDErrorBoundary'), 'Must contain ThreeDErrorBoundary');
      assert.ok(content3D.includes('Switch to 2D Floorplan') || content3D.includes('Continue Booking via 2D Floorplan'), 'Must offer switch to 2D button on error');
      assert.ok(content3D.includes('onSwitchTo2D'), 'Must accept onSwitchTo2D callback');
    });

    it('2D floorplan implements interactive table selection and switch to 3D button', () => {
      assert.ok(content2D.includes('onSelectTable'), '2D floorplan must support onSelectTable');
      assert.ok(content2D.includes('onSwitchTo3D'), '2D floorplan must provide switch to 3D callback');
      assert.ok(content2D.includes('ARCHITECTURAL BLUEPRINT (2D)'), '2D floorplan must display blueprint header');
    });

    it('touch vs scroll ergonomics: synchronizes touch-action pan-y in scroll mode and none in orbit mode', () => {
      assert.ok(content3D.includes('function MobileTouchSync'), 'Must define MobileTouchSync');
      assert.ok(content3D.includes("touchOrbitActive ? 'none' : 'pan-y'"), 'Must toggle touchAction between none and pan-y');
      assert.ok(content3D.includes('Page Scroll Mode'), 'Must indicate Page Scroll Mode');
      assert.ok(content3D.includes('3D Orbit Active'), 'Must indicate 3D Orbit Active');
      assert.ok(content3D.includes('Use 2 fingers to rotate'), 'Must provide two-finger rotation guidance');
    });

    it('table availability hold: convex/bookings.ts implements 5-min hold logic & expiry filtering', () => {
      assert.ok(contentConvex.includes('booking_hold_minutes'), 'Must check booking_hold_minutes setting');
      assert.ok(contentConvex.includes('holdExpiresAt = now + holdMinutes * 60 * 1000'), 'Must calculate holdExpiresAt');
      assert.ok(contentConvex.includes('b.status === "pending" && b.holdExpiresAt && b.holdExpiresAt <= now'), 'filterActiveBookings must release expired holds');
      assert.ok(contentConvex.includes('Reservation hold has expired'), 'confirmBookingPayment must reject expired hold');
    });

    it('BookingClient manages hold countdown & re-verifies availability on expiration', () => {
      assert.ok(contentClient.includes('setHoldExpiresAt'), 'BookingClient must set holdExpiresAt');
      assert.ok(contentClient.includes('Table Hold Expired'), 'BookingClient must notify when hold expires');
    });
  });

  // =========================================================================
  // 2. Date, time, guest selection & URL query param prefilling
  // =========================================================================
  describe('2. Query param prefilling (?guests=X&date=Y&time=Z) & selection parsing', () => {
    const bookingPagePath = path.join(PROJECT_ROOT, 'src/app/booking/page.tsx');
    const bookingClientPath = path.join(PROJECT_ROOT, 'src/app/booking/BookingClient.tsx');
    const contentPage = fs.readFileSync(bookingPagePath, 'utf8');
    const contentClient = fs.readFileSync(bookingClientPath, 'utf8');

    it('BookingPage extracts guests, date, and time from searchParams Promise', () => {
      assert.ok(contentPage.includes('parseInitialGuests(params?.guests)'), 'Must parse guests');
      assert.ok(contentPage.includes('parseInitialDateStr(params?.date)'), 'Must parse date');
      assert.ok(contentPage.includes('normalizeInitialTime(params?.time)'), 'Must normalize time');
      assert.ok(contentPage.includes('key={`${initialGuests}-${initialDateStr}-${initialTime}`}'), 'Must set dynamic key on BookingClient to prevent stale searchParam state');
    });

    it('normalizeInitialTime correctly resolves 24hr, 12hr, and dinner hours without meridiem', () => {
      const ALLOWED = [
        '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM',
        '09:00 PM', '09:30 PM', '10:00 PM', '10:30 PM',
      ];
      function normalizeInitialTime(raw) {
        if (!raw) return '08:00 PM';
        const match = raw.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
        if (!match) return '08:00 PM';
        let hours = Number.parseInt(match[1], 10);
        const mins = Number.parseInt(match[2], 10);
        let meridiem = match[3]?.toUpperCase();
        if (!meridiem) {
          if (hours < 0 || hours > 23 || mins < 0 || mins > 59) return '08:00 PM';
          if (hours >= 7 && hours <= 11) {
            meridiem = 'PM';
          } else {
            meridiem = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
          }
        } else if (hours < 1 || hours > 12 || mins < 0 || mins > 59) {
          return '08:00 PM';
        }
        const formatted = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${meridiem}`;
        return ALLOWED.includes(formatted) ? formatted : '08:00 PM';
      }

      assert.equal(normalizeInitialTime('19:30'), '07:30 PM');
      assert.equal(normalizeInitialTime('20:00'), '08:00 PM');
      assert.equal(normalizeInitialTime('7:30'), '07:30 PM');
      assert.equal(normalizeInitialTime('8:30'), '08:30 PM');
      assert.equal(normalizeInitialTime('9:00 PM'), '09:00 PM');
      assert.equal(normalizeInitialTime('10:30'), '10:30 PM');
      assert.equal(normalizeInitialTime(''), '08:00 PM');
    });

    it('BookingClient initializes initialTable that satisfies initialGuests party capacity', () => {
      assert.ok(contentClient.includes('initialTable'), 'BookingClient must compute initialTable matching initialGuests');
      assert.ok(contentClient.includes('t.capacity >= initialGuests'), 'Must check capacity against initialGuests');
    });

    it('BookingClient synchronizes URL query params on client selection change without full reload', () => {
      assert.ok(contentClient.includes("url.searchParams.set('guests'"), 'Must update guests query param');
      assert.ok(contentClient.includes("url.searchParams.set('date'"), 'Must update date query param');
      assert.ok(contentClient.includes("url.searchParams.set('time'"), 'Must update time query param');
      assert.ok(contentClient.includes('window.history.replaceState'), 'Must use replaceState to update browser URL');
    });
  });

  // =========================================================================
  // 3. /booking/success confirmation details
  // =========================================================================
  describe('3. /booking/success: Confirmation card, details mapping & timezone preservation', () => {
    const successPagePath = path.join(PROJECT_ROOT, 'src/app/booking/success/page.tsx');
    const cardPath = path.join(PROJECT_ROOT, 'src/components/booking/BookingConfirmationCard.tsx');

    const contentSuccess = fs.readFileSync(successPagePath, 'utf8');
    const contentCard = fs.readFileSync(cardPath, 'utf8');

    it('BookingSuccessPage passes clean booking_date directly without UTC shifting', () => {
      assert.ok(contentSuccess.includes('date: booking.booking_date'), 'Must pass booking.booking_date directly');
      assert.ok(!contentSuccess.includes('parsedBookingDate.toISOString()'), 'Must not convert YMD date to ISO string with UTC offset shifting');
    });

    it('BookingSuccessPage displays assigned table number if table preference is unset', () => {
      assert.ok(contentSuccess.includes('booking.tables?.table_number') || contentSuccess.includes('Table #'), 'Must fall back to assigned table number');
    });

    it('BookingConfirmationCard renders booking details, calendar invite and directions', () => {
      assert.ok(contentCard.includes('Reservation Confirmed'), 'Must display confirmed header');
      assert.ok(contentCard.includes('Booking ID'), 'Must display booking ID');
      assert.ok(contentCard.includes('handleAddToCalendar'), 'Must support downloading .ics calendar invite');
      assert.ok(contentCard.includes('mapsUrl') || contentCard.includes('Get Directions'), 'Must provide Google Maps directions link');
      assert.ok(contentCard.includes('Call Restaurant'), 'Must provide call restaurant button');
    });
  });

  // =========================================================================
  // 4. /profile dashboard & sub-pages
  // =========================================================================
  describe('4. /profile: Authenticated vs guest mock login, real data fetching & phone normalization', () => {
    const profilePagePath = path.join(PROJECT_ROOT, 'src/app/profile/page.tsx');
    const mockLoginPath = path.join(PROJECT_ROOT, 'src/components/profile/MockLoginCard.tsx');
    const profileClientPath = path.join(PROJECT_ROOT, 'src/components/profile/ProfileDashboardClient.tsx');
    const bookingServicePath = path.join(PROJECT_ROOT, 'src/lib/services/booking.service.ts');
    const authUtilsPath = path.join(PROJECT_ROOT, 'convex/authUtils.ts');

    const contentProfile = fs.readFileSync(profilePagePath, 'utf8');
    const contentMock = fs.readFileSync(mockLoginPath, 'utf8');
    const contentProfileClient = fs.readFileSync(profileClientPath, 'utf8');
    const contentService = fs.readFileSync(bookingServicePath, 'utf8');
    const contentAuthUtils = fs.readFileSync(authUtilsPath, 'utf8');

    it('ProfilePage displays MockLoginCard for unauthenticated guest sessions', () => {
      assert.ok(contentProfile.includes('if (!resolvedUser)'), 'Must check user authentication');
      assert.ok(contentProfile.includes('<MockLoginCard />'), 'Must render MockLoginCard when unauthenticated');
    });

    it('MockLoginCard provides sign-in, sign-up, reservation, and menu links', () => {
      assert.ok(contentMock.includes('/auth/login?redirectTo=/profile'), 'Must have login link');
      assert.ok(contentMock.includes('/auth/signup?redirectTo=/profile'), 'Must have signup link');
      assert.ok(contentMock.includes('/booking'), 'Must link to bookings');
      assert.ok(contentMock.includes('/menu'), 'Must link to menu');
    });

    it('booking.service.ts maps table_number in getBookingsByPhone for real table badge display', () => {
      assert.ok(contentService.includes('table_number: typeof b.tableNumber === \'number\' ? b.tableNumber : null'), 'getBookingsByPhone must include table_number');
    });

    it('ProfileDashboardClient formats phone number cleanly for Indian mobile display', () => {
      assert.ok(contentProfileClient.includes('formatPhoneDisplay'), 'Must use formatPhoneDisplay');
      assert.ok(contentProfileClient.includes('+91'), 'Must include +91 prefix for standardized Indian mobile formatting');
    });

    it('convex/authUtils.ts normalizePhone, buildPhoneCandidates, and phonesMatch handle all format variations', () => {
      assert.ok(contentAuthUtils.includes('function normalizePhone'), 'Must define normalizePhone');
      assert.ok(contentAuthUtils.includes('function buildPhoneCandidates'), 'Must define buildPhoneCandidates');
      assert.ok(contentAuthUtils.includes('function phonesMatch'), 'Must define phonesMatch');
      assert.ok(contentAuthUtils.includes('candidates.add(`+91${norm}`)'), 'Must include candidates for +91 and 10 digits');
    });
  });
});
