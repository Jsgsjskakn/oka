'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { setupEmployeePassword } from '@/lib/actions/employee-actions';
import { loginAction } from '@/lib/auth/convex-auth-actions';

export default function EmployeeLoginPage() {
  const [viewMode, setViewMode] = useState<'login' | 'setup' | 'forgot'>('login');
  const [identifier, setIdentifier] = useState(''); // Email or Phone
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      // 1. Primary: Convex Authentication
      const convexResult = await loginAction({
        identifier,
        password,
        roleRequired: 'employee',
      });

      if (convexResult.success) {
        router.push('/employee/orders');
        router.refresh();
        return;
      }

      if (convexResult.error) {
        console.warn('[employee-login] Convex login unsuccessful, trying Supabase fallback:', convexResult.error);
      }

      // 2. Secondary: Supabase Fallback
      const isEmail = identifier.includes('@');
      let phoneIdentifier = identifier.trim();
      
      if (!isEmail && !phoneIdentifier.startsWith('+')) {
        phoneIdentifier = `+91${phoneIdentifier.replace(/[^0-9]/g, '')}`;
      }
      
      const credentials = isEmail 
        ? { email: identifier.trim(), password }
        : { phone: phoneIdentifier, password };

      const { data, error: signInError } = await supabase.auth.signInWithPassword(credentials);

      if (signInError) {
        throw new Error(signInError.message);
      }

      if (!data.user) {
        throw new Error('Login failed. Please try again.');
      }

      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('role, is_active')
        .eq('auth_id', data.user.id)
        .single();

      if (employeeError || !employeeData) {
        await supabase.auth.signOut();
        throw new Error('Access denied. Employee accounts only.');
      }

      if (employeeData.role !== 'admin' && employeeData.role !== 'employee' && employeeData.role !== 'staff' && employeeData.role !== 'manager' && employeeData.role !== 'chef') {
        await supabase.auth.signOut();
        throw new Error('Access denied. Insufficient role.');
      }

      if (!employeeData.is_active) {
        await supabase.auth.signOut();
        throw new Error('Your account has been deactivated. Contact admin.');
      }

      router.push('/employee/orders');
      router.refresh();

    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const result = await setupEmployeePassword(identifier, password);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setSuccessMsg('Account setup successfully! You can now sign in.');
      setViewMode('login');
      setPassword('');
      
    } catch (err: any) {
      setError(err.message || 'An error occurred during setup.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const { sendEmployeePasswordResetEmail } = await import('@/lib/actions/employee-actions');
      const result = await sendEmployeePasswordResetEmail(identifier);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setSuccessMsg('If this email is registered, a password reset link has been sent. Please check your inbox.');
      setViewMode('login');
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while sending reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-heading font-extrabold text-platinum tracking-wide">
          Staff Portal
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400">
          The Golden Oak Kitchen & Floor Operations
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900/60 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-border-subtle premium-glass">
          
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-lg bg-zinc-800/80 p-1 mb-6 border border-border-subtle">
            <button
              type="button"
              onClick={() => { setViewMode('login'); setError(null); setSuccessMsg(null); }}
              className={`flex-1 text-xs py-1.5 font-medium rounded-md transition-all ${
                viewMode === 'login' 
                  ? 'bg-zinc-950 text-platinum shadow-sm border border-border-subtle' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setViewMode('setup'); setError(null); setSuccessMsg(null); }}
              className={`flex-1 text-xs py-1.5 font-medium rounded-md transition-all ${
                viewMode === 'setup' 
                  ? 'bg-zinc-950 text-platinum shadow-sm border border-border-subtle' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Set Password
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg p-3">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-lg p-3">
              {successMsg}
            </div>
          )}

          {viewMode === 'login' && (
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Email or 10-Digit Mobile Number
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@thegoldenoak.in or 9876543210"
                  className="w-full bg-zinc-950 border border-border-subtle rounded-xl px-4 py-3 text-sm text-platinum focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-zinc-400">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setViewMode('forgot'); setError(null); }}
                    className="text-xs text-amber-500 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-border-subtle rounded-xl px-4 py-3 text-sm text-platinum focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold rounded-xl py-3 text-sm shadow-lg shadow-amber-500/10 transition-all disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Access Staff Portal'}
              </button>
            </form>
          )}

          {viewMode === 'setup' && (
            <form className="space-y-6" onSubmit={handleSetup}>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Email or Mobile (Must match Admin Roster)
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="staff@thegoldenoak.in"
                  className="w-full bg-zinc-950 border border-border-subtle rounded-xl px-4 py-3 text-sm text-platinum focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Create New Password (min. 6 characters)
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-border-subtle rounded-xl px-4 py-3 text-sm text-platinum focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-black font-semibold rounded-xl py-3 text-sm shadow-lg shadow-emerald-500/10 transition-all disabled:opacity-50"
              >
                {loading ? 'Saving Setup...' : 'Set Up Password'}
              </button>
            </form>
          )}

          {viewMode === 'forgot' && (
            <form className="space-y-6" onSubmit={handleForgot}>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Registered Staff Email
                </label>
                <input
                  type="email"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="staff@thegoldenoak.in"
                  className="w-full bg-zinc-950 border border-border-subtle rounded-xl px-4 py-3 text-sm text-platinum focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('login')}
                  className="w-1/3 bg-zinc-800 text-zinc-300 font-medium rounded-xl py-3 text-sm hover:bg-zinc-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl py-3 text-sm transition-all disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
