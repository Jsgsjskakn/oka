'use client';

import { useState } from 'react';
import { Tag, Check, X, Sparkles } from 'lucide-react';
import { toast } from '@/store/toast-store';

interface PromoCodeSectionProps {
  subtotal: number;
  appliedPromo: { code: string; discountPaise: number; description: string } | null;
  onApplyPromo: (promo: { code: string; discountPaise: number; description: string }) => void;
  onRemovePromo: () => void;
}

interface PromoRule {
  description: string;
  minSubtotalRupees: number;
  calculateDiscountPaise: (subtotalPaise: number) => number;
}

const PROMO_REGISTRY: Record<string, PromoRule> = {
  GOLDEN10: {
    description: '10% off entire culinary order',
    minSubtotalRupees: 0,
    calculateDiscountPaise: (subtotalPaise) => Math.round((subtotalPaise * 10) / 100),
  },
  WELCOME20: {
    description: '20% off on orders above ₹500',
    minSubtotalRupees: 500,
    calculateDiscountPaise: (subtotalPaise) => Math.round((subtotalPaise * 20) / 100),
  },
  ROYAL50: {
    description: 'Flat ₹50 privilege discount',
    minSubtotalRupees: 300,
    calculateDiscountPaise: () => 5000,
  },
  CHEF100: {
    description: 'Flat ₹100 chef connoisseur reward',
    minSubtotalRupees: 800,
    calculateDiscountPaise: () => 10000,
  },
};

export function PromoCodeSection({
  subtotal,
  appliedPromo,
  onApplyPromo,
  onRemovePromo,
}: PromoCodeSectionProps) {
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);

  const subtotalPaise = Math.round(subtotal * 100);

  const handleApply = (e?: React.FormEvent) => {
    e?.preventDefault();
    setPromoError(null);
    const code = promoInput.trim().toUpperCase();

    if (!code) {
      setPromoError('Please enter a promo code');
      return;
    }

    const rule = PROMO_REGISTRY[code];
    if (!rule) {
      setPromoError(`Code "${code}" is not valid. Try GOLDEN10, WELCOME20, or ROYAL50.`);
      toast.error('Invalid Promo Code', `Code "${code}" was not recognized.`);
      return;
    }

    if (subtotal < rule.minSubtotalRupees) {
      const msg = `Code "${code}" requires minimum order of ₹${rule.minSubtotalRupees}`;
      setPromoError(msg);
      toast.error('Minimum Amount Required', msg);
      return;
    }

    const discountPaise = Math.min(subtotalPaise, rule.calculateDiscountPaise(subtotalPaise));
    onApplyPromo({
      code,
      discountPaise,
      description: rule.description,
    });
    setPromoInput('');
    toast.success('Promo Code Applied', `Saved ₹${(discountPaise / 100).toFixed(0)} with ${code}`);
  };

  const handleRemove = () => {
    onRemovePromo();
    setPromoError(null);
    toast.info('Promo Code Removed', 'Discount removed from order total');
  };

  return (
    <div className="px-4 py-6 border-b border-white/5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-text-primary/40 uppercase tracking-widest flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-primary" />
          <span>Promo Code &amp; Offers</span>
        </h3>
        {!appliedPromo && (
          <span className="text-[10px] text-primary/70 font-mono">
            Offers available
          </span>
        )}
      </div>

      {appliedPromo ? (
        <div className="p-3.5 rounded-xl bg-[#22C58B]/10 border border-[#22C58B]/35 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#22C58B]/20 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-[#22C58B]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#FAF5EC] tracking-wider uppercase">
                  {appliedPromo.code}
                </span>
                <span className="text-[10px] text-[#22C58B] font-semibold">
                  Saved ₹{(appliedPromo.discountPaise / 100).toFixed(0)}
                </span>
              </div>
              <p className="text-[11px] text-text-primary/60 truncate">
                {appliedPromo.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-text-primary/60 hover:text-rose-400 transition-colors shrink-0"
            aria-label="Remove promo code"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div>
          <form onSubmit={handleApply} className="flex gap-2">
            <input
              type="text"
              value={promoInput}
              onChange={(e) => {
                setPromoInput(e.target.value.toUpperCase());
                if (promoError) setPromoError(null);
              }}
              placeholder="Enter code (e.g. GOLDEN10)"
              aria-label="Promo code"
              className="flex-1 min-h-[44px] bg-[#1a1a1a] border border-border-subtle rounded-xl px-3.5 text-xs sm:text-sm text-text-primary uppercase placeholder:normal-case placeholder-white/25 focus:outline-none focus:border-primary/50 transition-colors font-mono"
            />
            <button
              type="submit"
              disabled={!promoInput.trim()}
              className="min-h-[44px] px-4 rounded-xl bg-primary text-black text-xs font-bold uppercase tracking-wider disabled:opacity-40 hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
            >
              Apply
            </button>
          </form>

          {promoError && (
            <p className="text-rose-400 text-[11px] mt-1.5 ml-1">{promoError}</p>
          )}

          {/* Quick available codes suggestion pills */}
          <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] text-text-primary/40 mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" /> Suggestions:
            </span>
            {['GOLDEN10', 'WELCOME20', 'ROYAL50'].map((suggested) => (
              <button
                key={suggested}
                type="button"
                onClick={() => {
                  setPromoInput(suggested);
                  const rule = PROMO_REGISTRY[suggested];
                  if (rule && subtotal >= rule.minSubtotalRupees) {
                    const discountPaise = Math.min(subtotalPaise, rule.calculateDiscountPaise(subtotalPaise));
                    onApplyPromo({
                      code: suggested,
                      discountPaise,
                      description: rule.description,
                    });
                    setPromoInput('');
                    toast.success('Promo Code Applied', `Saved ₹${(discountPaise / 100).toFixed(0)} with ${suggested}`);
                  }
                }}
                className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/10 text-primary/80 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer"
              >
                {suggested}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
