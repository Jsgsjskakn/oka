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
    <div className="flex flex-col gap-4 p-5 rounded-2xl bg-[rgba(21,17,14,0.9)] backdrop-blur-xl border border-[rgba(226,168,75,0.22)] shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
      {/* Dossier Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-[#E2A84B]">
            CONFIRMATION DOSSIER
          </span>
          <h3 className="font-serif text-lg font-bold text-[#FAF5EC] leading-tight mt-0.5">
            Reservation Summary
          </h3>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#0E1F18] border border-[#22C58B]/30 text-[#22C58B]">
          Live Sync
        </span>
      </div>

      {/* 5-Minute Live Hold Timer Banner (Feature 3) */}
      {time && (
        <div className="p-3 rounded-xl bg-[#0A261C] border border-[#22C58B]/60 shadow-[0_0_15px_rgba(34,197,139,0.15)] flex items-start gap-2.5 animate-in fade-in duration-300">
          <Lock className="w-4 h-4 text-[#22C58B] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#FAF5EC]">
                {tableNumber ? `Table #${tableNumber} Temporarily Held` : 'Table Slot Locked'}
              </span>
              <span className="font-mono text-xs font-bold text-[#22C58B] bg-black/40 px-1.5 py-0.5 rounded border border-[#22C58B]/30">
                {timeFormatted}
              </span>
            </div>
            <p className="text-[10.5px] text-[#A6E8C8] font-light leading-relaxed mt-0.5">
              Your table is reserved for 5 minutes while you finalize your details.
            </p>
          </div>
        </div>
      )}

      {/* Detail Rows */}
      <div className="space-y-2.5 text-xs">
        {/* Date & Time */}
        <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
          <span className="text-[#9A9286] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#E2A84B]" /> Date
          </span>
          <span className="font-semibold text-[#FAF5EC]">
            {date.toLocaleDateString('en-US', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>

        {/* Time Slot */}
        <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
          <span className="text-[#9A9286] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#E2A84B]" /> Time &amp; Duration
          </span>
          <span className="font-semibold text-[#FAF5EC]">
            {time ? `${time} (${durationLabel})` : 'Select time'}
          </span>
        </div>

        {/* Guests */}
        <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
          <span className="text-[#9A9286] flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#E2A84B]" /> Party Size
          </span>
          <span className="font-semibold text-[#FAF5EC]">
            {guests} {guests === 1 ? 'Guest' : 'Guests'}
          </span>
        </div>

        {/* Seating Table & Zone */}
        <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
          <span className="text-[#9A9286] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#E2A84B]" /> Seating Allocation
          </span>
          <span className="font-semibold text-[#E2A84B] text-right truncate max-w-[180px]">
            {tableName || (tableNumber ? `Table #${tableNumber}` : 'Best Fit Table')}
          </span>
        </div>

        {/* Pre-order dishes from 3D Menu */}
        {preOrderCartItemsCount > 0 && (
          <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
            <span className="text-[#9A9286] flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-[#E0532B]" /> 3D Menu Pre-Order
            </span>
            <span className="font-semibold text-[#22C58B]">
              {preOrderCartItemsCount} dishes linked
            </span>
          </div>
        )}
      </div>

      {/* Advance Guarantee Amount */}
      <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#120D0A] to-[#1A130E] border border-[rgba(226,168,75,0.25)] flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-[#9A9286] font-semibold block">
            Table Hold Deposit
          </span>
          <span className="text-[10px] text-[#B5ADA2] font-light">
            100% credited against your dining bill
          </span>
        </div>
        <span className="font-mono text-lg font-bold text-[#22C58B]">
          {formatMoney(advanceAmountPaise)}
        </span>
      </div>

      {/* Trust & Policy Micro-Badge */}
      <div className="flex items-center gap-2 text-[10px] text-[#9A9286] pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-[#22C58B] shrink-0" />
        <span>Instant seating guarantee · Free cancellation up to 2 hours before</span>
      </div>
    </div>
  );
}
