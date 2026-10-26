'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0d0d0d] text-[#f4efe6] flex flex-col items-center justify-center p-6 text-center font-sans antialiased">
        <div className="w-16 h-16 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/30 flex items-center justify-center mb-6 text-[#c9a84c]">
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 3c0 4.5-2.5 7-7 7 4.5 0 7 2.5 7 7 0-4.5 2.5-7 7-7-4.5 0-7-2.5-7-7z" fill="currentColor" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">The Golden Oak</h1>
        <p className="text-sm text-[#f4efe6]/60 max-w-xs mb-8">
          The system encountered a root layout exception. Please reload to resume your dining session.
        </p>
        <button
          onClick={() => reset()}
          className="py-3 px-8 rounded-full bg-[#c9a84c] text-black font-semibold text-sm active:scale-95 transition-transform cursor-pointer shadow-[0_0_20px_rgba(201,168,76,0.3)]"
        >
          Reload Experience
        </button>
      </body>
    </html>
  );
}
