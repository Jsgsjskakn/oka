'use client';

import { MapPin, Phone, Star, Navigation } from 'lucide-react';
import { restaurantInfo } from '@/data/mock-menu';

export function RestaurantInfo() {
  const address = '45 Golden Oak Boulevard, Indiranagar, Bengaluru, Karnataka 560038';
  const phone = '+91 99907 74565';
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    // Split Architectural Concierge & Dark Map Card (12-column full container width, max-width: 1280px)
    <section className="py-16 px-6 md:px-12 max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full">
        {/* Left 5 Columns: Hospitality Dossier Card */}
        <div
          className="lg:col-span-5 p-8 sm:p-10 rounded-xl flex flex-col justify-between shadow-2xl border"
          style={{
            background: '#15110E',
            borderColor: 'rgba(226, 168, 75, 0.16)',
          }}
        >
          <div className="space-y-6">
            {/* Header: Title & Verified Star Rating */}
            <div>
              <span className="text-[11px] uppercase tracking-[0.25em] text-[#E0532B] font-bold block mb-2">
                FLAGSHIP LOCATION
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#FAF5EC] tracking-tight leading-snug">
                The Golden Oak — Indiranagar Flagship
              </h2>
              <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-[#E2A84B]/10 border border-[#E2A84B]/30 text-xs font-semibold text-[#E2A84B]">
                <Star className="w-3.5 h-3.5 fill-[#E2A84B] text-[#E2A84B]" />
                <span>4.8</span>
                <span className="text-[#B5ADA2] font-normal">(1,240+ Verified Diners)</span>
              </div>
            </div>

            {/* Address */}
            <div className="pt-2 border-t border-white/[0.08] space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-[#9A9286] font-medium block">
                ADDRESS
              </span>
              <p className="text-sm text-[#FAF5EC] font-light leading-relaxed">
                {address}
              </p>
            </div>

            {/* Hours & Live Open Status Pill */}
            <div className="pt-2 border-t border-white/[0.08] space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-[#9A9286] font-medium block">
                OPERATING HOURS
              </span>
              <p className="text-sm text-[#FAF5EC] font-light">
                12:00 PM – 11:30 PM (Daily)
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22C58B]/15 border border-[#22C58B]/30 text-xs font-bold text-[#22C58B]">
                <span className="w-2 h-2 rounded-full bg-[#22C58B] animate-pulse" />
                <span>OPEN NOW · Closes at 11:30 PM</span>
              </div>
            </div>
          </div>

          {/* Equal 50/50 Call & Directions Buttons */}
          <div className="grid grid-cols-2 gap-4 pt-8 mt-6 border-t border-white/[0.08]">
            <a
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-[6px] text-xs font-bold text-[#FAF5EC] transition-all duration-300 hover:text-[#0D0A08] hover:bg-[#E2A84B] group"
              style={{
                border: '1px solid rgba(226, 168, 75, 0.35)',
                background: 'rgba(226, 168, 75, 0.06)',
              }}
            >
              <Phone className="w-3.5 h-3.5 text-[#E2A84B] group-hover:text-[#0D0A08] transition-colors" />
              <span>Call</span>
            </a>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-[6px] text-xs font-bold text-[#FAF5EC] transition-all duration-300 hover:text-[#0D0A08] hover:bg-[#E2A84B] group"
              style={{
                border: '1px solid rgba(226, 168, 75, 0.35)',
                background: 'rgba(226, 168, 75, 0.06)',
              }}
            >
              <Navigation className="w-3.5 h-3.5 text-[#E2A84B] group-hover:text-[#0D0A08] transition-colors" />
              <span>Directions</span>
            </a>
          </div>
        </div>

        {/* Right 7 Columns: Custom Dark-Mode Map Container with Invert Luxury Filter & Pulsing Gold Pin */}
        <div
          className="lg:col-span-7 relative min-h-[380px] lg:min-h-[460px] rounded-xl overflow-hidden border shadow-2xl flex items-center justify-center"
          style={{
            background: '#0D0A08',
            borderColor: 'rgba(226, 168, 75, 0.2)',
          }}
        >
          {/* Map Embed with Requested Inverted Luxury Dark Mode CSS Filter */}
          <iframe
            title="The Golden Oak Indiranagar Luxury Map Location"
            src="https://www.google.com/maps?q=12.9716,77.6416&hl=en&z=15&output=embed"
            className="w-full h-full absolute inset-0 border-0 opacity-80"
            style={{
              filter: 'invert(92%) hue-rotate(185deg) brightness(85%) contrast(92%)',
            }}
            loading="lazy"
            referrerPolicy="no-referrer"
          />

          {/* Dark Glass Overlay Tint to Harmonize with Luxury Dark Aesthetics */}
          <div className="absolute inset-0 bg-[#0D0A08]/30 pointer-events-none" />

          {/* Custom #E2A84B Pulsing Gold Map Pin in Center */}
          <div className="relative z-20 pointer-events-none flex flex-col items-center">
            {/* Pulsing Aura Rings */}
            <div className="relative flex items-center justify-center">
              <span className="absolute w-12 h-12 rounded-full bg-[#E2A84B]/30 animate-ping" />
              <span className="absolute w-8 h-8 rounded-full bg-[#E2A84B]/40" />
              <div className="relative w-10 h-10 rounded-full bg-[#0D0A08] border-2 border-[#E2A84B] flex items-center justify-center shadow-2xl">
                <MapPin className="w-5 h-5 text-[#E2A84B]" />
              </div>
            </div>

            {/* Floating Luxury Tag */}
            <div
              className="mt-3 px-3.5 py-1.5 rounded-md shadow-2xl flex items-center gap-1.5 border"
              style={{
                background: 'rgba(13, 10, 8, 0.88)',
                backdropFilter: 'blur(10px)',
                borderColor: 'rgba(226, 168, 75, 0.4)',
              }}
            >
              <span className="font-serif text-xs font-bold text-[#FAF5EC]">
                The Golden Oak
              </span>
              <span className="text-[10px] text-[#E2A84B]">· Indiranagar Flagship</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
