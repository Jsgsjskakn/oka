'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateEmployeePassword } from '@/lib/actions/employee-actions';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await updateEmployeePassword(password);
    
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push('/employee/login');
      }, 2000);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
        <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-[#333] shadow-2xl w-full max-w-md text-center">
          <h2 className="text-2xl font-semibold text-champagne mb-2">Password Updated!</h2>
          <p className="text-gray-400">Your password has been securely changed.</p>
          <p className="text-gray-500 text-sm mt-4">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-champagne/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-champagne/5 rounded-full blur-3xl" />

      <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-[#333] shadow-2xl w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-2">Update Password</h1>
          <p className="text-gray-400 text-sm">Please enter your new password below.</p>
        </div>

        {error && (
          <div className="bg-red-950/50 border border-red-900 text-red-200 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#0d0d0d] border border-[#333] text-text-primary px-4 py-3 rounded-lg focus:outline-none focus:border-champagne focus:ring-1 focus:ring-[#c9a84c] transition-all"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-[#0d0d0d] border border-[#333] text-text-primary px-4 py-3 rounded-lg focus:outline-none focus:border-champagne focus:ring-1 focus:ring-[#c9a84c] transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-champagne hover:bg-[#b09240] text-black font-semibold py-3 rounded-lg transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Set New Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
