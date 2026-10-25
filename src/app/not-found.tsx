import Link from 'next/link';
import { Compass, UtensilsCrossed, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center bg-obsidian text-text-primary">
      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500/20 to-amber-500/5 border border-amber-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(201,168,76,0.2)]">
        <Compass className="w-10 h-10 text-amber-500 animate-pulse" />
      </div>

      <span className="text-xs font-semibold tracking-widest uppercase text-amber-500 mb-2">
        Error 404
      </span>
      <h1 className="font-heading text-3xl font-bold mb-3 text-platinum">Dish or Page Not Found</h1>
      <p className="text-sm text-text-secondary max-w-sm mb-8 leading-relaxed">
        The table or dish you are looking for does not exist or may have been moved. Allow us to guide you back to our menu.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Link
          href="/menu"
          className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold text-sm hover:from-amber-600 hover:to-amber-700 active:scale-95 transition-all shadow-[0_0_20px_rgba(201,168,76,0.3)]"
        >
          <UtensilsCrossed className="w-4 h-4" />
          Return to Menu
        </Link>
        <Link
          href="/"
          className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-zinc-900 border border-border-subtle text-text-primary font-medium text-sm hover:bg-zinc-800 active:scale-95 transition-all"
        >
          Home
          <ArrowRight className="w-4 h-4 text-text-secondary" />
        </Link>
      </div>
    </div>
  );
}
