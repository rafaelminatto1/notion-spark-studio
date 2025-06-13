import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMicroInteractions } from '@/hooks/useMicroInteractions';

// Context para micro-interactions globais
interface MicroInteractionsContextType {
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  setLoadingState: (id: string, isLoading: boolean) => void;
  errorStates: Record<string, string>;
  setErrorState: (id: string, message: string | null) => void;
}

const MicroInteractionsContext = createContext<MicroInteractionsContextType | null>(null);

export const useMicroInteractions = () => {
  const context = useContext(MicroInteractionsContext);
  if (!context) {
    throw new Error('useMicroInteractions must be used within MicroInteractionsProvider');
  }
  return context;
};

// Provider para micro-interactions
export const MicroInteractionsProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    timestamp: number;
  }>>([]);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errorStates, setErrorStatesState] = useState<Record<string, string>>({});

  // Haptic feedback
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [50],
        heavy: [100, 50, 100]
      };
      navigator.vibrate(patterns[type]);
    }
  }, []);

  // Toast notifications
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast = { id, message, type, timestamp: Date.now() };
    
    setToasts(prev => [...prev, toast]);
    
    // Trigger haptic feedback
    triggerHaptic(type === 'error' ? 'heavy' : type === 'success' ? 'medium' : 'light');
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, [triggerHaptic]);

  // Loading states
  const setLoadingState = useCallback((id: string, isLoading: boolean) => {
    setLoadingStates(prev => {
      if (!isLoading) {
        const { [id]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: true };
    });
  }, []);

  // Error states
  const setErrorState = useCallback((id: string, message: string | null) => {
    setErrorStatesState(prev => {
      if (!message) {
        const { [id]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: message };
    });
  }, []);

  const value = {
    triggerHaptic,
    showToast,
    setLoadingState,
    errorStates,
    setErrorState
  };

  return (
    <MicroInteractionsContext.Provider value={value}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map(toast => (
            <ToastNotification 
              key={toast.id} 
              toast={toast}
              onRemove={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            />
          ))}
        </AnimatePresence>
      </div>
    </MicroInteractionsContext.Provider>
  );
};

// Componente de Toast
interface ToastProps {
  toast: {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    timestamp: number;
  };
  onRemove: () => void;
}

const ToastNotification: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info
  };

  const colors = {
    success: 'bg-green-900 border-green-700 text-green-100',
    error: 'bg-red-900 border-red-700 text-red-100',
    info: 'bg-blue-900 border-blue-700 text-blue-100'
  };

  const Icon = icons[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.3 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.3 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg border shadow-xl backdrop-blur max-w-sm",
        colors[toast.type]
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={onRemove}
        className="text-white/70 hover:text-white transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
};

// Smart Skeleton - Loading placeholder inteligente
interface SmartSkeletonProps {
  isLoading: boolean;
  children: React.ReactNode;
  variant?: 'text' | 'card' | 'avatar' | 'button';
  className?: string;
  lines?: number;
}

export const SmartSkeleton: React.FC<SmartSkeletonProps> = ({
  isLoading,
  children,
  variant = 'text',
  className,
  lines = 3
}) => {
  if (!isLoading) {
    return <>{children}</>;
  }

  const skeletonVariants = {
    text: (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: lines }).map((_, index) => (
          <motion.div
            key={index}
            className={cn(
              "h-4 bg-gray-300 dark:bg-gray-700 rounded animate-pulse",
              index === lines - 1 ? "w-3/4" : "w-full"
            )}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.1 }}
          />
        ))}
      </div>
    ),
    card: (
      <motion.div 
        className={cn("p-4 border rounded-lg space-y-3", className)}
        initial={{ opacity: 0.3 }}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6 animate-pulse" />
        </div>
      </motion.div>
    ),
    avatar: (
      <motion.div 
        className={cn("h-10 w-10 bg-gray-300 dark:bg-gray-700 rounded-full", className)}
        initial={{ opacity: 0.3 }}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    ),
    button: (
      <motion.div 
        className={cn("h-10 w-24 bg-gray-300 dark:bg-gray-700 rounded", className)}
        initial={{ opacity: 0.3 }}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    )
  };

  return skeletonVariants[variant];
};

// Interactive Button com micro-interactions
interface InteractiveButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  hapticFeedback?: 'light' | 'medium' | 'heavy';
}

export const InteractiveButton: React.FC<InteractiveButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className,
  hapticFeedback = 'light'
}) => {
  const { triggerHaptic } = useMicroInteractions();
  const controls = useAnimation();

  const handleClick = useCallback(() => {
    if (disabled || isLoading) return;
    
    // Trigger haptic feedback
    triggerHaptic(hapticFeedback);
    
    // Trigger click animation
    controls.start({
      scale: [1, 0.95, 1],
      transition: { duration: 0.15 }
    });
    
    onClick?.();
  }, [disabled, isLoading, triggerHaptic, hapticFeedback, controls, onClick]);

  const variants = {
    primary: 'bg-notion-purple hover:bg-notion-purple-hover text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <motion.button
      animate={controls}
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn(
        "relative rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2",
        "focus:outline-none focus:ring-2 focus:ring-notion-purple focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
    >
      {isLoading && (
        <Loader2 className="h-4 w-4 animate-spin" />
      )}
      {children}
    </motion.button>
  );
};

// Error State Component
interface ErrorStateProps {
  id: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const ErrorBoundary: React.FC<ErrorStateProps> = ({ 
  id, 
  fallback, 
  children, 
  className 
}) => {
  const { errorStates } = useMicroInteractions();
  const error = errorStates[id];

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg",
          className
        )}
      >
        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            Erro
          </p>
          <p className="text-sm text-red-600 dark:text-red-300">
            {error}
          </p>
        </div>
      </motion.div>
    );
  }

  return <>{children}</>;
};

// Page Transition Component
interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  className 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ 
        type: "spring", 
        damping: 20, 
        stiffness: 300 
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Export das funcionalidades principais
export { MicroInteractionsProvider };
export default useMicroInteractions; 