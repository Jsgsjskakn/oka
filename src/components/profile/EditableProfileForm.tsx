'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { updateUserProfileAction } from '@/lib/auth/convex-auth-actions';
import { useAuthStore } from '@/store/user-store';
import { toast } from '@/store/toast-store';

interface EditableProfileFormProps {
  name: string;
  email: string;
  phone: string;
}

function normalizePhoneDigits(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.length > 10 && digits.startsWith('91')) {
    return digits.slice(-10);
  }
  return digits.slice(0, 10);
}

export function EditableProfileForm({ name: initialName, email: initialEmail, phone: initialPhone }: EditableProfileFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialName || '');
  const [phone, setPhone] = useState(() => normalizePhoneDigits(initialPhone || ''));
  const [email] = useState(initialEmail || '');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (phone && phone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSaved(false);

    const formattedPhone = phone ? `+91 ${phone}` : '';
    const res = await updateUserProfileAction({ name: trimmedName, phone: formattedPhone });

    setLoading(false);
    if (res.error) {
      setErrorMessage(res.error);
    } else {
      const store = useAuthStore.getState();
      if (store.userId) {
        store.setAuth(store.userId, trimmedName, email, formattedPhone || null);
      }
      setSaved(true);
      toast.success('Profile Updated', 'Your guest details have been saved.');
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    }
  };

  return (
    <div className="min-h-[calc(100vh-76px)] sm:min-h-[calc(100vh-84px)] bg-obsidian text-text-primary pb-24 md:pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 pb-4 flex items-center gap-3 border-b border-white/5">
        <Link
          href="/profile"
          aria-label="Back to Profile"
          className="w-10 h-10 flex items-center justify-center -ml-2 text-text-primary/70 hover:text-text-primary active:scale-95 rounded-full hover:bg-white/5 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="font-heading text-lg sm:text-xl font-bold">Edit Profile</h1>
      </div>

      <form onSubmit={handleSave} className="px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-5 max-w-2xl mx-auto">
        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs text-center">
            {errorMessage}
          </div>
        )}

        <div className="bg-[#14110e]/90 border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col gap-5">
          <div>
            <label htmlFor="edit-profile-name" className="block text-[11px] font-medium text-text-primary/70 mb-1.5 ml-1">Full Name</label>
            <input
              id="edit-profile-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-[#1a1a1a] border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary placeholder-white/20 focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label htmlFor="edit-profile-phone" className="block text-[11px] font-medium text-text-primary/70 mb-1.5 ml-1">Phone</label>
            <div className="flex gap-2">
              <div className="bg-[#1a1a1a] border border-border-subtle rounded-xl px-3 py-3 text-sm text-text-primary/50 shrink-0">+91</div>
              <input
                id="edit-profile-phone"
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit number"
                className="w-full bg-[#1a1a1a] border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary placeholder-white/20 focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>
          <div>
            <label htmlFor="edit-profile-email" className="block text-[11px] font-medium text-text-primary/70 mb-1.5 ml-1">Email (Read Only)</label>
            <input
              id="edit-profile-email"
              type="email"
              value={email}
              readOnly
              disabled
              className="w-full bg-[#1a1a1a] border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary/50 focus:outline-none opacity-70 cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:max-w-xs sm:self-end mt-2 bg-primary text-black py-3.5 px-6 rounded-full font-semibold text-sm shadow-[0_0_15px_rgba(201,168,76,0.2)] active:scale-[0.98] transition-transform disabled:opacity-70 cursor-pointer"
          >
            {loading ? 'Saving...' : saved ? '✓ Profile Updated' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
