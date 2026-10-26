'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Phone,
  Star,
  Navigation,
  Compass,
  ArrowUpRight,
  LocateFixed,
  Clock,
  Sparkles,
  Car,
  Wine,
  Utensils,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

export function RestaurantInfo() {
  const address = '45 Golden Oak Boulevard, 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038';
  const phone = '+91 99907 74565';
  const goldenOakCoords = { lat: 12.9716, lng: 77.6416 };

  // Google Maps Turn-by-Turn Navigation & Distance URL
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=The+Golden+Oak,+100+Feet+Road,+Indiranagar,+Bengaluru&destination_place_id=ChIJwWv3fT8UrjsRNsFk4JgO7z8&travelmode=driving`;
  const viewMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('The Golden Oak, 100 Feet Road, Indiranagar, Bengaluru')}`;

  const [userDistance, setUserDistance] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapViewMode, setMapViewMode] = useState<'dark' | 'standard' | 'satellite'>('dark');
  const [mapReloadKey, setMapReloadKey] = useState(0);
  const [bengaluruTime, setBengaluruTime] = useState<string>('');
  const [isOpenNow, setIsOpenNow] = useState<boolean>(true);

  // Live Bengaluru Clock & Operating Status
  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const options: Intl.DateTimeFormatOptions = {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        };
        const timeStr = new Intl.DateTimeFormat('en-IN', options).format(now);
        setBengaluruTime(timeStr);

        // Check if between 12:00 PM and 11:30 PM IST
        const istFormatter = new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: 'numeric',
          minute: 'numeric',
          hourCycle: 'h23',
        });
        const parts = istFormatter.formatToParts(now);
        const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
        const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
        const currentTotalMinutes = hour * 60 + minute;
        // 12:00 PM is 720 min, 11:30 PM is 1410 min
        setIsOpenNow(currentTotalMinutes >= 720 && currentTotalMinutes <= 1410);
      } catch {
        setBengaluruTime('04:30 PM IST');
        setIsOpenNow(true);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Interactive Live Distance Calculation
  const handleCalculateDistance = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setUserDistance('Indiranagar, Bengaluru · Central Prime Hub');
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
        const estMinutes = Math.max(3, Math.round(d * 2.8));
        setUserDistance(`${distanceText} away · ~${estMinutes} min drive`);
        setIsLocating(false);
      },
      () => {
        setUserDistance('Indiranagar 100ft Rd · Flagship Hub');
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  useEffect(() => {
    handleCalculateDistance();
  }, []);

  const handleRecenterMap = () => {
    setMapReloadKey((prev) => prev + 1);
  };

  // Google Maps embed URL with fixed coordinates pinned to 100 Feet Road, Indiranagar
  const getMapIframeSrc = () => {
    if (mapViewMode === 'satellite') {
      return `https://maps.google.com/maps?q=12.971598,77.641617&t=k&z=16&ie=UTF8&iwloc=&output=embed`;
    }
    return `https://maps.google.com/maps?q=100+Feet+Road,+Indiranagar,+Bengaluru&t=m&z=16&ie=UTF8&iwloc=&output=embed`;
  };

  return (
    <section className="relative py-20 px-6 md:px-12 max-w-7xl mx-auto w-full overflow-hidden">
      {/* Background Subtle Warm Ambient Glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[400px] bg-[#E2A84B]/05 rounded-full blur-3xl -z-10" />

      {/* Main 12-Column Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full">
        {/* Left 5 Columns: Hospitality Dossier & Concierge Card */}
        <div
          className="lg:col-span-5 p-8 sm:p-10 rounded-2xl flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.85)] border transition-all duration-300 hover:border-[#E2A84B]/35 relative overflow-hidden group"
          style={{
            background: 'linear-gradient(165deg, #181310 0%, #120E0B 100%)',
            borderColor: 'rgba(226, 168, 75, 0.22)',
          }}
        >
          {/* Subtle Corner Sheen Accent */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-48 h-48 bg-[#E2A84B]/10 rounded-full blur-2xl group-hover:bg-[#E2A84B]/15 transition-all duration-700" />

          <div className="space-y-6 relative z-10">
            {/* Header: Overline + Star Rating */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="w-2 h-2 rounded-full bg-[#E0532B] animate-pulse" />
                <span className="text-[11px] uppercase tracking-[0.25em] text-[#E0532B] font-bold">
                  FLAGSHIP LOCATION · BENGALURU
                </span>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#FAF5EC] tracking-tight leading-snug">
                The Golden Oak — Indiranagar Flagship
              </h2>

              <div className="inline-flex items-center gap-2 mt-3.5 px-3 py-1.5 rounded-full bg-[#E2A84B]/10 border border-[#E2A84B]/30 text-xs font-semibold text-[#E2A84B] shadow-sm">
                <Star className="w-3.5 h-3.5 fill-[#E2A84B] text-[#E2A84B]" />
                <span className="font-bold">4.8</span>
                <span className="text-[#B5ADA2] font-normal">· 1,240+ Verified Diners</span>
              </div>
            </div>

            {/* Address */}
            <div className="pt-3 border-t border-white/[0.08] space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider text-[#9A9286] font-semibold block">
                ADDRESS &amp; VALET ENTRANCE
              </span>
              <p className="text-sm text-[#FAF5EC] font-light leading-relaxed">
                {address}
              </p>
            </div>

            {/* Live Hours, Bengalur Clock & Active Kitchen Status */}
            <div className="pt-3 border-t border-white/[0.08] space-y-2.5">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#9A9286] font-semibold">
                <span>OPERATING HOURS</span>
                <span className="text-[#E2A84B] flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  {bengaluruTime || 'IST (Bengaluru)'}
                </span>
              </div>

              <p className="text-sm text-[#FAF5EC] font-light">
                12:00 PM – 11:30 PM (Monday – Sunday)
              </p>

              {isOpenNow ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22C58B]/15 border border-[#22C58B]/35 text-xs font-bold text-[#22C58B] shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C58B] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C58B]" />
                  </span>
                  <span>OPEN NOW · Dining &amp; Bar Active · Closes at 11:30 PM</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E2A84B]/15 border border-[#E2A84B]/35 text-xs font-bold text-[#E2A84B]">
                  <span className="w-2 h-2 rounded-full bg-[#E2A84B]" />
                  <span>OPENS AT 12:00 PM · Online Bookings Open</span>
                </div>
              )}
            </div>

            {/* Curated Michelin-Tier Amenities Highlights */}
            <div className="pt-3 border-t border-white/[0.08] grid grid-cols-2 gap-2.5">
              <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-[11px] text-[#FAF5EC]/85">
                <Car className="w-3.5 h-3.5 text-[#E2A84B] shrink-0" />
                <span>Complimentary Valet</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-[11px] text-[#FAF5EC]/85">
                <Utensils className="w-3.5 h-3.5 text-[#E2A84B] shrink-0" />
                <span>Wood-Fired Hearth</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-[11px] text-[#FAF5EC]/85">
                <Wine className="w-3.5 h-3.5 text-[#E2A84B] shrink-0" />
                <span>Sommelier Wine Cellar</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-[11px] text-[#FAF5EC]/85">
                <ShieldCheck className="w-3.5 h-3.5 text-[#22C58B] shrink-0" />
                <span>Private Dining Suites</span>
              </div>
            </div>
          </div>

          {/* Action Row: Call Concierge, Directions & Table Reservation */}
          <div className="grid grid-cols-2 gap-3 pt-6 mt-6 border-t border-white/[0.08] relative z-10">
            <a
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-[6px] text-xs font-bold text-[#FAF5EC] transition-all duration-300 hover:text-[#0D0A08] hover:bg-[#E2A84B] active:scale-95 group shadow-md"
              style={{
                border: '1px solid rgba(226, 168, 75, 0.4)',
                background: 'rgba(226, 168, 75, 0.08)',
              }}
            >
              <Phone className="w-3.5 h-3.5 text-[#E2A84B] group-hover:text-[#0D0A08] transition-colors" />
              <span>Call Concierge</span>
            </a>

            <Link
              href="/booking"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-[6px] text-xs font-bold text-[#0D0A08] transition-all duration-300 hover:brightness-110 active:scale-95 shadow-lg group"
              style={{
                background: 'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)',
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0D0A08]" />
              <span>Reserve Table</span>
            </Link>
          </div>
        </div>

        {/* Right 7 Columns: Bengaluru Dark Map Container with Native Pinned Map */}
        <div
          className="lg:col-span-7 relative min-h-[480px] lg:min-h-[540px] rounded-2xl overflow-hidden border shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex flex-col justify-between group"
          style={{
            background: '#0D0A08',
            borderColor: 'rgba(226, 168, 75, 0.25)',
          }}
        >
          {/* Top Architectural Header Bar Pinned Over Map (Stationary, Non-Drifting) */}
          <div className="relative z-30 p-4 sm:p-5 flex items-center justify-between gap-3 pointer-events-none">
            {/* Pinned Radar Status Capsule */}
            <div
              className="px-3.5 py-1.5 rounded-full shadow-2xl flex items-center gap-2 border pointer-events-auto"
              style={{
                background: 'rgba(13, 10, 8, 0.90)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderColor: 'rgba(226, 168, 75, 0.4)',
              }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E2A84B] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E2A84B]" />
              </span>
              <MapPin className="w-3.5 h-3.5 text-[#E2A84B]" />
              <span className="font-serif text-xs font-bold text-[#FAF5EC] tracking-wide">
                Bengaluru · Indiranagar 100ft Rd Flagship
              </span>
            </div>

            {/* Map Style & Recenter Action Cluster */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                type="button"
                onClick={handleRecenterMap}
                title="Recenter Map on The Golden Oak Flagship"
                className="p-1.5 rounded-md text-[#FAF5EC] hover:text-[#E2A84B] border border-white/20 transition-all shadow-md active:scale-95"
                style={{
                  background: 'rgba(13, 10, 8, 0.88)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() =>
                  setMapViewMode(
                    mapViewMode === 'dark' ? 'standard' : mapViewMode === 'standard' ? 'satellite' : 'dark'
                  )
                }
                className="px-3 py-1.5 rounded-md text-[11px] font-semibold text-[#FAF5EC] hover:text-[#E2A84B] border border-white/20 transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                style={{
                  background: 'rgba(13, 10, 8, 0.88)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <span>
                  {mapViewMode === 'dark'
                    ? 'Dark Luxury'
                    : mapViewMode === 'standard'
                    ? 'Street View'
                    : 'Satellite'}
                </span>
              </button>
            </div>
          </div>

          {/* Interactive Native Google Map (Pin is Rendered Inside Map, Anchored to Real Geo-Coordinates) */}
          <div className="absolute inset-0 z-10 w-full h-full overflow-hidden">
            <iframe
              key={mapReloadKey}
              title="The Golden Oak Bengaluru Indiranagar Google Map"
              src={getMapIframeSrc()}
              className="w-full h-full border-0 transition-all duration-500"
              style={{
                filter:
                  mapViewMode === 'dark'
                    ? 'invert(92%) hue-rotate(185deg) brightness(88%) contrast(90%)'
                    : 'none',
              }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            {/* Subtle atmospheric gold vignette around the map edges */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(13,10,8,0.7)]" />
          </div>

          {/* Bottom Interactive Navigation & START Button Card (Stationary Control Center) */}
          <div
            className="relative z-30 p-4 sm:p-5 m-3 sm:m-4 rounded-xl border shadow-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
            style={{
              background: 'rgba(13, 10, 8, 0.94)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderColor: 'rgba(226, 168, 75, 0.35)',
            }}
          >
            {/* Left: Distance & Animated Radar Compass */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-[#E2A84B]/15 border border-[#E2A84B]/35 flex items-center justify-center shrink-0 shadow-inner">
                <Compass className="w-5 h-5 text-[#E2A84B] animate-[spin_10s_linear_infinite]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-[#E2A84B] font-bold">
                    LIVE GPS ROUTE &amp; DISTANCE
                  </span>
                  <button
                    type="button"
                    onClick={handleCalculateDistance}
                    title="Refresh GPS Distance"
                    className="text-[#B5ADA2] hover:text-[#FAF5EC] transition-colors"
                  >
                    <LocateFixed className="w-3 h-3 hover:rotate-45 transition-transform" />
                  </button>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-[#FAF5EC] truncate mt-0.5">
                  {isLocating
                    ? 'Calculating live distance...'
                    : userDistance || 'Indiranagar 100ft Rd · Flagship Sanctuary'}
                </p>
              </div>
            </div>

            {/* Right: Direct Google Map View & START NAVIGATION Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              <a
                href={viewMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2.5 rounded-[6px] border border-white/20 text-[#FAF5EC] hover:text-[#E2A84B] hover:border-[#E2A84B]/40 text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <span>Full Map</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>

              {/* High-Impact Molten Gold Navigation Button */}
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-[6px] text-xs font-extrabold text-[#0D0A08] transition-all duration-300 hover:brightness-110 active:scale-95 shadow-[0_4px_20px_rgba(226,168,75,0.4)] flex items-center gap-2 group"
                style={{
                  background: 'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)',
                }}
              >
                <Navigation className="w-3.5 h-3.5 fill-[#0D0A08] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                <span>START NAVIGATION</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
