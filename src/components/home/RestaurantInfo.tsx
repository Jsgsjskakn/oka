'use client';

import { useState, useEffect } from 'react';
import { MapPin, Phone, Star, Navigation, Compass, ArrowUpRight, LocateFixed } from 'lucide-react';

export function RestaurantInfo() {
  const address = '45 Golden Oak Boulevard, 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038';
  const phone = '+91 99907 74565';
  const goldenOakCoords = { lat: 12.9716, lng: 77.6416 };

  // Google Maps Turn-by-Turn Navigation & Distance URL
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=The+Golden+Oak,+100+Feet+Road,+Indiranagar,+Bengaluru&destination_place_id=ChIJwWv3fT8UrjsRNsFk4JgO7z8&travelmode=driving`;
  const viewMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  const [userDistance, setUserDistance] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapSource, setMapSource] = useState<'osm' | 'google'>('osm');

  // Interactive Live Distance Calculation
  const handleCalculateDistance = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setUserDistance('Indiranagar, Bengaluru · Central Prime Location');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat1 = pos.coords.latitude;
        const lon1 = pos.coords.longitude;
        const R = 6371; // Earth radius in km
        const dLat = ((goldenOakCoords.lat - lat1) * Math.PI) / 180;
        const dLon = ((goldenOakCoords.lng - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((goldenOakCoords.lat * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;

        const distanceText = d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
        const estMinutes = Math.max(4, Math.round(d * 3.2));
        setUserDistance(`${distanceText} away · ~${estMinutes} min drive`);
        setIsLocating(false);
      },
      () => {
        setUserDistance('Indiranagar 100ft Rd · Flagship Hub');
        setIsLocating(false);
      },
      { timeout: 7000 }
    );
  };

  useEffect(() => {
    // Attempt non-blocking distance detection on mount
    handleCalculateDistance();
  }, []);

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
              href={directionsUrl}
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

        {/* Right 7 Columns: Bengaluru Luxury Map Container with Live Navigation & Start Button */}
        <div
          className="lg:col-span-7 relative min-h-[460px] lg:min-h-[520px] rounded-xl overflow-hidden border shadow-2xl flex flex-col justify-between"
          style={{
            background: '#0D0A08',
            borderColor: 'rgba(226, 168, 75, 0.2)',
          }}
        >
          {/* Top Bar on Map: View Controls */}
          <div className="relative z-30 p-4 flex items-center justify-between gap-3 pointer-events-none">
            <div
              className="px-3.5 py-1.5 rounded-md shadow-2xl flex items-center gap-2 border pointer-events-auto"
              style={{
                background: 'rgba(13, 10, 8, 0.88)',
                backdropFilter: 'blur(10px)',
                borderColor: 'rgba(226, 168, 75, 0.4)',
              }}
            >
              <MapPin className="w-3.5 h-3.5 text-[#E2A84B]" />
              <span className="font-serif text-xs font-bold text-[#FAF5EC]">
                Bengaluru · Indiranagar 100ft Rd
              </span>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                type="button"
                onClick={() => setMapSource(mapSource === 'osm' ? 'google' : 'osm')}
                className="px-2.5 py-1 rounded text-[11px] font-medium text-[#FAF5EC] hover:text-[#E2A84B] border border-white/20 transition-all shadow-md"
                style={{ background: 'rgba(13, 10, 8, 0.85)' }}
              >
                {mapSource === 'osm' ? 'Switch to Google Map' : 'Switch to Dark Map'}
              </button>
            </div>
          </div>

          {/* Map Embed of Bengaluru Indiranagar */}
          <div className="absolute inset-0 z-10 w-full h-full overflow-hidden">
            {mapSource === 'osm' ? (
              <iframe
                title="The Golden Oak Bengaluru Indiranagar Map"
                src="https://www.openstreetmap.org/export/embed.html?bbox=77.6250%2C12.9550%2C77.6580%2C12.9850&layer=mapnik&marker=12.9716%2C77.6416"
                className="w-full h-full border-0"
                style={{
                  filter: 'invert(92%) hue-rotate(185deg) brightness(85%) contrast(92%)',
                }}
                loading="lazy"
              />
            ) : (
              <iframe
                title="Google Maps Bengaluru Indiranagar"
                src="https://maps.google.com/maps?q=100%20Feet%20Road,%20Indiranagar,%20Bengaluru&t=&z=15&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full border-0"
                style={{
                  filter: 'invert(92%) hue-rotate(185deg) brightness(85%) contrast(92%)',
                }}
                loading="lazy"
              />
            )}

            {/* Subtle luxury ambient tint */}
            <div className="absolute inset-0 bg-[#0D0A08]/20 pointer-events-none" />
          </div>

          {/* Central Pulsing Gold Flagship Pin */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex flex-col items-center">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-12 h-12 rounded-full bg-[#E2A84B]/30 animate-ping" />
              <span className="absolute w-8 h-8 rounded-full bg-[#E2A84B]/40" />
              <div className="relative w-10 h-10 rounded-full bg-[#0D0A08] border-2 border-[#E2A84B] flex items-center justify-center shadow-2xl">
                <MapPin className="w-5 h-5 text-[#E2A84B]" />
              </div>
            </div>
            <div
              className="mt-2 px-3 py-1 rounded-md shadow-2xl flex items-center gap-1 border"
              style={{
                background: 'rgba(13, 10, 8, 0.92)',
                backdropFilter: 'blur(10px)',
                borderColor: 'rgba(226, 168, 75, 0.45)',
              }}
            >
              <span className="font-serif text-[11px] font-bold text-[#FAF5EC]">The Golden Oak</span>
            </div>
          </div>

          {/* Bottom Interactive Navigation & START Button Card (User's Requested Control Bar) */}
          <div className="relative z-30 p-4 sm:p-5 m-3 sm:m-4 rounded-xl border shadow-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
            style={{
              background: 'rgba(13, 10, 8, 0.94)',
              backdropFilter: 'blur(16px)',
              borderColor: 'rgba(226, 168, 75, 0.35)',
            }}
          >
            {/* Left: Distance & Location Status */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-[#E2A84B]/15 border border-[#E2A84B]/30 flex items-center justify-center shrink-0">
                <Compass className="w-5 h-5 text-[#E2A84B] animate-[spin_12s_linear_infinite]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-[#E2A84B] font-bold">
                    GPS ROUTE &amp; DISTANCE
                  </span>
                  <button
                    type="button"
                    onClick={handleCalculateDistance}
                    title="Refresh Distance from Current Location"
                    className="text-[#B5ADA2] hover:text-[#FAF5EC] transition-colors"
                  >
                    <LocateFixed className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-[#FAF5EC] truncate mt-0.5">
                  {isLocating
                    ? 'Calculating live distance...'
                    : userDistance || 'Indiranagar 100ft Rd · Flagship'}
                </p>
              </div>
            </div>

            {/* Right: START Navigation Button & Direct Map Link */}
            <div className="flex items-center gap-2.5 shrink-0">
              <a
                href={viewMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2.5 rounded-[6px] border border-white/20 text-[#FAF5EC] hover:text-[#E2A84B] hover:border-[#E2A84B]/40 text-xs font-medium transition-all flex items-center gap-1"
              >
                <span>View</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>

              {/* High-Visibility START Navigation Button (opens Google Maps directly with distance and Start navigation) */}
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-[6px] text-xs font-extrabold text-[#0D0A08] transition-all duration-300 hover:brightness-110 active:scale-95 shadow-lg flex items-center gap-1.5 group"
                style={{
                  background: 'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)',
                }}
              >
                <Navigation className="w-3.5 h-3.5 fill-[#0D0A08] group-hover:translate-x-0.5 transition-transform" />
                <span>START NAVIGATION</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
