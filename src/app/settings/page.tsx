'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Bell, Trash2, LogOut, Heart, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFavoritesStore } from '@/store/favorites-store';
import { useCartStore } from '@/store/cart-store';
import { useAuthStore } from '@/store/user-store';
import { toast } from '@/store/toast-store';

export default function SettingsPage() {
  const router = useRouter();
  const clearFavorites = useFavoritesStore((s) => s.clearFavorites);
  const clearCart = useCartStore((s) => s.clearCart);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [notifications, setNotifications] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'favorites' | 'cart' | 'signout' | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const pref = localStorage.getItem('golden_oak_notifications');
    if (pref !== null) {
      setNotifications(pref === 'true');
    }
  }, []);

  const handleNotificationToggle = () => {
    const newVal = !notifications;
    setNotifications(newVal);
    localStorage.setItem('golden_oak_notifications', String(newVal));
    toast.info('Preferences Saved', newVal ? 'Order & reservation updates enabled.' : 'Notifications muted.');
  };

  const handleClearFavorites = () => {
    if (confirmAction !== 'favorites') {
      setConfirmAction('favorites');
      return;
    }
    clearFavorites();
    setConfirmAction(null);
    toast.success('Favorites Cleared', 'All saved dishes removed from your vault.');
  };

  const handleClearCart = () => {
    if (confirmAction !== 'cart') {
      setConfirmAction('cart');
      return;
    }
    clearCart();
    setConfirmAction(null);
    toast.success('Cart Cleared', 'Your cart is now empty.');
  };

  const handleSignOut = async () => {
    if (confirmAction !== 'signout') {
      setConfirmAction('signout');
      return;
    }
    setSigningOut(true);
    clearAuth();
    try {
      const { createClient } = await import('@/lib/supabase/client');
      await createClient().auth.signOut();
    } catch {
      // Ignore Supabase client cleanup errors
    }
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch {
      // Fallback still navigates cleanly
    }
    toast.info('Signed Out', 'You have been signed out of The Golden Oak.');
    router.push('/auth/login?switch=1');
    router.refresh();
  };

  if (!isClient) {
    return (
      <div className="min-h-[calc(100vh-84px)] bg-obsidian flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-76px)] sm:min-h-[calc(100vh-84px)] bg-obsidian text-text-primary flex flex-col pb-24 md:pb-12">
      <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 pt-4 pb-4 flex items-center gap-3 border-b border-white/5">
        <Link
          href="/profile"
          aria-label="Back to Profile"
          className="w-10 h-10 flex items-center justify-center -ml-2 text-text-primary/70 hover:text-text-primary active:scale-95 transition-transform rounded-full hover:bg-white/5"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="font-heading text-lg sm:text-xl font-bold">Settings</h1>
      </div>

      <div className="flex-1 px-4 sm:px-6 py-6 sm:py-8 max-w-2xl mx-auto w-full space-y-6 sm:space-y-8">
        <section>
          <h2 className="text-xs font-semibold text-text-primary/40 uppercase tracking-widest mb-3 sm:mb-4">Preferences</h2>

          <div className="bg-[#14110e]/90 border border-white/10 backdrop-blur-md shadow-xl rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between gap-4 p-4 sm:p-5">
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0 border border-white/5">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-text-primary">Push Notifications</p>
                  <p className="text-xs text-text-primary/50">Order updates &amp; offers</p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={notifications}
                aria-label="Toggle Push Notifications"
                onClick={handleNotificationToggle}
                className={`w-12 h-6 rounded-full p-1 transition-colors shrink-0 cursor-pointer ${notifications ? 'bg-primary' : 'bg-white/15'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-obsidian transition-transform ${notifications ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-text-primary/40 uppercase tracking-widest mb-3 sm:mb-4">Data Management</h2>

          <div className="bg-[#14110e]/90 border border-white/10 backdrop-blur-md shadow-xl rounded-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-white/5">
              <button
                type="button"
                onClick={handleClearFavorites}
                className="flex-1 flex items-center gap-3.5 sm:gap-4 text-left hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0 border border-white/5">
                  <Heart className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">
                    {confirmAction === 'favorites' ? 'Tap again to confirm clearing favorites' : 'Clear Favorites'}
                  </p>
                  <p className="text-xs text-text-primary/50">Remove all saved dishes</p>
                </div>
              </button>
              {confirmAction === 'favorites' && (
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-text-primary/70 hover:text-text-primary shrink-0"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 p-4 sm:p-5">
              <button
                type="button"
                onClick={handleClearCart}
                className="flex-1 flex items-center gap-3.5 sm:gap-4 text-left hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0 border border-white/5">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">
                    {confirmAction === 'cart' ? 'Tap again to confirm clearing cart' : 'Clear Cart'}
                  </p>
                  <p className="text-xs text-text-primary/50">Remove all items from cart</p>
                </div>
              </button>
              {confirmAction === 'cart' && (
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-text-primary/70 hover:text-text-primary shrink-0"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-text-primary/40 uppercase tracking-widest mb-3 sm:mb-4">Account</h2>

          <div className="bg-[#14110e]/90 border border-white/10 backdrop-blur-md shadow-xl rounded-2xl overflow-hidden flex items-center justify-between gap-3 p-4 sm:p-5">
            <button
              type="button"
              disabled={signingOut}
              onClick={handleSignOut}
              className="flex-1 flex items-center gap-3.5 sm:gap-4 text-left hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
            >
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                {signingOut ? (
                  <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                ) : (
                  <LogOut className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div>
                <p className="font-medium text-red-400">
                  {signingOut
                    ? 'Signing out...'
                    : confirmAction === 'signout'
                    ? 'Tap again to confirm Sign Out'
                    : 'Sign Out'}
                </p>
                <p className="text-xs text-text-primary/50">Log out of your account</p>
              </div>
            </button>
            {confirmAction === 'signout' && !signingOut && (
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-text-primary/70 hover:text-text-primary shrink-0"
              >
                Cancel
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
