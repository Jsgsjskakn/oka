'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TreePine, AlertCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { signupAction } from '@/lib/auth/convex-auth-actions';
import { useAuthStore } from '@/store/user-store';

function sanitizeRedirect(raw: string | null, fallback = '/booking'): string {
  if (!raw || typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback;
  }
  return trimmed;
}

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = sanitizeRedirect(
    searchParams.get('redirectTo') || searchParams.get('returnUrl'),
    '/booking'
  );
  const supabase = createClient();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // 1. Primary: Convex Signup
      const res = await signupAction({
        email: email.trim(),
        password,
        name: name.trim(),
      });

      if (res.success) {
        if (res.user) {
          useAuthStore.getState().setAuth(
            String(res.user._id || res.user.userId || ''),
            res.user.name || name.trim(),
            res.user.email || email.trim(),
            res.user.phone || null
          );
        }
        router.push(redirectTo);
        router.refresh();
        return;
      }

      if (res.error && !/network|fetch|timeout|unavailable|Signup failed/i.test(res.error)) {
        throw new Error(res.error);
      }

      // 2. Secondary: Supabase Fallback
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        useAuthStore.getState().setAuth(
          data.session.user.id,
          name.trim(),
          data.session.user.email || email.trim()
        );
        // Auto sign-in successful
        router.push(redirectTo);
        router.refresh();
      } else {
        // Require email verification
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-76px)] sm:min-h-[calc(100vh-84px)] bg-[#0a0a0a] flex flex-col justify-center px-4 py-10 pb-24 md:pb-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white/5 backdrop-blur-xl py-8 px-5 shadow rounded-2xl sm:px-10 border border-border-subtle text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <TreePine className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-medium text-text-primary mb-2">Check your email</h3>
            <p className="text-sm text-gray-400 mb-6">
              We&apos;ve sent a verification link to <span className="text-text-primary font-medium">{email}</span>. Please click the link to confirm your account and continue.
            </p>
            <Link
              href={`/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`}
              className="inline-flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-black bg-amber-500 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors w-full"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-76px)] sm:min-h-[calc(100vh-84px)] bg-[#0a0a0a] flex flex-col justify-center px-4 py-8 pb-24 md:pb-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/5 border border-border-subtle flex items-center justify-center mb-3 sm:mb-4">
          <TreePine className="w-7 h-7 sm:w-8 sm:h-8 text-amber-500" />
        </div>
        <h2 className="mt-1 sm:mt-2 text-center text-2xl sm:text-3xl font-light tracking-tight text-text-primary">
          Create an account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Sign up to make reservations and track orders
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/5 backdrop-blur-xl py-7 px-5 shadow rounded-2xl sm:px-10 border border-border-subtle">
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-300"
              >
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-white/10 rounded-lg bg-black/40 placeholder-gray-500 text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent sm:text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300"
              >
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
                  className="appearance-none block w-full px-3 py-2 border border-white/10 rounded-lg bg-black/40 placeholder-gray-500 text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent sm:text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-white/10 rounded-lg bg-black/40 placeholder-gray-500 text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent sm:text-sm"
                  placeholder="At least 6 characters"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-300"
              >
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-white/10 rounded-lg bg-black/40 placeholder-gray-500 text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent sm:text-sm"
                  placeholder="Re-enter your password"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-black bg-amber-500 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Create account'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link
                href={`/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`}
                className="font-medium text-amber-500 hover:text-amber-400"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}
