import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateOptimizedProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'search' | 'error';
}

export const EmptyStateOptimized: React.FC<EmptyStateOptimizedProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  size = 'md',
  variant = 'default'
}) => {
  const sizeClasses = {
    sm: {
      container: 'py-8 px-4',
      icon: 'w-8 h-8',
      iconContainer: 'p-3',
      title: 'text-sm',
      description: 'text-xs',
      button: 'text-xs px-3 py-1.5'
    },
    md: {
      container: 'py-12 px-6',
      icon: 'w-12 h-12',
      iconContainer: 'p-4',
      title: 'text-base',
      description: 'text-sm',
      button: 'text-sm px-4 py-2'
    },
    lg: {
      container: 'py-16 px-8',
      icon: 'w-16 h-16',
      iconContainer: 'p-6',
      title: 'text-lg',
      description: 'text-base',
      button: 'text-base px-6 py-3'
    }
  };

  const variantClasses = {
    default: {
      iconBg: 'bg-slate-100 dark:bg-slate-800',
      iconColor: 'text-slate-400 dark:text-slate-500',
      title: 'text-slate-600 dark:text-slate-300',
      description: 'text-slate-500 dark:text-slate-400',
      button: 'bg-emerald-600 hover:bg-emerald-700 text-white'
    },
    search: {
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-400 dark:text-blue-500',
      title: 'text-slate-600 dark:text-slate-300',
      description: 'text-slate-500 dark:text-slate-400',
      button: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    error: {
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-400 dark:text-red-500',
      title: 'text-slate-600 dark:text-slate-300',
      description: 'text-slate-500 dark:text-slate-400',
      button: 'bg-red-600 hover:bg-red-700 text-white'
    }
  };

  const currentSize = sizeClasses[size];
  const currentVariant = variantClasses[variant];

  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      currentSize.container,
      className
    )}>
      {/* Icon com animação */}
      <div className={cn(
        "rounded-full mb-4 transition-all duration-300 hover:scale-105",
        currentSize.iconContainer,
        currentVariant.iconBg
      )}>
        <Icon className={cn(
          "transition-colors duration-200",
          currentSize.icon,
          currentVariant.iconColor
        )} />
      </div>

      {/* Title */}
      <h3 className={cn(
        "font-medium mb-2 transition-colors duration-200",
        currentSize.title,
        currentVariant.title
      )}>
        {title}
      </h3>

      {/* Description */}
      <p className={cn(
        "mb-4 max-w-sm transition-colors duration-200",
        currentSize.description,
        currentVariant.description
      )}>
        {description}
      </p>

      {/* Action Button */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className={cn(
            "inline-flex items-center gap-2 font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl",
            currentSize.button,
            currentVariant.button
          )}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}; 