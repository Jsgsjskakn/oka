export default function BookingLoading() {
  return (
    <div className="min-h-screen bg-obsidian pb-28 animate-pulse">
      <div className="px-4 py-6 border-b border-white/5 flex flex-col items-center justify-center">
        <div className="h-8 w-48 bg-[#1a1a1a] rounded-md mb-2" />
        <div className="h-4 w-32 bg-[#1a1a1a] rounded-md" />
      </div>

      <div className="max-w-md mx-auto w-full px-4 py-6 flex flex-col gap-8">
        <div>
          <div className="h-4 w-24 bg-[#1a1a1a] rounded-md mb-4" />
          <div className="flex gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-[72px] h-[84px] bg-[#1a1a1a] rounded-xl shrink-0" />
            ))}
          </div>
        </div>

        <div>
          <div className="h-4 w-24 bg-[#1a1a1a] rounded-md mb-4" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-11 bg-[#1a1a1a] rounded-xl" />
            ))}
          </div>
        </div>
        
        <div>
          <div className="h-4 w-32 bg-[#1a1a1a] rounded-md mb-4" />
          <div className="h-14 bg-[#1a1a1a] rounded-xl" />
        </div>
      </div>
    </div>
  );
}
