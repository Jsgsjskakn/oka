import { requireEmployee } from '@/lib/auth/employee-auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Activity } from 'lucide-react';
import { EmployeeRealtimeStatus } from '@/components/employee/EmployeeRealtimeStatus';

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforce strict server-side authorization. If not active/authorized, this throws a redirect.
  const employee = await requireEmployee();

  return (
    <div className="min-h-screen bg-obsidian text-text-primary flex flex-col font-sans">
      <header className="bg-obsidian/90 backdrop-blur-xl border-b border-border-subtle px-4 md:px-8 py-4 flex flex-wrap justify-between items-center gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <h1 className="text-champagne font-serif text-2xl tracking-wide flex items-center gap-3">
            The Golden Oak <span className="text-sm text-text-secondary font-sans tracking-widest uppercase hidden sm:inline">— Operations</span>
          </h1>
          <nav className="hidden md:flex gap-6 ml-8 text-sm font-semibold tracking-wide uppercase">
            <Link href="/employee/orders" className="text-text-secondary hover:text-champagne transition-colors">Current Orders</Link>
            <Link href="/employee/orders/history" className="text-text-secondary hover:text-champagne transition-colors">History</Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-4 md:gap-6 text-sm">
          {/* Client component for realtime connection state */}
          <EmployeeRealtimeStatus />
          
          <span className="text-text-secondary hidden sm:inline border-l border-border-subtle pl-6">
            Signed in as <strong className="text-platinum font-medium">{employee.name || 'Employee'}</strong>
          </span>
          <form action={async () => {
            'use server';
            const { signoutAction } = await import('@/lib/auth/convex-auth-actions');
            await signoutAction();
            try {
              const supabase = await createClient();
              await supabase.auth.signOut();
            } catch {
              // ignore
            }
            redirect('/employee/login');
          }}>
            <button type="submit" className="text-text-secondary hover:text-red-400 flex items-center gap-2 transition-colors px-3 py-1.5 rounded-lg border border-transparent hover:border-red-900/50 hover:bg-red-950/20">
              <LogOut size={16} /> <span className="hidden sm:inline font-medium">Logout</span>
            </button>
          </form>
        </div>
      </header>
      
      {/* Mobile Nav */}
      <nav className="md:hidden bg-zinc-950/50 border-b border-border-subtle px-4 py-3 flex gap-6 text-xs font-bold uppercase tracking-wider overflow-x-auto shadow-sm">
        <Link href="/employee/orders" className="whitespace-nowrap text-text-secondary hover:text-champagne transition-colors">Current Orders</Link>
        <Link href="/employee/orders/history" className="whitespace-nowrap text-text-secondary hover:text-champagne transition-colors">History</Link>
      </nav>

      <main className="flex-1 p-4 md:p-8 overflow-auto relative z-0">
        {children}
      </main>
    </div>
  );
}
