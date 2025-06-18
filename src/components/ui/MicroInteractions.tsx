import React, { useCallback, useState, createContext, useContext } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, Info, X, Loader2, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// Tipos de feedback haptic
export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

// Tipos de loading states
export type LoadingStateType = 'skeleton' | 'progressive' | 'contextual' | 'pulse';

// Interface para configurações de micro-interactions
export interface MicroInteractionSettings {
  enableHaptics: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  reducedMotion: boolean;
  enableSounds: boolean;
}

// Hook principal para micro-interactions
export const useMicroInteractions = (settings?: Partial<MicroInteractionSettings>) => {
  const defaultSettings: MicroInteractionSettings = {
    enableHaptics: true,
    animationSpeed: 'normal',
    reducedMotion: false,
    enableSounds: false,
    ...settings
  };

  // Função para trigger haptic feedback
  const triggerHaptic = useCallback((type: HapticType = 'light') => {
    if (!defaultSettings.enableHaptics || !navigator.vibrate) return;

    const patterns: Record<HapticType, number[]> = {
      light: [10],
      medium: [50],
      heavy: [100],
      success: [50, 50, 100],
      warning: [100, 50, 100],
      error: [100, 50, 100, 50, 100]
    };

    try {
      navigator.vibrate(patterns[type]);
    } catch (error) {
      console.warn('Haptic feedback não suportado:', error);
    }
  }, [defaultSettings.enableHaptics]);

  // Função para mostrar toast com feedback
  const showToast = useCallback((
    message: string, 
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    options?: { haptic?: boolean; duration?: number }
  ) => {
    const { haptic = true, duration = 3000 } = options || {};

    // Trigger haptic feedback
    if (haptic) {
      triggerHaptic(type === 'success' ? 'success' : type === 'error' ? 'error' : 'light');
    }

    // Configurações do toast baseadas no tipo
    const toastConfig = {
      success: { icon: '✅', style: { background: '#10B981', color: 'white' } },
      error: { icon: '❌', style: { background: '#EF4444', color: 'white' } },
      warning: { icon: '⚠️', style: { background: '#F59E0B', color: 'white' } },
      info: { icon: '💡', style: { background: '#3B82F6', color: 'white' } }
    };

    const config = toastConfig[type];
    
    toast(message, {
      icon: config.icon,
      style: config.style,
      duration,
      className: 'font-medium'
    });
  }, [triggerHaptic]);

  // Função para feedback de interação
  const triggerInteractionFeedback = useCallback((
    type: 'click' | 'hover' | 'focus' | 'success' | 'error' = 'click'
  ) => {
    const hapticMap: Record<string, HapticType> = {
      click: 'light',
      hover: 'light',
      focus: 'light',
      success: 'success',
      error: 'error'
    };

    triggerHaptic(hapticMap[type]);
  }, [triggerHaptic]);

  return {
    triggerHaptic,
    showToast,
    triggerInteractionFeedback,
    settings: defaultSettings
  };
};

// Context para Error States globais
interface ErrorContextType {
  errors: Record<string, string>;
  setError: (id: string, message: string | null) => void;
  clearError: (id: string) => void;
  clearAllErrors: () => void;
}

const ErrorContext = createContext<ErrorContextType | null>(null);

export const ErrorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setError = useCallback((id: string, message: string | null) => {
    setErrors(prev => {
      if (!message) {
        const { [id]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: message };
    });
  }, []);

  const clearError = useCallback((id: string) => {
    setErrors(prev => {
      const { [id]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  return (
    <ErrorContext.Provider value={{ errors, setError, clearError, clearAllErrors }}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useErrorState = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorState must be used within ErrorProvider');
  }
  return context;
};

// Componente de Loading Skeleton inteligente
export interface SmartSkeletonProps {
  lines?: number;
  className?: string;
  isLoading: boolean;
  children: React.ReactNode;
}

export const SmartSkeleton: React.FC<SmartSkeletonProps> = ({
  lines = 3,
  className = '',
  isLoading,
  children
}) => {
  if (!isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          className="h-4 bg-gray-600 rounded"
          style={{
            width: `${Math.random() * 40 + 60}%` // Random width between 60-100%
          }}
          animate={{
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

// Componente de Button interativo
export interface InteractiveButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  hapticFeedback?: boolean;
}

export const InteractiveButton: React.FC<InteractiveButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  isLoading = false,
  className = '',
  hapticFeedback = true
}) => {
  const { triggerInteractionFeedback } = useMicroInteractions();
  const [isPressed, setIsPressed] = useState(false);

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const handleClick = useCallback(() => {
    if (disabled || isLoading) return;
    
    if (hapticFeedback) {
      triggerInteractionFeedback('click');
    }
    
    onClick?.();
  }, [disabled, isLoading, hapticFeedback, triggerInteractionFeedback, onClick]);

  return (
    <motion.button
      className={`
        ${variants[variant]} 
        ${sizes[size]} 
        rounded-lg font-medium transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800
        ${className}
      `}
      onClick={handleClick}
      disabled={disabled || isLoading}
      onMouseDown={() => { setIsPressed(true); }}
      onMouseUp={() => { setIsPressed(false); }}
      onMouseLeave={() => { setIsPressed(false); }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      animate={{
        scale: isPressed ? 0.95 : 1
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17
      }}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center"
          >
            <motion.div
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <span className="ml-2">Carregando...</span>
          </motion.div>
        ) : (
          <motion.span
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// Componente de Progress Ring animado
export interface AnimatedProgressProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  className?: string;
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  progress,
  size = 60,
  strokeWidth = 6,
  color = '#3B82F6',
  backgroundColor = '#374151',
  showPercentage = true,
  className = ''
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative inline-block ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{
            duration: 0.8,
            ease: "easeInOut"
          }}
        />
      </svg>
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className="text-sm font-medium text-white"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {Math.round(progress)}%
          </motion.span>
        </div>
      )}
    </div>
  );
};

// Componente de Transition suave entre páginas
export interface PageTransitionProps {
  children: React.ReactNode;
  direction?: 'slide' | 'fade' | 'scale';
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  direction = 'slide',
  className = ''
}) => {
  const variants = {
    slide: {
      initial: { x: 300, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: -300, opacity: 0 }
    },
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    scale: {
      initial: { scale: 0.8, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 1.2, opacity: 0 }
    }
  };

  return (
    <motion.div
      className={className}
      variants={variants[direction]}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20
      }}
    >
      {children}
    </motion.div>
  );
};

// Componente de Error State elegante
export interface ErrorStateProps {
  id: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  id, 
  children, 
  fallback, 
  className 
}) => {
  const { errors, clearError } = useErrorState();
  const error = errors[id];

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg",
          className
        )}
      >
        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            Erro encontrado
          </p>
          <p className="text-sm text-red-600 dark:text-red-300 mt-1">
            {error}
          </p>
        </div>
        <button
          onClick={() => { clearError(id); }}
          className="text-red-400 hover:text-red-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    );
  }

  return <>{children}</>;
};

// Componente de Connection Status
export interface ConnectionStatusProps {
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => { setIsOnline(true); };
    const handleOffline = () => { setIsOnline(false); };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className={cn(
        "fixed top-4 left-1/2 transform -translate-x-1/2 z-50",
        "flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900 border border-orange-300 dark:border-orange-700 rounded-lg shadow-lg",
        className
      )}
    >
      <WifiOff className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
        Sem conexão com a internet
      </span>
    </motion.div>
  );
};

// Contextual Loading States
export interface ContextualLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  variant?: 'spinner' | 'dots' | 'pulse';
  className?: string;
}

export const ContextualLoading: React.FC<ContextualLoadingProps> = ({
  isLoading,
  children,
  loadingText = 'Carregando...',
  variant = 'spinner',
  className
}) => {
  const spinnerVariant = (
    <div className="flex items-center justify-center gap-3">
      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      <span className="text-sm text-gray-600 dark:text-gray-400">{loadingText}</span>
    </div>
  );

  const dotsVariant = (
    <div className="flex items-center justify-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-blue-500 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
        />
      ))}
      <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">{loadingText}</span>
    </div>
  );

  const pulseVariant = (
    <motion.div
      className="text-center"
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <span className="text-sm text-gray-600 dark:text-gray-400">{loadingText}</span>
    </motion.div>
  );

  const variants = {
    spinner: spinnerVariant,
    dots: dotsVariant,
    pulse: pulseVariant
  };

  if (!isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("py-8", className)}
    >
      {variants[variant]}
    </motion.div>
  );
};