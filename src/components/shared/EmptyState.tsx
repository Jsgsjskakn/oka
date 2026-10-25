'use client';

import Link from 'next/link';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ icon, title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-8 py-16">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-5 border border-border-subtle">
        {icon}
      </div>
      <h3 className="font-heading text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-primary/40 mb-6 max-w-xs">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="px-6 py-3 bg-primary text-black text-sm font-semibold rounded-full shadow-[0_0_15px_rgba(201,168,76,0.2)] active:scale-95 transition-transform"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
