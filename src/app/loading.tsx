export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0D0A08] flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="relative flex items-center justify-center mb-6">
        <div className="w-14 h-14 rounded-full border-2 border-[#E2A84B]/20 border-t-[#E2A84B] animate-spin" />
        <div className="absolute w-6 h-6 rounded-full bg-[#E2A84B]/15 blur-sm animate-pulse" />
      </div>
      <p className="font-serif text-xl font-bold text-[#FAF5EC] tracking-wide mb-1.5">
        The Golden Oak
      </p>
      <p className="text-[10px] uppercase font-mono tracking-[0.28em] text-[#E2A84B]">
        Curating Artisanal Gastronomy...
      </p>
    </div>
  );
}
