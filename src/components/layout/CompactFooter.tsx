'use client';

import Link from 'next/link';
import { RESTAURANT_CONFIG } from '@/lib/config';

export function CompactFooter() {
  return (
    <footer className="px-4 py-8 border-t border-white/5 bg-[#0a0a0a]">
      <div className="max-w-md mx-auto flex flex-col items-center justify-center text-center">
        <h3 className="font-heading text-lg font-semibold gold-gradient mb-1">
          {RESTAURANT_CONFIG.name}
        </h3>
        
        <div className="flex items-center gap-4 text-xs text-text-primary/50 mb-6 mt-4">
          <Link href="/privacy" className="hover:text-text-primary transition-colors">Privacy</Link>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <Link href="/terms" className="hover:text-text-primary transition-colors">Terms</Link>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <Link href="/contact" className="hover:text-text-primary transition-colors">Contact</Link>
        </div>
        
        <p className="text-[10px] text-text-primary/30">
          © {new Date().getFullYear()} {RESTAURANT_CONFIG.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
