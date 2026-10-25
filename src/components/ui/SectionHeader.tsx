'use client';

import Link from 'next/link';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  viewAllLink?: string;
}

export function SectionHeader({ title, subtitle, viewAllLink }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between mb-6 px-4">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-text-primary mb-1 relative inline-block">
          {title}
          <div className="absolute -bottom-1 left-0 w-1/2 h-[2px] bg-primary rounded-full"></div>
        </h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>
        )}
      </div>
      
      {viewAllLink && (
        <Link 
          href={viewAllLink}
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          View All
        </Link>
      )}
    </div>
  );
}
