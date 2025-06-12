import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Eye, EyeOff, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FocusModeContextType {
  isFocusMode: boolean;
  isZenMode: boolean;
  focusLevel: 'normal' | 'minimal' | 'zen';
  toggleFocusMode: () => void;
  toggleZenMode: () => void;
  setFocusLevel: (level: 'normal' | 'minimal' | 'zen') => void;
  exitFocusMode: () => void;
}

const FocusModeContext = createContext<FocusModeContextType | undefined>(undefined);

export const FocusModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [focusLevel, setFocusLevel] = useState<'normal' | 'minimal' | 'zen'>('normal');

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode(prev => {
      const newValue = !prev;
      if (newValue) {
        setFocusLevel('minimal');
        toast.success('Modo foco ativado', {
          description: 'Pressione Esc ou Ctrl+F para sair'
        });
      } else {
        setFocusLevel('normal');
        setIsZenMode(false);
        toast.success('Modo foco desativado');
      }
      return newValue;
    });
  }, []);

  const toggleZenMode = useCallback(() => {
    setIsZenMode(prev => {
      const newValue = !prev;
      if (newValue) {
        setIsFocusMode(true);
        setFocusLevel('zen');
        toast.success('Modo zen ativado', {
          description: 'Máxima concentração. Pressione Esc para sair'
        });
      } else {
        setFocusLevel('minimal');
        toast.success('Modo zen desativado');
      }
      return newValue;
    });
  }, []);

  const exitFocusMode = useCallback(() => {
    setIsFocusMode(false);
    setIsZenMode(false);
    setFocusLevel('normal');
    toast.success('Voltando ao modo normal');
  }, []);

  // Keyboard shortcuts para focus mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Esc para sair do focus mode
      if (event.key === 'Escape' && (isFocusMode || isZenMode)) {
        event.preventDefault();
        exitFocusMode();
      }

      // Ctrl+F para toggle focus mode
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        const isInInput = (event.target as HTMLElement)?.tagName === 'INPUT' ||
                         (event.target as HTMLElement)?.tagName === 'TEXTAREA' ||
                         (event.target as HTMLElement)?.contentEditable === 'true';
        
        if (!isInInput) {
          event.preventDefault();
          toggleFocusMode();
        }
      }

      // Ctrl+Shift+F para zen mode
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'F') {
        event.preventDefault();
        toggleZenMode();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode, isZenMode, toggleFocusMode, toggleZenMode, exitFocusMode]);

  // Auto-save focus mode preference
  useEffect(() => {
    const saved = localStorage.getItem('notion-spark-focus-mode');
    if (saved) {
      const { focusLevel: savedLevel } = JSON.parse(saved);
      setFocusLevel(savedLevel);
      if (savedLevel === 'minimal') setIsFocusMode(true);
      if (savedLevel === 'zen') {
        setIsFocusMode(true);
        setIsZenMode(true);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('notion-spark-focus-mode', JSON.stringify({
      focusLevel,
      isFocusMode,
      isZenMode
    }));
  }, [focusLevel, isFocusMode, isZenMode]);

  const value: FocusModeContextType = {
    isFocusMode,
    isZenMode,
    focusLevel,
    toggleFocusMode,
    toggleZenMode,
    setFocusLevel,
    exitFocusMode
  };

  return (
    <FocusModeContext.Provider value={value}>
      {children}
    </FocusModeContext.Provider>
  );
};

export const useFocusMode = () => {
  const context = useContext(FocusModeContext);
  if (context === undefined) {
    throw new Error('useFocusMode must be used within a FocusModeProvider');
  }
  return context;
};

// Component para o botão de focus mode
interface FocusModeToggleProps {
  className?: string;
  variant?: 'button' | 'icon';
  showLabel?: boolean;
}

export const FocusModeToggle: React.FC<FocusModeToggleProps> = ({
  className,
  variant = 'button',
  showLabel = true
}) => {
  const { isFocusMode, isZenMode, toggleFocusMode, toggleZenMode } = useFocusMode();

  if (variant === 'icon') {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <button
          onClick={toggleFocusMode}
          className={cn(
            "p-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95",
            isFocusMode 
              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" 
              : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
          )}
          title={isFocusMode ? "Sair do modo foco (Esc)" : "Ativar modo foco (Ctrl+F)"}
        >
          {isFocusMode ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>

        <button
          onClick={toggleZenMode}
          className={cn(
            "p-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95",
            isZenMode 
              ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300" 
              : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
          )}
          title={isZenMode ? "Sair do modo zen (Esc)" : "Ativar modo zen (Ctrl+Shift+F)"}
        >
          {isZenMode ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        onClick={toggleFocusMode}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
          "hover:scale-105 active:scale-95 shadow-sm",
          isFocusMode
            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700"
            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
        )}
      >
        {isFocusMode ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
        {showLabel && (
          <span>
            {isFocusMode ? 'Sair do Foco' : 'Modo Foco'}
          </span>
        )}
      </button>

      <button
        onClick={toggleZenMode}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
          "hover:scale-105 active:scale-95 shadow-sm",
          isZenMode
            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700"
            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
        )}
      >
        {isZenMode ? (
          <Minimize2 className="h-4 w-4" />
        ) : (
          <Maximize2 className="h-4 w-4" />
        )}
        {showLabel && (
          <span>
            {isZenMode ? 'Sair do Zen' : 'Modo Zen'}
          </span>
        )}
      </button>
    </div>
  );
};

// Hook para aplicar classes CSS baseadas no focus mode
export const useFocusModeClasses = () => {
  const { isFocusMode, isZenMode, focusLevel } = useFocusMode();

  const getLayoutClasses = () => {
    const baseClasses = "transition-all duration-500 ease-in-out";
    
    if (isZenMode) {
      return cn(baseClasses, "focus-mode-zen");
    }
    
    if (isFocusMode) {
      return cn(baseClasses, "focus-mode-minimal");
    }
    
    return baseClasses;
  };

  const getSidebarClasses = () => {
    if (isZenMode) return "opacity-0 pointer-events-none transform -translate-x-full";
    if (isFocusMode) return "opacity-30 hover:opacity-100 transition-opacity duration-300";
    return "";
  };

  const getHeaderClasses = () => {
    if (isZenMode) return "opacity-0 pointer-events-none transform -translate-y-full";
    if (isFocusMode) return "opacity-80 hover:opacity-100 transition-opacity duration-300";
    return "";
  };

  const getEditorClasses = () => {
    if (isZenMode) return "max-w-4xl mx-auto px-8";
    if (isFocusMode) return "max-w-5xl mx-auto px-6";
    return "";
  };

  return {
    getLayoutClasses,
    getSidebarClasses,
    getHeaderClasses,
    getEditorClasses,
    isFocusMode,
    isZenMode,
    focusLevel
  };
}; 