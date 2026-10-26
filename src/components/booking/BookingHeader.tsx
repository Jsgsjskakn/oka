'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BookingHeaderProps {
  step: 1 | 2 | 3;
  onStepChange?: (step: 1 | 2 | 3) => void;
  showBack?: boolean;
}

export function BookingHeader({ step, onStepChange, showBack = true }: BookingHeaderProps) {
  const router = useRouter();

  const steps = [
    { num: '01', label: 'TIME & SEATING', stepVal: 1 as const },
    { num: '02', label: 'GUEST DOSSIER', stepVal: 2 as const },
    { num: '03', label: 'INSTANT CONFIRMATION', stepVal: 3 as const },
  ];

  return (
    <header className="relative pt-8 pb-6 px-4 sm:px-6 w-full max-w-[1320px] mx-auto text-center">
      {/* Top Header Row with Editorial Overline & Back Button */}
      <div className="relative flex items-center justify-center mb-3">
        {showBack && (
          <button
            onClick={() => {
              if (step > 1 && onStepChange) {
                onStepChange((step - 1) as 1 | 2 | 3);
              } else {
                router.back();
              }
            }}
            className="absolute left-0 group inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[rgba(21,17,14,0.7)] backdrop-blur-md border border-[rgba(226,168,75,0.22)] hover:border-[#E2A84B] text-[#FAF5EC] text-xs font-medium transition-all active:scale-95"
            aria-label="Back"
          >
            <ChevronLeft className="w-4 h-4 text-[#E2A84B] transition-transform duration-200 group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">Back</span>
          </button>
        )}

        <span className="text-[11px] font-semibold tracking-[0.3em] uppercase text-[#E2A84B]">
          — CONCIERGE TABLE RESERVATION —
        </span>
      </div>

      {/* Main Michelin Editorial Title */}
      <h1 className="font-serif text-3xl sm:text-4xl md:text-[44px] font-bold text-[#FAF5EC] tracking-tight leading-tight mb-2">
        Reserve at The Golden Oak
      </h1>
      <p className="text-xs sm:text-sm text-[#9A9286] font-light max-w-lg mx-auto">
        Curate your fine dining experience, preferred seating zone, and culinary ambiance.
      </p>

      {/* Architectural Stepper (Editorial Numbering & Glowing Hairlines) */}
      <nav
        aria-label="Booking Progress"
        className="mt-8 mb-4 max-w-3xl mx-auto flex items-center justify-between gap-3 text-xs"
      >
        {steps.map((s, idx) => {
          const isActive = step === s.stepVal;
          const isPassed = step > s.stepVal;

          return (
            <div key={s.num} className="flex-1 flex items-center gap-3">
              <div
                className={`relative flex flex-col items-start pb-2 flex-1 transition-all ${
                  isActive
                    ? 'text-[#E2A84B]'
                    : isPassed
                    ? 'text-[#22C58B]'
                    : 'text-[#9A9286]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold tracking-wider">
                    {s.num} /
                  </span>
                  <span className="font-sans text-[11px] sm:text-xs font-semibold tracking-[0.14em] uppercase whitespace-nowrap">
                    {s.label}
                  </span>
                </div>

                {/* Glowing Bottom Accent Line */}
                <div
                  className={`mt-2 h-[2px] w-full rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#F6D386] via-[#D49432] to-[#E2A84B] shadow-[0_0_12px_rgba(226,168,75,0.7)]'
                      : isPassed
                      ? 'bg-[#22C58B]/60'
                      : 'bg-white/[0.08]'
                  }`}
                />
              </div>

              {idx < steps.length - 1 && (
                <div className="w-6 sm:w-10 h-[1px] bg-white/[0.08] mb-2 shrink-0 hidden sm:block" />
              )}
            </div>
          );
        })}
      </nav>
    </header>
  );
}
