import { Shield, AlertCircle, Users, ShieldCheck, ChefHat, UserCheck, Sparkles, KeyRound } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { getEmployees } from '@/lib/services/employee.service';
import { EmployeeActions, RemoveEmployeeButton, ResetPasswordButton } from './EmployeeActions';

export const metadata = {
  title: 'Staff Management | Admin | The Golden Oak',
};

export default async function EmployeesPage() {
  await requireAdmin();
  const employees = await getEmployees();

  const totalStaff = employees.length;
  const activeStaff = employees.filter(e => e.is_active).length;
  const chefsCount = employees.filter(e => e.role === 'chef').length;
  const managersCount = employees.filter(e => e.role === 'manager' || e.role === 'admin').length;

  return (
    <div className="relative min-h-screen p-6 md:p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-12 left-1/4 w-96 h-96 bg-champagne/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-48 right-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pb-2 border-b border-border-subtle/60">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase bg-champagne/10 text-platinum border border-champagne/20 shadow-[0_0_15px_rgba(201,168,76,0.1)]">
              <Users className="w-3.5 h-3.5 text-champagne" />
              Staff & Team Operations
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl heading-ui text-text-primary text-2xl text-transparent bg-clip-text bg-gradient-to-r from-champagne via-platinum to-champagne drop-shadow-[0_0_20px_rgba(201,168,76,0.3)]">
              Staff Management
            </h1>
            <p className="text-champagne/80 text-[13px] font-medium tracking-[0.05em] uppercase">
              Manage restaurant personnel credentials, assign kitchen/floor roles, and calibrate operational permissions.
            </p>
          </div>
        </div>

        <EmployeeActions />
      </div>

      {/* Metric Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
        {/* Total Staff */}
        <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border border-border-subtle p-5 rounded-2xl shadow-[0_15px_40px_rgba(201,168,76,0.15)] hover:shadow-[0_20px_50px_rgba(201,168,76,0.25)] hover:-translate-y-1 hover:border-border-subtle transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Total Personnel</span>
            <Users className="w-4 h-4 text-champagne" />
          </div>
          <p className="text-3xl font-black text-text-primary mt-2">{totalStaff}</p>
        </div>

        {/* Active on Duty */}
        <div className="bg-gradient-to-b from-zinc-900/90 via-zinc-950/90 to-zinc-950 backdrop-blur-xl border border-border-subtle p-5 rounded-2xl shadow-[0_15px_40px_rgba(201,168,76,0.15)] hover:shadow-[0_20px_50px_rgba(201,168,76,0.25)] hover:-translate-y-1 hover:border-champagne/60 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-success">Active On-Duty</span>
            <UserCheck className="w-4 h-4 text-success" />
          </div>
          <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-teal-200 mt-2">
            {activeStaff}
          </p>
        </div>

        {/* Kitchen Brigade */}
        <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border border-border-subtle p-5 rounded-2xl shadow-[0_15px_40px_rgba(201,168,76,0.15)] hover:shadow-[0_20px_50px_rgba(201,168,76,0.25)] hover:-translate-y-1 hover:border-champagne/60 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-warning">Culinary Chefs</span>
            <ChefHat className="w-4 h-4 text-warning" />
          </div>
          <p className="text-3xl font-black text-warning mt-2">{chefsCount}</p>
        </div>

        {/* Leadership */}
        <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border border-border-subtle p-5 rounded-2xl shadow-[0_15px_40px_rgba(201,168,76,0.15)] hover:shadow-[0_20px_50px_rgba(201,168,76,0.25)] hover:-translate-y-1 hover:border-champagne/60 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-platinum">Managers & Leads</span>
            <ShieldCheck className="w-4 h-4 text-platinum" />
          </div>
          <p className="text-3xl font-black text-platinum mt-2">{managersCount}</p>
        </div>
      </div>

      {/* Staff Roster Table Panel */}
      <div className="bg-gradient-to-b from-zinc-900/80 via-zinc-900/60 to-zinc-950/90 backdrop-blur-2xl border border-border-subtle rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(201,168,76,0.15)] hover:shadow-[0_25px_70px_rgba(201,168,76,0.25)] hover:-translate-y-1 transition-all duration-500 hover:border-champagne/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-obsidian/90 text-text-secondary border-b border-border-subtle backdrop-blur-xl text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Employee</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Phone</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Duty Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-text-secondary">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="w-8 h-8 text-zinc-600 stroke-[1.5]" />
                      <p className="text-sm font-semibold text-text-secondary">No staff members found</p>
                      <p className="text-xs text-text-secondary/70">Click &apos;Add Employee&apos; to onboard new team members.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="group hover:bg-elevated/40 transition-all duration-300">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-border-strong flex items-center justify-center text-xs font-serif font-bold text-champagne shadow-inner">
                          {emp.name ? emp.name.slice(0, 2).toUpperCase() : 'ST'}
                        </div>
                        <span className="font-semibold text-zinc-100 group-hover:text-text-primary transition-colors">
                          {emp.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-text-secondary">{emp.email || '—'}</td>
                    <td className="px-6 py-4 text-xs font-mono text-text-secondary">{emp.phone || '—'}</td>
                    <td className="px-6 py-4 capitalize">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-lg border shadow-sm ${
                        emp.role === 'manager' || emp.role === 'admin'
                          ? 'bg-champagne/10 text-platinum border-border-subtle'
                          : emp.role === 'chef'
                          ? 'bg-amber-500/10 text-warning border-border-subtle'
                          : 'bg-platinum/5 text-platinum border-border-subtle'
                      }`}>
                        {emp.role === 'chef' ? <ChefHat className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                        <span>{emp.role}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 text-[10px] uppercase tracking-widest font-bold rounded-full border shadow-sm ${
                        emp.is_active 
                          ? 'bg-emerald-500/10 text-success border-border-subtle shadow-[0_0_8px_rgba(52,211,153,0.15)]' 
                          : 'bg-rose-500/10 text-danger border-danger/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${emp.is_active ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-rose-400'}`} />
                        {emp.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ResetPasswordButton id={emp.id} hasEmail={!!emp.email} />
                        <RemoveEmployeeButton id={emp.id} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


