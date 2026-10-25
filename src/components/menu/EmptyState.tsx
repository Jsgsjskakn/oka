'use client';

import { SearchX } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

interface EmptyStateProps {
  onClearFilters: () => void;
}

export function EmptyState({ onClearFilters }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[#1a1a1a] border border-white/5 flex items-center justify-center mb-4">
        <SearchX className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="font-heading text-xl font-semibold text-text-primary mb-2">No dishes found</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-[250px]">
        We couldn't find any dishes matching your current search or filters.
      </p>
      <PrimaryButton onClick={onClearFilters}>
        Clear Search & Filters
      </PrimaryButton>
    </div>
  );
}
