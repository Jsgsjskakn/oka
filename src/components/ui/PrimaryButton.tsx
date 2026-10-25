'use client';

import { Loader2 } from 'lucide-react';
import { ButtonHTMLAttributes } from 'react';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function PrimaryButton({ 
  children, 
  isLoading, 
  fullWidth, 
  icon, 
  iconPosition = 'left', 
  className = '', 
  ...props 
}: PrimaryButtonProps) {
  return (
    <button
      className={`
        relative overflow-hidden group flex items-center justify-center gap-2
        bg-gradient-to-r from-champagne to-[#d4af37]
        text-black font-semibold rounded-xl
        px-6 py-3 min-h-[48px] transition-all duration-300
        hover:shadow-[0_0_20px_rgba(201,168,76,0.3)]
        active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
      
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="z-10">{icon}</span>}
          <span className="z-10">{children}</span>
          {icon && iconPosition === 'right' && <span className="z-10">{icon}</span>}
        </>
      )}
    </button>
  );
}
