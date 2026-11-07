import { requireAdmin } from '@/lib/auth/admin-auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopBar } from '@/components/admin/AdminTopBar';
import { AmbientGoldenOakBackdrop } from '@/components/admin/AmbientGoldenOakBackdrop';
import { Lock, ChevronLeft, ChevronRight, Share, Plus, Copy, RotateCw } from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="relative min-h-screen w-full bg-[#08070b] text-white flex items-center justify-center p-2 sm:p-3 md:p-4 overflow-hidden font-sans select-none">
      {/* 1. Deep Luxury Restaurant Atmosphere Backdrop */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none -z-20 scale-105"
        style={{ backgroundImage: "url('/images/restaurant-backdrop.png')" }}
      />

      {/* 2. Golden Oak Particle Tree & Drifting Leaf Fragments in Ambient Background */}
      <AmbientGoldenOakBackdrop />

      {/* 3. Soft Ambient Veil (Translucent to showcase bokeh & particles) */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] pointer-events-none -z-10" />

      {/* 4. THE FLOATING APP WINDOW (Clean Mac Frame with Independent Floating Islands) */}
      <div className="w-full max-w-[1420px] h-[95vh] max-h-[930px] rounded-[26px] bg-black/25 backdrop-blur-xl border border-white/15 shadow-[0_30px_90px_rgba(0,0,0,0.95),0_0_60px_rgba(212,175,55,0.15)] flex flex-col overflow-hidden relative z-10 ring-1 ring-white/10">
        
        {/* Mac OS Chrome Bar */}
        <div className="w-full h-9 flex items-center justify-between px-4 bg-black/40 border-b border-white/10 shrink-0 select-none backdrop-blur-md">
          {/* Left: Traffic Lights & Navigation Buttons */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] inline-block shadow-sm" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] inline-block shadow-sm" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] inline-block shadow-sm" />
            </div>
            <div className="flex items-center gap-1 text-zinc-400 pl-2">
              <button type="button" className="p-0.5 hover:text-white transition-colors" title="Back">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button type="button" className="p-0.5 hover:text-white transition-colors" title="Forward">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Center: Address Bar Pill */}
          <div className="flex items-center justify-between px-3.5 py-0.5 rounded-lg bg-black/40 border border-white/10 text-xs text-zinc-300 font-mono shadow-inner w-64 sm:w-80">
            <div className="flex items-center gap-2">
              <Lock className="w-3 h-3 text-zinc-400" />
              <span className="text-[11px] font-sans tracking-wide text-zinc-200">admin.thegoldenoak.com</span>
            </div>
            <RotateCw className="w-2.5 h-2.5 text-zinc-500 hover:text-zinc-300 cursor-pointer" />
          </div>

          {/* Right: Window Utility Icons */}
          <div className="flex items-center gap-2.5 text-zinc-400 pr-1">
            <Share className="w-3.5 h-3.5 hover:text-white cursor-pointer transition-colors" />
            <Plus className="w-3.5 h-3.5 hover:text-white cursor-pointer transition-colors" />
            <Copy className="w-3.5 h-3.5 hover:text-white cursor-pointer transition-colors" />
          </div>
        </div>

        {/* Workspace: Independent Floating Glass Islands (NO Nested Enclosing Boxes) */}
        <div className="flex-1 flex overflow-hidden min-h-0 p-3 sm:p-3.5 gap-3 sm:gap-3.5 bg-transparent">
          {/* Island 1: Floating Left Sidebar */}
          <AdminSidebar />

          {/* Right Workspace: Independent Floating Cards (TopBar + Page Content) */}
          <div className="flex-1 flex flex-col min-w-0 h-full gap-3 overflow-y-auto pr-0.5">
            {/* Island 2: Floating Top Bar Pill */}
            <AdminTopBar adminName="Sajib" adminRole="Admin" />

            {/* Independent Floating Page Content */}
            <div className="flex-1 min-h-0 space-y-3">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
