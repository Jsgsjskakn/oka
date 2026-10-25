'use client';

import { useState } from 'react';
import { ChevronRight, X, Check, Users, Utensils, Ban } from 'lucide-react';
import { updateBookingStatusAction } from '@/lib/actions/booking-actions';

interface ManageBookingModalProps {
  booking: {
    id: string;
    customer_name: string;
    customer_phone: string;
    status: string;
    guests: number;
    booking_time: string;
    booking_date: string;
  };
}

export function ManageBookingModal({ booking }: ManageBookingModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (
    newStatus: 'confirmed' | 'seated' | 'completed' | 'cancelled'
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await updateBookingStatusAction(
        booking.id,
        newStatus,
        newStatus === 'cancelled' ? cancelReason || 'Cancelled by staff' : undefined
      );
      if (res.error) {
        setError(res.error);
      } else {
        setIsOpen(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 text-xs font-semibold px-3.5 py-1.5 rounded-lg border border-border-subtle bg-champagne/10 text-platinum hover:bg-champagne/20 hover:border-champagne/50 hover:shadow-[0_0_12px_rgba(201,168,76,0.2)] transition-all duration-300 shadow-sm cursor-pointer"
      >
        <span>Manage</span>
        <ChevronRight className="w-3 h-3" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-border-subtle rounded-2xl p-6 max-w-md w-full shadow-2xl relative text-left">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-platinum p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-serif text-platinum font-bold">
              Manage Reservation
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              {booking.customer_name} • {booking.guests} Guests • {booking.booking_time} ({booking.booking_date})
            </p>

            <div className="mt-4 p-3 rounded-xl bg-zinc-900/60 border border-border-subtle flex items-center justify-between text-xs">
              <span className="text-zinc-400">Current Status</span>
              <span className="font-semibold uppercase tracking-wider text-champagne">
                {booking.status}
              </span>
            </div>

            {error && (
              <div className="mt-3 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs">
                {error}
              </div>
            )}

            <div className="mt-5 space-y-2.5">
              {booking.status === 'pending' && (
                <button
                  disabled={loading}
                  onClick={() => handleStatusChange('confirmed')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  Confirm Reservation
                </button>
              )}

              {['pending', 'confirmed'].includes(booking.status) && (
                <button
                  disabled={loading}
                  onClick={() => handleStatusChange('seated')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  <Users className="w-4 h-4" />
                  Seat Guests at Table
                </button>
              )}

              {booking.status === 'seated' && (
                <button
                  disabled={loading}
                  onClick={() => handleStatusChange('completed')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  <Utensils className="w-4 h-4" />
                  Complete Dining & Release Table
                </button>
              )}

              {['pending', 'confirmed', 'seated'].includes(booking.status) && (
                <div className="pt-2 border-t border-border-subtle/50 space-y-2">
                  <input
                    type="text"
                    placeholder="Reason for cancellation (optional)"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full bg-zinc-900 border border-border-subtle rounded-xl px-3 py-2 text-xs text-platinum focus:outline-none focus:border-red-500/50"
                  />
                  <button
                    disabled={loading}
                    onClick={() => handleStatusChange('cancelled')}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-red-950/60 border border-red-800/60 hover:bg-red-900/50 text-red-300 font-semibold text-xs transition-colors disabled:opacity-50"
                  >
                    <Ban className="w-4 h-4" />
                    Cancel Reservation
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
