'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
import { BookingSummaryDossier } from '@/components/booking/BookingSummaryDossier';
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
} from 'lucide-react';
import { formatMoney } from '@/lib/db/types';
import { toast } from '@/store/toast-store';
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
  const totalCartItems = useCartStore((s) => s.getTotalItems());
  const cartItems = useCartStore((s) => s.items);
  const [attachCart, setAttachCart] = useState(false);

  // Step 1: Configurator State
  const [guests, setGuests] = useState<number>(2);
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number>(120); // default 2 hours
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<FloorTable | null>(null);
  const [availableTableNumbers, setAvailableTableNumbers] = useState<number[] | undefined>(undefined);
  const [holdExpiresAt, setHoldExpiresAt] = useState<number | null>(null);
  const [availabilityMsg, setAvailabilityMsg] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

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
          if (!selectedTable || !tableNums.includes(selectedTable.tableNumber)) {
            const best = RESTAURANT_TABLES.find(
              (t) => tableNums.includes(t.tableNumber) && t.capacity >= partySize
            ) || RESTAURANT_TABLES[0];
            setSelectedTable(best);
            setSelectedZone(best.zone);
          }

          // Start 5-minute hold timer
          setHoldExpiresAt(Date.now() + 5 * 60 * 1000);

          setAvailabilityMsg({
            text: `Table reserved! ${res.tableCount || 1} table(s) available for ${partySize} guests.`,
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
        setIsSubmitting(false);
        return;
      }

      toast.success('Reservation Confirmed', 'We look forward to hosting you at The Golden Oak!');
      router.push(`/booking/success?bookingId=${bookingId}`);
    } catch {
      setPaymentError('Failed to confirm advance payment. Please contact concierge support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-[#FAF5EC] pb-24 relative overflow-x-hidden" style={{ backgroundColor: '#0D0A08' }}>
      {/* Emerald & Molten Gold Atmospheric Radial Spotlight */}
      <div
        className="absolute top-0 left-0 right-0 h-[640px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(14, 31, 24, 0.85) 0%, rgba(226, 168, 75, 0.10) 40%, transparent 75%)',
        }}
      />

      {/* Top Header & Architectural Stepper */}
      <BookingHeader step={step} onStepChange={setStep} />

      {/* Main Split Concierge Booking Workspace */}
      <main className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ========================================================= */}
          {/* LEFT 7 COLUMNS: Booking Configurator Card                  */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Step 1: Time, Seating & Dining Preferences */}
            {step === 1 && (
              <div
                className="rounded-2xl p-6 sm:p-8 border border-[rgba(226,168,75,0.18)] border-t-[rgba(246,211,134,0.30)] shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex flex-col gap-6 animate-in fade-in duration-300"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(21, 17, 14, 0.96) 0%, rgba(16, 12, 10, 0.98) 100%)',
                }}
              >
                {/* Section 1: Party Size Selector (at the VERY TOP!) */}
                <section>
                  <GuestStepper guests={guests} onChange={setGuests} />
                </section>

                <div className="h-[1px] bg-white/[0.06]" />

                {/* Section 2: Horizon Date Ribbon */}
                <section>
                  <DateChipSelector selectedDate={date} onSelect={setDate} />
                </section>

                <div className="h-[1px] bg-white/[0.06]" />

                {/* Section 3: Time Slot Grid (3 Meal Tabs) */}
                <section>
                  <TimeSlotGrid selectedTime={time} onSelect={setTime} />
                </section>

                <div className="h-[1px] bg-white/[0.06]" />

                {/* Section 4: Dining Duration (4 Inline Chips) */}
                <section className="w-full">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-[#E2A84B] tracking-[0.2em] uppercase">
                      Dining Duration
                    </h3>
                    <span className="text-[11px] text-[#9A9286]">
                      {durationChips.find((d) => d.value === durationMinutes)?.desc}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {durationChips.map((chip) => {
                      const isSelected = durationMinutes === chip.value;
                      return (
                        <button
                          key={chip.value}
                          type="button"
                          onClick={() => {
                            setDurationMinutes(chip.value);
                            if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                              navigator.vibrate(8);
                            }
                          }}
                          className={`py-2.5 px-2 rounded-xl border text-xs font-medium text-center transition-all active:scale-95 ${
                            isSelected
                              ? 'bg-[#0E1F18] border-[1.5px] border-[#E2A84B] text-[#F6D386] shadow-[0_0_12px_rgba(226,168,75,0.25)] font-semibold'
                              : 'bg-[#16110E] border-white/[0.07] text-[#9A9286] hover:text-[#FAF5EC] hover:border-white/20'
                          }`}
                        >
                          {chip.label}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <div className="h-[1px] bg-white/[0.06]" />

                {/* Section 5: Occasion & 3D Pre-Order Concierge Toggle */}
                <section className="flex flex-col gap-4">
                  <OccasionChips selected={occasion} onSelect={setOccasion} />

                  {/* Luxury 3D Pre-Order Toggle */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-[#17120E] to-[#1F1711] border border-[rgba(226,168,75,0.2)] flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#E0532B]/15 border border-[#E0532B]/30 flex items-center justify-center text-[#E0532B] shrink-0 mt-0.5">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#FAF5EC]">
                            Pre-Select Dishes from 3D Menu
                          </span>
                          {totalCartItems > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-[#E0532B] text-[10px] font-bold text-white">
                              {totalCartItems} in cart
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#B5ADA2] font-light leading-relaxed mt-0.5">
                          Want your wood-fired pizzas ready within 10 minutes of arrival? Attach
                          your cart items directly to this table reservation!
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAttachCart(!attachCart)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        attachCart ? 'bg-[#22C58B]' : 'bg-white/10'
                      }`}
                      role="switch"
                      aria-checked={attachCart}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#0D0A08] shadow-lg ring-0 transition duration-200 ease-in-out ${
                          attachCart ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </section>

                <div className="h-[1px] bg-white/[0.06]" />

                {/* Section 6: Live Status Feedback & Single Primary CTA Button */}
                <section className="flex flex-col gap-3 pt-1">
                  {/* Real-time Loading or Status Banner */}
                  {isChecking && (
                    <div className="p-3.5 rounded-xl bg-[#0E1F18]/50 border border-[#22C58B]/30 flex items-center gap-2.5 text-xs text-[#22C58B] animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Checking real-time table concurrency &amp; seating availability...</span>
                    </div>
                  )}

                  {!isChecking && availabilityMsg && (
                    <div
                      className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-center gap-2.5 ${
                        availabilityMsg.type === 'success'
                          ? 'bg-[#0A261C] border-[#22C58B]/50 text-[#86EFAC]'
                          : 'bg-[#2A0B12] border-[#F43F5E]/40 text-[#FCA5A5]'
                      }`}
                    >
                      {availabilityMsg.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-[#22C58B] shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-[#F43F5E] shrink-0" />
                      )}
                      <span className="font-medium">{availabilityMsg.text}</span>
                    </div>
                  )}

                  {/* Single Primary Action CTA Button */}
                  <button
                    type="button"
                    onClick={handleProceedToDetails}
                    disabled={!time || availabilityMsg?.type !== 'success' || isChecking}
                    className={`relative overflow-hidden w-full h-[54px] rounded-lg font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
                      !time || availabilityMsg?.type !== 'success'
                        ? 'bg-[#1C1713] text-white/30 border border-white/5 cursor-not-allowed'
                        : 'text-[#0D0A08] shadow-[0_8px_25px_rgba(226,168,75,0.45)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] cursor-pointer'
                    }`}
                    style={
                      time && availabilityMsg?.type === 'success'
                        ? {
                            background:
                              'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)',
                          }
                        : undefined
                    }
                  >
                    {/* Subtle liquid shimmer sweep on hover */}
                    {time && availabilityMsg?.type === 'success' && (
                      <span className="absolute inset-0 -translate-x-full hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform pointer-events-none" />
                    )}
                    <span>Confirm Seat &amp; Continue to Guest Details →</span>
                  </button>
                </section>
              </div>
            )}

            {/* Step 2: Guest Dossier Form */}
            {step === 2 && (
              <div
                className="rounded-2xl p-6 sm:p-8 border border-[rgba(226,168,75,0.18)] border-t-[rgba(246,211,134,0.30)] shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex flex-col gap-6 animate-in fade-in duration-300"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(21, 17, 14, 0.96) 0%, rgba(16, 12, 10, 0.98) 100%)',
                }}
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E2A84B] hover:underline"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Seating &amp; Time</span>
                  </button>
                  <span className="text-[11px] font-mono text-[#9A9286]">
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
                  className="w-full h-[54px] rounded-lg text-[#0D0A08] font-bold text-sm tracking-wide shadow-[0_8px_25px_rgba(226,168,75,0.45)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  style={{
                    background:
                      'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)',
                  }}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#0D0A08]" />
                  ) : (
                    <Calendar className="w-4 h-4 text-[#0D0A08]" />
                  )}
                  <span>Reserve Table &amp; Proceed to Hold →</span>
                </button>
              </div>
            )}

            {/* Step 3: Instant Confirmation & Hold Deposit */}
            {step === 3 && (
              <div
                className="rounded-2xl p-6 sm:p-8 border border-[rgba(226,168,75,0.18)] border-t-[rgba(246,211,134,0.30)] shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex flex-col gap-6 animate-in fade-in duration-300"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(21, 17, 14, 0.96) 0%, rgba(16, 12, 10, 0.98) 100%)',
                }}
              >
                <div className="text-center pb-2">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#0E1F18] border border-[#22C58B]/40 text-xs font-semibold text-[#22C58B] mb-2.5">
                    Physical Table Hold Active
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#FAF5EC] mb-1">
                    Advance Hold Confirmation
                  </h2>
                  <p className="text-xs text-[#9A9286] max-w-md mx-auto font-light">
                    To guarantee your physical table reservation, confirm the table hold fee via
                    instant UPI transfer.
                  </p>
                </div>

                <div className="bg-[#120D0A] p-5 rounded-2xl border border-[rgba(226,168,75,0.2)] text-center flex flex-col items-center">
                  <div className="w-32 h-32 bg-white rounded-xl flex items-center justify-center mb-3 p-2 shadow-lg">
                    <QrCode className="w-24 h-24 text-black" />
                  </div>
                  <p className="text-xs font-mono font-bold text-[#FAF5EC] tracking-wider">
                    UPI ID: goldenoak@upi
                  </p>
                  <p className="text-[11px] text-[#9A9286] mt-0.5">
                    Accepts GPay, PhonePe, Paytm, or BHIM
                  </p>
                  <div className="mt-3 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono font-bold text-[#22C58B]">
                    Amount: {formatMoney(advanceAmountPaise)}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#FAF5EC]/80 block">
                    UTR / UPI Transaction Reference Number *
                  </label>
                  <input
                    type="text"
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                    placeholder="Enter 12-digit UTR reference ID"
                    className="w-full bg-[#120D0A] p-3.5 rounded-xl border border-white/10 focus:border-[#E2A84B] outline-none text-white text-xs sm:text-sm font-mono tracking-wider"
                  />
                  {paymentError && (
                    <p className="text-xs text-rose-400 mt-1">{paymentError}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={isSubmitting || !utr.trim()}
                  className="w-full h-[54px] rounded-lg text-[#0D0A08] font-bold text-sm tracking-wide shadow-[0_8px_25px_rgba(226,168,75,0.45)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                  style={{
                    background:
                      'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)',
                  }}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#0D0A08]" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-[#0D0A08]" />
                  )}
                  <span>Verify &amp; Confirm Table Reservation →</span>
                </button>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* RIGHT 5 COLUMNS: Sticky Live Floor Plan & Dossier Summary */}
          {/* ========================================================= */}
          <aside className="lg:col-span-5 sticky top-6 flex flex-col gap-6">
            {/* 1. Interactive Architectural Floor Map & Seating Vibe Selector */}
            <div
              className="rounded-2xl p-5 sm:p-6 border border-[rgba(226,168,75,0.18)] border-t-[rgba(246,211,134,0.30)] shadow-[0_16px_40px_rgba(0,0,0,0.6)]"
              style={{
                background:
                  'linear-gradient(180deg, rgba(21, 17, 14, 0.95) 0%, rgba(16, 12, 10, 0.98) 100%)',
              }}
            >
              <RestaurantFloorMap
                selectedTableNumber={selectedTable?.tableNumber || null}
                onSelectTable={handleSelectTableFromMap}
                guests={guests}
                availableTableNumbers={availableTableNumbers}
                selectedZone={selectedZone}
                onSelectZone={setSelectedZone}
              />
            </div>

            {/* 2. Live Selection Dossier & 5-Minute Hold Timer */}
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
              preOrderCartItemsCount={attachCart ? totalCartItems : 0}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}
