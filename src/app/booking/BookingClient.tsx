'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookingHeader } from '@/components/booking/BookingHeader';
import { DateChipSelector } from '@/components/booking/DateChipSelector';
import { TimeSlotGrid } from '@/components/booking/TimeSlotGrid';
import { GuestStepper } from '@/components/booking/GuestStepper';
import { CustomerDetailsForm } from '@/components/booking/CustomerDetailsForm';
import { SpecialRequestField } from '@/components/booking/SpecialRequestField';
import { OccasionChips } from '@/components/booking/OccasionChips';
import { TablePreferenceSelector } from '@/components/booking/TablePreferenceSelector';
import { createBookingAction, customerConfirmBookingPayment } from '@/lib/actions/booking-actions';
import { checkAvailabilityAction } from '@/lib/actions/booking-availability-action';
import { Loader2, Calendar, Clock, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, QrCode } from 'lucide-react';
import { formatMoney } from '@/lib/db/types';
import { toast } from '@/store/toast-store';

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

  // Step 1 state
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number>(120); // default 2 hours
  const [guests, setGuests] = useState<number>(2);
  const [availabilityMsg, setAvailabilityMsg] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  // Step 2 state
  const [details, setDetails] = useState({
    name: userName,
    phone: userPhone,
    email: userEmail,
  });
  const [specialRequests, setSpecialRequests] = useState('');
  const [occasion, setOccasion] = useState('None');
  const [preference, setPreference] = useState('No preference');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 3 state
  const [utr, setUtr] = useState('');
  const [paymentError, setPaymentError] = useState('');

  // Duration options: 30m to 12h
  const durationOptions = Array.from({ length: 24 }).map((_, i) => {
    const mins = (i + 1) * 30;
    const hours = Math.floor(mins / 60);
    const m = mins % 60;
    const label = `${hours > 0 ? hours + ' hour' + (hours > 1 ? 's' : '') : ''} ${m > 0 ? m + ' min' : ''}`.trim();
    return { value: mins, label };
  });

  const generateSlots = () => {
    const slots = [];
    for (let i = 0; i < 24; i++) {
      const hour = Math.floor(i / 2) + 12;
      const mins = (i % 2) * 30;
      const d = new Date();
      d.setHours(hour, mins);
      slots.push({
        time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        available: true,
      });
    }
    return slots;
  };

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

  const handleCheckAvailability = async () => {
    if (!time) {
      setAvailabilityMsg({ text: 'Please select a dining time slot first.', type: 'error' });
      return;
    }

    setIsChecking(true);
    setAvailabilityMsg(null);

    try {
      const dateStr = getLocalDateStr(date);
      const dbStartTime = formatDbTime(time);
      const dbEndTime = calculateEndTime(time, durationMinutes);

      const res = await checkAvailabilityAction(
        dateStr,
        dbStartTime,
        dbEndTime,
        guests
      );

      if (res.available) {
        setAvailabilityMsg({
          text: `Table Available! We found ${res.tableCount || 1} matching table(s) for ${guests} guests.`,
          type: 'success',
        });
        toast.success('Table Available', `${guests} guests on ${date.toDateString()} at ${time}`);
      } else {
        setAvailabilityMsg({
          text: res.error || 'All tables are reserved for this slot. Please choose another time.',
          type: 'error',
        });
        toast.error('No Tables Available', 'Please try an adjacent time slot.');
      }
    } catch {
      setAvailabilityMsg({ text: 'Failed to verify live table availability.', type: 'error' });
    } finally {
      setIsChecking(false);
    }
  };

  const handleProceedToDetails = () => {
    if (availabilityMsg?.type !== 'success') return;
    setStep(2);
  };

  const validateDetails = () => {
    const errs: Record<string, string> = {};
    if (!details.name.trim()) errs.customerName = 'Name is required';
    if (!details.phone.trim() || details.phone.replace(/\D/g, '').length < 10) {
      errs.customerPhone = 'Valid 10-digit phone number is required';
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

      const res = await createBookingAction({
        customerName: details.name.trim(),
        customerPhone: details.phone.trim(),
        customerEmail: details.email.trim() || undefined,
        bookingDate: dateStr,
        bookingTime: dbStartTime,
        bookingEndTime: dbEndTime,
        guests,
        specialRequests: specialRequests.trim() || undefined,
        occasion: occasion !== 'None' ? occasion : undefined,
        tablePreference: preference !== 'No preference' ? preference : undefined,
      });

      if (res.error) {
        toast.error('Reservation Error', res.error);
        setIsSubmitting(false);
        return;
      }

      if (res.bookingId) {
        setBookingId(res.bookingId);
        toast.success('Hold Reserved', 'Complete advance payment within 10 minutes.');
        setStep(3);
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
      const res = await customerConfirmBookingPayment(bookingId, 'upi', utr.trim(), details.phone.trim());
      if (res.error) {
        setPaymentError(res.error);
        setIsSubmitting(false);
        return;
      }

      toast.success('Reservation Confirmed', 'We look forward to hosting you!');
      router.push(`/booking/success?bookingId=${bookingId}`);
    } catch {
      setPaymentError('Failed to confirm advance payment. Please contact support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060e08] text-white pb-24">
      <BookingHeader />

      {/* Step Indicators */}
      <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 mb-6">
        <div className="flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                step >= 1
                  ? 'bg-[#d4af37] text-black font-extrabold'
                  : 'bg-white/10 text-white/50'
              }`}
            >
              1
            </span>
            <span className={step >= 1 ? 'text-[#d4af37]' : 'text-white/40'}>
              Time &amp; Guests
            </span>
          </div>

          <div
            className={`h-0.5 flex-1 mx-3 ${
              step >= 2 ? 'bg-[#d4af37]' : 'bg-white/10'
            }`}
          />

          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                step >= 2
                  ? 'bg-[#d4af37] text-black font-extrabold'
                  : 'bg-white/10 text-white/50'
              }`}
            >
              2
            </span>
            <span className={step >= 2 ? 'text-[#d4af37]' : 'text-white/40'}>
              Guest Details
            </span>
          </div>

          <div
            className={`h-0.5 flex-1 mx-3 ${
              step >= 3 ? 'bg-[#d4af37]' : 'bg-white/10'
            }`}
          />

          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                step >= 3
                  ? 'bg-[#d4af37] text-black font-extrabold'
                  : 'bg-white/10 text-white/50'
              }`}
            >
              3
            </span>
            <span className={step >= 3 ? 'text-[#d4af37]' : 'text-white/40'}>
              Confirmation
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 relative">
        {/* Step 1: Date, Time & Guests */}
        {step === 1 && (
          <div className="animate-in fade-in duration-300 space-y-5 bg-[#09150d]/85 p-5 sm:p-7 rounded-3xl border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
            <DateChipSelector
              selectedDate={date}
              onSelect={(d) => {
                setDate(d);
                setAvailabilityMsg(null);
              }}
            />

            <TimeSlotGrid
              selectedTime={time}
              onSelect={(t) => {
                setTime(t);
                setAvailabilityMsg(null);
              }}
              slots={generateSlots()}
            />

            <div className="py-3 border-t border-white/[0.08]">
              <h3 className="text-xs font-bold text-white/70 uppercase tracking-widest mb-2.5">
                Dining Duration
              </h3>
              <select
                value={durationMinutes}
                onChange={(e) => {
                  setDurationMinutes(Number(e.target.value));
                  setAvailabilityMsg(null);
                }}
                className="w-full bg-[#061209] text-white text-xs sm:text-sm p-3.5 rounded-xl border border-white/10 focus:border-[#d4af37] outline-none"
              >
                {durationOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <GuestStepper
              guests={guests}
              onChange={(g) => {
                setGuests(g);
                setAvailabilityMsg(null);
              }}
            />

            <div className="pt-2">
              <button
                type="button"
                onClick={handleCheckAvailability}
                disabled={isChecking || !time}
                className="w-full py-3.5 rounded-2xl bg-[#0e2517]/90 border border-[#3EE094]/30 hover:border-[#3EE094]/60 text-[#3EE094] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isChecking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>Check Live Table Availability</span>
              </button>

              {availabilityMsg && (
                <div
                  className={`mt-3 p-3 rounded-xl border text-xs leading-relaxed flex items-center gap-2 ${
                    availabilityMsg.type === 'success'
                      ? 'bg-[#3EE094]/10 border-[#3EE094]/30 text-[#3EE094]'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {availabilityMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{availabilityMsg.text}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleProceedToDetails}
              disabled={availabilityMsg?.type !== 'success'}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#c5a059] to-[#a88232] text-black font-extrabold text-sm shadow-[0_12px_28px_rgba(212,175,55,0.3)] hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-40 disabled:scale-100 disabled:bg-white/10 disabled:text-white/30"
            >
              Continue to Guest Details →
            </button>
          </div>
        )}

        {/* Step 2: Guest Details & Preferences */}
        {step === 2 && (
          <div className="animate-in fade-in duration-300 space-y-5 bg-[#09150d]/85 p-5 sm:p-7 rounded-3xl border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 text-xs text-[#d4af37] hover:underline mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Time &amp; Guests</span>
            </button>

            <CustomerDetailsForm
              details={details}
              onChange={setDetails}
              errors={{ name: errors.customerName, phone: errors.customerPhone }}
            />
            <SpecialRequestField value={specialRequests} onChange={setSpecialRequests} />
            <OccasionChips selected={occasion} onSelect={setOccasion} />
            <TablePreferenceSelector selected={preference} onSelect={setPreference} />

            <button
              type="button"
              onClick={handleCreateBooking}
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#c5a059] to-[#a88232] text-black font-extrabold text-sm shadow-[0_12px_28px_rgba(212,175,55,0.3)] hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : (
                <Calendar className="w-4 h-4 text-black" />
              )}
              <span>Reserve Table &amp; Proceed to Hold</span>
            </button>
          </div>
        )}

        {/* Step 3: Advance Hold Fee Confirmation */}
        {step === 3 && (
          <div className="animate-in fade-in duration-300 space-y-5 bg-[#09150d]/85 p-5 sm:p-7 rounded-3xl border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
            <div className="text-center pb-2">
              <span className="inline-block px-3 py-1 rounded-full bg-[#3EE094]/15 border border-[#3EE094]/30 text-xs font-semibold text-[#3EE094] mb-3">
                Table Held for 10 Minutes
              </span>
              <h2 className="font-heading text-2xl font-bold text-white mb-1.5">
                Advance Hold Confirmation
              </h2>
              <p className="text-xs text-white/60 max-w-md mx-auto">
                To guarantee your physical table reservation, please confirm the advance table hold fee.
              </p>
            </div>

            <div className="bg-[#061209] p-4 sm:p-5 rounded-2xl border border-white/10 space-y-2 text-xs">
              <p className="text-white/50 text-[11px] uppercase tracking-wider font-semibold">
                Reservation Details
              </p>
              <div className="flex justify-between items-center text-sm font-bold text-white">
                <span>{date.toDateString()}</span>
                <span className="text-[#d4af37]">{time}</span>
              </div>
              <p className="text-white/65">
                {guests} Guests • {durationOptions.find((d) => d.value === durationMinutes)?.label}
              </p>

              <div className="h-px bg-white/10 my-2" />

              <div className="flex justify-between items-center text-base font-extrabold">
                <span className="text-white/80">Advance Amount</span>
                <span className="text-[#3EE094]">{formatMoney(advanceAmountPaise)}</span>
              </div>
            </div>

            <div className="bg-[#061209] p-5 rounded-2xl border border-white/10 text-center flex flex-col items-center">
              <div className="w-28 h-28 bg-white rounded-xl flex items-center justify-center mb-3 p-2 shadow-md">
                <QrCode className="w-20 h-20 text-black" />
              </div>
              <p className="text-xs font-bold text-white tracking-wider">UPI ID: goldenoak@upi</p>
              <p className="text-[10px] text-white/50 mt-0.5">Scan with GPay, PhonePe, or Paytm</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70">
                UTR / UPI Transaction Reference ID
              </label>
              <input
                type="text"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                placeholder="e.g. 429182746192"
                className="w-full bg-[#061209] p-3 rounded-xl border border-white/10 focus:border-[#d4af37] outline-none text-white text-xs sm:text-sm font-mono"
              />
              {paymentError && <p className="text-xs text-rose-400 mt-1">{paymentError}</p>}
            </div>

            <button
              type="button"
              onClick={handleConfirmPayment}
              disabled={isSubmitting || !utr.trim()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#c5a059] to-[#a88232] text-black font-extrabold text-sm shadow-[0_12px_28px_rgba(212,175,55,0.3)] hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-black" />
              )}
              <span>Verify &amp; Confirm Table Reservation</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
