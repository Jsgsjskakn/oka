'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Users, ShieldCheck, ShoppingBag, Lock, Sparkles } from 'lucide-react';
import { formatMoney } from '@/lib/db/types';

interface BookingSummaryDossierProps {
  date: Date;
  time: string | null;
  guests: number;
  durationMinutes: number;
  tableNumber: number | null;
  tableName?: string;
  zone?: string;
  advanceAmountPaise: number;
  holdExpiresAt?: number | null;
  preOrderCartItemsCount?: number;
}

export function BookingSummaryDossier({
  date,
  time,
  guests,
  durationMinutes,
  tableNumber,
  tableName,
  zone,
  advanceAmountPaise,
  holdExpiresAt,
  preOrderCartItemsCount = 0,
}: BookingSummaryDossierProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300); // 5 mins

  useEffect(() => {
    if (!holdExpiresAt) {
      setSecondsRemaining(300);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((holdExpiresAt - now) / 1000));
      setSecondsRemaining(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [holdExpiresAt]);

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const hours = Math.floor(durationMinutes / 60);
  const m = durationMinutes % 60;
  const durationLabel = `${hours}h${m > 0 ? ` ${m}m` : ''}`;

  return (
    <div
      className="flex flex-col gap-4 p-5 sm:p-6 rounded-3xl border border-[#F0C36B]/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.22),0_24px_60px_rgba(0,0,0,0.7)]"
      style={{
        background: 'rgba(16, 12, 9, 0.38)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
      }}
    >
      {/* Dossier Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <h3 className="font-serif text-lg font-bold text-[#F8F2E8] leading-tight">
          Reservation Summary
        </h3>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#0E1F18] border border-[#36D6A0]/40 text-[#36D6A0] flex items-center gap-1 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#36D6A0] shadow-[0_0_6px_#36D6A0]" />
          Live Sync
        </span>
      </div>

      {/* 5-Minute Live Hold Timer Banner (when time is locked) */}
      {time && (
        <div className="p-3 rounded-xl bg-[#0A261C]/80 border border-[#36D6A0]/60 shadow-[0_0_15px_rgba(54,214,160,0.15)] flex items-start gap-2.5 animate-in fade-in duration-300">
          <Lock className="w-4 h-4 text-[#36D6A0] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#F8F2E8]">
                {tableNumber ? `Table T${tableNumber} Temporarily Held` : 'Table Slot Locked'}
              </span>
              <span className="font-mono text-xs font-bold text-[#36D6A0] bg-black/40 px-1.5 py-0.5 rounded border border-[#36D6A0]/30">
                {timeFormatted}
              </span>
            </div>
            <p className="text-[10.5px] text-[#36D6A0]/90 font-light leading-relaxed mt-0.5">
              Your table is reserved for 5 minutes while you finalize your details.
            </p>
          </div>
        </div>
      )}

      {/* Detail Rows */}
      <div className="space-y-2.5 text-xs">
        {/* Date */}
        <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
          <span className="text-[#A99A88] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#F0C36B]" /> Date
          </span>
          <span className="font-semibold text-[#F8F2E8]">
            {date.toLocaleDateString('en-US', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>

        {/* Time & Duration */}
        <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
          <span className="text-[#A99A88] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#F0C36B]" /> Time &amp; Duration
          </span>
          <span className="font-semibold text-[#F8F2E8]">
            {time ? `${time} · ${durationLabel}` : 'Select time'}
          </span>
        </div>

        {/* Party Size */}
        <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
          <span className="text-[#A99A88] flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#F0C36B]" /> Party Size
          </span>
          <span className="font-semibold text-[#F8F2E8]">
            {guests} {guests === 1 ? 'Guest' : 'Guests'}
          </span>
        </div>

        {/* Seating Allocation */}
        <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
          <span className="text-[#A99A88] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#F0C36B]" /> Seating Allocation
          </span>
          <span className="font-semibold text-[#F0C36B] text-right truncate max-w-[200px]">
            {tableNumber ? `T${tableNumber} · ${zone || tableName || 'Fireplace Lounge'}` : (tableName || 'Best Fit Table')}
          </span>
        </div>

        {/* Pre-order dishes from 3D Menu */}
        {preOrderCartItemsCount > 0 && (
          <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
            <span className="text-[#A99A88] flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-[#E0532B]" /> 3D Menu Pre-Order
            </span>
            <span className="font-semibold text-[#36D6A0]">
              {preOrderCartItemsCount} dishes linked
            </span>
          </div>
        )}
      </div>

      {/* Advance Guarantee Amount */}
      <div className="p-3.5 rounded-xl bg-black/40 backdrop-blur-md border border-[#F0C36B]/25 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-[#A99A88] font-bold block font-mono">
            TABLE HOLD DEPOSIT
          </span>
          <span className="text-[10px] text-[#D4C7B6] font-light">
            100% against your dining bill
          </span>
        </div>
        <span className="font-mono text-xl font-bold text-[#36D6A0]">
          {formatMoney(advanceAmountPaise)}
        </span>
      </div>

      {/* Trust & Policy Micro-Badge */}
      <div className="flex items-center gap-2 text-[10.5px] text-[#A99A88] pt-1">
        <ShieldCheck className="w-4 h-4 text-[#36D6A0] shrink-0" />
        <span>Instant seating guarantee · Free cancellation up to 2 hours before</span>
      </div>
    </div>
  );
}
