export default function Loading() {
  return (
    <div className="min-h-screen bg-obsidian pb-28 animate-pulse">
      <header className="px-4 py-4 flex items-center border-b border-white/5">
        <div className="w-10 h-10 bg-[#1a1a1a] rounded-md -ml-2" />
        <div className="h-6 w-32 bg-[#1a1a1a] rounded-md ml-2" />
      </header>

      <div className="p-4 flex flex-col gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-4 p-4 bg-[#1a1a1a] rounded-xl border border-white/5">
            <div className="w-24 h-24 bg-[#222] rounded-lg shrink-0" />
            <div className="flex-1 flex flex-col">
              <div className="h-5 w-3/4 bg-[#222] rounded-md mb-2" />
              <div className="h-4 w-1/2 bg-[#222] rounded-md mb-auto" />
              <div className="flex justify-between items-center mt-4">
                <div className="h-5 w-16 bg-[#222] rounded-md" />
                <div className="h-8 w-24 bg-[#222] rounded-md" />
              </div>
            </div>
          </div>
        ))}
        
        <div className="mt-4 h-32 bg-[#1a1a1a] rounded-xl border border-white/5" />
        <div className="mt-4 h-14 bg-[#1a1a1a] rounded-xl" />
      </div>
    </div>
  );
}
