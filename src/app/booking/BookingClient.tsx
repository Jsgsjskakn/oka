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
import { Loader2 } from 'lucide-react';
import { formatMoney } from '@/lib/db/types';

interface BookingClientProps {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  advanceAmountPaise: number;
}

export default function BookingClient({ userId, userName, userEmail, userPhone, advanceAmountPaise }: BookingClientProps) {
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
  const [availabilityMsg, setAvailabilityMsg] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

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
    for (let i = 0; i < 24; i++) { // 12PM to 11:30PM
      const hour = Math.floor(i / 2) + 12;
      const mins = (i % 2) * 30;
      const d = new Date();
      d.setHours(hour, mins);
      slots.push({
        time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        available: true
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
    return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00`;
  };

  const handleCheckAvailability = async () => {
    if (!time) {
      setAvailabilityMsg({ text: 'Please select a time first', type: 'error' });
      return;
    }
    
    setIsChecking(true);
    setAvailabilityMsg(null);
    
    try {
      const dateStr = getLocalDateStr(date);
      const startDbTime = formatDbTime(time);
      const endTimeStr = calculateEndTime(time, durationMinutes);
      
      const res = await checkAvailabilityAction(dateStr, startDbTime, endTimeStr, guests);
      if (res.available) {
        setAvailabilityMsg({ text: `${res.tableCount} table(s) available.`, type: 'success' });
      } else {
        setAvailabilityMsg({ text: res.error || 'No tables available for this time.', type: 'error' });
      }
    } catch {
      setAvailabilityMsg({ text: 'Failed to check availability', type: 'error' });
    } finally {
      setIsChecking(false);
    }
  };

  const handleProceedToDetails = () => {
    if (!time) {
      setAvailabilityMsg({ text: 'Please select a time', type: 'error' });
      return;
    }
    if (availabilityMsg?.type !== 'success') {
      setAvailabilityMsg({ text: 'Please check availability first', type: 'error' });
      return;
    }
    setStep(2);
  };

  const handleCreateBooking = async () => {
    const newErrors: Record<string, string> = {};
    if (!details.name.trim()) newErrors.customerName = 'Name is required';
    if (!details.phone || details.phone.length < 10) newErrors.customerPhone = 'Valid 10-digit phone is required';
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) return;
    
    setIsSubmitting(true);
    const res = await createBookingAction({
      customerName: details.name,
      customerPhone: details.phone,
      customerEmail: details.email,
      bookingDate: getLocalDateStr(date),
      bookingTime: formatDbTime(time!),
      bookingEndTime: calculateEndTime(time!, durationMinutes),
      durationMinutes,
      guests,
      occasion,
      tablePreference: preference,
      specialRequests
    });
    setIsSubmitting(false);

    if (res.bookingId) {
      setBookingId(res.bookingId);
      setStep(3);
    } else {
      alert(res.error || 'Failed to create booking');
    }
  };

  const handleConfirmPayment = async () => {
    if (!utr.trim()) {
      setPaymentError('Please enter UTR/Reference number');
      return;
    }
    if (!bookingId) return;

    setIsSubmitting(true);
    setPaymentError('');
    const res = await customerConfirmBookingPayment(bookingId, 'upi', utr, details.phone);
    setIsSubmitting(false);

    if (res.error) {
      setPaymentError(res.error);
    } else {
      router.push(`/booking/success?id=${bookingId}`);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian pb-8 text-text-primary">
      <BookingHeader />
      
      <div className="max-w-md mx-auto w-full px-4 mb-4">
        <div className="flex justify-between items-center text-xs font-medium text-text-primary/50 mb-2">
          <span className={step >= 1 ? 'text-primary' : ''}>1. Time</span>
          <div className={`h-px flex-1 mx-2 ${step >= 2 ? 'bg-primary' : 'bg-white/10'}`} />
          <span className={step >= 2 ? 'text-primary' : ''}>2. Details</span>
          <div className={`h-px flex-1 mx-2 ${step >= 3 ? 'bg-primary' : 'bg-white/10'}`} />
          <span className={step >= 3 ? 'text-primary' : ''}>3. Payment</span>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full relative">
        {/* Step 1 */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4 bg-[#0f0f0f] p-4 rounded-xl border border-white/5">
            <DateChipSelector selectedDate={date} onSelect={(d) => { setDate(d); setAvailabilityMsg(null); }} />
            
            <TimeSlotGrid 
              selectedTime={time} 
              onSelect={(t) => { setTime(t); setAvailabilityMsg(null); }} 
              slots={generateSlots()}
            />
            
            <div className="px-4 py-4 border-b border-white/5">
              <h3 className="text-xs font-semibold text-text-primary/40 uppercase tracking-widest mb-3">Duration</h3>
              <select 
                value={durationMinutes} 
                onChange={(e) => { setDurationMinutes(Number(e.target.value)); setAvailabilityMsg(null); }}
                className="w-full bg-[#1a1a1a] text-text-primary p-3 rounded-lg border border-border-subtle focus:border-primary outline-none"
              >
                {durationOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <GuestStepper guests={guests} onChange={(g) => { setGuests(g); setAvailabilityMsg(null); }} />

            <div className="px-4 py-2">
              <button
                onClick={handleCheckAvailability}
                disabled={isChecking || !time}
                className="w-full py-3 bg-[#1a1a1a] text-primary border border-primary/30 rounded-xl font-medium flex items-center justify-center hover:bg-primary/10 transition-colors disabled:opacity-50"
              >
                {isChecking ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Check Availability'}
              </button>
              
              {availabilityMsg && (
                <p className={`mt-3 text-sm text-center ${availabilityMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {availabilityMsg.text}
                </p>
              )}
            </div>

            <button
              onClick={handleProceedToDetails}
              disabled={availabilityMsg?.type !== 'success'}
              className="w-full py-4 mt-2 bg-primary text-black rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:bg-white/10 disabled:text-text-primary/30"
            >
              Continue to Details
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4 bg-[#0f0f0f] p-4 rounded-xl border border-white/5">
            <button onClick={() => setStep(1)} className="text-sm text-primary mb-2">← Back to Time</button>
            
            <CustomerDetailsForm 
              details={details} 
              onChange={setDetails} 
              errors={{ name: errors.customerName, phone: errors.customerPhone }} 
            />
            <SpecialRequestField value={specialRequests} onChange={setSpecialRequests} />
            <OccasionChips selected={occasion} onSelect={setOccasion} />
            <TablePreferenceSelector selected={preference} onSelect={setPreference} />

            <button
              onClick={handleCreateBooking}
              disabled={isSubmitting}
              className="w-full py-4 mt-4 bg-primary text-black rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex justify-center items-center"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Booking & Proceed'}
            </button>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4 bg-[#0f0f0f] p-4 rounded-xl border border-white/5">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-primary mb-2">Advance Payment</h2>
              <p className="text-sm text-text-primary/60">Your booking is reserved for 10 minutes. Please complete the payment to confirm.</p>
            </div>

            <div className="bg-[#1a1a1a] p-4 rounded-lg border border-border-subtle mb-6">
              <p className="text-sm text-text-primary/50 mb-1">Booking Summary</p>
              <p className="font-medium">{date.toDateString()} at {time}</p>
              <p className="text-sm">{guests} Guests • {durationOptions.find(d => d.value === durationMinutes)?.label}</p>
              
              <div className="h-px bg-white/10 my-3" />
              
              <div className="flex justify-between items-center text-lg">
                <span className="text-text-primary/80">Amount</span>
                <span className="font-bold text-primary">{formatMoney(advanceAmountPaise)}</span>
              </div>
            </div>

            <div className="bg-[#1a1a1a] p-6 rounded-lg border border-border-subtle text-center mb-6 flex flex-col items-center">
              <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center mb-4">
                {/* Placeholder QR */}
                <span className="text-black text-xs font-bold px-2 text-center">Scan to pay via UPI</span>
              </div>
              <p className="text-sm font-medium">goldenoak@upi</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary/70">Enter UTR / Reference Number</label>
              <input
                type="text"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                placeholder="e.g. 123456789012"
                className="w-full bg-[#1a1a1a] p-3 rounded-lg border border-border-subtle focus:border-primary outline-none text-text-primary"
              />
              {paymentError && <p className="text-sm text-red-400">{paymentError}</p>}
            </div>

            <button
              onClick={handleConfirmPayment}
              disabled={isSubmitting || !utr.trim()}
              className="w-full py-4 mt-4 bg-primary text-black rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex justify-center items-center"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'I have completed payment'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
