import { requireAdmin } from '@/lib/auth/admin-auth';
import { AdminShellClient } from '@/components/admin/AdminShellClient';
import { AmbientGoldenOakBackdrop } from '@/components/admin/AmbientGoldenOakBackdrop';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="relative min-h-screen w-full bg-[#08070b] text-white flex items-center justify-center p-2 sm:p-3 md:p-4 overflow-x-hidden lg:overflow-hidden font-sans select-none">
      {/* 1. Deep Luxury Restaurant Atmosphere Backdrop */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none -z-20 scale-105"
        style={{ backgroundImage: "url('/images/restaurant-backdrop.png')" }}
      />

      {/* 2. Golden Oak Particle Tree & Drifting Leaf Fragments in Ambient Background */}
      <AmbientGoldenOakBackdrop />

      {/* 3. Soft Ambient Veil */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] pointer-events-none -z-10" />

      {/* 4. Responsive Floating App Window + Mobile Navigation Drawer */}
      <AdminShellClient adminName={admin.name || 'Admin'} adminRole="Admin">
        {children}
      </AdminShellClient>
    </div>
  );
}
