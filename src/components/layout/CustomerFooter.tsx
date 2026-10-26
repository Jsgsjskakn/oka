'use client';

import Link from 'next/link';
import { UtensilsCrossed, Calendar, MapPin, Phone, Mail, Clock, ShieldCheck, Sparkles } from 'lucide-react';

export function CustomerFooter() {
  return (
    // Monumental Luxury Footer
    <footer
      className="relative mt-20 text-[#FAF5EC]/80 overflow-hidden border-t select-none"
      style={{
        background: '#080605',
        borderTopColor: 'rgba(226, 168, 75, 0.2)',
      }}
    >
      {/* Giant Serif Watermark: THE GOLDEN OAK in 3% Opacity (rgba(226, 168, 75, 0.03)) */}
      <div
        className="pointer-events-none absolute -bottom-8 left-0 right-0 w-full overflow-hidden flex justify-center items-center z-0"
        aria-hidden="true"
      >
        <span
          className="font-serif font-black tracking-[0.2em] whitespace-nowrap text-center uppercase"
          style={{
            fontSize: 'clamp(5rem, 15vw, 13rem)',
            color: 'rgba(226, 168, 75, 0.03)',
            lineHeight: 0.8,
          }}
        >
          THE GOLDEN OAK
        </span>
      </div>

      {/* Subtle Ambient Radial Lighting */}
      <div
        className="pointer-events-none absolute top-0 left-1/4 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl z-0"
        style={{ background: 'rgba(226, 168, 75, 0.04)' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-28 md:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-16 border-b border-white/[0.08]">
          {/* Column 1: Brand & Philosophy */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <UtensilsCrossed className="w-5 h-5 text-[#E2A84B] group-hover:scale-105 transition-transform" />
              <div>
                <span className="font-serif text-xl font-bold tracking-tight text-[#FAF5EC] block">
                  The Golden Oak
                </span>
                {/* Subtitle strictly matches Header: ARTISANAL DINING */}
                <span className="text-[9px] tracking-[0.28em] uppercase text-[#9A9286] font-medium block">
                  ARTISANAL DINING
                </span>
              </div>
            </Link>

            <p className="text-xs text-[#B5ADA2] leading-relaxed font-light">
              Experience the pinnacle of culinary artistry where time-honored Indian traditions meet modern fusion techniques, wood-fired hearths, and interactive 3D gastronomy.
            </p>

            {/* Muted Gold Accent Tag (No neon green) */}
            <div className="flex items-center gap-2 pt-2 text-xs text-[#E2A84B] font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[#E2A84B]" />
              <span>Interactive 3D &amp; AR Dish Previews</span>
            </div>
          </div>

          {/* Column 2: EXPLORE (All 5 links perfectly aligned, heart icon removed) */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.22em] text-[#E2A84B]">
              EXPLORE
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  href="/menu"
                  className="text-[#FAF5EC]/75 hover:text-[#E2A84B] transition-colors block"
                >
                  Culinary Menu
                </Link>
              </li>
              <li>
                <Link
                  href="/booking"
                  className="text-[#FAF5EC]/75 hover:text-[#E2A84B] transition-colors block"
                >
                  Reserve a Table
                </Link>
              </li>
              <li>
                {/* Heart icon removed so all 5 links are in a straight aligned column */}
                <Link
                  href="/favorites"
                  className="text-[#FAF5EC]/75 hover:text-[#E2A84B] transition-colors block"
                >
                  My Favorites
                </Link>
              </li>
              <li>
                <Link
                  href="/ar"
                  className="text-[#FAF5EC]/75 hover:text-[#E2A84B] transition-colors block"
                >
                  3D / AR Food Lounge
                </Link>
              </li>
              <li>
                <Link
                  href="/profile/orders"
                  className="text-[#FAF5EC]/75 hover:text-[#E2A84B] transition-colors block"
                >
                  Track Live Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Hours & Dining Services */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.22em] text-[#E2A84B]">
              HOURS &amp; HOSPITALITY
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <Clock className="w-3.5 h-3.5 text-[#E2A84B] mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-[#FAF5EC]">Daily Dining Hours</p>
                  <p className="text-[#9A9286] text-[11px] mt-0.5">12:00 PM – 11:30 PM (IST)</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Calendar className="w-3.5 h-3.5 text-[#E2A84B] mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-[#FAF5EC]">Table Reservations</p>
                  <p className="text-[#9A9286] text-[11px] mt-0.5">Instant live seat allocation</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#E2A84B] mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-[#FAF5EC]">Dietary Integrity</p>
                  <p className="text-[#9A9286] text-[11px] mt-0.5">Dedicated Veg &amp; Non-Veg preparations</p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 4: Contact & Location */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.22em] text-[#E2A84B]">
              VISIT US
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5 text-[#FAF5EC]/75">
                <MapPin className="w-3.5 h-3.5 text-[#E2A84B] mt-0.5 shrink-0" />
                <span>45 Golden Oak Boulevard, Indiranagar, Bengaluru, 560038</span>
              </div>
              <div className="flex items-center gap-2.5 text-[#FAF5EC]/75">
                <Phone className="w-3.5 h-3.5 text-[#E2A84B] shrink-0" />
                <a href="tel:+919990774565" className="hover:text-[#E2A84B] transition-colors">
                  +91 99907 74565
                </a>
              </div>
              <div className="flex items-center gap-2.5 text-[#FAF5EC]/75">
                <Mail className="w-3.5 h-3.5 text-[#E2A84B] shrink-0" />
                <a href="mailto:contact@thegoldenoak.in" className="hover:text-[#E2A84B] transition-colors">
                  contact@thegoldenoak.in
                </a>
              </div>
              <div className="pt-2">
                <Link
                  href="/booking"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 text-xs font-bold text-[#0D0A08] transition-all duration-300 hover:brightness-110 shadow-sm"
                  style={{
                    background: 'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)',
                    borderRadius: '6px',
                  }}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book Your Experience</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Staff Gateway */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9A9286]">
          <p>© {new Date().getFullYear()} The Golden Oak. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-[#FAF5EC] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[#FAF5EC] transition-colors">
              Terms of Service
            </Link>
            <span className="text-white/20">|</span>
            <Link
              href="/employee/login"
              className="hover:text-[#E2A84B] transition-colors flex items-center gap-1 font-semibold text-[#E2A84B]/90"
            >
              <span>Staff Portal</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
