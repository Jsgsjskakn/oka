'use client';

export function MenuHeader() {
  return (
    <div className="pt-12 pb-8 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto relative z-10">
      {/* Overline — THE CULINARY ARCHIVE — */}
      <div className="flex items-center justify-center gap-3 mb-3.5">
        <span className="w-8 h-[1px] bg-[#E2A84B]/40" />
        <span className="text-[11px] uppercase tracking-[0.3em] text-[#E2A84B] font-bold">
          THE CULINARY ARCHIVE
        </span>
        <span className="w-8 h-[1px] bg-[#E2A84B]/40" />
      </div>

      {/* Main Headline: Cormorant Garamond 56px with Molten Gold Italic */}
      <h1 className="font-serif text-3xl sm:text-5xl lg:text-[56px] font-bold text-[#FAF5EC] mb-4 tracking-tight leading-[1.08]">
        Gourmet Dishes &amp;{' '}
        <span className="italic text-[#E2A84B] font-normal block sm:inline">
          Signature Craft
        </span>
      </h1>

      {/* Subtitle */}
      <p className="text-sm sm:text-base text-[#B5ADA2] max-w-xl mx-auto leading-relaxed font-light">
        Browse hand-stretched wood-fired sourdough pizzas, handcrafted smash burgers, aromatic charcoal tandoor delicacies, and street fusion specialties.
      </p>
    </div>
  );
}
