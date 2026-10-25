'use client';

interface SpecialRequestFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function SpecialRequestField({ value, onChange }: SpecialRequestFieldProps) {
  return (
    <div className="px-4 py-6 border-b border-white/5">
      <h3 className="text-xs font-semibold text-text-primary/40 uppercase tracking-widest mb-3">
        Special Requests
      </h3>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, 200))}
          placeholder="E.g. Wheelchair access, corner table..."
          className="w-full bg-[#1a1a1a] border border-border-subtle rounded-xl p-4 text-sm text-text-primary placeholder-white/20 resize-none focus:outline-none focus:border-primary/50 transition-colors"
          rows={3}
          maxLength={200}
        />
        <span className="absolute bottom-4 right-4 text-[10px] text-text-primary/30">
          {value.length}/200
        </span>
      </div>
    </div>
  );
}
