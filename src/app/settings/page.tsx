'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Bell, Trash2, LogOut, Heart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFavoritesStore } from '@/store/favorites-store';
import { useCartStore } from '@/store/cart-store';

export default function SettingsPage() {
  const router = useRouter();
  const clearFavorites = useFavoritesStore((s) => s.clearFavorites);
  const clearCart = useCartStore((s) => s.clearCart);
  
  const [notifications, setNotifications] = useState(true);
  const [isClient, setIsClient] = useState(false);

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
  };

  const handleClearFavorites = () => {
    if (confirm('Are you sure you want to clear all your favorite dishes?')) {
      clearFavorites();
      alert('Favorites cleared.');
    }
  };

  const handleClearCart = () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      clearCart();
      alert('Cart cleared.');
    }
  };

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      // Create a form programmatically to post to signout
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/api/auth/signout';
      document.body.appendChild(form);
      form.submit();
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian text-text-primary flex flex-col">
      <header className="px-4 py-5 flex items-center gap-3 border-b border-white/5 sticky top-0 bg-obsidian/90 backdrop-blur-md z-40">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center -ml-2 text-text-primary/70 hover:text-text-primary active:scale-95 transition-transform">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="font-heading text-lg font-bold">Settings</h1>
      </header>

      <main className="flex-1 px-4 py-8 max-w-md mx-auto w-full space-y-8">
        
        <section>
          <h2 className="text-xs font-semibold text-text-primary/40 uppercase tracking-widest mb-4">Preferences</h2>
          
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">Push Notifications</p>
                  <p className="text-xs text-text-primary/40">Order updates & offers</p>
                </div>
              </div>
              
              <button 
                onClick={handleNotificationToggle}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${notifications ? 'bg-primary' : 'bg-white/10'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-obsidian transition-transform ${notifications ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-text-primary/40 uppercase tracking-widest mb-4">Data Management</h2>
          
          <div className="glass-card rounded-2xl overflow-hidden flex flex-col">
            <button 
              onClick={handleClearFavorites}
              className="flex items-center gap-4 p-4 text-left hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/5"
            >
              <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="font-medium text-text-primary">Clear Favorites</p>
                <p className="text-xs text-text-primary/40">Remove all saved dishes</p>
              </div>
            </button>
            
            <button 
              onClick={handleClearCart}
              className="flex items-center gap-4 p-4 text-left hover:bg-white/5 active:bg-white/10 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="font-medium text-text-primary">Clear Cart</p>
                <p className="text-xs text-text-primary/40">Remove all items from cart</p>
              </div>
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-text-primary/40 uppercase tracking-widest mb-4">Account</h2>
          
          <div className="glass-card rounded-2xl overflow-hidden">
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/5 active:bg-white/10 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-medium text-red-400">Sign Out</p>
                <p className="text-xs text-text-primary/40">Log out of your account</p>
              </div>
            </button>
          </div>
        </section>

      </main>
    </div>
  );
}
