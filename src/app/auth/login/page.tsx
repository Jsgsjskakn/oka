'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Lock,
  Mail,
  KeyRound,
  ChefHat,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { loginAction, requestPasswordResetAction } from '@/lib/auth/convex-auth-actions';
import { toast } from '@/store/toast-store';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/booking';
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.push(redirectTo);
      }
    };
    checkUser();
  }, [router, redirectTo, supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Convex Authentication Primary
      const res = await loginAction({
        identifier: email,
        password,
      });

      if (res.success) {
        toast.success('Welcome Back', 'Authorized into The Golden Oak Privé Lounge.');
        router.push(redirectTo);
        router.refresh();
        return;
      }

      if (res.error && !res.error.includes('failed')) {
        throw new Error(res.error);
      }

      // 2. Supabase Fallback
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        toast.success('Welcome Back', 'Authorized into The Golden Oak Privé Lounge.');
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication credentials not recognized.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address above to receive your reset link.');
      return;
    }

    try {
      await requestPasswordResetAction(email);
      toast.info('Reset Link Dispatched', 'Password recovery link sent to your email.');
    } catch {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/update-password`,
        });
        if (error) throw error;
        toast.info('Reset Link Dispatched', 'Password recovery link sent to your email.');
      } catch (err: any) {
        setError(err.message || 'Unable to dispatch recovery link.');
      }
    }
  };

  const handleSocialPlaceholder = (provider: string) => {
    toast.info(
      `${provider} Concierge Access`,
      'Please sign in with your Golden Oak credentials for instant privileges.'
    );
  };

  return (
    <div className="min-h-screen bg-[#0D0A08] text-[#FAF5EC] flex flex-col lg:flex-row overflow-x-hidden selection:bg-[#E2A84B] selection:text-[#0D0A08]">
      {/* ========================================================= */}
      {/* LEFT 6 COLUMNS: Visual Atmosphere & Quote Stage           */}
      {/* ========================================================= */}
      <div className="lg:w-1/2 relative min-h-[460px] lg:min-h-screen flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden">
        {/* Background Dining Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/restaurant-backdrop.png"
            alt="The Golden Oak Atmosphere"
            fill
            priority
            className="object-cover scale-105"
          />
          {/* Multi-layered dark vignette overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, rgba(14, 31, 24, 0.92) 0%, rgba(13, 10, 8, 0.94) 75%, rgba(13, 10, 8, 0.98) 100%)',
            }}
          />
        </div>

        {/* Top Header Crest */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex flex-col group">
            <span className="font-serif text-2xl sm:text-3xl font-bold tracking-[0.18em] text-[#FAF5EC] group-hover:text-[#E2A84B] transition-colors">
              THE GOLDEN OAK
            </span>
            <span className="text-[10px] font-mono tracking-[0.3em] text-[#E2A84B] uppercase">
              ARTISANAL DINING · PRIVÉ LOUNGE
            </span>
          </Link>
        </div>

        {/* Center Quote Stage */}
        <div className="relative z-10 my-auto py-10 max-w-lg space-y-4">
          <div className="w-10 h-0.5 bg-[#E2A84B]" />
          <p className="font-serif text-2xl sm:text-3xl lg:text-[32px] font-medium text-[#FAF5EC] leading-snug italic">
            &ldquo;Enter our private digital lounge to reserve bespoke tables, curate your 3D tasting menu, and track live kitchen craft.&rdquo;
          </p>
          <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#E2A84B] font-bold">
            — EXECUTIVE CONCIERGE &amp; MAÎTRE D&apos;
          </p>
        </div>

        {/* Bottom 3 Luxury Privilege Badges */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex flex-wrap items-center gap-3 text-[11px] font-mono text-[#E2A84B]">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-[#E2A84B]/30">
            <Sparkles className="w-3 h-3 text-[#E2A84B]" /> Instant Table Lock
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-[#E2A84B]/30">
            <Sparkles className="w-3 h-3 text-[#E2A84B]" /> 1-Click Reordering
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-[#E2A84B]/30">
            <Sparkles className="w-3 h-3 text-[#E2A84B]" /> Priority Seating
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT 6 COLUMNS: The Velvet Auth Form Card                */}
      {/* ========================================================= */}
      <div className="lg:w-1/2 min-h-screen flex flex-col justify-between p-6 sm:p-12 lg:p-16 relative bg-[#0D0A08] border-l border-[#E2A84B]/[0.08]">
        {/* Top ambient chandelier glow */}
        <div
          className="pointer-events-none absolute -top-24 right-0 w-80 h-80 z-0"
          style={{
            background:
              'radial-gradient(circle at 70% 30%, rgba(226, 168, 75, 0.12) 0%, transparent 70%)',
          }}
        />

        {/* Form Container (max-w: 440px) */}
        <div className="max-w-[440px] w-full mx-auto my-auto relative z-10 space-y-6 pt-4 pb-8">
          {/* Segmented Mode Switcher */}
          <div className="grid grid-cols-2 p-1 rounded-lg bg-[#14100D] border border-[#E2A84B]/25">
            <button
              type="button"
              className="py-2.5 text-xs font-bold rounded-md bg-[#0E1F18] border border-[#E2A84B] text-[#FAF5EC] shadow-md transition-all text-center select-none"
            >
              Sign In
            </button>
            <Link
              href={`/auth/signup?redirectTo=${encodeURIComponent(redirectTo)}`}
              className="py-2.5 text-xs font-semibold rounded-md text-[#9A9286] hover:text-[#FAF5EC] transition-all text-center select-none"
            >
              Request Membership
            </Link>
          </div>

          {/* Form Header */}
          <div className="space-y-1">
            <h2 className="font-serif text-3xl font-bold text-[#FAF5EC] tracking-tight">
              Sign In to Your Lounge
            </h2>
            <p className="text-xs text-[#9A9286] font-light">
              Enter your credentials to access your personal tasting dossier.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input 1: Email Address */}
            <div
              className={`relative rounded-[6px] bg-[#15110E] border transition-all h-[52px] flex flex-col justify-center px-3.5 ${
                emailFocused
                  ? 'border-[#E2A84B] ring-1 ring-[#E2A84B]/30'
                  : 'border-[#E2A84B]/22 hover:border-[#E2A84B]/40'
              }`}
            >
              <label
                htmlFor="email"
                className={`text-[10px] font-mono tracking-widest uppercase transition-all duration-200 select-none ${
                  emailFocused || email ? 'text-[#E2A84B]' : 'text-[#9A9286]'
                }`}
              >
                EMAIL ADDRESS
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="bg-transparent text-xs text-[#FAF5EC] placeholder:text-[#9A9286]/40 outline-none w-full"
              />
            </div>

            {/* Input 2: Password */}
            <div
              className={`relative rounded-[6px] bg-[#15110E] border transition-all h-[52px] flex flex-col justify-center px-3.5 ${
                passwordFocused
                  ? 'border-[#E2A84B] ring-1 ring-[#E2A84B]/30'
                  : 'border-[#E2A84B]/22 hover:border-[#E2A84B]/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className={`text-[10px] font-mono tracking-widest uppercase transition-all duration-200 select-none ${
                    passwordFocused || password ? 'text-[#E2A84B]' : 'text-[#9A9286]'
                  }`}
                >
                  PASSWORD
                </label>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="text-[10px] text-[#E2A84B] hover:underline cursor-pointer"
                >
                  Forgot?
                </button>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="bg-transparent text-xs text-[#FAF5EC] placeholder:text-[#9A9286]/40 outline-none w-full"
              />
            </div>

            {/* Primary CTA Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative overflow-hidden w-full h-[52px] rounded-[6px] text-xs font-extrabold tracking-[0.15em] text-[#0D0A08] transition-all duration-300 hover:brightness-110 active:scale-[0.98] shadow-2xl flex items-center justify-center gap-2 cursor-pointer uppercase mt-2"
              style={{
                background:
                  'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)',
              }}
            >
              <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none animate-shimmer" />
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#0D0A08]" />
              ) : (
                <>
                  <span className="relative z-10 font-bold">ENTER THE GOLDEN OAK</span>
                  <ArrowRight className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:translate-x-1.5 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative py-2 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <span className="relative px-3 bg-[#0D0A08] text-[10px] font-mono tracking-widest text-[#9A9286] uppercase">
              OR CONTINUE WITH
            </span>
          </div>

          {/* Social / Passwordless Glass Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSocialPlaceholder('Google')}
              className="py-2.5 px-3 rounded-[6px] bg-[#17120E] hover:bg-[#1f1914] border border-white/10 text-xs text-[#FAF5EC] flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <span className="font-bold text-[11px]">G</span>
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={() => handleSocialPlaceholder('Magic OTP')}
              className="py-2.5 px-3 rounded-[6px] bg-[#17120E] hover:bg-[#1f1914] border border-white/10 text-xs text-[#FAF5EC] flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#E2A84B]" />
              <span>OTP Link</span>
            </button>
          </div>
        </div>

        {/* Bottom Bar: Staff & Kitchen KDS Access */}
        <div className="pt-6 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#9A9286] relative z-10">
          <Link
            href="/"
            className="hover:text-[#FAF5EC] transition-colors"
          >
            ← Return to Home
          </Link>

          <Link
            href="/employee/login"
            className="hover:text-[#E2A84B] transition-colors flex items-center gap-1.5 font-medium"
          >
            <ChefHat className="w-3.5 h-3.5 text-[#E2A84B]" />
            <span>Staff &amp; Kitchen KDS Access →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0D0A08] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#E2A84B]" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
