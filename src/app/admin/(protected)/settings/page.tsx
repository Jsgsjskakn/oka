import { requireAdmin } from '@/lib/auth/admin-auth';
import { getPublicSettings } from '@/lib/services/settings.service';
import AdminSettingsClient from './SettingsClient';
import { Sliders, Sparkles } from 'lucide-react';

const RESTAURANT_ID = 'a1b2c3d4-0000-0000-0000-000000000001';

export const metadata = {
  title: 'Settings | Admin | The Golden Oak',
};

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getPublicSettings(RESTAURANT_ID);

  return (
    <div className="relative min-h-screen p-6 md:p-10 max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Background Futuristic Ambient Glow Orbs */}
      <div className="absolute top-12 left-1/4 w-96 h-96 bg-champagne/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-48 right-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pb-2 border-b border-border-subtle/60">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase bg-champagne/10 text-platinum border border-champagne/20 shadow-[0_0_15px_rgba(201,168,76,0.1)]">
              <Sparkles className="w-3 h-3 text-champagne" />
              System Architecture & Core Policies
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl heading-ui text-text-primary text-2xl text-transparent bg-clip-text bg-gradient-to-r from-champagne via-platinum to-champagne drop-shadow-[0_0_20px_rgba(201,168,76,0.3)]">
              Restaurant Settings
            </h1>
            <p className="text-champagne/80 text-[13px] font-medium tracking-[0.05em] uppercase">
              Operational parameters, digital ticket workflows, statutory taxes, and concierge policies.
            </p>
          </div>
        </div>
      </div>

      {/* Main Settings Card Container */}
      <div className="bg-gradient-to-b from-zinc-900/80 via-zinc-900/60 to-zinc-950/90 backdrop-blur-2xl border border-border-subtle rounded-2xl p-6 lg:p-8 shadow-[0_20px_60px_rgba(201,168,76,0.15)] hover:shadow-[0_25px_70px_rgba(201,168,76,0.25)] hover:-translate-y-1 transition-all duration-500 hover:border-champagne/60">
        <AdminSettingsClient initialSettings={settings} restaurantId={RESTAURANT_ID} />
      </div>
    </div>
  );
}


