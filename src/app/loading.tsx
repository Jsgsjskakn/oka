export default function Loading() {
  return (
    <div className="flex flex-col w-full animate-pulse">
      {/* Hero Skeleton */}
      <div className="w-full h-[75vh] min-h-[500px] bg-[#111] relative -mt-16">
        <div className="absolute bottom-8 left-6 w-[80%] max-w-[300px]">
          <div className="h-6 w-24 bg-white/10 rounded-full mb-4" />
          <div className="h-10 w-3/4 bg-white/10 rounded-md mb-3" />
          <div className="h-5 w-1/2 bg-white/5 rounded-md mb-6" />
          <div className="flex gap-4">
            <div className="h-12 flex-1 bg-white/10 rounded-xl" />
            <div className="h-12 flex-1 bg-white/10 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="px-4 py-8 -mt-6 relative z-30">
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-[#1a1a1a] rounded-2xl border border-white/5" />
          ))}
        </div>
      </div>

      {/* Categories Skeleton */}
      <div className="py-6 px-4">
        <div className="flex justify-between mb-6">
          <div className="h-8 w-32 bg-white/10 rounded-md" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 w-24 flex-none bg-[#1a1a1a] rounded-full border border-white/5" />
          ))}
        </div>
      </div>

      {/* Featured Skeleton */}
      <div className="py-6 px-4">
        <div className="flex justify-between mb-6">
          <div className="h-8 w-40 bg-white/10 rounded-md" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-[320px] w-[280px] flex-none bg-[#111] rounded-2xl border border-white/5" />
          ))}
        </div>
      </div>
    </div>
  );
}
