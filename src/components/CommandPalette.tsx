import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  File, 
  Folder, 
  Plus, 
  Settings, 
  Zap, 
  Clock, 
  Star, 
  ArrowRight,
  Hash,
  User,
  Calendar,
  Database,
  Sparkles,
  Brain,
  TrendingUp,
  Link,
  Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSemanticSearch } from '@/hooks/useSemanticSearch';
import { useFileSystemContext } from '@/contexts/FileSystemContext';
import { cn } from '@/lib/utils';

// Declarações de tipos para Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Interface para tracking de uso de comandos
interface CommandUsage {
  commandId: string;
  count: number;
  lastUsed: Date;
  context: string[];
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: number;
}

// Interface para sugestões contextuais
interface ContextualSuggestion {
  id: string;
  title: string;
  description: string;
  confidence: number; // 0-1
  reason: string;
  command: Command;
}

interface Command {
  id: string;
  title: string;
  description?: string;
  category: 'search' | 'create' | 'navigate' | 'actions' | 'recent' | 'ai' | 'suggested' | 'chained';
  icon: React.ComponentType<{ className?: string }>;
  keywords: string[];
  action: () => void;
  shortcut?: string;
  score?: number;
  context?: string[];
  chainable?: boolean;
  requiredContext?: string[];
  usageCount?: number;
  lastUsed?: Date;
}

// Hook para learning algorithm
const useCommandLearning = () => {
  const [commandUsage, setCommandUsage] = useState<CommandUsage[]>([]);
  const [contextualSuggestions, setContextualSuggestions] = useState<ContextualSuggestion[]>([]);

  // Carregar dados do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('command-palette-usage');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCommandUsage(parsed.map((item: any) => ({
          ...item,
          lastUsed: new Date(item.lastUsed)
        })));
      } catch (error) {
        console.warn('Erro ao carregar histórico de comandos:', error);
      }
    }
  }, []);

  // Registrar uso de comando
  const recordCommandUsage = useCallback((commandId: string, context: string[]) => {
    const now = new Date();
    const hour = now.getHours();
    const timeOfDay = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    
    setCommandUsage(prev => {
      const existing = prev.find(usage => usage.commandId === commandId);
      const updated = existing 
        ? { ...existing, count: existing.count + 1, lastUsed: now, context }
        : { 
            commandId, 
            count: 1, 
            lastUsed: now, 
            context,
            timeOfDay: timeOfDay as any,
            dayOfWeek: now.getDay()
          };

      const newUsage = existing 
        ? prev.map(usage => usage.commandId === commandId ? updated : usage)
        : [...prev, updated];

      // Salvar no localStorage
      localStorage.setItem('command-palette-usage', JSON.stringify(newUsage));
      return newUsage;
    });
  }, []);

  // Gerar sugestões contextuais baseadas no uso
  const generateContextualSuggestions = useCallback((
    currentContext: string[], 
    timeOfDay: string,
    availableCommands: Command[]
  ): ContextualSuggestion[] => {
    const suggestions: ContextualSuggestion[] = [];
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    commandUsage.forEach(usage => {
      const command = availableCommands.find(cmd => cmd.id === usage.commandId);
      if (!command) return;

      let confidence = 0;
      let reason = '';

      // Bonus baseado na frequência de uso
      const frequencyScore = Math.min(usage.count / 10, 0.4);
      confidence += frequencyScore;

      // Bonus baseado no contexto
      const contextMatch = currentContext.some(ctx => 
        usage.context.some(usageCtx => usageCtx.toLowerCase().includes(ctx.toLowerCase()))
      );
      if (contextMatch) {
        confidence += 0.3;
        reason = 'Baseado no contexto atual';
      }

      // Bonus baseado no horário
      if (usage.timeOfDay === timeOfDay) {
        confidence += 0.2;
        reason = reason ? `${reason} e horário habitual` : 'Comando usado neste horário';
      }

      // Bonus para comandos usados recentemente
      const daysSinceLastUse = (now.getTime() - usage.lastUsed.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastUse < 1) {
        confidence += 0.3;
        reason = reason ? `${reason} (usado recentemente)` : 'Usado recentemente';
      }

      // Bonus para dias da semana similares
      if (usage.dayOfWeek === currentDay) {
        confidence += 0.1;
      }

      if (confidence > 0.3) {
        suggestions.push({
          id: `contextual-${command.id}`,
          title: command.title,
          description: `${command.description} • ${reason}`,
          confidence,
          reason,
          command: { ...command, category: 'suggested' as any }
        });
      }
    });

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }, [commandUsage]);

  return {
    commandUsage,
    recordCommandUsage,
    generateContextualSuggestions,
    contextualSuggestions
  };
};

// Hook para command chaining
const useCommandChaining = () => {
  const [commandChain, setCommandChain] = useState<Command[]>([]);
  const [isChaining, setIsChaining] = useState(false);

  const startChain = useCallback((initialCommand: Command) => {
    if (initialCommand.chainable) {
      setCommandChain([initialCommand]);
      setIsChaining(true);
    }
  }, []);

  const addToChain = useCallback((command: Command) => {
    setCommandChain(prev => [...prev, command]);
  }, []);

  const executeChain = useCallback(() => {
    commandChain.forEach((command, index) => {
      setTimeout(() => command.action(), index * 500);
    });
    setCommandChain([]);
    setIsChaining(false);
  }, [commandChain]);

  const clearChain = useCallback(() => {
    setCommandChain([]);
    setIsChaining(false);
  }, []);

  return {
    commandChain,
    isChaining,
    startChain,
    addToChain,
    executeChain,
    clearChain
  };
};

// Hook para voice commands (experimental)
const useVoiceCommands = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionConstructor();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'pt-BR';

        recognitionRef.current.onresult = (event) => {
          const result = event.results[event.results.length - 1];
          if (result.isFinal) {
            setTranscript(result[0].transcript);
            setIsListening(false);
          }
        };

        recognitionRef.current.onerror = () => {
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setIsListening(true);
      recognitionRef.current.start();
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported: !!recognitionRef.current
  };
};

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateToFile: (fileId: string) => void;
  onCreateFile: (name: string, type: 'file' | 'folder') => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onOpenChange,
  onNavigateToFile,
  onCreateFile
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { files, currentFileId, recentFiles } = useFileSystemContext();
  const { results: searchResults, isSearching } = useSemanticSearch(files);
  
  // Hooks para funcionalidades IA
  const { 
    recordCommandUsage, 
    generateContextualSuggestions 
  } = useCommandLearning();
  
  const {
    commandChain,
    isChaining,
    startChain,
    addToChain,
    executeChain,
    clearChain
  } = useCommandChaining();
  
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported: voiceSupported
  } = useVoiceCommands();

  // Context atual para sugestões
  const currentContext = useMemo(() => {
    const context: string[] = [];
    if (currentFileId) {
      const currentFile = files.find(f => f.id === currentFileId);
      if (currentFile) {
        context.push(currentFile.type, currentFile.name);
        // Adicionar tags se existirem
        if (currentFile.tags) {
          context.push(...currentFile.tags);
        }
      }
    }
    return context;
  }, [currentFileId, files]);

  // Aplicar voice command transcript ao query
  useEffect(() => {
    if (transcript && open) {
      setQuery(transcript);
    }
  }, [transcript, open]);

  // Comandos base do sistema
  const baseCommands = useMemo((): Command[] => [
    // Criação
    {
      id: 'create-file',
      title: 'Criar Nova Nota',
      description: 'Criar um novo arquivo de texto',
      category: 'create',
      icon: File,
      keywords: ['criar', 'novo', 'arquivo', 'nota', 'create', 'new', 'file'],
      action: () => {
        const name = query.replace(/^criar|^novo|^create|^new/i, '').trim() || 'Nova Nota';
        onCreateFile(name, 'file');
        onOpenChange(false);
      },
      shortcut: 'Ctrl+N'
    },
    {
      id: 'create-folder',
      title: 'Criar Nova Pasta',
      description: 'Criar uma nova pasta para organizar arquivos',
      category: 'create',
      icon: Folder,
      keywords: ['criar', 'nova', 'pasta', 'folder', 'diretório', 'directory'],
      action: () => {
        const name = query.replace(/^criar|^nova|^create|^new/i, '').trim() || 'Nova Pasta';
        onCreateFile(name, 'folder');
        onOpenChange(false);
      },
      shortcut: 'Ctrl+Shift+N'
    },

    // Navegação
    {
      id: 'search-files',
      title: 'Buscar Arquivos',
      description: 'Buscar por arquivos e conteúdo',
      category: 'search',
      icon: Search,
      keywords: ['buscar', 'procurar', 'search', 'find'],
      action: () => {
        // Ação de busca já é executada automaticamente
      },
      shortcut: 'Ctrl+K'
    },

    // Ações
    {
      id: 'settings',
      title: 'Configurações',
      description: 'Abrir configurações do sistema',
      category: 'actions',
      icon: Settings,
      keywords: ['configurações', 'settings', 'config', 'preferências'],
      action: () => {
        console.log('Abrir configurações');
        onOpenChange(false);
      },
      shortcut: 'Ctrl+,'
    },

    // IA
    {
      id: 'ai-summarize',
      title: 'Resumir com IA',
      description: 'Gerar resumo do arquivo atual usando IA',
      category: 'ai',
      icon: Sparkles,
      keywords: ['resumir', 'resumo', 'ia', 'ai', 'summarize', 'summary'],
      action: () => {
        console.log('Resumir com IA');
        onOpenChange(false);
      },
      shortcut: 'Ctrl+Shift+S'
    },
    {
      id: 'ai-explain',
      title: 'Explicar com IA',
      description: 'Explicar conceitos do texto selecionado',
      category: 'ai',
      icon: Sparkles,
      keywords: ['explicar', 'explain', 'ia', 'ai', 'conceito'],
      action: () => {
        console.log('Explicar com IA');
        onOpenChange(false);
      }
    },
    {
      id: 'ai-translate',
      title: 'Traduzir com IA',
      description: 'Traduzir texto selecionado',
      category: 'ai',
      icon: Sparkles,
      keywords: ['traduzir', 'translate', 'ia', 'ai', 'idioma'],
      action: () => {
        console.log('Traduzir com IA');
        onOpenChange(false);
      }
    }
  ], [query, onCreateFile, onOpenChange]);

  // Comandos de arquivos recentes
  const recentCommands = useMemo((): Command[] => {
    // Simular arquivos recentes baseado nos arquivos existentes
    const simulatedRecentFiles = files.slice(0, 5);
    return simulatedRecentFiles.map(file => ({
      id: `recent-${file.id}`,
      title: file.name,
      description: `Aberto recentemente • ${file.type}`,
      category: 'recent',
      icon: file.type === 'folder' ? Folder : File,
      keywords: [file.name.toLowerCase(), 'recente', 'recent'],
      action: () => {
        onNavigateToFile(file.id);
        onOpenChange(false);
      },
      context: ['📁 Recentes']
    }));
  }, [files, onNavigateToFile, onOpenChange]);

  // Comandos de busca (arquivos encontrados)
  const searchCommands = useMemo((): Command[] => {
    if (!isSearching || !query.trim()) return [];
    
    return searchResults.slice(0, 8).map(result => ({
      id: `search-${result.item.id}`,
      title: result.item.name,
      description: result.reasons.join(' • '),
      category: 'search',
      icon: result.item.type === 'folder' ? Folder : result.item.type === 'database' ? Database : File,
      keywords: [result.item.name.toLowerCase()],
      action: () => {
        onNavigateToFile(result.item.id);
        onOpenChange(false);
      },
      score: result.score,
      context: result.highlights
    }));
  }, [isSearching, query, searchResults, onNavigateToFile, onOpenChange]);

  // Gerar sugestões contextuais baseadas em IA
  const contextualSuggestions = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const timeOfDay = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    
    return generateContextualSuggestions(currentContext, timeOfDay, baseCommands);
  }, [generateContextualSuggestions, currentContext, baseCommands]);

  // Filtrar e pontuar comandos
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      // Sem query: mostrar sugestões contextuais, recentes e comandos principais
      const contextualCommands = contextualSuggestions.map(suggestion => suggestion.command);
      return [
        ...contextualCommands,
        ...recentCommands,
        ...baseCommands.filter(cmd => ['create', 'ai'].includes(cmd.category))
      ].slice(0, 12);
    }

    const queryLower = query.toLowerCase();
    const searchTerms = queryLower.split(/\s+/);

    // Comandos de busca têm prioridade quando há query
    const allCommands = [
      ...searchCommands,
      ...baseCommands,
      ...recentCommands
    ];

    return allCommands
      .map(command => {
        let score = command.score || 0;

        // Calcular score baseado em correspondências
        searchTerms.forEach(term => {
          if (command.title.toLowerCase().includes(term)) score += 0.5;
          if (command.description?.toLowerCase().includes(term)) score += 0.3;
          if (command.keywords.some(keyword => keyword.includes(term))) score += 0.2;
        });

        // Bonus para correspondência exata no título
        if (command.title.toLowerCase() === queryLower) score += 1;

        // Bonus para comandos IA quando query contém termos relacionados
        if (command.category === 'ai' && ['ia', 'ai', 'resumir', 'explicar', 'traduzir'].some(term => queryLower.includes(term))) {
          score += 0.5;
        }

        // Bonus para criação quando query começa com "criar" ou "novo"
        if (command.category === 'create' && /^(criar|novo|create|new)/i.test(query)) {
          score += 0.7;
        }

        return { ...command, score };
      })
      .filter(command => command.score > 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 12);
  }, [query, baseCommands, recentCommands, searchCommands]);

  // Agrupar comandos por categoria
  const groupedCommands = useMemo(() => {
    const groups = filteredCommands.reduce((acc, command) => {
      const category = command.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(command);
      return acc;
    }, {} as Record<string, Command[]>);

    // Ordem das categorias
    const categoryOrder = ['search', 'recent', 'create', 'ai', 'navigate', 'actions'];
    
    return categoryOrder
      .filter(category => groups[category])
      .map(category => ({
        category,
        commands: groups[category]
      }));
  }, [filteredCommands]);

  // Executar comando com tracking de uso
  const executeCommand = useCallback((command: Command) => {
    // Registrar uso para learning algorithm
    recordCommandUsage(command.id, currentContext);
    
    // Verificar se é chainable
    if (command.chainable && !isChaining) {
      startChain(command);
    } else if (isChaining) {
      addToChain(command);
    } else {
      command.action();
      onOpenChange(false);
    }
  }, [recordCommandUsage, currentContext, isChaining, startChain, addToChain, onOpenChange]);

  // Navegação por teclado
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const totalCommands = filteredCommands.length;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalCommands);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + totalCommands) % totalCommands);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          if (e.shiftKey && isChaining) {
            executeChain();
          } else {
            executeCommand(filteredCommands[selectedIndex]);
          }
        }
        break;
      case 'Escape':
        if (isChaining) {
          clearChain();
        } else {
          onOpenChange(false);
        }
        break;
      case ' ':
        // Espaço para voice commands
        if (e.ctrlKey && voiceSupported) {
          e.preventDefault();
          if (isListening) {
            stopListening();
          } else {
            startListening();
          }
        }
        break;
    }
  }, [filteredCommands, selectedIndex, executeCommand, isChaining, executeChain, clearChain, voiceSupported, isListening, startListening, stopListening, onOpenChange]);

  // Reset quando abre/fecha
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Atualizar índice selecionado quando comandos mudam
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const getCategoryLabel = (category: string) => {
    const labels = {
      search: '🔍 Resultados da Busca',
      recent: '🕒 Recentes',
      create: '➕ Criar Novo',
      ai: '✨ IA Assistente',
      navigate: '🧭 Navegação',
      actions: '⚡ Ações'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      search: Search,
      recent: Clock,
      create: Plus,
      ai: Sparkles,
      navigate: ArrowRight,
      actions: Zap
    };
    return icons[category as keyof typeof icons] || Search;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-2xl bg-slate-900 border-slate-700 overflow-hidden">
        <div className="flex flex-col max-h-[80vh]">
          {/* Header com Input */}
          <div className="p-4 border-b border-slate-700">
            {/* Command Chain Indicator */}
            {isChaining && (
              <div className="mb-3 flex items-center gap-2 p-2 bg-blue-900/20 border border-blue-700 rounded-lg">
                <Link className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-blue-300">
                  Encadeamento: {commandChain.length} comando(s)
                </span>
                <div className="flex gap-1 ml-auto">
                  <button
                    onClick={executeChain}
                    className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    Executar (Shift+Enter)
                  </button>
                  <button
                    onClick={clearChain}
                    className="px-2 py-1 text-xs bg-slate-600 hover:bg-slate-700 text-white rounded"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isListening 
                    ? "🎤 Ouvindo..." 
                    : "Digite um comando ou busque por arquivos..."
                }
                className={cn(
                  "pl-10 bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500",
                  isListening && "border-red-500 bg-red-900/10"
                )}
              />
              
              {/* Voice Command Button */}
              {voiceSupported && (
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={cn(
                    "absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded",
                    isListening 
                      ? "text-red-400 bg-red-900/20" 
                      : "text-slate-400 hover:text-white hover:bg-slate-700"
                  )}
                  title="Comando de voz (Ctrl+Space)"
                >
                  <Mic className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {/* Context Info */}
            {currentContext.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {currentContext.slice(0, 3).map((ctx, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {ctx}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Resultados */}
          <ScrollArea className="flex-1 max-h-96">
            <div className="p-2">
              {groupedCommands.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                  <Search className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Nenhum resultado encontrado</p>
                  <p className="text-xs mt-1">Tente buscar por outros termos</p>
                </div>
              )}

              {groupedCommands.map(({ category, commands }, groupIndex) => {
                const CategoryIcon = getCategoryIcon(category);
                let currentIndex = 0;
                
                // Calcular o índice atual baseado nas categorias anteriores
                for (let i = 0; i < groupIndex; i++) {
                  currentIndex += groupedCommands[i].commands.length;
                }

                return (
                  <div key={category} className="mb-4 last:mb-0">
                    <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-slate-400 uppercase tracking-wide">
                      <CategoryIcon className="h-3 w-3" />
                      {getCategoryLabel(category)}
                    </div>
                    
                    <div className="space-y-1">
                      {commands.map((command, commandIndex) => {
                        const globalIndex = currentIndex + commandIndex;
                        const isSelected = globalIndex === selectedIndex;
                        
                        return (
                          <motion.div
                            key={command.id}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200",
                              isSelected 
                                ? "bg-blue-600 text-white" 
                                : "hover:bg-slate-800 text-slate-300 hover:text-white"
                            )}
                            onClick={() => executeCommand(command)}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: commandIndex * 0.02 }}
                          >
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                              <command.icon className={cn(
                                "h-4 w-4",
                                isSelected ? "text-white" : "text-slate-400"
                              )} />
                              
                              {/* Indicadores especiais */}
                              {command.category === 'suggested' && (
                                <Brain className="h-3 w-3 text-purple-400" title="Sugestão IA" />
                              )}
                              {command.chainable && (
                                <Link className="h-3 w-3 text-blue-400" title="Encadeável" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">
                                  {command.title}
                                </span>
                                {command.context && (
                                  <div className="flex gap-1">
                                    {command.context.slice(0, 2).map((ctx, i) => (
                                      <Badge 
                                        key={i} 
                                        variant="secondary" 
                                        className="text-xs px-1 py-0"
                                      >
                                        {ctx}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {command.description && (
                                <p className={cn(
                                  "text-sm truncate mt-0.5",
                                  isSelected ? "text-blue-100" : "text-slate-500"
                                )}>
                                  {command.description}
                                </p>
                              )}
                            </div>
                            
                            {command.shortcut && (
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs font-mono flex-shrink-0",
                                  isSelected 
                                    ? "border-blue-300 text-blue-100" 
                                    : "border-slate-600 text-slate-400"
                                )}
                              >
                                {command.shortcut}
                              </Badge>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-slate-700 bg-slate-800/50">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <span>↑↓ Navegar</span>
                <span>↵ Selecionar</span>
                <span>Esc Fechar</span>
              </div>
              <div className="flex items-center gap-2">
                {isSearching && (
                  <Badge variant="secondary" className="text-xs">
                    {searchResults.length} resultado(s)
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  Ctrl+K
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
