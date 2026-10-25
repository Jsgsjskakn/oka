import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin-auth';
import Link from 'next/link';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles, 
  Clock, 
  User, 
  Activity, 
  Database, 
  Key, 
  Sliders, 
  ArrowRight,
  ArrowLeft,
  Filter,
  Layers
} from 'lucide-react';

export const metadata = {
  title: 'Audit Logs | Admin | The Golden Oak',
};

export default async function AuditLogsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ action?: string; entity?: string; page?: string }> 
}) {
  await requireAdmin();
  const params = await searchParams;
  const supabase = await createClient();
  const { sb } = await import('@/lib/supabase/typed');
  const db = sb(supabase);
  
  const page = parseInt(params.page || '1');
  const limit = 50;
  const offset = (page - 1) * limit;

  // Query audit logs with pagination and filters
  let query = db
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (params.action) query = query.eq('action', params.action);
  if (params.entity) query = query.eq('entity_type', params.entity);

  const { data: logs, count } = await query;
  const totalLogsCount = count ?? logs?.length ?? 0;

  // Query all logs count for telemetry
  const { count: totalEvents } = await db.from('audit_logs').select('*', { count: 'exact', head: true });

  return (
    <div className="relative min-h-screen p-6 md:p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-12 left-1/4 w-96 h-96 bg-champagne/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-48 right-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pb-2 border-b border-border-subtle/60">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase bg-platinum/5 text-platinum border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <ShieldCheck className="w-3.5 h-3.5 text-platinum" />
              Security Audit Stream
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl heading-ui text-text-primary text-2xl text-transparent bg-clip-text bg-gradient-to-r from-champagne via-platinum to-champagne drop-shadow-[0_0_20px_rgba(201,168,76,0.3)]">
              Audit Logs
            </h1>
            <p className="text-champagne/80 text-[13px] font-medium tracking-[0.05em] uppercase">
              Immutable chronological record of administrative actions, permission mutations, and data revisions.
            </p>
          </div>
        </div>
      </div>

      {/* 1-Click Interactive Filter Navigation (Replaces native browser dropdowns!) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Entity Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: '', label: 'All Entities' },
            { id: 'dishes', label: 'Dishes & Menu' },
            { id: 'orders', label: 'Orders' },
            { id: 'tables', label: 'Tables' },
            { id: 'employees', label: 'Employees' },
            { id: 'settings', label: 'Settings' },
          ].map((item) => {
            const isSelected = (params.entity || '') === item.id;
            const targetUrl = `/admin/audit-logs?${item.id ? `entity=${item.id}` : ''}${params.action ? `&action=${params.action}` : ''}`;

            return (
              <Link
                key={item.id}
                href={targetUrl}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 border ${
                  isSelected
                    ? 'bg-gradient-to-r from-champagne to-platinum text-zinc-950 border-transparent shadow-lg shadow-[#c9a84c]/20'
                    : 'bg-surface/80 text-text-secondary border-border-subtle hover:text-text-primary hover:border-border-strong'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Action Type Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-obsidian/80 p-1 rounded-2xl border border-border-subtle">
          {[
            { id: '', label: 'All' },
            { id: 'CREATE', label: 'Create', color: 'text-success' },
            { id: 'UPDATE', label: 'Update', color: 'text-platinum' },
            { id: 'DELETE', label: 'Delete', color: 'text-danger' },
          ].map((actionItem) => {
            const isSelected = (params.action || '') === actionItem.id;
            const targetUrl = `/admin/audit-logs?${params.entity ? `entity=${params.entity}&` : ''}${actionItem.id ? `action=${actionItem.id}` : ''}`;

            return (
              <Link
                key={actionItem.id}
                href={targetUrl}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-elevated text-text-primary shadow-inner font-bold'
                    : 'text-text-secondary hover:text-zinc-200'
                }`}
              >
                {actionItem.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Security Telemetry Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
        {/* Total Events */}
        <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border border-border-subtle p-5 rounded-2xl shadow-[0_15px_40px_rgba(201,168,76,0.15)] hover:shadow-[0_20px_50px_rgba(201,168,76,0.25)] hover:-translate-y-1 hover:border-border-subtle transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Total Audit Events</span>
            <Layers className="w-4 h-4 text-champagne" />
          </div>
          <p className="text-3xl font-black text-text-primary mt-2">{totalEvents ?? totalLogsCount}</p>
        </div>

        {/* Security Shield Status */}
        <div className="bg-gradient-to-b from-zinc-900/90 via-zinc-950/90 to-zinc-950 backdrop-blur-xl border border-border-subtle p-5 rounded-2xl shadow-[0_15px_40px_rgba(201,168,76,0.15)] hover:shadow-[0_20px_50px_rgba(201,168,76,0.25)] hover:-translate-y-1 hover:border-champagne/60 transition-all duration-300 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-success">Security Posture</span>
            <ShieldCheck className="w-4 h-4 text-success" />
          </div>
          <div className="flex items-center gap-2 mt-2 relative z-10">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-teal-200">
              Active Protection
            </p>
          </div>
        </div>

        {/* Mutation Events */}
        <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border border-border-subtle p-5 rounded-2xl shadow-[0_15px_40px_rgba(201,168,76,0.15)] hover:shadow-[0_20px_50px_rgba(201,168,76,0.25)] hover:-translate-y-1 hover:border-champagne/60 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-platinum">Monitored Entities</span>
            <Database className="w-4 h-4 text-platinum" />
          </div>
          <p className="text-3xl font-black text-platinum mt-2">6 Services</p>
        </div>

        {/* Role Access Level */}
        <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border border-border-subtle p-5 rounded-2xl shadow-[0_15px_40px_rgba(201,168,76,0.15)] hover:shadow-[0_20px_50px_rgba(201,168,76,0.25)] hover:-translate-y-1 hover:border-champagne/60 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Audit Authority</span>
            <Key className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300 mt-2">
            SuperAdmin
          </p>
        </div>
      </div>

      {/* Audit Log Stream Table */}
      <div className="bg-gradient-to-b from-zinc-900/80 via-zinc-900/60 to-zinc-950/90 backdrop-blur-2xl border border-border-subtle rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(201,168,76,0.15)] hover:shadow-[0_25px_70px_rgba(201,168,76,0.25)] hover:-translate-y-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-obsidian/90 text-text-secondary border-b border-border-subtle backdrop-blur-xl text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-4 px-6 font-semibold">Timestamp</th>
                <th className="py-4 px-6 font-semibold">Actor</th>
                <th className="py-4 px-6 font-semibold">Role</th>
                <th className="py-4 px-6 font-semibold">Action</th>
                <th className="py-4 px-6 font-semibold">Entity Type</th>
                <th className="py-4 px-6 font-semibold">Data Revisions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-text-secondary">
              {logs?.map((log: any) => {
                const isCreate = log.action?.toUpperCase().includes('CREATE') || log.action?.toUpperCase().includes('INSERT');
                const isUpdate = log.action?.toUpperCase().includes('UPDATE') || log.action?.toUpperCase().includes('EDIT');
                const isDelete = log.action?.toUpperCase().includes('DELETE');

                return (
                  <tr key={log.id} className="group hover:bg-elevated/40 transition-colors">
                    {/* Timestamp */}
                    <td className="py-4 px-6 text-xs text-text-secondary font-mono">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-text-secondary/70" />
                        <span>{new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}</span>
                      </div>
                    </td>

                    {/* Actor */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-elevated border border-border-strong flex items-center justify-center text-[10px] font-bold text-text-secondary">
                          {log.actor_role === 'admin' ? 'AD' : 'SY'}
                        </div>
                        <span className="font-mono text-xs text-zinc-200">
                          {log.actor_id ? `#${log.actor_id.slice(0, 8)}` : 'System Daemon'}
                        </span>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${
                        log.actor_role === 'admin'
                          ? 'bg-champagne/10 text-platinum border-border-subtle'
                          : log.actor_role === 'employee'
                          ? 'bg-platinum/5 text-platinum border-border-subtle'
                          : 'bg-elevated text-text-secondary border-border-strong'
                      }`}>
                        {log.actor_role || 'SYSTEM'}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border ${
                        isCreate
                          ? 'bg-emerald-500/10 text-success border-border-subtle'
                          : isUpdate
                          ? 'bg-platinum/5 text-platinum border-border-subtle'
                          : isDelete
                          ? 'bg-rose-500/10 text-danger border-danger/20'
                          : 'bg-amber-500/10 text-warning border-border-subtle'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isCreate ? 'bg-emerald-400' : isUpdate ? 'bg-cyan-400' : isDelete ? 'bg-rose-400' : 'bg-amber-400'
                        }`} />
                        {log.action}
                      </span>
                    </td>

                    {/* Entity */}
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-elevated/80 border border-border-strong/50 text-zinc-200 capitalize">
                        {log.entity_type || 'system'}
                      </span>
                    </td>

                    {/* Changes Diff */}
                    <td className="py-4 px-6 text-xs font-mono">
                      <div className="flex items-center gap-3">
                        {log.old_value && (
                          <div className="max-w-[180px] truncate bg-rose-500/10 text-danger px-2 py-1 rounded border border-rose-500/20">
                            <span className="font-bold opacity-75 mr-1">-</span>
                            {JSON.stringify(log.old_value)}
                          </div>
                        )}
                        {log.new_value && (
                          <div className="max-w-[180px] truncate bg-emerald-500/10 text-success px-2 py-1 rounded border border-emerald-500/20">
                            <span className="font-bold opacity-75 mr-1">+</span>
                            {JSON.stringify(log.new_value)}
                          </div>
                        )}
                        {!log.old_value && !log.new_value && (
                          <span className="text-zinc-600">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {(!logs || logs.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-16 px-6 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-surface border border-border-subtle flex items-center justify-center text-zinc-600 shadow-inner">
                        <ShieldCheck className="w-6 h-6 stroke-[1.5]" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-text-secondary">
                          No audit records found
                        </p>
                        <p className="text-xs text-text-secondary/70 max-w-sm">
                          Administrative and security transactions will stream into this tamper-evident ledger automatically.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-2">
        <p className="text-xs text-text-secondary tracking-wider font-mono">
          PAGE <span className="font-bold text-champagne">{page}</span> OF AUDIT TIMELINE
        </p>
        <div className="flex items-center gap-2">
          {page > 1 && (
            <Link 
              href={`/admin/audit-logs?page=${page - 1}${params.entity ? `&entity=${params.entity}` : ''}${params.action ? `&action=${params.action}` : ''}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface/80 hover:bg-elevated border border-border-subtle text-text-secondary hover:text-text-primary rounded-xl text-xs font-semibold transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </Link>
          )}
          <Link 
            href={`/admin/audit-logs?page=${page + 1}${params.entity ? `&entity=${params.entity}` : ''}${params.action ? `&action=${params.action}` : ''}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800 border border-border-strong/80 text-text-primary rounded-xl text-xs font-semibold transition-all hover:-translate-y-0.5 shadow-md"
          >
            <span>Next Page</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}


