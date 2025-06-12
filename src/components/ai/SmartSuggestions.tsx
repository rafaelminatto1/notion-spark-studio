import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, 
  Tag, 
  Link2, 
  FileText, 
  Zap, 
  Brain, 
  Target,
  TrendingUp,
  Eye,
  BookOpen,
  Hash,
  Users,
  Clock,
  Sparkles,
  X,
  ChevronRight,
  RefreshCw,
  Edit,
  Link,
  Calendar,
  BarChart,
  ArrowRight,
  Star,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Share2,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { contentAI, AIAnalysis, SimilarityResult } from '@/services/ContentAI';
import { FileItem } from '@/types';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { useFileSystemContext } from '@/contexts/FileSystemContext';

interface SmartSuggestion {
  id: string;
  type: 'content' | 'organization' | 'workflow' | 'productivity' | 'collaboration';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reason: string;
  icon: React.ComponentType<any>;
  confidence: number;
  estimatedTime?: string;
  impact: 'high' | 'medium' | 'low';
  tags: string[];
  action: {
    type: 'navigate' | 'create' | 'edit' | 'organize' | 'share';
    payload: any;
  };
  contextData?: {
    relatedNotes?: string[];
    patterns?: string[];
    triggers?: string[];
  };
  dismissible: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

interface SuggestionContext {
  currentNoteId?: string;
  recentActivity: ActivityItem[];
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: number;
  userPatterns: UserPattern[];
}

interface ActivityItem {
  id: string;
  type: 'edit' | 'create' | 'view' | 'search' | 'organize';
  entityId: string;
  timestamp: Date;
  duration?: number;
}

interface UserPattern {
  id: string;
  pattern: string;
  frequency: number;
  lastSeen: Date;
  confidence: number;
}

interface SmartSuggestionsProps {
  currentNoteId?: string;
  visible?: boolean;
  onToggleVisibility?: () => void;
  onApplySuggestion?: (suggestion: SmartSuggestion) => void;
  maxSuggestions?: number;
  className?: string;
}

const useContextAnalysis = () => {
  const { files } = useFileSystemContext();
  const [context, setContext] = useState<SuggestionContext>({
    recentActivity: [],
    timeOfDay: 'morning',
    dayOfWeek: new Date().getDay(),
    userPatterns: []
  });

  useEffect(() => {
    const mockActivity: ActivityItem[] = [
      {
        id: 'activity_1',
        type: 'edit',
        entityId: files[0]?.id || 'note1',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        duration: 300
      },
      {
        id: 'activity_2',
        type: 'create',
        entityId: 'new_note',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
      },
      {
        id: 'activity_3',
        type: 'search',
        entityId: 'search_project',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
      }
    ];

    const mockPatterns: UserPattern[] = [
      {
        id: 'pattern_1',
        pattern: 'Creates notes in the morning',
        frequency: 0.8,
        lastSeen: new Date(),
        confidence: 0.9
      },
      {
        id: 'pattern_2',
        pattern: 'Reviews notes on Friday',
        frequency: 0.6,
        lastSeen: new Date(),
        confidence: 0.7
      }
    ];

    const hour = new Date().getHours();
    let timeOfDay: SuggestionContext['timeOfDay'] = 'morning';
    if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
    else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
    else if (hour >= 22 || hour < 6) timeOfDay = 'night';

    setContext({
      recentActivity: mockActivity,
      timeOfDay,
      dayOfWeek: new Date().getDay(),
      userPatterns: mockPatterns
    });
  }, [files]);

  return context;
};

const useSuggestionEngine = (context: SuggestionContext, currentNoteId?: string) => {
  const { files } = useFileSystemContext();
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  const generateSuggestions = useCallback(() => {
    const newSuggestions: SmartSuggestion[] = [];
    const now = new Date();

    if (context.timeOfDay === 'morning') {
      newSuggestions.push({
        id: 'morning_review',
        type: 'productivity',
        priority: 'high',
        title: 'Revisar notas de ontem',
        description: 'Comece o dia revisando o que você trabalhou ontem',
        reason: 'Usuários são 40% mais produtivos quando revisam trabalho anterior',
        icon: Eye,
        confidence: 0.85,
        estimatedTime: '5 min',
        impact: 'medium',
        tags: ['produtividade', 'revisão', 'manhã'],
        action: { type: 'navigate', payload: { view: 'recent_notes' } },
        dismissible: true,
        createdAt: now
      });
    }

    const recentEdits = context.recentActivity.filter(a => a.type === 'edit');
    if (recentEdits.length > 0) {
      newSuggestions.push({
        id: 'continue_editing',
        type: 'workflow',
        priority: 'high',
        title: 'Continuar editando nota',
        description: 'Você estava trabalhando em uma nota há pouco tempo',
        reason: 'Manter o foco em tarefas inacabadas aumenta a produtividade',
        icon: Edit,
        confidence: 0.9,
        estimatedTime: '10 min',
        impact: 'high',
        tags: ['continuidade', 'foco'],
        action: { type: 'navigate', payload: { noteId: recentEdits[0].entityId } },
        contextData: { relatedNotes: [recentEdits[0].entityId] },
        dismissible: true,
        createdAt: now
      });
    }

    const unorganizedNotes = files.filter(f => f.type === 'file' && !f.parentId);
    if (unorganizedNotes.length > 5) {
      newSuggestions.push({
        id: 'organize_notes',
        type: 'organization',
        priority: 'medium',
        title: 'Organizar notas soltas',
        description: `Você tem ${unorganizedNotes.length} notas sem categoria`,
        reason: 'Notas organizadas são encontradas 3x mais rápido',
        icon: Target,
        confidence: 0.75,
        estimatedTime: '15 min',
        impact: 'high',
        tags: ['organização', 'estrutura'],
        action: { type: 'organize', payload: { noteIds: unorganizedNotes.map(n => n.id) } },
        dismissible: true,
        createdAt: now
      });
    }

    if (currentNoteId) {
      const currentNote = files.find(f => f.id === currentNoteId);
      if (currentNote && currentNote.content) {
        const wordCount = currentNote.content.split(' ').length;
        
        if (wordCount > 500) {
          newSuggestions.push({
            id: 'create_summary',
            type: 'content',
            priority: 'medium',
            title: 'Criar resumo da nota',
            description: 'Esta nota está ficando longa. Que tal criar um resumo?',
            reason: 'Resumos ajudam na revisão e compartilhamento',
            icon: FileText,
            confidence: 0.7,
            estimatedTime: '5 min',
            impact: 'medium',
            tags: ['resumo', 'conteúdo'],
            action: { type: 'create', payload: { template: 'summary', sourceNoteId: currentNoteId } },
            dismissible: true,
            createdAt: now
          });
        }

        const hasLinks = /https?:\/\//.test(currentNote.content);
        if (hasLinks) {
          newSuggestions.push({
            id: 'organize_links',
            type: 'content',
            priority: 'low',
            title: 'Organizar links da nota',
            description: 'Criar uma seção dedicada para os links desta nota',
            reason: 'Links organizados são mais fáceis de acessar',
            icon: Link,
            confidence: 0.6,
            estimatedTime: '3 min',
            impact: 'low',
            tags: ['links', 'organização'],
            action: { type: 'edit', payload: { noteId: currentNoteId, action: 'organize_links' } },
            dismissible: true,
            createdAt: now
          });
        }
      }
    }

    const morningCreatorPattern = context.userPatterns.find(p => p.pattern.includes('morning'));
    if (morningCreatorPattern && context.timeOfDay === 'morning') {
      newSuggestions.push({
        id: 'morning_brainstorm',
        type: 'productivity',
        priority: 'medium',
        title: 'Sessão de brainstorming',
        description: 'Você costuma ser criativo pela manhã. Que tal uma sessão de ideias?',
        reason: 'Baseado no seu padrão de criatividade matinal',
        icon: Brain,
        confidence: morningCreatorPattern.confidence,
        estimatedTime: '10 min',
        impact: 'medium',
        tags: ['criatividade', 'ideias', 'padrão'],
        action: { type: 'create', payload: { template: 'brainstorm' } },
        dismissible: true,
        createdAt: now
      });
    }

    const fridayPattern = context.userPatterns.find(p => p.pattern.includes('Friday'));
    if (fridayPattern && context.dayOfWeek === 5) {
      newSuggestions.push({
        id: 'weekly_review',
        type: 'collaboration',
        priority: 'high',
        title: 'Revisar semana e compartilhar',
        description: 'Fim de semana chegando! Que tal revisar o que você produziu?',
        reason: 'Você costuma fazer revisões nas sextas-feiras',
        icon: Share2,
        confidence: fridayPattern.confidence,
        estimatedTime: '20 min',
        impact: 'high',
        tags: ['revisão', 'compartilhamento', 'semana'],
        action: { type: 'create', payload: { template: 'weekly_review' } },
        dismissible: true,
        createdAt: now
      });
    }

    const longNotesCount = files.filter(f => f.content && f.content.split(' ').length > 1000).length;
    if (longNotesCount > 3) {
      newSuggestions.push({
        id: 'split_long_notes',
        type: 'organization',
        priority: 'low',
        title: 'Dividir notas longas',
        description: `Você tem ${longNotesCount} notas muito extensas`,
        reason: 'Notas menores são mais fáceis de navegar e editar',
        icon: BarChart,
        confidence: 0.65,
        estimatedTime: '30 min',
        impact: 'medium',
        tags: ['organização', 'estrutura', 'tamanho'],
        action: { type: 'organize', payload: { action: 'split_notes' } },
        dismissible: true,
        createdAt: now
      });
    }

    newSuggestions.push({
      id: 'add_tags',
      type: 'organization',
      priority: 'low',
      title: 'Adicionar tags às notas',
      description: 'Tags facilitam a busca e organização',
      reason: 'Usuários com tags encontram conteúdo 50% mais rápido',
      icon: Tag,
      confidence: 0.6,
      estimatedTime: '10 min',
      impact: 'medium',
      tags: ['tags', 'busca', 'organização'],
      action: { type: 'organize', payload: { action: 'add_tags' } },
      dismissible: true,
      createdAt: now
    });

    const filteredSuggestions = newSuggestions.filter(s => !dismissedSuggestions.has(s.id));

    filteredSuggestions.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityWeight[a.priority];
      const bPriority = priorityWeight[b.priority];
      
      if (aPriority !== bPriority) return bPriority - aPriority;
      return b.confidence - a.confidence;
    });

    setSuggestions(filteredSuggestions);
  }, [context, currentNoteId, files, dismissedSuggestions]);

  const dismissSuggestion = useCallback((suggestionId: string) => {
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  }, []);

  const refreshSuggestions = useCallback(() => {
    generateSuggestions();
  }, [generateSuggestions]);

  useEffect(() => {
    generateSuggestions();
  }, [generateSuggestions]);

  return {
    suggestions,
    dismissSuggestion,
    refreshSuggestions
  };
};

interface SuggestionCardProps {
  suggestion: SmartSuggestion;
  onApply: () => void;
  onDismiss: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ 
  suggestion, 
  onApply, 
  onDismiss,
  isExpanded = false,
  onToggleExpand
}) => {
  const Icon = suggestion.icon;
  
  const getPriorityColor = (priority: SmartSuggestion['priority']) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-blue-200 bg-blue-50';
    }
  };

  const getImpactColor = (impact: SmartSuggestion['impact']) => {
    switch (impact) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'low': return 'text-blue-600 bg-blue-100';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "border-2 rounded-lg p-4 cursor-pointer transition-all",
        getPriorityColor(suggestion.priority),
        isExpanded && "ring-2 ring-blue-300"
      )}
      onClick={onToggleExpand}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className={cn(
            "p-2 rounded-lg",
            suggestion.type === 'content' ? "bg-blue-100 text-blue-600" :
            suggestion.type === 'organization' ? "bg-green-100 text-green-600" :
            suggestion.type === 'workflow' ? "bg-purple-100 text-purple-600" :
            suggestion.type === 'productivity' ? "bg-orange-100 text-orange-600" :
            "bg-pink-100 text-pink-600"
          )}>
            <Icon className="h-5 w-5" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 text-sm">
                {suggestion.title}
              </h3>
              
              <span className={cn(
                "px-2 py-1 text-xs font-medium rounded-full",
                suggestion.priority === 'high' ? "bg-red-100 text-red-700" :
                suggestion.priority === 'medium' ? "bg-yellow-100 text-yellow-700" :
                "bg-gray-100 text-gray-700"
              )}>
                {suggestion.priority === 'high' ? 'Alta' : 
                 suggestion.priority === 'medium' ? 'Média' : 'Baixa'}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-2">
              {suggestion.description}
            </p>
            
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {Math.round(suggestion.confidence * 100)}% confiança
              </div>
              
              {suggestion.estimatedTime && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {suggestion.estimatedTime}
                </div>
              )}
              
              <div className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                getImpactColor(suggestion.impact)
              )}>
                Impacto {suggestion.impact === 'high' ? 'Alto' : 
                         suggestion.impact === 'medium' ? 'Médio' : 'Baixo'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 ml-2">
          {suggestion.dismissible && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Descartar"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Por que esta sugestão?</h4>
              <p className="text-sm text-gray-600">{suggestion.reason}</p>
            </div>

            {suggestion.tags.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {suggestion.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {suggestion.contextData && (
              <div className="mb-4 text-xs text-gray-500">
                {suggestion.contextData.relatedNotes && (
                  <div>
                    <strong>Notas relacionadas:</strong> {suggestion.contextData.relatedNotes.length}
                  </div>
                )}
                {suggestion.contextData.patterns && (
                  <div>
                    <strong>Padrões identificados:</strong> {suggestion.contextData.patterns.join(', ')}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onApply();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <span>Aplicar Sugestão</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  currentNoteId,
  visible = true,
  onToggleVisibility,
  onApplySuggestion,
  maxSuggestions = 5,
  className
}) => {
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);
  const context = useContextAnalysis();
  const { suggestions, dismissSuggestion, refreshSuggestions } = useSuggestionEngine(context, currentNoteId);

  const displayedSuggestions = suggestions.slice(0, maxSuggestions);

  const handleApplySuggestion = useCallback((suggestion: SmartSuggestion) => {
    onApplySuggestion?.(suggestion);
    dismissSuggestion(suggestion.id);
  }, [onApplySuggestion, dismissSuggestion]);

  const handleToggleExpand = useCallback((suggestionId: string) => {
    setExpandedSuggestion(prev => prev === suggestionId ? null : suggestionId);
  }, []);

  if (!visible) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={onToggleVisibility}
        className="fixed bottom-20 right-4 p-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all z-40"
        title="Mostrar sugestões"
      >
        <Lightbulb className="h-6 w-6" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className={cn(
        "fixed top-20 right-4 w-80 max-h-[calc(100vh-6rem)] bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden z-40",
        className
      )}
    >
      <div className="p-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            <h2 className="font-semibold">Sugestões Inteligentes</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={refreshSuggestions}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Atualizar sugestões"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            
            <button
              onClick={onToggleVisibility}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Ocultar sugestões"
            >
              <EyeOff className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {displayedSuggestions.length > 0 && (
          <p className="text-sm opacity-90 mt-1">
            {displayedSuggestions.length} sugestão{displayedSuggestions.length > 1 ? 'ões' : ''} disponível{displayedSuggestions.length > 1 ? 'eis' : ''}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto max-h-[500px]">
        {displayedSuggestions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="font-medium text-gray-900 mb-2">Tudo em dia!</h3>
            <p className="text-sm">
              Não temos sugestões no momento. Continue o bom trabalho!
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <AnimatePresence>
              {displayedSuggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onApply={() => handleApplySuggestion(suggestion)}
                  onDismiss={() => dismissSuggestion(suggestion.id)}
                  isExpanded={expandedSuggestion === suggestion.id}
                  onToggleExpand={() => handleToggleExpand(suggestion.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {displayedSuggestions.length > 0 && (
        <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Sugestões baseadas em IA e seus padrões de uso
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default SmartSuggestions; 