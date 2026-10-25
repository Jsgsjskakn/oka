'use client';

import { ChevronLeft, Phone, Mail, MapPin, Send } from 'lucide-react';
import Link from 'next/link';
import { RESTAURANT_CONFIG } from '@/lib/config';
import { CompactFooter } from '@/components/layout/CompactFooter';
import { useState } from 'react';

export default function ContactPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 3000);
  };

  return (
    <div className="min-h-screen bg-obsidian text-text-primary flex flex-col">
      <header className="px-4 py-5 flex items-center gap-3 border-b border-white/5 sticky top-0 bg-obsidian/90 backdrop-blur-md z-40">
        <Link href="/" className="w-10 h-10 flex items-center justify-center -ml-2 text-text-primary/70 hover:text-text-primary active:scale-95 transition-transform">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="font-heading text-lg font-bold">Contact Us</h1>
      </header>

      <main className="flex-1 px-4 py-8 max-w-md mx-auto w-full">
        <div className="text-center mb-10">
          <h2 className="font-heading text-2xl font-bold gold-gradient mb-2">We'd Love to Hear From You</h2>
          <p className="text-sm text-text-primary/60">Reach out for reservations, private events, or general inquiries.</p>
        </div>

        <div className="space-y-4 mb-10">
          <a href={`tel:${RESTAURANT_CONFIG.phone}`} className="flex items-center gap-4 p-4 glass-card rounded-2xl active:scale-[0.98] transition-transform">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-text-primary/50 mb-1">Call Us</p>
              <p className="font-medium">{RESTAURANT_CONFIG.phone}</p>
            </div>
          </a>

          <a href={`mailto:${RESTAURANT_CONFIG.email}`} className="flex items-center gap-4 p-4 glass-card rounded-2xl active:scale-[0.98] transition-transform">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-text-primary/50 mb-1">Email Us</p>
              <p className="font-medium">{RESTAURANT_CONFIG.email}</p>
            </div>
          </a>

          <div className="flex items-center gap-4 p-4 glass-card rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-text-primary/50 mb-1">Visit Us</p>
              <p className="text-sm leading-tight">{RESTAURANT_CONFIG.address}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-heading text-lg font-bold mb-4">Send a Message</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input 
                type="text" 
                placeholder="Your Name" 
                required
                className="w-full bg-[#1a1a1a] border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary text-text-primary"
              />
            </div>
            <div>
              <input 
                type="email" 
                placeholder="Email Address" 
                required
                className="w-full bg-[#1a1a1a] border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary text-text-primary"
              />
            </div>
            <div>
              <textarea 
                placeholder="Your Message" 
                rows={4}
                required
                className="w-full bg-[#1a1a1a] border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary text-text-primary resize-none"
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full py-4 bg-primary text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
            >
              {isSubmitted ? 'Message Sent!' : (
                <>
                  <Send className="w-4 h-4" />
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      <CompactFooter />
    </div>
  );
}
