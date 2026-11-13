import Link from 'next/link';
import { User, LogIn, UserPlus, Calendar, ShoppingBag } from 'lucide-react';

export function MockLoginCard() {
  return (
    <div className="min-h-[calc(100vh-76px)] sm:min-h-[calc(100vh-84px)] bg-[#0B0907] flex items-center justify-center px-4 py-8 pb-24 md:pb-12">
      <div className="w-full max-w-md bg-[#121c15] border border-white/10 rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#d4af37]/20 to-[#8a6828]/10 border border-[#d4af37]/30 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#d4af37]/10">
          <User className="w-8 h-8 text-[#d4af37]" />
        </div>

        <h2 className="font-heading text-xl font-bold text-white mb-2">
          Customer Portal
        </h2>
        <p className="text-xs sm:text-sm text-white/60 mb-6 leading-relaxed">
          Sign in to manage your table bookings, track live orders, and view your complete dining history.
        </p>

        <div className="space-y-3">
          <Link
            href="/auth/login?redirectTo=/profile"
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#d4af37] via-[#c5a059] to-[#b38936] text-black py-3.5 rounded-2xl font-bold text-sm shadow-md shadow-[#d4af37]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <LogIn className="w-4 h-4 text-black" />
            <span>Sign In to Account</span>
          </Link>

          <Link
            href="/auth/signup?redirectTo=/profile"
            className="flex items-center justify-center gap-2 w-full bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-white py-3.5 rounded-2xl font-semibold text-sm transition-all"
          >
            <UserPlus className="w-4 h-4 text-[#d4af37]" />
            <span>Create New Account</span>
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-white/[0.08] grid grid-cols-2 gap-3 text-left">
          <Link href="/booking" className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-colors">
            <Calendar className="w-4 h-4 text-[#d4af37] mb-1.5" />
            <p className="text-xs font-semibold text-white">Reservations</p>
            <p className="text-[10px] text-white/40">Guaranteed table holds</p>
          </Link>
          <Link href="/menu" className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-colors">
            <ShoppingBag className="w-4 h-4 text-[#3EE094] mb-1.5" />
            <p className="text-xs font-semibold text-white">Menu &amp; 3D Dining</p>
            <p className="text-[10px] text-white/40">Browse &amp; save dishes</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
