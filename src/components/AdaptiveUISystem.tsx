import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Brain, User, Settings, TrendingUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

// Tipos para contexto e padrões de uso
export interface UserPattern {
  id: string;
  action: string;
  frequency: number;
  timeOfDay: number[]; // Horários em que a ação é mais comum (0-23)
  context: string; // workspace, file type, etc.
  lastUsed: Date;
  confidence: number; // 0-1
}

export interface ContextualSuggestion {
  id: string;
  type: 'shortcut' | 'action' | 'tool' | 'workflow';
  title: string;
  description: string;
  icon: React.ComponentType;
  confidence: number;
  timeRelevant: boolean;
  contextRelevant: boolean;
  action: () => void;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  density: 'compact' | 'normal' | 'spacious';
  animations: 'minimal' | 'normal' | 'enhanced';
  toolbarPosition: 'top' | 'bottom' | 'floating';
  shortcuts: Record<string, string>;
  autoSave: boolean;
  collaborationMode: 'focus' | 'aware' | 'social';
}

export interface AdaptiveState {
  patterns: UserPattern[];
  suggestions: ContextualSuggestion[];
  preferences: UserPreferences;
  currentContext: {
    workspace: string;
    fileType: string;
    timeOfDay: number;
    isCollaborating: boolean;
    recentActions: string[];
  };
  learningEnabled: boolean;
  adaptationLevel: 'basic' | 'moderate' | 'advanced';
}

type AdaptiveAction = 
  | { type: 'TRACK_ACTION'; payload: { action: string; context: string } }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'ADD_SUGGESTION'; payload: ContextualSuggestion }
  | { type: 'REMOVE_SUGGESTION'; payload: string }
  | { type: 'SET_CONTEXT'; payload: Partial<AdaptiveState['currentContext']> }
  | { type: 'TOGGLE_LEARNING'; payload: boolean }
  | { type: 'SET_ADAPTATION_LEVEL'; payload: AdaptiveState['adaptationLevel'] };

// Estado inicial
const initialState: AdaptiveState = {
  patterns: [],
  suggestions: [],
  preferences: {
    theme: 'auto',
    density: 'normal',
    animations: 'normal',
    toolbarPosition: 'top',
    shortcuts: {},
    autoSave: true,
    collaborationMode: 'aware'
  },
  currentContext: {
    workspace: '',
    fileType: '',
    timeOfDay: new Date().getHours(),
    isCollaborating: false,
    recentActions: []
  },
  learningEnabled: true,
  adaptationLevel: 'moderate'
};

// Reducer para gerenciar estado
function adaptiveReducer(state: AdaptiveState, action: AdaptiveAction): AdaptiveState {
  switch (action.type) {
    case 'TRACK_ACTION': {
      const { action: actionName, context } = action.payload;
      const currentTime = new Date().getHours();
      
      // Buscar padrão existente ou criar novo
      const existingPatternIndex = state.patterns.findIndex(
        p => p.action === actionName && p.context === context
      );

      let updatedPatterns;
      if (existingPatternIndex >= 0) {
        // Atualizar padrão existente
        updatedPatterns = [...state.patterns];
        const pattern = updatedPatterns[existingPatternIndex];
        pattern.frequency += 1;
        pattern.lastUsed = new Date();
        
        // Atualizar horários de uso
        if (!pattern.timeOfDay.includes(currentTime)) {
          pattern.timeOfDay.push(currentTime);
        }
        
        // Aumentar confiança baseada na frequência
        pattern.confidence = Math.min(1, pattern.frequency / 10);
      } else {
        // Criar novo padrão
        const newPattern: UserPattern = {
          id: `${actionName}-${context}-${Date.now()}`,
          action: actionName,
          frequency: 1,
          timeOfDay: [currentTime],
          context,
          lastUsed: new Date(),
          confidence: 0.1
        };
        updatedPatterns = [...state.patterns, newPattern];
      }

      // Manter apenas os 50 padrões mais relevantes
      updatedPatterns.sort((a, b) => 
        (b.confidence * b.frequency) - (a.confidence * a.frequency)
      );
      if (updatedPatterns.length > 50) {
        updatedPatterns = updatedPatterns.slice(0, 50);
      }

      // Atualizar ações recentes
      const recentActions = [actionName, ...state.currentContext.recentActions.slice(0, 9)];

      return {
        ...state,
        patterns: updatedPatterns,
        currentContext: {
          ...state.currentContext,
          recentActions
        }
      };
    }

    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload }
      };

    case 'ADD_SUGGESTION':
      return {
        ...state,
        suggestions: [...state.suggestions, action.payload]
      };

    case 'REMOVE_SUGGESTION':
      return {
        ...state,
        suggestions: state.suggestions.filter(s => s.id !== action.payload)
      };

    case 'SET_CONTEXT':
      return {
        ...state,
        currentContext: { ...state.currentContext, ...action.payload }
      };

    case 'TOGGLE_LEARNING':
      return {
        ...state,
        learningEnabled: action.payload
      };

    case 'SET_ADAPTATION_LEVEL':
      return {
        ...state,
        adaptationLevel: action.payload
      };

    default:
      return state;
  }
}

// Context
const AdaptiveUIContext = createContext<{
  state: AdaptiveState;
  dispatch: React.Dispatch<AdaptiveAction>;
  trackAction: (action: string, context?: string) => void;
  getSuggestions: () => ContextualSuggestion[];
  adaptUI: () => void;
} | null>(null);

export const useAdaptiveUI = () => {
  const context = useContext(AdaptiveUIContext);
  if (!context) {
    throw new Error('useAdaptiveUI must be used within AdaptiveUIProvider');
  }
  return context;
};

// Provider
export const AdaptiveUIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(adaptiveReducer, initialState);

  // Função para rastrear ações do usuário
  const trackAction = useCallback((action: string, context?: string) => {
    if (!state.learningEnabled) return;
    
    const currentContext = context || state.currentContext.workspace || 'general';
    dispatch({ type: 'TRACK_ACTION', payload: { action, context: currentContext } });
  }, [state.learningEnabled, state.currentContext.workspace]);

  // Gerar sugestões baseadas em padrões
  const getSuggestions = useCallback((): ContextualSuggestion[] => {
    const currentTime = new Date().getHours();
    const relevantPatterns = state.patterns.filter(pattern => {
      const timeRelevant = pattern.timeOfDay.includes(currentTime);
      const contextRelevant = pattern.context === state.currentContext.workspace;
      const notRecentlyUsed = !state.currentContext.recentActions.includes(pattern.action);
      
      return (timeRelevant || contextRelevant) && notRecentlyUsed && pattern.confidence > 0.3;
    });

    return relevantPatterns.slice(0, 5).map(pattern => ({
      id: pattern.id,
      type: 'action' as const,
      title: `Sugestão: ${pattern.action}`,
      description: `Você usa isso frequentemente neste contexto`,
      icon: Zap,
      confidence: pattern.confidence,
      timeRelevant: pattern.timeOfDay.includes(currentTime),
      contextRelevant: pattern.context === state.currentContext.workspace,
      action: () => { trackAction(pattern.action); }
    }));
  }, [state.patterns, state.currentContext, trackAction]);

  // Adaptar UI baseado em padrões
  const adaptUI = useCallback(() => {
    if (state.adaptationLevel === 'basic') return;

    // Analisar padrões e sugerir mudanças na UI
    const frequentActions = state.patterns
      .filter(p => p.frequency > 5)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3);

    // Gerar sugestões de adaptação
    const suggestions = frequentActions.map(pattern => ({
      id: `adapt-${pattern.id}`,
      type: 'tool' as const,
      title: `Adicionar ${pattern.action} à toolbar`,
      description: 'Ação frequente detectada',
      icon: TrendingUp,
      confidence: pattern.confidence,
      timeRelevant: false,
      contextRelevant: true,
      action: () => {
        // Implementar adição à toolbar
        console.log(`Adicionando ${pattern.action} à toolbar`);
      }
    }));

    suggestions.forEach(suggestion => {
      dispatch({ type: 'ADD_SUGGESTION', payload: suggestion });
    });
  }, [state.patterns, state.adaptationLevel]);

  // Atualizar contexto baseado no tempo
  useEffect(() => {
    const interval = setInterval(() => {
      const currentHour = new Date().getHours();
      dispatch({ 
        type: 'SET_CONTEXT', 
        payload: { timeOfDay: currentHour } 
      });
    }, 60000); // Verificar a cada minuto

    return () => { clearInterval(interval); };
  }, []);

  // Analisar e adaptar UI periodicamente
  useEffect(() => {
    if (state.learningEnabled && state.adaptationLevel !== 'basic') {
      const interval = setInterval(adaptUI, 300000); // A cada 5 minutos
      return () => { clearInterval(interval); };
    }
  }, [state.learningEnabled, state.adaptationLevel, adaptUI]);

  const value = {
    state,
    dispatch,
    trackAction,
    getSuggestions,
    adaptUI
  };

  return (
    <AdaptiveUIContext.Provider value={value}>
      {children}
    </AdaptiveUIContext.Provider>
  );
};

// Componente para exibir sugestões contextuais
interface ContextualSuggestionsProps {
  className?: string;
  maxSuggestions?: number;
}

export const ContextualSuggestions: React.FC<ContextualSuggestionsProps> = ({
  className,
  maxSuggestions = 3
}) => {
  const { getSuggestions, trackAction } = useAdaptiveUI();
  const suggestions = getSuggestions().slice(0, maxSuggestions);

  if (suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "contextual-suggestions bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <Brain className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Sugestões Inteligentes
        </span>
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {suggestions.map((suggestion) => (
            <motion.button
              key={suggestion.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onClick={() => {
                suggestion.action();
                trackAction(`suggestion-${suggestion.type}`, suggestion.title);
              }}
              className="w-full flex items-start gap-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <suggestion.icon className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {suggestion.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {suggestion.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <div 
                      className="w-2 h-2 rounded-full bg-blue-500"
                      style={{ opacity: suggestion.confidence }}
                    />
                    <span className="text-xs text-gray-400">
                      {Math.round(suggestion.confidence * 100)}%
                    </span>
                  </div>
                  {suggestion.timeRelevant && (
                    <Clock className="h-3 w-3 text-green-500" />
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default AdaptiveUIProvider;