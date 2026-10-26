'use client';

import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { updateUserProfileAction } from '@/lib/auth/convex-auth-actions';

interface EditableProfileFormProps {
  name: string;
  email: string;
  phone: string;
}

export function EditableProfileForm({ name: initialName, email: initialEmail, phone: initialPhone }: EditableProfileFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialName || '');
  const [phone, setPhone] = useState(initialPhone || '');
  const [email] = useState(initialEmail || '');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSave = async () => {
    setLoading(true);
    setErrorMessage('');
    setSaved(false);

    const res = await updateUserProfileAction({ name, phone });

    setLoading(false);
    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-obsidian text-text-primary">
      <div className="px-4 py-5 flex items-center gap-3 border-b border-white/5 sticky top-0 bg-obsidian z-40">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center -ml-2 text-text-primary/70 hover:text-text-primary active:scale-95">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="font-heading text-lg font-bold">Edit Profile</h1>
      </div>

      <div className="px-4 py-6 flex flex-col gap-5 max-w-md mx-auto">
        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs text-center">
            {errorMessage}
          </div>
        )}

        <div>
          <label className="block text-[11px] font-medium text-text-primary/70 mb-1.5 ml-1">Full Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
            className="w-full bg-[#1a1a1a] border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary placeholder-white/20 focus:outline-none focus:border-primary/50" />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-text-primary/70 mb-1.5 ml-1">Phone</label>
          <div className="flex gap-2">
            <div className="bg-[#1a1a1a] border border-border-subtle rounded-xl px-3 py-3 text-sm text-text-primary/50 shrink-0">+91</div>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit number"
              className="w-full bg-[#1a1a1a] border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary placeholder-white/20 focus:outline-none focus:border-primary/50" />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-text-primary/70 mb-1.5 ml-1">Email (Read Only)</label>
          <input type="email" value={email} readOnly disabled
            className="w-full bg-[#1a1a1a] border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary/50 focus:outline-none opacity-70 cursor-not-allowed" />
        </div>

        <button onClick={handleSave} disabled={loading}
          className="w-full mt-4 bg-primary text-black py-3.5 rounded-full font-semibold text-sm shadow-[0_0_15px_rgba(201,168,76,0.2)] active:scale-[0.98] transition-transform disabled:opacity-70">
          {loading ? 'Saving...' : saved ? 'Profile Updated' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
