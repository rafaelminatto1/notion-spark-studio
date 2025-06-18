import React, { useState, useMemo } from 'react';
import { 
  Zap, Plus, Copy, Share2, Star, Archive, Trash2, Edit3, 
  FileText, Folder, Tag, Calendar, Clock, Search, Filter,
  Download, Upload, Bookmark, Link, Move, Sparkles,
  MoreHorizontal, ChevronRight, Command
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { FileItem } from '@/types';

interface QuickAction {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  shortcut?: string;
  category: 'create' | 'edit' | 'organize' | 'share' | 'system';
  priority: number;
  action: () => void;
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'secondary';
}

interface QuickActionsProps {
  context: {
    selectedFile?: FileItem;
    selectedFiles?: FileItem[];
    currentView: string;
    hasSelection: boolean;
    clipboard?: any;
  };
  onCreateNote: () => void;
  onCreateNotebook: () => void;
  onEditFile: (fileId: string) => void;
  onDeleteFiles: (fileIds: string[]) => void;
  onToggleFavorite: (fileId: string) => void;
  onShareFile: (fileId: string) => void;
  onDuplicateFile: (fileId: string) => void;
  onMoveFiles: (fileIds: string[], targetId: string) => void;
  onExportFiles: (fileIds: string[]) => void;
  onSearch: () => void;
  onShowTemplates: () => void;
  className?: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  context,
  onCreateNote,
  onCreateNotebook,
  onEditFile,
  onDeleteFiles,
  onToggleFavorite,
  onShareFile,
  onDuplicateFile,
  onMoveFiles,
  onExportFiles,
  onSearch,
  onShowTemplates,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Generate contextual actions
  const quickActions = useMemo(() => {
    const actions: QuickAction[] = [];
    const { selectedFile, selectedFiles, currentView, hasSelection } = context;
    const multipleSelection = selectedFiles && selectedFiles.length > 1;

    // Creation Actions (always available)
    actions.push(
      {
        id: 'create-note',
        label: 'Nova Nota',
        description: 'Criar uma nova nota',
        icon: <FileText className="h-4 w-4" />,
        shortcut: 'Ctrl+N',
        category: 'create',
        priority: 100,
        action: onCreateNote
      },
      {
        id: 'create-notebook',
        label: 'Novo Notebook',
        description: 'Criar um novo notebook',
        icon: <Folder className="h-4 w-4" />,
        shortcut: 'Ctrl+Shift+N',
        category: 'create',
        priority: 90,
        action: onCreateNotebook
      },
      {
        id: 'templates',
        label: 'Templates',
        description: 'Usar um template',
        icon: <Sparkles className="h-4 w-4" />,
        shortcut: 'Ctrl+T',
        category: 'create',
        priority: 85,
        action: onShowTemplates
      }
    );

    // Single file actions
    if (selectedFile && !multipleSelection) {
      actions.push(
        {
          id: 'edit-file',
          label: selectedFile.type === 'folder' ? 'Abrir Notebook' : 'Editar Nota',
          description: `Editar ${selectedFile.name}`,
          icon: <Edit3 className="h-4 w-4" />,
          shortcut: 'Enter',
          category: 'edit',
          priority: 95,
          action: () => { onEditFile(selectedFile.id); }
        },
        {
          id: 'toggle-favorite',
          label: selectedFile.isFavorite ? 'Remover Favorito' : 'Adicionar Favorito',
          description: selectedFile.isFavorite ? 'Remover dos favoritos' : 'Marcar como favorito',
          icon: <Star className={cn("h-4 w-4", selectedFile.isFavorite && "fill-current text-yellow-500")} />,
          shortcut: 'Ctrl+D',
          category: 'organize',
          priority: 80,
          action: () => { onToggleFavorite(selectedFile.id); }
        },
        {
          id: 'share-file',
          label: 'Compartilhar',
          description: 'Compartilhar este arquivo',
          icon: <Share2 className="h-4 w-4" />,
          shortcut: 'Ctrl+Shift+S',
          category: 'share',
          priority: 75,
          action: () => { onShareFile(selectedFile.id); }
        },
        {
          id: 'duplicate-file',
          label: 'Duplicar',
          description: 'Criar uma cópia',
          icon: <Copy className="h-4 w-4" />,
          shortcut: 'Ctrl+Shift+D',
          category: 'edit',
          priority: 70,
          action: () => { onDuplicateFile(selectedFile.id); }
        }
      );

      // Content-specific actions
      if (selectedFile.type === 'file') {
        actions.push(
          {
            id: 'export-file',
            label: 'Exportar',
            description: 'Exportar para PDF, MD, etc.',
            icon: <Download className="h-4 w-4" />,
            category: 'share',
            priority: 60,
            action: () => { onExportFiles([selectedFile.id]); }
          },
          {
            id: 'add-tags',
            label: 'Adicionar Tags',
            description: 'Organizar com tags',
            icon: <Tag className="h-4 w-4" />,
            category: 'organize',
            priority: 55,
            action: () => {/* TODO: implement tag modal */}
          }
        );
      }
    }

    // Multiple files actions
    if (multipleSelection && selectedFiles) {
      actions.push(
        {
          id: 'bulk-favorite',
          label: 'Favoritar Todos',
          description: `Marcar ${selectedFiles.length} itens como favoritos`,
          icon: <Star className="h-4 w-4" />,
          category: 'organize',
          priority: 70,
          action: () => { selectedFiles.forEach(file => { onToggleFavorite(file.id); }); }
        },
        {
          id: 'bulk-move',
          label: 'Mover Para...',
          description: `Mover ${selectedFiles.length} itens`,
          icon: <Move className="h-4 w-4" />,
          category: 'organize',
          priority: 65,
          action: () => {/* TODO: implement move modal */}
        },
        {
          id: 'bulk-export',
          label: 'Exportar Todos',
          description: `Exportar ${selectedFiles.length} itens`,
          icon: <Download className="h-4 w-4" />,
          category: 'share',
          priority: 60,
          action: () => { onExportFiles(selectedFiles.map(f => f.id)); }
        }
      );
    }

    // Destructive actions (always last)
    if (hasSelection) {
      const fileIds = multipleSelection && selectedFiles 
        ? selectedFiles.map(f => f.id)
        : selectedFile ? [selectedFile.id] : [];
      
      if (fileIds.length > 0) {
        actions.push(
          {
            id: 'archive-files',
            label: multipleSelection ? 'Arquivar Todos' : 'Arquivar',
            description: multipleSelection ? `Arquivar ${fileIds.length} itens` : 'Mover para arquivo',
            icon: <Archive className="h-4 w-4" />,
            category: 'organize',
            priority: 40,
            action: () => {/* TODO: implement archive */}
          },
          {
            id: 'delete-files',
            label: multipleSelection ? 'Deletar Todos' : 'Deletar',
            description: multipleSelection ? `Deletar ${fileIds.length} itens` : 'Mover para lixeira',
            icon: <Trash2 className="h-4 w-4" />,
            category: 'system',
            priority: 10,
            variant: 'destructive' as const,
            action: () => { onDeleteFiles(fileIds); }
          }
        );
      }
    }

    // System actions
    actions.push(
      {
        id: 'search',
        label: 'Buscar',
        description: 'Busca global',
        icon: <Search className="h-4 w-4" />,
        shortcut: 'Ctrl+K',
        category: 'system',
        priority: 50,
        action: onSearch
      }
    );

    // Context-specific actions
    if (currentView === 'dashboard') {
      actions.push(
        {
          id: 'refresh-stats',
          label: 'Atualizar',
          description: 'Atualizar estatísticas',
          icon: <Clock className="h-4 w-4" />,
          category: 'system',
          priority: 45,
          action: () => {/* TODO: implement refresh */}
        }
      );
    }

    return actions.sort((a, b) => b.priority - a.priority);
  }, [context, onCreateNote, onCreateNotebook, onEditFile, onDeleteFiles, onToggleFavorite, onShareFile, onDuplicateFile, onExportFiles, onSearch, onShowTemplates]);

  // Group actions by category
  const actionsByCategory = useMemo(() => {
    const groups: Record<string, QuickAction[]> = {};
    quickActions.forEach(action => {
      if (!groups[action.category]) groups[action.category] = [];
      groups[action.category].push(action);
    });
    return groups;
  }, [quickActions]);

  // Get primary actions (most important)
  const primaryActions = quickActions.slice(0, 4);
  const secondaryActions = quickActions.slice(4);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'create': return 'Criar';
      case 'edit': return 'Editar';
      case 'organize': return 'Organizar';
      case 'share': return 'Compartilhar';
      case 'system': return 'Sistema';
      default: return 'Outros';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'create': return <Plus className="h-3 w-3" />;
      case 'edit': return <Edit3 className="h-3 w-3" />;
      case 'organize': return <Filter className="h-3 w-3" />;
      case 'share': return <Share2 className="h-3 w-3" />;
      case 'system': return <Command className="h-3 w-3" />;
      default: return <MoreHorizontal className="h-3 w-3" />;
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Primary Actions */}
      {primaryActions.map((action) => (
        <Button
          key={action.id}
          variant={action.variant || 'default'}
          size="sm"
          className={cn(
            "h-8 transition-all duration-200",
            action.variant === 'destructive' && "hover:bg-red-600"
          )}
          onClick={action.action}
          disabled={action.disabled}
          title={`${action.description}${action.shortcut ? ` (${action.shortcut})` : ''}`}
        >
          {action.icon}
          <span className="ml-2 hidden sm:inline">{action.label}</span>
        </Button>
      ))}

      {/* More Actions Dropdown */}
      {secondaryActions.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Mais</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-2" align="end">
            <div className="space-y-1">
              {Object.entries(actionsByCategory).map(([category, actions]) => {
                if (actions.every(action => primaryActions.includes(action))) return null;
                
                const categoryActions = actions.filter(action => !primaryActions.includes(action));
                if (categoryActions.length === 0) return null;

                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                      {getCategoryIcon(category)}
                      {getCategoryLabel(category)}
                    </div>
                    {categoryActions.map((action) => (
                      <button
                        key={action.id}
                        className={cn(
                          "w-full flex items-center justify-between p-2 rounded-md text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors",
                          action.variant === 'destructive' && "hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                        )}
                        onClick={() => {
                          action.action();
                        }}
                        disabled={action.disabled}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-6 h-6 rounded flex items-center justify-center",
                            action.variant === 'destructive' 
                              ? "bg-red-100 dark:bg-red-900/30" 
                              : "bg-slate-100 dark:bg-slate-700"
                          )}>
                            {action.icon}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{action.label}</div>
                            {action.description && (
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {action.description}
                              </div>
                            )}
                          </div>
                        </div>
                        {action.shortcut && (
                          <Badge variant="outline" className="text-xs">
                            {action.shortcut}
                          </Badge>
                        )}
                      </button>
                    ))}
                    <Separator className="my-1" />
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Context indicator */}
      {context.hasSelection && (
        <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-md text-xs text-blue-700 dark:text-blue-300">
          <Zap className="h-3 w-3" />
          <span>
            {context.selectedFiles?.length > 1 
              ? `${context.selectedFiles.length} selecionados`
              : '1 selecionado'
            }
          </span>
        </div>
      )}
    </div>
  );
};
