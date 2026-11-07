import { Users, ChefHat, UserCheck, ShieldCheck, TrendingUp } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { getEmployees } from '@/lib/services/employee.service';
import { EmployeeActions, RemoveEmployeeButton, ResetPasswordButton } from './EmployeeActions';

export const metadata = {
  title: 'Staff & Team | Admin | The Golden Oak',
};

export default async function EmployeesPage() {
  await requireAdmin();
  const employees = await getEmployees();

  const totalStaff = employees.length;
  const activeStaff = employees.filter(e => e.is_active).length;
  const chefsCount = employees.filter(e => e.role === 'chef').length;
  const managersCount = employees.filter(e => e.role === 'manager' || e.role === 'admin').length;

  return (
    <div className="space-y-3 select-none font-sans">
      {/* ===================================================================== */}
      {/* 1. TOP METRIC CARDS: 4 Glowing Dark Glass Cards with Sparklines       */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Active On-Duty (Emerald Glow) */}
        <div className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-emerald-500/25 p-3.5 relative overflow-hidden shadow-lg flex flex-col justify-between group hover:border-emerald-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shadow-inner">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] text-zinc-300 font-medium">Active On-Duty</span>
          </div>

          <div className="flex items-end justify-between my-1.5 relative z-10">
            <span className="text-xl md:text-2xl font-black text-white tracking-tight">
              {activeStaff}
            </span>
            <svg className="w-20 h-8 overflow-visible" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="emeraldGradE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 35 Q 20 28, 35 30 T 60 18 T 80 12 T 100 5 L 100 40 L 0 40 Z" fill="url(#emeraldGradE)" />
              <path d="M 0 35 Q 20 28, 35 30 T 60 18 T 80 12 T 100 5" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_#34d399]" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold relative z-10">
            <TrendingUp className="w-3 h-3" /> Shift Ready
          </div>
        </div>

        {/* Card 2: Total Personnel (Amber Glow) */}
        <div className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-amber-500/25 p-3.5 relative overflow-hidden shadow-lg flex flex-col justify-between group hover:border-amber-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-inner">
              <Users className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="text-[11px] text-zinc-300 font-medium">Total Personnel</span>
          </div>

          <div className="flex items-end justify-between my-1.5 relative z-10">
            <span className="text-xl md:text-2xl font-black text-white tracking-tight">
              {totalStaff}
            </span>
            <svg className="w-20 h-8 overflow-visible" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="amberGradE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 32 Q 25 35, 45 22 T 75 18 T 100 8 L 100 40 L 0 40 Z" fill="url(#amberGradE)" />
              <path d="M 0 32 Q 25 35, 45 22 T 75 18 T 100 8" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_#fbbf24]" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-bold relative z-10">
            <TrendingUp className="w-3 h-3" /> Full Roster
          </div>
        </div>

        {/* Card 3: Managers & Leads (Purple Glow) */}
        <div className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-purple-500/25 p-3.5 relative overflow-hidden shadow-lg flex flex-col justify-between group hover:border-purple-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <span className="text-[11px] text-zinc-300 font-medium">Managers & Leads</span>
          </div>

          <div className="flex items-end justify-between my-1.5 relative z-10">
            <span className="text-xl md:text-2xl font-black text-white tracking-tight">
              {managersCount}
            </span>
            <svg className="w-20 h-8 overflow-visible" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="purpleGradE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 25 Q 25 32, 50 20 T 75 14 T 100 10 L 100 40 L 0 40 Z" fill="url(#purpleGradE)" />
              <path d="M 0 25 Q 25 32, 50 20 T 75 14 T 100 10" fill="none" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_#c084fc]" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-purple-400 font-bold relative z-10">
            Administrative Access
          </div>
        </div>

        {/* Card 4: Culinary Chefs (Rose Glow) */}
        <div className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-rose-500/25 p-3.5 relative overflow-hidden shadow-lg flex flex-col justify-between group hover:border-rose-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-xs shadow-inner">
              <ChefHat className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] text-zinc-300 font-medium">Culinary Chefs</span>
          </div>

          <div className="flex items-end justify-between my-1.5 relative z-10">
            <span className="text-xl md:text-2xl font-black text-white tracking-tight">
              {chefsCount}
            </span>
            <svg className="w-20 h-8 overflow-visible" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="roseGradE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 35 Q 25 30, 45 32 T 75 16 T 100 10 L 100 40 L 0 40 Z" fill="url(#roseGradE)" />
              <path d="M 0 35 Q 25 30, 45 32 T 75 16 T 100 10" fill="none" stroke="#fb7185" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_#fb7185]" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-rose-400 font-bold relative z-10">
            Kitchen Operations
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. MAIN ROSTER SECTION                                                */}
      {/* ===================================================================== */}
      <div className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-white/10 p-4 shadow-lg space-y-3.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-bold text-white tracking-wide">
                Teams & Staff Roster
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Floor Roster
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Manage restaurant personnel credentials, assign kitchen/floor roles, and calibrate permissions.
            </p>
          </div>

          <EmployeeActions />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="text-zinc-400 border-b border-white/10 text-[10px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Duty Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-600/30 to-amber-400/30 border border-amber-400/40 flex items-center justify-center font-bold text-amber-200 text-[10px]">
                        {(emp.name || 'EM').slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-white text-xs">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[11px] font-mono text-zinc-400">{emp.email || '—'}</td>
                  <td className="px-4 py-3 text-[11px] font-mono text-zinc-400">{emp.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="capitalize px-2 py-0.5 text-[10px] font-medium bg-white/10 text-white rounded-md border border-white/10">
                      {emp.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full border ${
                      emp.is_active
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${emp.is_active ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      {emp.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <ResetPasswordButton id={emp.id} hasEmail={!!emp.email} />
                      <RemoveEmployeeButton id={emp.id} />
                    </div>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-zinc-500 text-xs">
                    No employees registered in the staff database yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
