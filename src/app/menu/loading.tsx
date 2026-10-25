export default function MenuLoading() {
  return (
    <div className="flex flex-col w-full animate-pulse min-h-screen bg-obsidian">
      {/* Header */}
      <div className="pt-8 pb-4 px-4 flex flex-col items-center">
        <div className="h-8 w-40 bg-white/10 rounded-md mb-2" />
        <div className="h-4 w-48 bg-white/5 rounded-md" />
      </div>

      {/* Search */}
      <div className="px-4 mb-4">
        <div className="w-full h-12 rounded-full bg-[#1a1a1a] border border-white/5" />
      </div>

      {/* Categories */}
      <div className="px-4 py-3 border-b border-white/5 flex gap-3 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-10 w-24 flex-none bg-[#1a1a1a] rounded-full border border-white/5" />
        ))}
      </div>

      {/* Filters/Sort */}
      <div className="px-4 py-6 flex gap-3">
        <div className="flex-1 h-10 rounded-xl bg-[#1a1a1a] border border-white/5" />
        <div className="flex-1 h-10 rounded-xl bg-[#1a1a1a] border border-white/5" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-12">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col w-full bg-[#111] rounded-2xl overflow-hidden border border-white/5">
            <div className="aspect-[4/3] w-full bg-[#1a1a1a]" />
            <div className="p-3">
              <div className="h-4 w-3/4 bg-white/10 rounded-md mb-2" />
              <div className="h-3 w-full bg-white/5 rounded-md mb-1" />
              <div className="h-3 w-1/2 bg-white/5 rounded-md mb-3" />
              <div className="h-4 w-1/3 bg-champagne/20 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
