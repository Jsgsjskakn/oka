'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction, requestPasswordResetAction } from '@/lib/auth/convex-auth-actions';
import { Sparkles, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Primary: Convex Authentication
      const result = await loginAction({
        identifier: email,
        password,
        roleRequired: 'admin',
      });

      if (result.success) {
        router.push('/admin/dashboard');
        router.refresh();
        return;
      }

      // If Convex rejected with explicit error
      if (result.error) {
        console.warn('[admin-login] Convex login unsuccessful, trying Supabase fallback:', result.error);
      }

      // 2. Secondary: Supabase Fallback
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, is_active')
          .eq('id', data.user.id)
          .single() as { data: { role: string; is_active: boolean } | null; error: unknown };

        if (profile?.role !== 'admin' || !profile?.is_active) {
          await supabase.auth.signOut();
          throw new Error('Access denied. Admin privileges required.');
        }

        router.push('/admin/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address to reset password.');
      return;
    }
    
    try {
      setLoading(true);
      await requestPasswordResetAction(email);
      setError('Password reset link generated (if account exists).');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0d0d0d] flex flex-col justify-center py-12 sm:px-6 lg:px-8 absolute inset-0 z-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center mb-6">
          <Sparkles className="text-champagne w-8 h-8 mr-2" />
          <h2 className="text-center text-3xl font-extrabold text-text-primary tracking-wide">
            The Golden Oak
          </h2>
        </div>
        <h2 className="mt-2 text-center text-xl text-text-secondary">
          Admin Portal Login
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#121212] py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-white/5">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded p-3">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-white/10 rounded-md shadow-sm placeholder-zinc-600 focus:outline-none focus:ring-champagne focus:border-champagne sm:text-sm bg-[#1a1a1a] text-text-primary"
                  placeholder="admin@thegoldenoak.in"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-white/10 rounded-md shadow-sm placeholder-zinc-600 focus:outline-none focus:ring-champagne focus:border-champagne sm:text-sm bg-[#1a1a1a] text-text-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleResetPassword}
                className="text-xs text-text-secondary hover:text-champagne transition-colors"
              >
                Forgot your password?
              </button>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-champagne hover:bg-champagne/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-champagne disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in to Admin Console'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
