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
  Plus,
  Minus,
  Lock,
  Unlock,
  Hand,
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
  const [zoomLevel, setZoomLevel] = useState(16);
  const [isMapInteractive, setIsMapInteractive] = useState(false);
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
    setZoomLevel(16);
    setMapReloadKey((prev) => prev + 1);
  };

  // Google Maps embed URL with fixed coordinates pinned to 100 Feet Road, Indiranagar
  const getMapIframeSrc = () => {
    if (mapViewMode === 'satellite') {
      return `https://maps.google.com/maps?q=12.971598,77.641617&t=k&z=${zoomLevel}&ie=UTF8&iwloc=&output=embed`;
    }
    return `https://maps.google.com/maps?q=100+Feet+Road,+Indiranagar,+Bengaluru&t=m&z=${zoomLevel}&ie=UTF8&iwloc=&output=embed`;
  };

  return (
    <section className="relative py-14 sm:py-16 px-4 sm:px-8 lg:px-10 max-w-[1180px] mx-auto w-full overflow-hidden select-none">
      {/* Background Subtle Warm Ambient Glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/4 -translate-y-1/2 w-[460px] h-[360px] bg-[#D4AF37]/06 rounded-full blur-3xl -z-10" />

      {/* Main 12-Column Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7 items-stretch w-full">
        {/* Left 5 Columns: Hospitality Dossier & Concierge Card */}
        <div
          className="lg:col-span-5 p-6 sm:p-7 lg:p-8 rounded-2xl flex flex-col justify-between shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(243,229,171,0.22),inset_0_0_24px_rgba(212,175,55,0.03)] border transition-all duration-300 hover:border-[#D4AF37]/45 relative overflow-hidden group"
          style={{
            background: 'linear-gradient(160deg, rgba(22, 17, 13, 0.96) 0%, rgba(14, 11, 9, 0.98) 55%, rgba(9, 7, 5, 1) 100%)',
            borderColor: 'rgba(212, 175, 55, 0.28)',
          }}
        >
          {/* Subtle Corner Sheen Accent & Gold Filigree Aura */}
          <div className="pointer-events-none absolute -top-20 -right-20 w-44 h-44 bg-[radial-gradient(circle,rgba(212,175,55,0.16)_0%,transparent_70%)] rounded-full blur-xl group-hover:opacity-100 transition-opacity duration-700" />
          <div className="pointer-events-none absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#F3E5AB]/30 to-transparent" />

          <div className="space-y-5 relative z-10">
            {/* Header: Overline + Star Rating */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.85)] animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.26em] text-[#D4AF37] font-semibold">
                  FLAGSHIP SANCTUARY · BENGALURU
                </span>
              </div>

              <h2 className="font-serif text-2xl sm:text-[28px] lg:text-[29px] font-bold text-[#FAF5EC] tracking-tight leading-snug">
                The Golden Oak — Indiranagar Flagship
              </h2>

              <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-gradient-to-r from-[#D4AF37]/15 to-[#9E6818]/10 border border-[#D4AF37]/35 text-xs font-semibold text-[#F3E5AB] shadow-sm">
                <Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />
                <span className="font-bold">4.8</span>
                <span className="text-[#B5ADA2] font-normal">· 1,240+ Verified Diners</span>
              </div>
            </div>

            {/* Address */}
            <div className="pt-3 border-t border-white/[0.07] space-y-1">
              <span className="text-[9.5px] uppercase tracking-wider text-[#9A9286] font-semibold block">
                ADDRESS &amp; VALET ENTRANCE
              </span>
              <p className="text-xs sm:text-[13px] text-[#FAF5EC]/95 font-light leading-relaxed">
                {address}
              </p>
            </div>

            {/* Live Hours, Bengaluru Clock & Active Kitchen Status */}
            <div className="pt-3 border-t border-white/[0.07] space-y-2">
              <div className="flex items-center justify-between text-[9.5px] uppercase tracking-wider text-[#9A9286] font-semibold">
                <span>OPERATING HOURS</span>
                <span className="text-[#D4AF37] flex items-center gap-1 font-mono text-[10.5px]">
                  <Clock className="w-3 h-3 text-[#D4AF37]" />
                  {bengaluruTime || 'IST (Bengaluru)'}
                </span>
              </div>

              <p className="text-xs sm:text-[13px] text-[#FAF5EC]/90 font-light">
                12:00 PM – 11:30 PM (Monday – Sunday)
              </p>

              {isOpenNow ? (
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#22C58B]/12 border border-[#22C58B]/35 text-[11px] font-bold text-[#22C58B] shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C58B] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C58B]" />
                  </span>
                  <span>OPEN NOW · Dining &amp; Bar Active · Closes at 11:30 PM</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#D4AF37]/12 border border-[#D4AF37]/35 text-[11px] font-bold text-[#D4AF37]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                  <span>OPENS AT 12:00 PM · Online Bookings Open</span>
                </div>
              )}
            </div>

            {/* Curated Michelin-Tier Amenities Highlights */}
            <div className="pt-3 border-t border-white/[0.07] grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.025] border border-[#D4AF37]/15 hover:border-[#D4AF37]/35 hover:bg-[#D4AF37]/[0.04] transition-all text-[11px] text-[#FAF5EC]/90">
                <Car className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                <span>Complimentary Valet</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.025] border border-[#D4AF37]/15 hover:border-[#D4AF37]/35 hover:bg-[#D4AF37]/[0.04] transition-all text-[11px] text-[#FAF5EC]/90">
                <Utensils className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                <span>Wood-Fired Hearth</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.025] border border-[#D4AF37]/15 hover:border-[#D4AF37]/35 hover:bg-[#D4AF37]/[0.04] transition-all text-[11px] text-[#FAF5EC]/90">
                <Wine className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                <span>Sommelier Wine Cellar</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.025] border border-[#D4AF37]/15 hover:border-[#D4AF37]/35 hover:bg-[#D4AF37]/[0.04] transition-all text-[11px] text-[#FAF5EC]/90">
                <ShieldCheck className="w-3.5 h-3.5 text-[#22C58B] shrink-0" />
                <span>Private Dining Suites</span>
              </div>
            </div>
          </div>

          {/* Action Row: Call Concierge, Directions & Table Reservation */}
          <div className="grid grid-cols-2 gap-2.5 pt-5 mt-5 border-t border-white/[0.07] relative z-10">
            <a
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className="flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-lg text-xs font-semibold text-[#FAF5EC] transition-all duration-300 hover:text-[#0D0A08] hover:bg-[#D4AF37] active:scale-95 group shadow-md"
              style={{
                border: '1px solid rgba(212, 175, 55, 0.35)',
                background: 'rgba(212, 175, 55, 0.08)',
              }}
            >
              <Phone className="w-3.5 h-3.5 text-[#D4AF37] group-hover:text-[#0D0A08] transition-colors" />
              <span>Call Concierge</span>
            </a>

            <Link
              href="/booking"
              className="flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-lg text-xs font-bold text-[#0D0A08] transition-all duration-300 hover:brightness-110 active:scale-95 shadow-[0_6px_20px_rgba(212,175,55,0.3)] group"
              style={{
                background: 'linear-gradient(135deg, #F3E5AB 0%, #D4AF37 50%, #AA771C 100%)',
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0D0A08]" />
              <span>Reserve Table</span>
            </Link>
          </div>
        </div>

        {/* Right 7 Columns: Bengaluru Dark Map Container with Native Pinned Map */}
        <div
          className="lg:col-span-7 relative min-h-[440px] lg:min-h-[490px] rounded-2xl overflow-hidden border shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(243,229,171,0.18)] flex flex-col justify-between group"
          style={{
            background: '#0D0A08',
            borderColor: 'rgba(212, 175, 55, 0.28)',
          }}
          onMouseLeave={() => setIsMapInteractive(false)}
        >
          {/* Top Architectural Header Bar Pinned Over Map (Stationary, Non-Drifting) */}
          <div className="relative z-30 p-3.5 sm:p-4 flex items-center justify-between gap-2.5 pointer-events-none">
            {/* Pinned Radar Status Capsule */}
            <div
              className="px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-2 border pointer-events-auto"
              style={{
                background: 'rgba(14, 11, 9, 0.94)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderColor: 'rgba(212, 175, 55, 0.38)',
              }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]" />
              </span>
              <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="font-serif text-[11.5px] font-bold text-[#FAF5EC] tracking-wide">
                Bengaluru · Indiranagar 100ft Rd Flagship
              </span>
            </div>

            {/* Map Style & Recenter Action Cluster */}
            <div className="flex items-center gap-1.5 pointer-events-auto">
              {/* Zoom Out Button */}
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(12, z - 1))}
                title="Zoom Out Map"
                className="p-1.5 rounded-md text-[#FAF5EC] hover:text-[#D4AF37] border border-white/20 transition-all shadow-md active:scale-95"
                style={{
                  background: 'rgba(14, 11, 9, 0.90)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Minus className="w-3 h-3" />
              </button>

              {/* Zoom In Button */}
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(19, z + 1))}
                title="Zoom In Map"
                className="p-1.5 rounded-md text-[#FAF5EC] hover:text-[#D4AF37] border border-white/20 transition-all shadow-md active:scale-95"
                style={{
                  background: 'rgba(14, 11, 9, 0.90)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Plus className="w-3 h-3" />
              </button>

              {/* Recenter Button */}
              <button
                type="button"
                onClick={handleRecenterMap}
                title="Recenter Map on The Golden Oak Flagship"
                className="p-1.5 rounded-md text-[#FAF5EC] hover:text-[#D4AF37] border border-white/20 transition-all shadow-md active:scale-95"
                style={{
                  background: 'rgba(14, 11, 9, 0.90)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <RotateCcw className="w-3 h-3" />
              </button>

              {/* Map View Mode Toggle */}
              <button
                type="button"
                onClick={() =>
                  setMapViewMode(
                    mapViewMode === 'dark' ? 'standard' : mapViewMode === 'standard' ? 'satellite' : 'dark'
                  )
                }
                className="px-2.5 py-1.5 rounded-md text-[10.5px] font-semibold text-[#FAF5EC] hover:text-[#D4AF37] border border-white/20 transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                style={{
                  background: 'rgba(14, 11, 9, 0.90)',
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

              {/* Pan / Drag Mode Indicator Toggle */}
              <button
                type="button"
                onClick={() => setIsMapInteractive((prev) => !prev)}
                title={isMapInteractive ? 'Lock map to resume smooth page scroll' : 'Unlock map to drag/pan'}
                className="px-2.5 py-1.5 rounded-md text-[10.5px] font-semibold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                style={{
                  background: isMapInteractive ? 'rgba(212, 175, 55, 0.22)' : 'rgba(14, 11, 9, 0.90)',
                  color: isMapInteractive ? '#F3E5AB' : '#FAF5EC',
                  border: isMapInteractive ? '1px solid rgba(212, 175, 55, 0.55)' : '1px solid rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {isMapInteractive ? (
                  <>
                    <Unlock className="w-3 h-3 text-[#D4AF37]" />
                    <span className="hidden sm:inline">Drag Active</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3 opacity-70" />
                    <span className="hidden sm:inline">Scroll Safe</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Interactive Native Google Map Container */}
          <div className="absolute inset-0 z-10 w-full h-full overflow-hidden">
            <iframe
              key={`${mapReloadKey}-${zoomLevel}-${mapViewMode}`}
              title="The Golden Oak Bengaluru Indiranagar Google Map"
              src={getMapIframeSrc()}
              className={`absolute -top-[52px] -left-[12px] w-[calc(100%+24px)] h-[calc(100%+70px)] border-0 transition-all duration-500 ${
                isMapInteractive ? 'pointer-events-auto' : 'pointer-events-none'
              }`}
              style={{
                filter:
                  mapViewMode === 'dark'
                    ? 'invert(92%) hue-rotate(185deg) brightness(88%) contrast(90%)'
                    : 'none',
              }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            {/* Custom Luxury Restaurant Beacon (Stationary Gold Pin Over 100ft Rd Coordinates) */}
            <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 flex flex-col items-center">
              <div className="relative flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-9 w-9 rounded-full bg-[#D4AF37] opacity-40" />
                <span className="animate-pulse absolute inline-flex h-6 w-6 rounded-full bg-[#D4AF37]/30" />
                <div className="relative w-4 h-4 rounded-full bg-gradient-to-br from-[#F3E5AB] via-[#D4AF37] to-[#8C5D14] shadow-[0_0_20px_rgba(212,175,55,0.95)] border-2 border-[#0D0A08] flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0D0A08]" />
                </div>
              </div>
              <div
                className="mt-1.5 px-2.5 py-1 rounded-md shadow-2xl flex items-center gap-1.5 border"
                style={{
                  background: 'rgba(14, 11, 9, 0.94)',
                  backdropFilter: 'blur(10px)',
                  borderColor: 'rgba(212, 175, 55, 0.45)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                <span className="font-serif text-[10.5px] font-bold text-[#FAF5EC] tracking-wider uppercase whitespace-nowrap">
                  The Golden Oak Flagship
                </span>
              </div>
            </div>

            {/* Interactive Mode Prompt Pill (Shown when hovering over locked map) */}
            {!isMapInteractive && (
              <div
                onClick={() => setIsMapInteractive(true)}
                className="absolute inset-0 z-20 cursor-pointer flex items-center justify-center group/overlay bg-transparent"
              >
                <div className="opacity-0 group-hover/overlay:opacity-100 transition-opacity duration-300 px-4 py-2 rounded-full bg-[#0D0A08]/92 border border-[#D4AF37]/50 shadow-[0_4px_24px_rgba(0,0,0,0.8)] backdrop-blur-md flex items-center gap-2 text-xs font-semibold text-[#FAF5EC]">
                  <Hand className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Click to Drag &amp; Pan Map</span>
                </div>
              </div>
            )}

            {/* Subtle atmospheric gold vignette around the map edges */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(13,10,8,0.7)]" />
          </div>

          {/* Bottom Interactive Navigation & START Button Card (Stationary Control Center) */}
          <div
            className="relative z-30 p-3.5 sm:p-4 m-2.5 sm:m-3 rounded-xl border shadow-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5"
            style={{
              background: 'rgba(14, 11, 9, 0.95)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              borderColor: 'rgba(212, 175, 55, 0.35)',
            }}
          >
            {/* Left: Distance & Animated Radar Compass */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/35 flex items-center justify-center shrink-0 shadow-inner">
                <Compass className="w-4.5 h-4.5 text-[#D4AF37] animate-[spin_10s_linear_infinite]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[9.5px] uppercase tracking-wider text-[#D4AF37] font-bold">
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
                <p className="text-xs sm:text-[13px] font-semibold text-[#FAF5EC] truncate mt-0.5">
                  {isLocating
                    ? 'Calculating live distance...'
                    : userDistance || 'Indiranagar 100ft Rd · Flagship Sanctuary'}
                </p>
              </div>
            </div>

            {/* Right: Direct Google Map View & START NAVIGATION Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={viewMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg border border-white/20 text-[#FAF5EC] hover:text-[#D4AF37] hover:border-[#D4AF37]/45 text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <span>Full Map</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>

              {/* High-Impact Molten Gold Navigation Button */}
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg text-xs font-extrabold text-[#0D0A08] transition-all duration-300 hover:brightness-110 active:scale-95 shadow-[0_4px_20px_rgba(212,175,55,0.4)] flex items-center gap-1.5 group"
                style={{
                  background: 'linear-gradient(135deg, #F3E5AB 0%, #D4AF37 50%, #AA771C 100%)',
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
