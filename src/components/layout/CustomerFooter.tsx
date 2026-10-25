'use client';

import Link from 'next/link';
import { UtensilsCrossed, Calendar, MapPin, Phone, Mail, Clock, ShieldCheck, Heart, Sparkles } from 'lucide-react';

export function CustomerFooter() {
  return (
    <footer className="relative mt-20 border-t border-white/[0.08] bg-[#050c07] text-white/80 overflow-hidden">
      {/* Subtle Ambient Radial Lighting */}
      <div className="pointer-events-none absolute top-0 left-1/4 -translate-y-1/2 w-96 h-96 rounded-full bg-[#1b3a24]/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-[#d4af37]/08 blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pt-16 pb-28 md:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 pb-14 border-b border-white/[0.07]">
          {/* Column 1: Brand & Philosophy */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-[#d4af37] via-[#c5a059] to-[#8a6828] text-black shadow-md shadow-[#d4af37]/20 group-hover:scale-105 transition-transform">
                <UtensilsCrossed className="w-4 h-4 text-black" />
              </span>
              <div>
                <span className="font-heading text-lg font-bold tracking-tight text-white block">
                  The Golden Oak
                </span>
                <span className="text-[10px] tracking-widest uppercase text-[#d4af37] font-medium block">
                  Gourmet Dining
                </span>
              </div>
            </Link>
            <p className="text-xs text-white/60 leading-relaxed">
              Experience the pinnacle of culinary artistry where time-honored Indian traditions meet modern fusion techniques, wood-fired hearths, and interactive 3D gastronomy.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-[#3EE094]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive 3D &amp; AR Dish Previews</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">
              Explore
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/menu" className="hover:text-[#d4af37] transition-colors flex items-center gap-1.5">
                  <span>Culinary Menu</span>
                </Link>
              </li>
              <li>
                <Link href="/booking" className="hover:text-[#d4af37] transition-colors flex items-center gap-1.5">
                  <span>Reserve a Table</span>
                </Link>
              </li>
              <li>
                <Link href="/favorites" className="hover:text-[#d4af37] transition-colors flex items-center gap-1.5">
                  <Heart className="w-3 h-3 text-rose-400" />
                  <span>My Favorites</span>
                </Link>
              </li>
              <li>
                <Link href="/ar" className="hover:text-[#d4af37] transition-colors flex items-center gap-1.5">
                  <span>3D / AR Food Lounge</span>
                </Link>
              </li>
              <li>
                <Link href="/profile/orders" className="hover:text-[#d4af37] transition-colors flex items-center gap-1.5">
                  <span>Track Live Order</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Hours & Dining Services */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">
              Hours &amp; Hospitality
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-white/50 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-white/90">Daily Dining Hours</p>
                  <p className="text-white/55 text-[11px]">12:00 PM – 11:30 PM (IST)</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="w-3.5 h-3.5 text-white/50 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-white/90">Table Reservations</p>
                  <p className="text-white/55 text-[11px]">Instant live seat allocation</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-white/50 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-white/90">Dietary Integrity</p>
                  <p className="text-white/55 text-[11px]">Separated Veg &amp; Non-Veg kitchens</p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 4: Contact & Location */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">
              Visit Us
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2 text-white/65">
                <MapPin className="w-3.5 h-3.5 text-[#d4af37] mt-0.5 shrink-0" />
                <span>45 Golden Oak Boulevard, Indiranagar, Bengaluru, 560038</span>
              </div>
              <div className="flex items-center gap-2 text-white/65">
                <Phone className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                <a href="tel:+919990774565" className="hover:text-white transition-colors">
                  +91 99907 74565
                </a>
              </div>
              <div className="flex items-center gap-2 text-white/65">
                <Mail className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                <a href="mailto:contact@thegoldenoak.in" className="hover:text-white transition-colors">
                  contact@thegoldenoak.in
                </a>
              </div>
              <div className="pt-2">
                <Link
                  href="/booking"
                  className="inline-flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#d4af37]/20 to-[#c5a059]/10 border border-[#d4af37]/40 hover:border-[#d4af37]/80 text-[11px] font-semibold text-[#d4af37] hover:text-white transition-all shadow-sm"
                >
                  <Calendar className="w-3 h-3" />
                  <span>Book Your Experience</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Staff Gateway */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-white/45">
          <p>© {new Date().getFullYear()} The Golden Oak. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-white/70 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white/70 transition-colors">
              Terms of Service
            </Link>
            <span className="text-white/20">|</span>
            <Link
              href="/employee/login"
              className="hover:text-[#d4af37] transition-colors flex items-center gap-1 font-medium"
            >
              <span>Staff Portal</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
