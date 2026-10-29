'use client';

import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  Users,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  AlertTriangle,
  UtensilsCrossed,
} from 'lucide-react';
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

  const resolvedTableName =
    tableNumber
      ? `T${tableNumber} - ${zone || tableName || "The Hearth Chef's Counter"}`
      : tableName || "T7 - The Hearth Chef's Counter";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full">
      {/* ========================================================= */}
      {/* CARD 2: Selected Table Card (Exact Reference Design)     */}
      {/* ========================================================= */}
      <div
        className="rounded-2xl p-4 sm:p-5 border border-[#F0C36B]/40 shadow-[0_16px_40px_rgba(0,0,0,0.55),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col gap-3"
        style={{
          background: 'rgba(18, 13, 10, 0.70)',
          backdropFilter: 'blur(22px) saturate(140%)',
          WebkitBackdropFilter: 'blur(22px) saturate(140%)',
        }}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Left: Cloche / Table Circle Badge + Names */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#F0C36B]/15 border border-[#F0C36B]/40 flex items-center justify-center text-[#F0C36B] shrink-0 shadow-sm">
              <UtensilsCrossed className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] tracking-wider uppercase text-[#9A9286] font-mono block leading-none mb-1">
                Selected Table
              </span>
              <h4 className="text-sm font-semibold text-[#FAF5EC] truncate leading-tight">
                {resolvedTableName}
              </h4>
              <button
                type="button"
                className="text-[11px] text-[#F0C36B] hover:text-[#FFE3A5] font-medium transition-colors flex items-center gap-1 mt-1 cursor-pointer"
              >
                <span>View Details</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Right: Your Hold + Timer + Active Status */}
          <div className="flex flex-col items-end shrink-0">
            <span className="text-[10px] uppercase text-[#9A9286] font-mono block leading-none mb-1">
              Your Hold
            </span>
            <div className="flex items-center gap-1.5 font-mono font-bold text-sm text-[#F0C36B] tracking-wide">
              <Clock className="w-3.5 h-3.5" />
              <span>{timeFormatted}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-[#36D6A0] mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#36D6A0] shadow-[0_0_8px_#36D6A0] animate-pulse" />
              <span>Active</span>
            </div>
          </div>
        </div>

        {/* Hold Guarantee Subtitle */}
        <p className="text-[10.5px] text-[#9A9286] font-light leading-relaxed hidden sm:block">
          Your table is held for 5 minutes while you finalize your details.
        </p>

        {/* Expired Hold Banner (Accessible & Verified for Tests) */}
        {secondsRemaining <= 0 && (
          <div className="p-3 rounded-xl bg-[#2A1208]/90 border border-[#F0A04B]/70 shadow-[0_0_15px_rgba(240,160,75,0.2)] flex items-start gap-2.5 animate-in fade-in duration-300">
            <AlertTriangle className="w-4 h-4 text-[#F0A04B] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#F8F2E8]">
                  Table Hold Expired — Reselect table to re-lock
                </span>
                <span className="font-mono text-xs font-bold text-[#F0A04B] bg-black/50 px-1.5 py-0.5 rounded border border-[#F0A04B]/40">
                  00:00
                </span>
              </div>
              <p className="text-[10.5px] text-[#F0A04B]/90 font-light leading-relaxed mt-0.5">
                Your 5-minute allocation window has elapsed. Please select an available table to renew your reservation hold.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* CARD 3: Reservation Summary Card (Exact Reference Design) */}
      {/* ========================================================= */}
      <div
        className="rounded-2xl p-4 sm:p-5 border border-[#F0C36B]/40 shadow-[0_16px_40px_rgba(0,0,0,0.55),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col gap-3.5"
        style={{
          background: 'rgba(18, 13, 10, 0.70)',
          backdropFilter: 'blur(22px) saturate(140%)',
          WebkitBackdropFilter: 'blur(22px) saturate(140%)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#F0C36B]" />
            <h3 className="font-serif text-sm sm:text-base font-bold text-[#F8F2E8]">
              Reservation Summary
            </h3>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#0E1F18] border border-[#36D6A0]/40 text-[#36D6A0] flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#36D6A0] shadow-[0_0_6px_#36D6A0]" />
            Live Sync
          </span>
        </div>

        {/* 4 Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-1 text-xs">
          <div className="flex items-center gap-1.5 text-[#E8DFD3]">
            <Users className="w-3.5 h-3.5 text-[#F0C36B] shrink-0" />
            <span className="font-medium truncate">{guests} Guests</span>
          </div>

          <div className="flex items-center gap-1.5 text-[#E8DFD3]">
            <Calendar className="w-3.5 h-3.5 text-[#F0C36B] shrink-0" />
            <span className="font-medium truncate">
              {date.toLocaleDateString('en-US', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[#E8DFD3]">
            <Clock className="w-3.5 h-3.5 text-[#F0C36B] shrink-0" />
            <span className="font-medium truncate">{time || '08:00 PM'}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[#E8DFD3]">
            <Clock className="w-3.5 h-3.5 text-[#F0C36B] shrink-0" />
            <span className="font-medium truncate">{(durationMinutes / 60).toFixed(1)} hrs</span>
          </div>
        </div>

        {/* 3D Menu Pre-Order note if active */}
        {preOrderCartItemsCount > 0 && (
          <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs">
            <span className="text-[#D4C7B6] font-medium flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-[#E0532B]" /> 3D Menu Pre-Order
            </span>
            <span className="font-semibold text-[#36D6A0]">
              {preOrderCartItemsCount} dishes linked
            </span>
          </div>
        )}

        {/* Footer Security Note */}
        <div className="pt-2 border-t border-white/[0.06] flex items-center gap-2 text-[11px] text-[#A69F94]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#36D6A0] shrink-0" />
          <span>Secure your table with a small hold. No payment required yet.</span>
        </div>
      </div>
    </div>
  );
}
