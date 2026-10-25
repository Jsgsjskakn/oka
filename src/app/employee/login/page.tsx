'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { setupEmployeePassword } from '@/lib/actions/employee-actions';
import { loginAction } from '@/lib/auth/convex-auth-actions';
import { UtensilsCrossed, ShieldCheck, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EmployeeLoginPage() {
  const [viewMode, setViewMode] = useState<'login' | 'setup' | 'forgot'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        console.warn(
          '[employee-login] Convex login unsuccessful, trying Supabase fallback:',
          convexResult.error
        );
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

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword(credentials);

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

      if (
        employeeData.role !== 'admin' &&
        employeeData.role !== 'employee' &&
        employeeData.role !== 'staff' &&
        employeeData.role !== 'manager' &&
        employeeData.role !== 'chef'
      ) {
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
      setError(err.message || 'An error occurred during staff login.');
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

      setSuccessMsg('Account credentials setup successfully! You can now sign in.');
      setViewMode('login');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'An error occurred during password setup.');
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
      const { sendEmployeePasswordResetEmail } = await import(
        '@/lib/actions/employee-actions'
      );
      const result = await sendEmployeePasswordResetEmail(identifier);

      if (result.error) {
        throw new Error(result.error);
      }

      setSuccessMsg(
        'If this email is registered, a password reset link has been sent. Please check your inbox.'
      );
      setViewMode('login');
    } catch (err: any) {
      setError(err.message || 'An error occurred while sending reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060e08] text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      {/* Background Ambience */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-br from-[#0c2415]/30 via-[#060e08] to-[#040905]" />
      <div className="pointer-events-none fixed top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-[#d4af37]/08 blur-3xl z-0" />
      <div className="pointer-events-none fixed bottom-1/4 left-1/3 w-[400px] h-[300px] rounded-full bg-[#1b4327]/20 blur-3xl z-0" />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#d4af37] via-[#c5a059] to-[#8a6828] text-black shadow-md shadow-[#d4af37]/20 group-hover:scale-105 transition-transform">
            <UtensilsCrossed className="w-4 h-4 text-black" />
          </span>
          <span className="font-heading text-xl font-bold tracking-tight text-white">
            The Golden Oak
          </span>
        </Link>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1.5">
          Staff &amp; Operations Portal
        </h1>
        <p className="text-xs text-white/55">
          Kitchen Display (KDS), Waitstaff, Floor Hosts, &amp; Management
        </p>
      </div>

      <div className="mt-7 relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#09150d]/85 backdrop-blur-2xl py-7 px-5 sm:px-9 rounded-3xl border border-[#d4af37]/25 shadow-[0_24px_60px_rgba(0,0,0,0.65)]">
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-[#061209] p-1 mb-5 border border-white/[0.08]">
            <button
              type="button"
              onClick={() => {
                setViewMode('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 text-xs py-2 font-semibold rounded-lg transition-all ${
                viewMode === 'login'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#b38936] text-black shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('setup');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 text-xs py-2 font-semibold rounded-lg transition-all ${
                viewMode === 'setup'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#b38936] text-black shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              First-Time Setup
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl p-3 leading-relaxed">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 bg-[#3EE094]/10 border border-[#3EE094]/30 text-[#3EE094] text-xs rounded-xl p-3 leading-relaxed">
              {successMsg}
            </div>
          )}

          {/* VIEW: LOGIN */}
          {viewMode === 'login' && (
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">
                  Email or 10-Digit Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="staff@thegoldenoak.in or 9990774565"
                  className="w-full bg-[#061209] border border-white/10 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-white/70">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('forgot');
                      setError(null);
                    }}
                    className="text-xs text-[#d4af37] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#061209] border border-white/10 rounded-xl pl-4 pr-11 py-3 text-xs sm:text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#d4af37]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#d4af37] via-[#c5a059] to-[#a88232] text-black font-extrabold rounded-xl py-3.5 text-xs sm:text-sm shadow-[0_10px_25px_rgba(212,175,55,0.25)] hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-black" />
                    <span>Access Operations Portal</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* VIEW: SETUP */}
          {viewMode === 'setup' && (
            <form className="space-y-4" onSubmit={handleSetup}>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">
                  Email or Phone (On Staff Directory)
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="staff@thegoldenoak.in"
                  className="w-full bg-[#061209] border border-white/10 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">
                  Create Password (minimum 6 characters)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#061209] border border-white/10 rounded-xl pl-4 pr-11 py-3 text-xs sm:text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#d4af37]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#3EE094] to-[#25b573] text-black font-extrabold rounded-xl py-3.5 text-xs sm:text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Saving Setup...</span>
                  </>
                ) : (
                  <span>Set Up Password &amp; Activate</span>
                )}
              </button>
            </form>
          )}

          {/* VIEW: FORGOT */}
          {viewMode === 'forgot' && (
            <form className="space-y-4" onSubmit={handleForgot}>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">
                  Registered Staff Email
                </label>
                <input
                  type="email"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="staff@thegoldenoak.in"
                  className="w-full bg-[#061209] border border-white/10 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setViewMode('login')}
                  className="w-1/3 bg-white/[0.05] border border-white/10 text-white/80 font-medium rounded-xl py-3 text-xs hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 bg-gradient-to-r from-[#d4af37] to-[#b38936] text-black font-extrabold rounded-xl py-3 text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Customer Dining Lounge</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
