'use client';

import { MapPin, Clock, Compass } from 'lucide-react';

interface DeliveryAddressCardProps {
  address: string;
  landmark: string;
  pincode: string;
  instructions: string;
  onAddressChange: (value: string) => void;
  onLandmarkChange: (value: string) => void;
  onPincodeChange: (value: string) => void;
  onInstructionsChange: (value: string) => void;
  error?: string;
}

export function DeliveryAddressCard({
  address,
  landmark,
  pincode,
  instructions,
  onAddressChange,
  onLandmarkChange,
  onPincodeChange,
  onInstructionsChange,
  error,
}: DeliveryAddressCardProps) {
  return (
    <div className="px-4 py-6 border-b border-white/5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-text-primary/40 uppercase tracking-widest flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span>Delivery Details</span>
        </h3>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-[10px] font-mono font-semibold text-primary">
          <Clock className="w-3 h-3 text-primary" />
          <span>35-45 MINS ETA</span>
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="delivery-address" className="block text-[11px] font-medium text-text-primary/70 mb-1 ml-1">
            Complete Delivery Address <span className="text-red-400">*</span>
          </label>
          <textarea
            id="delivery-address"
            rows={2}
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="Flat/House no., Floor, Building, Street name..."
            aria-invalid={Boolean(error)}
            className={`w-full bg-[#1a1a1a] border rounded-xl p-3 text-sm text-text-primary placeholder-white/20 focus:outline-none focus:border-primary/50 transition-colors resize-none ${
              error ? 'border-red-500' : 'border-border-subtle'
            }`}
          />
          {error && <p className="text-red-400 text-[11px] mt-1 ml-1">{error}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="delivery-landmark" className="block text-[11px] font-medium text-text-primary/70 mb-1 ml-1">
              Landmark (Optional)
            </label>
            <div className="relative">
              <input
                id="delivery-landmark"
                type="text"
                value={landmark}
                onChange={(e) => onLandmarkChange(e.target.value)}
                placeholder="Near landmark or gate"
                className="w-full min-h-[44px] bg-[#1a1a1a] border border-border-subtle rounded-xl px-3 py-2 text-sm text-text-primary placeholder-white/20 focus:outline-none focus:border-primary/50 transition-colors"
              />
              <Compass className="w-4 h-4 text-white/30 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label htmlFor="delivery-pincode" className="block text-[11px] font-medium text-text-primary/70 mb-1 ml-1">
              PIN Code
            </label>
            <input
              id="delivery-pincode"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={pincode}
              onChange={(e) => onPincodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="e.g. 560001"
              className="w-full min-h-[44px] bg-[#1a1a1a] border border-border-subtle rounded-xl px-3 py-2 text-sm text-text-primary placeholder-white/20 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        <div>
          <label htmlFor="delivery-instructions" className="block text-[11px] font-medium text-text-primary/70 mb-1 ml-1">
            Rider Instructions (Optional)
          </label>
          <input
            id="delivery-instructions"
            type="text"
            value={instructions}
            onChange={(e) => onInstructionsChange(e.target.value)}
            placeholder="e.g. Ring bell, leave with security guard, call upon arrival"
            className="w-full min-h-[44px] bg-[#1a1a1a] border border-border-subtle rounded-xl px-3 py-2 text-sm text-text-primary placeholder-white/20 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
