import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const buttonVariants = {
  variant: {
    default: 'bg-slate-800 text-white hover:bg-slate-700',
    destructive: 'bg-red-500 text-white hover:bg-red-600',
    outline: 'border border-slate-300 bg-transparent hover:bg-slate-100',
    secondary: 'bg-slate-200 text-slate-800 hover:bg-slate-300',
    ghost: 'hover:bg-slate-100',
    link: 'text-blue-600 underline-offset-4 hover:underline'
  },
  size: {
    default: 'px-4 py-2',
    sm: 'px-3 py-1.5 text-sm',
    lg: 'px-6 py-3 text-lg',
    icon: 'h-10 w-10'
  }
};

export function Button({ 
  children, 
  className = '', 
  variant = 'default',
  size = 'default',
  ...props 
}: ButtonProps) {
  const variantClass = buttonVariants.variant[variant];
  const sizeClass = buttonVariants.size[size];
  
  return (
    <button
      className={cn(
        'rounded font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
        variantClass,
        sizeClass,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export { buttonVariants };
export default Button;
