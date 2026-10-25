export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-obsidian pb-28 animate-pulse">
      <div className="px-4 py-5 flex items-center gap-3 border-b border-white/5">
        <div className="w-10 h-10 bg-[#1a1a1a] rounded-md" />
        <div>
          <div className="h-5 w-24 bg-[#1a1a1a] rounded-md mb-1" />
          <div className="h-3 w-32 bg-[#1a1a1a] rounded-md" />
        </div>
      </div>

      <div className="px-4 py-6 flex flex-col gap-8">
        <div>
          <div className="h-3 w-20 bg-[#1a1a1a] rounded-md mb-4" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 bg-[#1a1a1a] rounded-xl" />
            <div className="h-24 bg-[#1a1a1a] rounded-xl" />
          </div>
        </div>

        <div>
          <div className="h-3 w-28 bg-[#1a1a1a] rounded-md mb-4" />
          <div className="h-14 bg-[#1a1a1a] rounded-xl mb-3" />
          <div className="h-14 bg-[#1a1a1a] rounded-xl mb-3" />
          <div className="h-14 bg-[#1a1a1a] rounded-xl" />
        </div>

        <div className="h-32 bg-[#1a1a1a] rounded-xl" />
      </div>
    </div>
  );
}
