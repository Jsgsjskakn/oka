import React from 'react';
import Image from 'next/image';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { 
  MessageSquare, 
  Search, 
  Send, 
  Phone, 
  MoreVertical,
  CheckCheck, 
  Clock,
  Sparkles,
  UserCheck,
  TrendingUp,
} from 'lucide-react';

export const metadata = {
  title: 'Guest Messages | Admin | The Golden Oak',
};

export default async function AdminMessagesPage() {
  await requireAdmin();

  const mockConversations = [
    {
      id: '1',
      name: 'Rohan Sharma',
      tag: 'Table 4 • VIP',
      avatar: '/images/admin-avatar.png',
      lastMessage: 'Could we arrange a birthday dessert sparkler for 8:30 PM?',
      time: '2m ago',
      unread: true,
    },
    {
      id: '2',
      name: 'Ananya Verma',
      tag: 'Table 8 • Dine-in',
      avatar: null,
      lastMessage: 'Thank you! The Truffle Pasta was exceptional.',
      time: '15m ago',
      unread: false,
    },
    {
      id: '3',
      name: 'Vikram Mehta',
      tag: 'Takeaway #1042',
      avatar: null,
      lastMessage: 'Is my order ready for curbside pickup?',
      time: '1h ago',
      unread: false,
    },
    {
      id: '4',
      name: 'Priya Kapoor',
      tag: 'Reservation Inquiry',
      avatar: null,
      lastMessage: 'Need a quiet corner table for 6 guests this Friday.',
      time: '3h ago',
      unread: false,
    },
  ];

  return (
    <div className="space-y-3 select-none font-sans">
      {/* ===================================================================== */}
      {/* 1. TOP METRIC CARDS: 4 Glowing Dark Glass Cards with Sparklines       */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Active Conversations (Emerald Glow) */}
        <div className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-emerald-500/25 p-3.5 relative overflow-hidden shadow-lg flex flex-col justify-between group hover:border-emerald-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shadow-inner">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] text-zinc-300 font-medium">Active Conversations</span>
          </div>

          <div className="flex items-end justify-between my-1.5 relative z-10">
            <span className="text-xl md:text-2xl font-black text-white tracking-tight">12</span>
            <svg className="w-20 h-8 overflow-visible" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="emeraldGradMsg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 35 Q 20 28, 35 30 T 60 18 T 80 12 T 100 5 L 100 40 L 0 40 Z" fill="url(#emeraldGradMsg)" />
              <path d="M 0 35 Q 20 28, 35 30 T 60 18 T 80 12 T 100 5" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_#34d399]" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold relative z-10">
            <TrendingUp className="w-3 h-3" /> Live Concierge Desk
          </div>
        </div>

        {/* Card 2: Guest Inquiries (Amber Glow) */}
        <div className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-amber-500/25 p-3.5 relative overflow-hidden shadow-lg flex flex-col justify-between group hover:border-amber-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-inner">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="text-[11px] text-zinc-300 font-medium">Guest Inquiries</span>
          </div>

          <div className="flex items-end justify-between my-1.5 relative z-10">
            <span className="text-xl md:text-2xl font-black text-white tracking-tight">48</span>
            <svg className="w-20 h-8 overflow-visible" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="amberGradMsg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 32 Q 25 35, 45 22 T 75 18 T 100 8 L 100 40 L 0 40 Z" fill="url(#amberGradMsg)" />
              <path d="M 0 32 Q 25 35, 45 22 T 75 18 T 100 8" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_#fbbf24]" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-bold relative z-10">
            <TrendingUp className="w-3 h-3" /> Today&apos;s Messages
          </div>
        </div>

        {/* Card 3: VIP Requests (Purple Glow) */}
        <div className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-purple-500/25 p-3.5 relative overflow-hidden shadow-lg flex flex-col justify-between group hover:border-purple-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <span className="text-[11px] text-zinc-300 font-medium">VIP Requests</span>
          </div>

          <div className="flex items-end justify-between my-1.5 relative z-10">
            <span className="text-xl md:text-2xl font-black text-white tracking-tight">8</span>
            <svg className="w-20 h-8 overflow-visible" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="purpleGradMsg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 25 Q 25 32, 50 20 T 75 14 T 100 10 L 100 40 L 0 40 Z" fill="url(#purpleGradMsg)" />
              <path d="M 0 25 Q 25 32, 50 20 T 75 14 T 100 10" fill="none" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_#c084fc]" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-purple-400 font-bold relative z-10">
            Priority Seating
          </div>
        </div>

        {/* Card 4: Avg Response Time (Rose Glow) */}
        <div className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-rose-500/25 p-3.5 relative overflow-hidden shadow-lg flex flex-col justify-between group hover:border-rose-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-xs shadow-inner">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] text-zinc-300 font-medium">Avg Response</span>
          </div>

          <div className="flex items-end justify-between my-1.5 relative z-10">
            <span className="text-xl md:text-2xl font-black text-white tracking-tight">1.4m</span>
            <svg className="w-20 h-8 overflow-visible" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="roseGradMsg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 35 Q 25 30, 45 32 T 75 16 T 100 10 L 100 40 L 0 40 Z" fill="url(#roseGradMsg)" />
              <path d="M 0 35 Q 25 30, 45 32 T 75 16 T 100 10" fill="none" stroke="#fb7185" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_#fb7185]" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-rose-400 font-bold relative z-10">
            High Concierge Velocity
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. MAIN CHAT DESK                                                     */}
      {/* ===================================================================== */}
      <div className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-white/10 p-4 shadow-lg space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm md:text-base font-bold text-white tracking-wide">
                Concierge Live Desk
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Preview Layout
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Sample concierge messaging preview — live two-way guest chat sync coming soon.
            </p>
          </div>
        </div>

        {/* Chat Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 lg:h-[420px]">
          {/* Left Column: Conversations List */}
          <div className="lg:col-span-5 xl:col-span-4 max-h-[260px] lg:max-h-none rounded-xl bg-black/40 border border-white/10 p-3 flex flex-col overflow-hidden">
            <div className="relative mb-2.5">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full bg-[#1e1c24] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-400/40"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {mockConversations.map((c, i) => (
                <div
                  key={c.id}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                    i === 0
                      ? 'bg-[#d4af37]/15 border-[#d4af37]/40 shadow-sm'
                      : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  <div className="relative w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0 overflow-hidden">
                    {c.avatar ? (
                      <Image src={c.avatar} alt={c.name} fill className="object-cover" />
                    ) : (
                      <span>{c.name.slice(0, 2).toUpperCase()}</span>
                    )}
                    {c.unread && (
                      <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-black" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate">{c.name}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">{c.time}</span>
                    </div>
                    <span className="text-[9px] font-semibold text-amber-300 block mt-0.5">{c.tag}</span>
                    <p className="text-[11px] text-zinc-300 truncate mt-0.5">{c.lastMessage}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Chat View */}
          <div className="lg:col-span-7 xl:col-span-8 min-h-[340px] lg:min-h-0 rounded-xl bg-black/40 border border-white/10 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600/30 to-amber-400/30 border border-amber-400/40 flex items-center justify-center text-amber-200 font-bold text-xs">
                  RS
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Rohan Sharma</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#d4af37]/20 text-[#f5dc9a] border border-[#d4af37]/30">
                      Table 4 VIP
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400">Online • Active in Dining Room</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button type="button" className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300">
                  <Phone className="w-3.5 h-3.5" />
                </button>
                <button type="button" className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300">
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex items-start gap-2 max-w-sm">
                <div className="w-6 h-6 rounded-full bg-zinc-800 text-[10px] font-bold text-white flex items-center justify-center shrink-0">
                  RS
                </div>
                <div className="bg-[#1e1c24] border border-white/10 rounded-2xl rounded-tl-none p-3 text-xs text-zinc-200 shadow-sm space-y-1">
                  <p>Could we arrange a birthday dessert sparkler for 8:30 PM?</p>
                  <span className="text-[9px] text-zinc-500 font-mono block text-right">8:14 PM</span>
                </div>
              </div>

              <div className="flex items-start justify-end gap-2">
                <div className="bg-gradient-to-r from-amber-600/30 to-[#d4af37]/20 border border-[#d4af37]/40 rounded-2xl rounded-tr-none p-3 text-xs text-white shadow-sm space-y-1 max-w-sm">
                  <p>Certainly, Mr. Sharma! Our head chef is preparing our signature Chocolate Lava Cake with a gold sparkler at 8:30 PM sharp.</p>
                  <div className="flex items-center justify-end gap-1 text-[9px] text-amber-200 font-mono">
                    <span>8:16 PM</span>
                    <CheckCheck className="w-3 h-3 text-emerald-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-2.5 border-t border-white/10 bg-white/5 flex items-center gap-2">
              <input
                type="text"
                placeholder="Type response to guest..."
                defaultValue=""
                className="flex-1 bg-[#1c1a22] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-400/40"
              />
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-[#d4af37] hover:bg-[#eac866] text-black font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <span>Send</span>
                <Send className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
