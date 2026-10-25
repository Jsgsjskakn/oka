'use client';

interface CustomerDetails {
  name: string;
  phone: string;
  email: string;
}

interface CustomerDetailsFormProps {
  details: CustomerDetails;
  onChange: (details: CustomerDetails) => void;
  errors: Partial<Record<keyof CustomerDetails, string>>;
}

export function CustomerDetailsForm({ details, onChange, errors }: CustomerDetailsFormProps) {
  return (
    <div className="px-4 py-6 border-b border-white/5 flex flex-col gap-5">
      <div>
        <h3 className="text-xs font-semibold text-text-primary/40 uppercase tracking-widest mb-4">
          Guest Details
        </h3>
      </div>

      <div>
        <label className="block text-[11px] font-medium text-text-primary/70 mb-1.5 ml-1">
          Full Name *
        </label>
        <input
          type="text"
          value={details.name}
          onChange={(e) => onChange({ ...details, name: e.target.value })}
          placeholder="Enter your full name"
          className={`w-full bg-[#1a1a1a] border rounded-xl px-4 py-3 text-sm text-text-primary placeholder-white/20 focus:outline-none focus:border-primary/50 transition-colors ${
            errors.name ? 'border-red-500' : 'border-border-subtle'
          }`}
        />
        {errors.name && <p className="text-red-400 text-[10px] mt-1 ml-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-[11px] font-medium text-text-primary/70 mb-1.5 ml-1">
          Phone Number *
        </label>
        <div className="flex gap-2">
          <div className="bg-[#1a1a1a] border border-border-subtle rounded-xl px-3 py-3 text-sm text-text-primary/50 flex items-center shrink-0">
            +91
          </div>
          <input
            type="tel"
            value={details.phone}
            onChange={(e) => onChange({ ...details, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
            placeholder="10-digit mobile number"
            className={`w-full bg-[#1a1a1a] border rounded-xl px-4 py-3 text-sm text-text-primary placeholder-white/20 focus:outline-none focus:border-primary/50 transition-colors ${
              errors.phone ? 'border-red-500' : 'border-border-subtle'
            }`}
          />
        </div>
        {errors.phone && <p className="text-red-400 text-[10px] mt-1 ml-1">{errors.phone}</p>}
      </div>

      <div>
        <label className="block text-[11px] font-medium text-text-primary/70 mb-1.5 ml-1">
          Email Address (Optional)
        </label>
        <input
          type="email"
          value={details.email}
          onChange={(e) => onChange({ ...details, email: e.target.value })}
          placeholder="For reservation updates"
          className="w-full bg-[#1a1a1a] border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary placeholder-white/20 focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>
    </div>
  );
}
