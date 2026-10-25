'use client';

import { useState } from 'react';
import { UserPlus, Sliders, Check, ShieldCheck, Lock, CheckCircle2, X } from 'lucide-react';
import { addEmployeeAction, removeEmployeeAction } from '@/lib/actions/employee-actions';

export function EmployeeActions() {

  const [showAddModal, setShowAddModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Access settings state (for Staff role toggles)
  const [permissions, setPermissions] = useState({
    staff_manage_orders: true,
    staff_modify_menu: false,
    staff_view_revenue: false,
    staff_manage_tables: true,
    staff_manage_bookings: true,
    chef_update_order_status: true,
  });
  const [accessSaved, setAccessSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const res = await addEmployeeAction(formData);
    if (res.error) {
      setError(res.error);
    } else {
      setShowAddModal(false);
    }
    setPending(false);
  }

  const handleSaveAccess = () => {
    setAccessSaved(true);
    setTimeout(() => {
      setAccessSaved(false);
      setShowAccessModal(false);
    }, 1200);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Access Settings Button */}
      <button 
        onClick={() => setShowAccessModal(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-surface/90 hover:bg-elevated border border-border-strong/80 text-zinc-200 hover:text-text-primary font-semibold rounded-xl text-xs transition-all duration-300 shadow-md hover:-translate-y-0.5"
      >
        <Sliders className="w-3.5 h-3.5 text-platinum" />
        <span>Access Settings</span>
      </button>

      {/* Add Employee Button */}
      <button 
        onClick={() => setShowAddModal(true)}
        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-champagne to-platinum hover:from-[#d8b85b] hover:to-[#f0db99] text-zinc-950 font-bold rounded-xl text-xs transition-all duration-300 shadow-lg shadow-[#c9a84c]/20 hover:shadow-[#c9a84c]/30 hover:-translate-y-0.5"
      >
        <UserPlus className="w-4 h-4 stroke-[2.5]" />
        <span>Add Employee</span>
      </button>

      {/* Access Settings Modal */}
      {showAccessModal && (
        <div className="fixed inset-0 bg-obsidian/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 border border-border-subtle rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl shadow-black animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-platinum/5 border border-cyan-500/20 flex items-center justify-center text-platinum">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-serif text-text-primary">Staff Access Matrix</h2>
                  <p className="text-xs text-text-secondary">Configure permission toggles for operational roles</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAccessModal(false)}
                className="p-1.5 text-text-secondary hover:text-text-primary bg-elevated/60 hover:bg-elevated rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {[
                { key: 'staff_manage_orders', label: 'Process Kitchen Orders', desc: 'Accept and mark orders as preparing or completed' },
                { key: 'staff_manage_tables', label: 'Table Seating & QR Control', desc: 'Assign guests to tables and toggle floor status' },
                { key: 'staff_manage_bookings', label: 'VIP Table Bookings', desc: 'Review and confirm guest dining reservations' },
                { key: 'staff_modify_menu', label: 'Modify Menu Items & Prices', desc: 'Allow staff to create or delete dishes' },
                { key: 'staff_view_revenue', label: 'View Gross Settled Revenue', desc: 'Access revenue metrics and financial analytics' },
              ].map((perm) => (
                <div key={perm.key} className="flex items-center justify-between p-3.5 rounded-xl bg-obsidian/60 border border-border-subtle">
                  <div className="space-y-0.5 pr-4">
                    <p className="font-semibold text-zinc-200">{perm.label}</p>
                    <p className="text-[11px] text-text-secondary">{perm.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={permissions[perm.key as keyof typeof permissions]}
                      onChange={(e) => setPermissions(prev => ({ ...prev, [perm.key]: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 shadow-inner" />
                  </label>
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-border-subtle">
              <button 
                type="button" 
                onClick={() => setShowAccessModal(false)} 
                className="px-4 py-2 text-text-secondary hover:text-text-primary text-xs font-semibold"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleSaveAccess}
                className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-text-primary font-bold rounded-xl text-xs transition-all shadow-md shadow-cyan-500/20"
              >
                {accessSaved ? <Check className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                <span>{accessSaved ? 'Permissions Saved' : 'Apply Permissions'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-obsidian/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 border border-border-subtle rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl shadow-black animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-champagne/10 border border-champagne/20 flex items-center justify-center text-champagne">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-serif text-text-primary">Add Team Member</h2>
                  <p className="text-xs text-text-secondary">Register employee credentials to the system</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-text-secondary hover:text-text-primary bg-elevated/60 hover:bg-elevated rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && <p className="text-danger text-xs bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">{error}</p>}
            
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-text-secondary uppercase tracking-wider text-[10px]">Full Name</label>
                <input name="name" type="text" required className="w-full px-3.5 py-2 bg-obsidian border border-border-strong/80 rounded-xl text-zinc-100 placeholder-zinc-500 outline-none focus:border-champagne/50 focus:ring-1 focus:ring-[#c9a84c]/50" placeholder="e.g. John Doe" />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-text-secondary uppercase tracking-wider text-[10px]">Assigned Role</label>
                <select name="role" required className="w-full px-3.5 py-2 bg-obsidian border border-border-strong/80 rounded-xl text-zinc-100 outline-none focus:border-champagne/50 cursor-pointer">
                  <option value="staff">Floor Staff / Waiter</option>
                  <option value="chef">Kitchen Chef</option>
                  <option value="manager">Restaurant Manager</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-text-secondary uppercase tracking-wider text-[10px]">Email Address</label>
                <input name="email" type="email" className="w-full px-3.5 py-2 bg-obsidian border border-border-strong/80 rounded-xl text-zinc-100 placeholder-zinc-500 outline-none focus:border-champagne/50 focus:ring-1 focus:ring-[#c9a84c]/50" placeholder="e.g. john@thegoldenoak.in" />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-text-secondary uppercase tracking-wider text-[10px]">Phone Contact</label>
                <input name="phone" type="text" className="w-full px-3.5 py-2 bg-obsidian border border-border-strong/80 rounded-xl text-zinc-100 placeholder-zinc-500 outline-none focus:border-champagne/50 focus:ring-1 focus:ring-[#c9a84c]/50" placeholder="e.g. +91 98765 43210" />
              </div>

              <div className="pt-3 flex gap-2 justify-end border-t border-border-subtle">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-text-secondary hover:text-text-primary text-xs font-semibold">
                  Cancel
                </button>
                <button type="submit" disabled={pending} className="px-5 py-2 bg-gradient-to-r from-champagne to-platinum hover:from-[#d8b85b] hover:to-[#f0db99] text-zinc-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-[#c9a84c]/20 disabled:opacity-50">
                  {pending ? 'Saving...' : 'Register Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


export function RemoveEmployeeButton({ id }: { id: string }) {
  const [pending, setPending] = useState(false);

  async function handleRemove() {
    if (!confirm('Are you sure you want to remove this employee?')) return;
    setPending(true);
    await removeEmployeeAction(id);
    setPending(false);
  }

  return (
    <button 
      onClick={handleRemove}
      disabled={pending}
      className="text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/5 hover:bg-red-500/15 border border-red-500/10 hover:border-red-500/30 px-3.5 py-2 rounded-md transition-all duration-300 shadow-sm disabled:opacity-50 hover:shadow-red-500/10"
    >
      {pending ? 'Removing...' : 'Remove'}
    </button>
  );
}

export function ResetPasswordButton({ id, hasEmail }: { id: string, hasEmail: boolean }) {
  const [pending, setPending] = useState(false);

  async function handleReset() {
    if (!hasEmail) {
      alert("This employee does not have an email address. Please edit the employee and add an email address first.");
      return;
    }
    
    if (!confirm("Send a password reset link to this employee's email?")) return;
    
    setPending(true);
    const { adminSendPasswordResetEmail } = await import('@/lib/actions/employee-actions');
    const res = await adminSendPasswordResetEmail(id);
    
    if (res.error) {
      alert(res.error);
    } else {
      alert('Password reset link sent successfully!');
    }
    setPending(false);
  }

  return (
    <button 
      onClick={handleReset}
      disabled={pending || !hasEmail}
      className={`text-xs font-medium px-3.5 py-2 rounded-md transition-all duration-300 border shadow-sm ${
        hasEmail 
          ? 'text-champagne border-champagne/20 bg-champagne/5 hover:bg-champagne/15 hover:border-border-subtle hover:shadow-[#c9a84c]/10' 
          : 'text-text-secondary/70 border-border-subtle bg-transparent cursor-not-allowed'
      } disabled:opacity-50`}
      title={!hasEmail ? "Email address required" : "Send reset link"}
    >
      {pending ? 'Sending...' : 'Send Reset Link'}
    </button>
  );
}
