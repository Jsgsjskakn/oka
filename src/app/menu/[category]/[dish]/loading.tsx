export default function Loading() {
  return (
    <div className="min-h-screen bg-obsidian pb-28 animate-pulse">
      {/* Hero Skeleton */}
      <div className="w-full aspect-square bg-[#1a1a1a]" />
      
      {/* Info Skeleton */}
      <div className="px-4 py-6">
        <div className="h-8 bg-[#1a1a1a] rounded-md w-3/4 mb-4" />
        <div className="h-4 bg-[#1a1a1a] rounded-md w-full mb-2" />
        <div className="h-4 bg-[#1a1a1a] rounded-md w-5/6" />
        
        <div className="flex gap-2 mt-6">
          <div className="h-6 w-20 bg-[#1a1a1a] rounded-md" />
          <div className="h-6 w-20 bg-[#1a1a1a] rounded-md" />
        </div>
      </div>
      
      {/* Separator */}
      <div className="h-px w-full bg-white/5" />
      
      {/* Ingredients Skeleton */}
      <div className="px-4 py-6">
        <div className="h-4 bg-[#1a1a1a] rounded-md w-32 mb-4" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 w-24 bg-[#1a1a1a] rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
