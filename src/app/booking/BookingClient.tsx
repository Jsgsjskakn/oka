'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { BookingHeader } from '@/components/booking/BookingHeader';
import { DateChipSelector } from '@/components/booking/DateChipSelector';
import { TimeSlotGrid } from '@/components/booking/TimeSlotGrid';
import { GuestStepper } from '@/components/booking/GuestStepper';
import { CustomerDetailsForm } from '@/components/booking/CustomerDetailsForm';
import { SpecialRequestField } from '@/components/booking/SpecialRequestField';
import { OccasionChips } from '@/components/booking/OccasionChips';
import { TablePreferenceSelector } from '@/components/booking/TablePreferenceSelector';
import { RestaurantFloorMap, RESTAURANT_TABLES, type FloorTable } from '@/components/booking/RestaurantFloorMap';
import { RESTAURANT_3D_TABLES } from '@/lib/constants/restaurant3DMapping';
import { BookingSummaryDossier } from '@/components/booking/BookingSummaryDossier';

// Dynamic import with SSR false for Three.js 3D WebGL Canvas
const Restaurant3DFloorplan = dynamic(
  () =>
    import('@/components/booking/Restaurant3DFloorplan').then(
      (mod) => mod.Restaurant3DFloorplan
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[520px] rounded-2xl flex flex-col items-center justify-center bg-[#0E0D0C]/80 border border-white/10 text-center">
        <div className="w-8 h-8 border-2 border-[#F0C36B] border-t-transparent rounded-full animate-spin mb-3 shadow-[0_0_15px_rgba(240,195,107,0.3)]" />
        <span className="text-xs font-mono font-semibold text-[#F0C36B] uppercase tracking-wider">
          Initializing 3D Spatial Canvas...
        </span>
        <span className="text-[11px] text-[#A69F94] mt-1 font-serif">
          The Golden Oak Dining Interior
        </span>
      </div>
    ),
  }
);
import { createBookingAction, customerConfirmBookingPayment } from '@/lib/actions/booking-actions';
import { checkAvailabilityAction } from '@/lib/actions/booking-availability-action';
import {
  Loader2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Lock,
  ShoppingBag,
  Sparkles,
  QrCode,
  ShieldCheck,
  UtensilsCrossed,
  MapPin,
  Heart,
  Maximize2,
  User,
  Users,
  ChevronDown,
  ChevronRight,
  Crown,
  Star,
  Wine,
  Box,
} from 'lucide-react';
import { formatMoney } from '@/lib/db/types';
import { toast } from '@/store/toast-store';
import { useNotificationStore } from '@/store/notification-store';
import { useCartStore } from '@/store/cart-store';

interface BookingClientProps {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  advanceAmountPaise: number;
}

export default function BookingClient({
  userId,
  userName,
  userEmail,
  userPhone,
  advanceAmountPaise,
}: BookingClientProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Cart store for pre-ordering feature
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const totalCartItems = useCartStore((s) => s.getTotalItems());
  const cartItems = useCartStore((s) => s.items);
  const safeTotalCartItems = mounted ? totalCartItems : 0;
  const [attachCart, setAttachCart] = useState(false);

  // Step 1: Configurator State
  const [guests, setGuests] = useState<number>(2);
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<string | null>('08:00 PM');
  const [durationMinutes, setDurationMinutes] = useState<number>(120); // default 2 hours
  const [selectedTable, setSelectedTable] = useState<FloorTable | null>(
    RESTAURANT_TABLES.find((t) => t.tableNumber === 7) || RESTAURANT_TABLES[0]
  );
  const [selectedZone, setSelectedZone] = useState<string>("The Hearth Chef's Counter");
  const [availableTableNumbers, setAvailableTableNumbers] = useState<number[] | undefined>(undefined);
  const [view3DMode, setView3DMode] = useState(true);
  const [openFullscreen3D, setOpenFullscreen3D] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [chefsSpecialSelected, setChefsSpecialSelected] = useState(false);
  const [holdExpiresAt, setHoldExpiresAt] = useState<number | null>(null);
  const [availabilityMsg, setAvailabilityMsg] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>({
    text: 'Table T7 available for 2 guests.',
    type: 'success',
  });

  // Step 2: Guest Dossier & Preferences
  const [details, setDetails] = useState({
    name: userName,
    phone: userPhone,
    email: userEmail,
  });
  const [specialRequests, setSpecialRequests] = useState('');
  const [occasion, setOccasion] = useState('None');
  const [preference, setPreference] = useState('No preference');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 3: Confirmation & Payment
  const [utr, setUtr] = useState('');
  const [paymentError, setPaymentError] = useState('');

  // 4 Inline Duration Chips
  const durationChips = [
    { value: 90, label: '1.5 Hrs · Express', desc: 'Light culinary sitting' },
    { value: 120, label: '2.0 Hrs · Standard', desc: 'Full multi-course dining' },
    { value: 150, label: '2.5 Hrs · Tasting', desc: "Chef's tasting menu" },
    { value: 180, label: '3.0 Hrs · Celebration', desc: 'Extended celebration' },
  ];

  const getLocalDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const calculateEndTime = (startTimeStr: string, durMins: number) => {
    const [timeStr, modifier] = startTimeStr.split(/[\s\u202F\u00A0]+/);
    let [hours, minutes] = timeStr.split(':').map(Number);
    if (modifier?.toUpperCase() === 'PM' && hours < 12) hours += 12;
    if (modifier?.toUpperCase() === 'AM' && hours === 12) hours = 0;

    const totalMinutes = hours * 60 + minutes + durMins;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;
  };

  const formatDbTime = (timeStr: string) => {
    const [t, m] = timeStr.split(/[\s\u202F\u00A0]+/);
    let [h, min] = t.split(':').map(Number);
    if (m?.toUpperCase() === 'PM' && h < 12) h += 12;
    if (m?.toUpperCase() === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`;
  };

  // Feature 3: Auto-Check Availability + 5-Minute Hold Timer
  const performAvailabilityCheck = useCallback(
    async (selectedDate: Date, selectedTime: string, partySize: number, durMins: number) => {
      setIsChecking(true);
      setAvailabilityMsg(null);

      try {
        const dateStr = getLocalDateStr(selectedDate);
        const dbStartTime = formatDbTime(selectedTime);
        const dbEndTime = calculateEndTime(selectedTime, durMins);

        const res = await checkAvailabilityAction(
          dateStr,
          dbStartTime,
          dbEndTime,
          partySize
        );

        if (res.available) {
          const tableNums = res.availableTables?.map((t) => t.tableNumber) || [];
          setAvailableTableNumbers(tableNums);

          // Auto-select best table or first available
          if (
            !selectedTable ||
            !tableNums.includes(selectedTable.tableNumber) ||
            (selectedTable.capacity && selectedTable.capacity < partySize)
          ) {
            const candidate3DTables = RESTAURANT_3D_TABLES.filter(
              (t) => tableNums.includes(t.tableNumber) && t.capacity >= partySize
            ).sort((a, b) => a.capacity - b.capacity);

            const best =
              candidate3DTables[0] ||
              RESTAURANT_TABLES.find(
                (t) => tableNums.includes(t.tableNumber) && t.capacity >= partySize
              ) ||
              RESTAURANT_3D_TABLES[0];
            setSelectedTable(best as FloorTable);
            setSelectedZone(best.zone);
          }

          // Start 5-minute hold timer
          setHoldExpiresAt(Date.now() + 5 * 60 * 1000);

          setAvailabilityMsg({
            text: `Table available! ${res.tableCount || 1} table(s) available for ${partySize} guests.`,
            type: 'success',
          });
          toast.success('Table Available', `Reserved for ${partySize} guests at ${selectedTime}`);
        } else {
          setAvailableTableNumbers([]);
          setSelectedTable(null);
          setHoldExpiresAt(null);
          setAvailabilityMsg({
            text: res.error || 'All tables are reserved for this slot. Please choose another time.',
            type: 'error',
          });
          toast.error('No Tables Available', 'Please select an adjacent time slot.');
        }
      } catch {
        setAvailabilityMsg({
          text: 'Failed to verify live table availability. Please try again.',
          type: 'error',
        });
      } finally {
        setIsChecking(false);
      }
    },
    [selectedTable]
  );

  // Trigger auto-check when Date, Time, Duration or Guests change
  useEffect(() => {
    if (time) {
      const timer = setTimeout(() => {
        performAvailabilityCheck(date, time, guests, durationMinutes);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [date, time, guests, durationMinutes, performAvailabilityCheck]);

  // When user clicks a table on the floor map
  const handleSelectTableFromMap = (table: FloorTable) => {
    if (table.capacity < guests) {
      toast.error(
        'Table Capacity Exceeded',
        `${table.name} accommodates up to ${table.capacity} guests (party has ${guests}). Please select a table that accommodates your party.`
      );
      return;
    }
    if (availableTableNumbers && availableTableNumbers.length > 0 && !availableTableNumbers.includes(table.tableNumber)) {
      toast.error(
        'Table Unavailable',
        `${table.name} is reserved for this time slot. Please choose an available table.`
      );
      return;
    }
    setSelectedTable(table);
    setSelectedZone(table.zone);
    setPreference(table.name);
    // Restart/refresh 5-minute hold timer
    setHoldExpiresAt(Date.now() + 5 * 60 * 1000);
    toast.success('Table Selected', `${table.name} (${table.zone}) locked for 5 mins`);
  };

  const handleProceedToDetails = () => {
    if (!time || availabilityMsg?.type !== 'success') {
      if (!time) {
        toast.error('Select Time', 'Please pick a dining time slot to continue.');
      }
      return;
    }
    if (holdExpiresAt && Date.now() > holdExpiresAt) {
      toast.error(
        'Table Hold Expired',
        'Your 5-minute allocation window has elapsed. Re-verifying table availability...'
      );
      performAvailabilityCheck(date, time, guests, durationMinutes);
      return;
    }
    setStep(2);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const validateDetails = () => {
    const errs: Record<string, string> = {};
    if (!details.name.trim()) errs.name = 'Full name is required';
    if (!details.phone.trim() || details.phone.replace(/\D/g, '').length < 10) {
      errs.phone = 'Valid 10-digit mobile number is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateBooking = async () => {
    if (!validateDetails()) return;
    if (!time) return;

    setIsSubmitting(true);
    try {
      const dateStr = getLocalDateStr(date);
      const dbStartTime = formatDbTime(time);
      const dbEndTime = calculateEndTime(time, durationMinutes);

      // If pre-order from cart is toggled, append cart summary to special requests
      let fullSpecialRequests = specialRequests.trim();
      if (attachCart && totalCartItems > 0) {
        const cartSummary = cartItems
          .map((item) => `${item.quantity}x ${item.dish.name}`)
          .join(', ');
        fullSpecialRequests = fullSpecialRequests
          ? `${fullSpecialRequests} | [Pre-Order Attached: ${cartSummary}]`
          : `[Pre-Order Attached: ${cartSummary}]`;
      }

      const res = await createBookingAction({
        customerName: details.name.trim(),
        customerPhone: details.phone.trim(),
        customerEmail: details.email.trim() || undefined,
        bookingDate: dateStr,
        bookingTime: dbStartTime,
        bookingEndTime: dbEndTime,
        durationMinutes,
        guests,
        specialRequests: fullSpecialRequests || undefined,
        occasion: occasion !== 'None' ? occasion : undefined,
        tablePreference: selectedTable?.name || preference,
        tableNumber: selectedTable?.tableNumber,
      });

      if (res.error) {
        toast.error('Reservation Error', res.error);
        setIsSubmitting(false);
        return;
      }

      if (res.bookingId) {
        setBookingId(res.bookingId);
        toast.success('Hold Reserved', 'Complete advance hold deposit to confirm.');
        setStep(3);
        window.scrollTo({ top: 120, behavior: 'smooth' });
      }
    } catch {
      toast.error('Reservation Failed', 'An error occurred while creating booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!bookingId || !utr.trim()) return;

    setIsSubmitting(true);
    setPaymentError('');

    try {
      const res = await customerConfirmBookingPayment(
        bookingId,
        'upi',
        utr.trim(),
        details.phone.trim()
      );
      if (res.error) {
        setPaymentError(res.error);
        useNotificationStore.getState().addNotification({
          title: 'Payment Verification Failed',
          message: `UPI transaction (UTR: ${utr.trim()}) could not be confirmed: ${res.error}. Please retry.`,
          type: 'payment_failed',
          category: 'payment',
          timestamp: 'Just now',
          actionLabel: 'Retry UPI Payment ↺',
          actionType: 'retry_payment',
        });
        setIsSubmitting(false);
        return;
      }

      useNotificationStore.getState().addNotification({
        title: 'Payment Accepted & Reservation Confirmed',
        message: `₹500 advance hold payment verified via UPI (Ref: ${utr.trim()}). Table #${selectedTable?.tableNumber || 7} (${selectedTable?.name}) is confirmed for ${guests} guests.`,
        type: 'payment_success',
        category: 'payment',
        timestamp: 'Just now',
        actionLabel: 'View Booking Receipt →',
        actionHref: `/booking/success?bookingId=${bookingId}`,
        actionType: 'navigate',
      });

      toast.success('Reservation Confirmed', 'We look forward to hosting you at The Golden Oak!');
      router.push(`/booking/success?bookingId=${bookingId}`);
    } catch {
      setPaymentError('Failed to confirm advance payment. Please contact concierge support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-[#FAF5EC] pb-24 relative overflow-x-hidden selection:bg-[#F0C36B]/30" style={{ backgroundColor: '#0B0907' }}>
      {/* 1. Full-Page Photorealistic Luxury Restaurant Background Image (Bright, Light & Warm) */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "url('/images/reservation-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 35%',
          backgroundRepeat: 'no-repeat',
          filter: 'brightness(1.18) contrast(1.06) saturate(1.18)',
        }}
      />

      {/* 2. Soft Luminous Ambient Vignette (Keeps background light & open) */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 25%, rgba(18, 14, 11, 0.15) 0%, rgba(14, 11, 8, 0.35) 60%, rgba(8, 6, 4, 0.65) 100%)',
        }}
      />

      {/* 3. Round Glowing Blur & Bokeh Bloom on Background Bulbs & Light Sources */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Right Wall Sconce Bulbs Bloom (Round Glow Blur) */}
        <div
          className="absolute right-[5%] top-[33%] w-52 h-52 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(255, 220, 130, 0.85) 0%, rgba(240, 170, 60, 0.5) 30%, rgba(220, 130, 30, 0.2) 55%, transparent 75%)',
            filter: 'blur(30px)',
          }}
        />
        <div
          className="absolute right-[7%] top-[36%] w-24 h-24 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(255, 250, 220, 0.95) 0%, rgba(255, 215, 120, 0.65) 45%, transparent 70%)',
            filter: 'blur(12px)',
          }}
        />

        {/* Center-Top Chandelier & Ceiling Lights Bloom */}
        <div
          className="absolute left-[50%] top-[8%] -translate-x-1/2 w-[600px] h-[320px] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse, rgba(255, 225, 140, 0.7) 0%, rgba(240, 180, 70, 0.35) 40%, rgba(210, 140, 40, 0.12) 65%, transparent 80%)',
            filter: 'blur(48px)',
          }}
        />

        {/* Upper Right Ambient Light Glow */}
        <div
          className="absolute right-[15%] top-[12%] w-60 h-60 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(255, 210, 120, 0.7) 0%, rgba(235, 155, 50, 0.38) 42%, transparent 72%)',
            filter: 'blur(35px)',
          }}
        />

        {/* Left Ambient Dining Lamp & Candlelight Bloom */}
        <div
          className="absolute left-[7%] top-[26%] w-48 h-48 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(255, 215, 125, 0.65) 0%, rgba(235, 160, 50, 0.32) 42%, transparent 72%)',
            filter: 'blur(26px)',
          }}
        />

        {/* Right Foreground Candle / Wine Glass Bokeh Bloom */}
        <div
          className="absolute right-[3%] bottom-[20%] w-44 h-44 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(255, 230, 160, 0.75) 0%, rgba(240, 170, 60, 0.4) 42%, transparent 72%)',
            filter: 'blur(22px)',
          }}
        />

        {/* Additional Soft Warm Bokeh Circles */}
        <div
          className="absolute left-[28%] top-[18%] w-32 h-32 rounded-full pointer-events-none opacity-50"
          style={{
            background:
              'radial-gradient(circle, rgba(255, 215, 135, 0.55) 0%, rgba(240, 165, 55, 0.2) 48%, transparent 70%)',
            filter: 'blur(18px)',
          }}
        />
      </div>

      {/* Stepper only shown during Step 2 & 3 */}
      {step > 1 && <BookingHeader step={step} onStepChange={setStep} />}

      {/* Main 3-Column Luxury Booking Workspace (100% Exact Match to Reference Design) */}
      <main className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 w-full pt-20 sm:pt-24 pb-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 xl:gap-6 items-start">
          {/* ========================================================= */}
          {/* COLUMN 1: LEFT BRAND EDITORIAL & FEATURES (3 COLS)        */}
          {/* ========================================================= */}
          <div className="lg:col-span-3 xl:col-span-3 flex flex-col pt-2 xl:pt-4">
            {/* Category Tag */}
            <div className="text-[10px] sm:text-[11px] font-mono tracking-[0.25em] text-[#E2A84B] uppercase font-semibold flex items-center gap-2">
              <span className="w-3.5 h-[1.5px] bg-[#E2A84B]" />
              <span>EXTRAORDINARY DINING</span>
            </div>

            {/* Main Luxury Heading */}
            <h1 className="font-serif text-3xl sm:text-4xl xl:text-[42px] font-bold text-[#F8F2E8] leading-[1.12] mt-3.5 tracking-tight">
              Reserve Your <br />
              <span className="text-[#FFE3A5]">Perfect Table</span>
            </h1>

            {/* Editorial Subtitle */}
            <p className="text-xs sm:text-[13px] text-[#C5BCAD] leading-relaxed mt-3 max-w-xs font-normal">
              Experience culinary excellence in a setting of timeless elegance.
            </p>

            {/* Subtle Gold Line */}
            <div className="w-12 h-[2px] bg-[#E2A84B] my-6" />

            {/* 4 Feature Badges (Stacked Vertically) */}
            <div className="flex flex-col gap-5">
              {/* Feature 1 */}
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full border border-[#F0C36B]/40 bg-[#16110D]/90 flex items-center justify-center text-[#F0C36B] shrink-0 shadow-sm">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-[#FAF5EC] leading-tight">28 Tables</div>
                  <div className="text-[11.5px] text-[#9A9286] mt-0.5 font-normal">Premium seating</div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full border border-[#F0C36B]/40 bg-[#16110D]/90 flex items-center justify-center text-[#F0C36B] shrink-0 shadow-sm">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-[#FAF5EC] leading-tight">6 Unique Views</div>
                  <div className="text-[11.5px] text-[#9A9286] mt-0.5 font-normal">Explore in 3D</div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full border border-[#F0C36B]/40 bg-[#16110D]/90 flex items-center justify-center text-[#F0C36B] shrink-0 shadow-sm">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-[#FAF5EC] leading-tight">Instant Confirmation</div>
                  <div className="text-[11.5px] text-[#9A9286] mt-0.5 font-normal">Secure &amp; seamless</div>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full border border-[#F0C36B]/40 bg-[#16110D]/90 flex items-center justify-center text-[#F0C36B] shrink-0 shadow-sm">
                  <Wine className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-[#FAF5EC] leading-tight">Fine Dining</div>
                  <div className="text-[11.5px] text-[#9A9286] mt-0.5 font-normal">World-class cuisine</div>
                </div>
              </div>
            </div>

            {/* Bottom Left: Golden Botanical Branch & Luxury Script Quote */}
            <div className="mt-10 xl:mt-14 flex flex-col gap-2">
              <svg className="w-12 h-12 text-[#E2A84B]/70" viewBox="0 0 64 64" fill="none">
                <path
                  d="M12 52 C 16 38, 28 24, 48 16 M20 42 C 24 38, 28 39, 29 44 C 29 49, 24 48, 20 42 M28 32 C 34 29, 38 31, 38 36 C 37 41, 32 38, 28 32 M38 23 C 44 20, 48 23, 47 28 C 45 32, 41 29, 38 23"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="font-serif italic text-base sm:text-lg text-[#D4AF37]/90 leading-snug tracking-wide">
                Good Food<br />
                Good Company<br />
                Great Moments
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* COLUMN 2: CENTER CONFIGURATOR CARD (5 COLS)               */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col gap-4">
            {step === 1 && (
              <div
                className="rounded-3xl p-5 sm:p-6 lg:p-7 border border-[#F0C36B]/40 shadow-[0_24px_60px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.18)] flex flex-col gap-5 animate-in fade-in duration-300"
                style={{
                  background: 'rgba(18, 13, 10, 0.70)',
                  backdropFilter: 'blur(26px) saturate(140%)',
                  WebkitBackdropFilter: 'blur(26px) saturate(140%)',
                }}
              >
                {/* 1. Party Size Section */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#F0C36B]" />
                      <div>
                        <h3 className="text-sm font-semibold text-[#FAF5EC] leading-tight">Party Size</h3>
                        <span className="text-[11px] text-[#9A9286]">Select your group size</span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-[#F0C36B]/30 text-[#F0C36B] text-[11px] font-mono font-semibold">
                      <Users className="w-3.5 h-3.5" />
                      <span>{guests} {guests === 1 ? 'Guest' : 'Guests'}</span>
                    </span>
                  </div>

                  {/* 7 Party Size Pills */}
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {[
                      { num: 1, label: 'Solo' },
                      { num: 2, label: 'Couple' },
                      { num: 3, label: 'Friends' },
                      { num: 4, label: 'Family' },
                      { num: 5, label: 'Group' },
                      { num: 6, label: 'Group' },
                      { num: 7, label: 'Group' },
                    ].map((item) => {
                      const isSelected = guests === item.num;
                      return (
                        <button
                          key={item.num}
                          type="button"
                          onClick={() => setGuests(item.num)}
                          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer select-none active:scale-95 ${
                            isSelected
                              ? 'text-[#161008] font-bold shadow-[0_0_15px_rgba(240,195,107,0.4)]'
                              : 'bg-white/[0.04] border border-white/10 hover:border-[#F0C36B]/40 text-[#FAF5EC]'
                          }`}
                          style={
                            isSelected
                              ? {
                                  background: 'linear-gradient(135deg, #F5D38B 0%, #E2A84B 100%)',
                                }
                              : undefined
                          }
                        >
                          <span className="text-sm font-bold leading-none">{item.num === 7 ? '7+' : item.num}</span>
                          <span className={`text-[10px] mt-1 leading-none ${isSelected ? 'text-[#201509] font-semibold' : 'text-[#9A9286]'}`}>
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* 2. Date & Time Section */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-[#F0C36B]" />
                    <div>
                      <h3 className="text-sm font-semibold text-[#FAF5EC] leading-tight">Date &amp; Time</h3>
                      <span className="text-[11px] text-[#9A9286]">Choose your preferred slot</span>
                    </div>
                  </div>

                  {/* Two dropdown selectors side-by-side */}
                  <div className="grid grid-cols-2 gap-2.5 mb-3 relative">
                    {/* Date Selector Dropdown Button */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setShowDateDropdown(!showDateDropdown);
                          setShowTimeDropdown(false);
                        }}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 hover:border-[#F0C36B]/60 text-xs text-[#FAF5EC] transition-all cursor-pointer shadow-sm group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Calendar className="w-3.5 h-3.5 text-[#F0C36B] shrink-0" />
                          <span className="truncate font-medium">
                            {date.toLocaleDateString('en-US', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-[#9A9286] group-hover:text-[#F0C36B] shrink-0" />
                      </button>

                      {/* Date Dropdown Menu */}
                      {showDateDropdown && (
                        <div className="absolute top-full left-0 mt-1.5 w-60 z-50 rounded-2xl bg-[#140F0A]/95 border border-[#F0C36B]/40 shadow-[0_12px_36px_rgba(0,0,0,0.85)] backdrop-blur-xl p-2 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
                          <span className="text-[10px] font-mono text-[#F0C36B] uppercase tracking-wider px-2 py-1">
                            Select Reservation Date
                          </span>
                          {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                            const d = new Date();
                            d.setDate(d.getDate() + offset);
                            const isCur = d.toDateString() === date.toDateString();
                            return (
                              <button
                                key={offset}
                                type="button"
                                onClick={() => {
                                  setDate(d);
                                  setShowDateDropdown(false);
                                  performAvailabilityCheck(d, time || '08:00 PM', guests, durationMinutes);
                                }}
                                className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-mono transition-all text-left cursor-pointer ${
                                  isCur
                                    ? 'bg-[#F0C36B] text-black font-bold'
                                    : 'text-[#FAF5EC] hover:bg-white/10'
                                }`}
                              >
                                <span>
                                  {d.toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                                {offset === 0 && <span className="text-[10px] opacity-75">Today</span>}
                                {offset === 1 && <span className="text-[10px] opacity-75">Tomorrow</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Time Selector Dropdown Button */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setShowTimeDropdown(!showTimeDropdown);
                          setShowDateDropdown(false);
                        }}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 hover:border-[#F0C36B]/60 text-xs text-[#FAF5EC] transition-all cursor-pointer shadow-sm group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Clock className="w-3.5 h-3.5 text-[#F0C36B] shrink-0" />
                          <span className="truncate font-medium">{time || '08:00 PM'}</span>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-[#9A9286] group-hover:text-[#F0C36B] shrink-0" />
                      </button>

                      {/* Time Dropdown Menu */}
                      {showTimeDropdown && (
                        <div className="absolute top-full right-0 mt-1.5 w-48 z-50 rounded-2xl bg-[#140F0A]/95 border border-[#F0C36B]/40 shadow-[0_12px_36px_rgba(0,0,0,0.85)] backdrop-blur-xl p-2 flex flex-col gap-1 max-h-56 overflow-y-auto scrollbar-thin animate-in fade-in zoom-in-95 duration-150">
                          <span className="text-[10px] font-mono text-[#F0C36B] uppercase tracking-wider px-2 py-1">
                            Available Seating Times
                          </span>
                          {['07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM', '10:00 PM', '10:30 PM'].map((slot) => {
                            const isCur = time === slot;
                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => {
                                  setTime(slot);
                                  setShowTimeDropdown(false);
                                  performAvailabilityCheck(date, slot, guests, durationMinutes);
                                }}
                                className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-mono transition-all text-left cursor-pointer ${
                                  isCur
                                    ? 'bg-[#F0C36B] text-black font-bold'
                                    : 'text-[#FAF5EC] hover:bg-white/10'
                                }`}
                              >
                                <span>{slot}</span>
                                {isCur && <span className="text-[10px]">●</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 5 Time Slot Pills with Available Table Counts */}
                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                    {[
                      { t: '8:00 PM', left: 2 },
                      { t: '8:30 PM', left: 4 },
                      { t: '9:00 PM', left: 6 },
                      { t: '9:30 PM', left: 8 },
                      { t: '10:00 PM', left: 5 },
                    ].map((slot) => {
                      const isSelected = time === slot.t;
                      return (
                        <button
                          key={slot.t}
                          type="button"
                          onClick={() => setTime(slot.t)}
                          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer select-none active:scale-95 ${
                            isSelected
                              ? 'text-[#161008] font-bold shadow-[0_0_15px_rgba(240,195,107,0.4)]'
                              : 'bg-white/[0.04] border border-white/10 hover:border-[#F0C36B]/40 text-[#FAF5EC]'
                          }`}
                          style={
                            isSelected
                              ? {
                                  background: 'linear-gradient(135deg, #F5D38B 0%, #E2A84B 100%)',
                                }
                              : undefined
                          }
                        >
                          <span className="text-xs font-bold leading-none">{slot.t}</span>
                          <span className={`text-[9.5px] mt-1 leading-none flex items-center gap-1 ${isSelected ? 'text-[#201509] font-semibold' : 'text-[#9A9286]'}`}>
                            <span className="w-1 h-1 rounded-full bg-[#36D6A0] inline-block" />
                            <span>{slot.left} Tables Left</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* 3. Dining Duration Section */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-[#F0C36B]" />
                    <div>
                      <h3 className="text-sm font-semibold text-[#FAF5EC] leading-tight">Dining Duration</h3>
                      <span className="text-[11px] text-[#9A9286]">How long would you like to dine?</span>
                    </div>
                  </div>

                  {/* 4 Duration Pills */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { val: 90, label: '1.5 hrs', sub: 'Express' },
                      { val: 120, label: '2.0 hrs', sub: 'Standard' },
                      { val: 150, label: '2.5 hrs', sub: 'Tasting' },
                      { val: 180, label: '3.0 hrs', sub: 'Celebration' },
                    ].map((dur) => {
                      const isSelected = durationMinutes === dur.val;
                      return (
                        <button
                          key={dur.val}
                          type="button"
                          onClick={() => setDurationMinutes(dur.val)}
                          className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer active:scale-95 flex flex-col items-center ${
                            isSelected
                              ? 'border-[#F0C36B] bg-[#F0C36B]/15 text-[#FFE3A5] shadow-[0_0_12px_rgba(240,195,107,0.3)]'
                              : 'border-white/10 bg-white/[0.04] text-[#FAF5EC] hover:border-[#F0C36B]/40'
                          }`}
                        >
                          <span className="text-xs font-bold leading-none">{dur.label}</span>
                          <span className="text-[10px] text-[#9A9286] mt-1 leading-none">{dur.sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* 4. Special Occasion (Optional) Section */}
                <section>
                  <div className="flex items-center gap-2 mb-2.5">
                    <Star className="w-4 h-4 text-[#F0C36B]" />
                    <h3 className="text-xs font-semibold text-[#FAF5EC]">Special Occasion <span className="text-[#9A9286] font-normal">(Optional)</span></h3>
                  </div>

                  {/* 5 Occasion Pills */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {['None', 'Anniversary', 'Birthday', 'Business', 'Date Night'].map((occ) => {
                      const isSelected = occasion === occ;
                      return (
                        <button
                          key={occ}
                          type="button"
                          onClick={() => setOccasion(occ)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer active:scale-95 ${
                            isSelected
                              ? 'border border-[#F0C36B] bg-[#F0C36B]/20 text-[#FFE3A5] shadow-[0_0_10px_rgba(240,195,107,0.25)]'
                              : 'border border-white/10 bg-white/[0.04] text-[#FAF5EC] hover:border-[#F0C36B]/40'
                          }`}
                        >
                          {occ === 'None' && <Sparkles className="w-3 h-3 text-[#F0C36B] inline mr-1" />}
                          <span>{occ}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* 5. Chef's Special Card */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    const next = !chefsSpecialSelected;
                    setChefsSpecialSelected(next);
                    if (next) {
                      toast.success(
                        "Chef's Special Selected",
                        "Signature 7-course tasting menu & sommelier reserve pairings requested."
                      );
                      setSpecialRequests((s) => (s ? `${s} | Chef's Tasting Menu requested` : "Chef's Tasting Menu requested"));
                    } else {
                      toast.info(
                        "Chef's Special Removed",
                        "Standard reservation restored."
                      );
                      setSpecialRequests((s) => s.replace(/ \| Chef's Tasting Menu requested|Chef's Tasting Menu requested/g, '').trim());
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setChefsSpecialSelected(!chefsSpecialSelected);
                    }
                  }}
                  className={`rounded-2xl p-3 border flex items-center justify-between gap-3 shadow-sm transition-all cursor-pointer ${
                    chefsSpecialSelected
                      ? 'bg-[#F0C36B]/15 border-[#F0C36B] shadow-[0_0_15px_rgba(240,195,107,0.3)]'
                      : 'bg-black/40 border-[#F0C36B]/30 hover:border-[#F0C36B]/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src="/images/dishes/chicken-pot-pie.png"
                      alt="Chef's Special"
                      className="w-11 h-11 rounded-lg object-cover border border-[#F0C36B]/30 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/hero-artisan-pizza.jpg';
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Crown className="w-3 h-3 text-[#F0C36B]" />
                        <span className="text-xs font-bold text-[#FAF5EC]">Chef&apos;s Special</span>
                        {chefsSpecialSelected && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-[#F0C36B] text-black font-semibold">
                            SELECTED
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#A69F94] truncate mt-0.5">
                        Ask about our signature tasting menu &amp; wine pairings.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-[#F0C36B] shrink-0 transition-transform ${chefsSpecialSelected ? 'rotate-90' : ''}`} />
                </div>

                {/* 6. Primary Action CTA Button */}
                <button
                  type="button"
                  onClick={handleProceedToDetails}
                  className="relative overflow-hidden w-full h-[52px] rounded-xl font-bold text-sm tracking-wide text-[#161008] transition-all duration-300 shadow-[0_8px_25px_rgba(240,195,107,0.45)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #F5D38B 0%, #E2A84B 50%, #B88226 100%)',
                  }}
                >
                  <Calendar className="w-4 h-4 text-[#161008]" />
                  <span>Find Available Tables →</span>
                </button>
              </div>
            )}

            {/* Step 2: Guest Dossier Form */}
            {step === 2 && (
              <div
                className="rounded-3xl p-6 sm:p-8 border border-[#F0C36B]/40 shadow-[0_24px_60px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.18)] flex flex-col gap-6 animate-in fade-in duration-300"
                style={{
                  background: 'rgba(18, 13, 10, 0.70)',
                  backdropFilter: 'blur(22px) saturate(140%)',
                  WebkitBackdropFilter: 'blur(22px) saturate(140%)',
                }}
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F0C36B] hover:underline cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Seating &amp; Time</span>
                  </button>
                  <span className="text-[11px] font-mono text-[#D4C7B6]">
                    STEP 02 OF 03
                  </span>
                </div>

                <CustomerDetailsForm
                  details={details}
                  onChange={setDetails}
                  errors={{ name: errors.name, phone: errors.phone }}
                />

                <SpecialRequestField value={specialRequests} onChange={setSpecialRequests} />

                <TablePreferenceSelector selected={preference} onSelect={setPreference} />

                <button
                  type="button"
                  onClick={handleCreateBooking}
                  disabled={isSubmitting}
                  className="w-full h-[54px] rounded-xl text-[#17100C] font-bold text-sm tracking-wide shadow-[0_8px_25px_rgba(240,195,107,0.45)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  style={{
                    background:
                      'linear-gradient(135deg, #F0C36B 0%, #DDA33E 50%, #A8792A 100%)',
                  }}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#17100C]" />
                  ) : (
                    <Calendar className="w-4 h-4 text-[#17100C]" />
                  )}
                  <span>Reserve Table &amp; Proceed to Hold →</span>
                </button>
              </div>
            )}

            {/* Step 3: Instant Confirmation & Hold Deposit */}
            {step === 3 && (
              <div
                className="rounded-3xl p-6 sm:p-8 border border-[#F0C36B]/40 shadow-[0_24px_60px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.18)] flex flex-col gap-6 animate-in fade-in duration-300"
                style={{
                  background: 'rgba(18, 13, 10, 0.70)',
                  backdropFilter: 'blur(22px) saturate(140%)',
                  WebkitBackdropFilter: 'blur(22px) saturate(140%)',
                }}
              >
                <div className="text-center pb-2">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#0A261C] border border-[#36D6A0]/40 text-xs font-semibold text-[#36D6A0] mb-2.5">
                    Physical Table Hold Active
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F2E8] mb-1">
                    Advance Hold Confirmation
                  </h2>
                  <p className="text-xs text-[#D4C7B6] max-w-md mx-auto font-normal">
                    To guarantee your physical table reservation, confirm the table hold fee via
                    instant UPI transfer.
                  </p>
                </div>

                <div className="bg-[#140F0C] p-5 rounded-2xl border border-[#F0C36B]/40 text-center flex flex-col items-center shadow-lg">
                  <div className="w-32 h-32 bg-white rounded-xl flex items-center justify-center mb-3 p-2 shadow-lg">
                    <QrCode className="w-24 h-24 text-black" />
                  </div>
                  <p className="text-xs font-mono font-bold text-[#F8F2E8] tracking-wider">
                    UPI ID: goldenoak@upi
                  </p>
                  <p className="text-[11px] text-[#D4C7B6] mt-0.5">
                    Accepts GPay, PhonePe, Paytm, or BHIM
                  </p>
                  <div className="mt-3 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono font-bold text-[#36D6A0]">
                    Amount: {formatMoney(advanceAmountPaise)}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#F8F2E8]/80 block">
                    UTR / UPI Transaction Reference Number *
                  </label>
                  <input
                    type="text"
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                    placeholder="Enter 12-digit UTR reference ID"
                    className="w-full bg-[#140F0C] p-3.5 rounded-xl border border-white/10 focus:border-[#F0C36B] outline-none text-white text-xs sm:text-sm font-mono tracking-wider"
                  />
                  {paymentError && (
                    <p className="text-xs text-rose-400 mt-1">{paymentError}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={isSubmitting || !utr.trim()}
                  className="w-full h-[54px] rounded-xl text-[#17100C] font-bold text-sm tracking-wide shadow-[0_8px_25px_rgba(240,195,107,0.45)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                  style={{
                    background:
                      'linear-gradient(135deg, #F0C36B 0%, #DDA33E 50%, #A8792A 100%)',
                  }}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#17100C]" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-[#17100C]" />
                  )}
                  <span>Verify &amp; Confirm Table Reservation →</span>
                </button>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* COLUMN 3: RIGHT 3D VIEW + SELECTED TABLE + DOSSIER (4 COLS)*/}
          {/* ========================================================= */}
          <aside className="lg:col-span-4 xl:col-span-4 sticky top-20 flex flex-col gap-4">
            {/* 1. Interactive Architectural Floor Map Card */}
            <div
              className="rounded-3xl p-3.5 sm:p-4 border border-[#F0C36B]/40 shadow-[0_24px_60px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.18)]"
              style={{
                background: 'rgba(18, 13, 10, 0.70)',
                backdropFilter: 'blur(22px) saturate(140%)',
                WebkitBackdropFilter: 'blur(22px) saturate(140%)',
              }}
            >
              {view3DMode ? (
                <Restaurant3DFloorplan
                  selectedTableNumber={selectedTable?.tableNumber || null}
                  onSelectTable={handleSelectTableFromMap}
                  guests={guests}
                  availableTableNumbers={availableTableNumbers}
                  selectedZone={selectedZone}
                  onSelectZone={setSelectedZone}
                  onSwitchTo2D={() => setView3DMode(false)}
                  isFullscreen={openFullscreen3D}
                  onToggleFullscreen={setOpenFullscreen3D}
                />
              ) : (
                <RestaurantFloorMap
                  selectedTableNumber={selectedTable?.tableNumber || null}
                  onSelectTable={handleSelectTableFromMap}
                  guests={guests}
                  availableTableNumbers={availableTableNumbers}
                  selectedZone={selectedZone}
                  onSelectZone={setSelectedZone}
                  onSwitchTo3D={() => setView3DMode(true)}
                />
              )}
            </div>
          </aside>
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: RESERVATION DOSSIER & SUMMARY (BELOW ON SCROLL)*/}
        {/* ========================================================= */}
        <section
          id="reservation-summary"
          className="mt-14 sm:mt-16 w-full pt-8 sm:pt-10 border-t border-[#F0C36B]/25 scroll-mt-24"
        >
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            {/* Elegant Golden Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0C36B]/10 border border-[#F0C36B]/30 text-[#F0C36B] text-xs font-mono mb-3 shadow-[0_0_12px_rgba(240,195,107,0.15)]">
              <span className="w-2 h-2 rounded-full bg-[#36D6A0] animate-pulse" />
              <span>LIVE RESERVATION DOSSIER &amp; TABLE HOLD</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F2E8] text-center mb-2">
              Your Allocation &amp; Reservation Summary
            </h2>
            <p className="text-xs sm:text-sm text-[#D4C8B8] text-center max-w-xl mb-8 font-light leading-relaxed">
              Review your allocated table, active 5-minute allocation hold, and dining itinerary. Scroll down anytime to finalize your reservation.
            </p>

            <div className="w-full">
              <BookingSummaryDossier
                date={date}
                time={time}
                guests={guests}
                durationMinutes={durationMinutes}
                tableNumber={selectedTable?.tableNumber || null}
                tableName={selectedTable?.name}
                zone={selectedZone || selectedTable?.zone}
                advanceAmountPaise={advanceAmountPaise}
                holdExpiresAt={holdExpiresAt}
                preOrderCartItemsCount={attachCart ? safeTotalCartItems : 0}
              />
            </div>

            {/* Direct Proceed CTA from Summary */}
            {step === 1 && (
              <div className="mt-8 flex justify-center w-full">
                <button
                  type="button"
                  onClick={handleProceedToDetails}
                  className="px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide text-[#161008] transition-all duration-300 shadow-[0_8px_25px_rgba(240,195,107,0.45)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #F5D38B 0%, #E2A84B 50%, #B88226 100%)',
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 text-[#161008]" />
                  <span>Proceed to Guest Details &amp; Confirm Hold →</span>
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
