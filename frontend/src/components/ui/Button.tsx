import clsx from 'clsx';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline-white' | 'white';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  loading?: boolean;
}

const variantStyles: Record<string, string> = {
  primary:
    'bg-dark text-white hover:bg-[#2d2d2d] dark:bg-orange dark:hover:bg-orange-light border border-transparent',
  secondary:
    'bg-card text-text-primary border border-border-default hover:bg-surface',
  danger:
    'bg-red-500 text-white hover:bg-red-600 border border-transparent',
  ghost:
    'bg-transparent text-text-secondary hover:bg-surface border border-transparent',
  'outline-white':
    'bg-transparent text-white border border-white/40 hover:border-white',
  white:
    'bg-white text-[#1A1A1A] border border-transparent hover:bg-gray-50',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-4 py-2 text-[13px] rounded-xl',
  md: 'px-6 py-3 text-[15px] rounded-2xl',
  lg: 'px-8 py-3.5 text-[16px] rounded-2xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-bold transition-all duration-150 select-none',
        variantStyles[variant],
        sizeStyles[size],
        (disabled || loading) && 'opacity-60 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
