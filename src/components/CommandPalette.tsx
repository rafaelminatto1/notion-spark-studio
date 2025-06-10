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
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSemanticSearch } from '@/hooks/useSemanticSearch';
import { useFileSystemContext } from '@/contexts/FileSystemContext';
import { cn } from '@/lib/utils';

interface Command {
  id: string;
  title: string;
  description?: string;
  category: 'search' | 'create' | 'navigate' | 'actions' | 'recent' | 'ai';
  icon: React.ComponentType<{ className?: string }>;
  keywords: string[];
  action: () => void;
  shortcut?: string;
  score?: number;
  context?: string[];
}

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
    return (recentFiles || []).slice(0, 5).map(file => ({
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
  }, [recentFiles, onNavigateToFile, onOpenChange]);

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

  // Filtrar e pontuar comandos
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      // Sem query: mostrar recentes e comandos principais
      return [
        ...recentCommands,
        ...baseCommands.filter(cmd => ['create', 'ai'].includes(cmd.category))
      ];
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
          filteredCommands[selectedIndex].action();
        }
        break;
      case 'Escape':
        onOpenChange(false);
        break;
    }
  }, [filteredCommands, selectedIndex, onOpenChange]);

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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite um comando ou busque por arquivos..."
                className="pl-10 bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500"
              />
            </div>
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
                            onClick={() => command.action()}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: commandIndex * 0.02 }}
                          >
                            <command.icon className={cn(
                              "h-4 w-4 flex-shrink-0",
                              isSelected ? "text-white" : "text-slate-400"
                            )} />
                            
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
