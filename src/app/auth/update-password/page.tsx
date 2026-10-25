'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Shield, AlertCircle, CheckCircle2 } from 'lucide-react';

function UpdatePasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    
    // Uses the session established by clicking the email link
    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push('/profile');
        router.refresh();
      }, 2000);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-surface border border-border-subtle rounded-lg text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        <h2 className="text-xl font-medium text-text-primary">Password Updated!</h2>
        <p className="text-text-secondary">
          Your password has been changed successfully. You will be redirected shortly...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white/5 backdrop-blur-xl border border-border-subtle rounded-2xl shadow-xl space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <Shield className="w-10 h-10 text-champagne" />
        </div>
        <h1 className="text-2xl font-serif text-champagne">Set New Password</h1>
        <p className="text-text-secondary text-sm">
          Please enter your new password below.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded p-3 flex gap-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">New Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-3 py-2 bg-obsidian border border-border-subtle rounded focus:border-champagne focus:outline-none text-text-primary"
            placeholder="Min. 6 characters"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Confirm New Password</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 bg-obsidian border border-border-subtle rounded focus:border-champagne focus:outline-none text-text-primary"
            placeholder="Confirm your new password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-champagne hover:bg-[#b09240] text-black font-medium rounded transition-colors disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}

export default function UpdatePasswordPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-champagne text-center">Loading...</div>}>
        <UpdatePasswordForm />
      </Suspense>
    </div>
  );
}
