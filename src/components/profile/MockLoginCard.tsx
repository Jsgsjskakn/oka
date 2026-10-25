import Link from 'next/link';

export function MockLoginCard() {
  return (
    <div className="px-4 py-8 max-w-md mx-auto">
      <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 text-center">
        <h2 className="font-heading text-lg font-bold text-text-primary mb-2">Welcome to The Golden Oak</h2>
        <p className="text-sm text-text-primary/60 mb-6">Sign in to manage your bookings and orders</p>
        
        <Link 
          href="/auth/login"
          className="block w-full bg-primary text-black py-3.5 rounded-full font-semibold text-sm shadow-[0_0_15px_rgba(201,168,76,0.2)] active:scale-[0.98] transition-transform"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
