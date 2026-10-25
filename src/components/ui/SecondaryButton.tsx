'use client';

import { Loader2 } from 'lucide-react';
import { ButtonHTMLAttributes } from 'react';

interface SecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function SecondaryButton({ 
  children, 
  isLoading, 
  fullWidth, 
  icon, 
  iconPosition = 'left', 
  className = '', 
  ...props 
}: SecondaryButtonProps) {
  return (
    <button
      className={`
        flex items-center justify-center gap-2
        bg-transparent border border-champagne
        text-champagne font-medium rounded-xl
        px-6 py-3 min-h-[48px] transition-all duration-300
        hover:bg-champagne/10 active:scale-[0.98] 
        disabled:opacity-70 disabled:pointer-events-none
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {icon && iconPosition === 'left' && <span>{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === 'right' && <span>{icon}</span>}
        </>
      )}
    </button>
  );
}
