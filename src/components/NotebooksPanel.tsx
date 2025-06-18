import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Book, ChevronRight, Star, Clock, Users, Edit, Share, Trash2, BarChart3, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FileItem } from '@/types';
import { usePermissions } from './permissions/PermissionsEngine';
import { useDebounce } from '@/hooks/useDebounce';
import { useAdvancedCache } from '@/hooks/useAdvancedCache';
import { usePerformance } from '@/hooks/usePerformance';
import { EmptyStateOptimized } from './EmptyStateOptimized';

interface NotebooksPanelProps {
  notebooks: FileItem[];
  selectedNotebook: string | null;
  onNotebookSelect: (notebookId: string) => void;
  onCreateNotebook: () => void;
  onCreateNote?: () => void;
  className?: string;
  isMobile?: boolean;
}

export const NotebooksPanel: React.FC<NotebooksPanelProps> = ({
  notebooks,
  selectedNotebook,
  onNotebookSelect,
  onCreateNotebook,
  onCreateNote,
  className,
  isMobile
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNotebooks, setExpandedNotebooks] = useState<Set<string>>(new Set());
  const [showPerformanceStats, setShowPerformanceStats] = useState(false);
  const { checkPermission, getUserPermissions, state: permissionsState } = usePermissions();

  // 🚀 MELHORIA: Debounce na busca para melhor performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // 🚀 MELHORIA: Cache inteligente para resultados de busca
  const searchCache = useAdvancedCache({
    maxSize: 30,
    defaultTTL: 3 * 60 * 1000, // 3 minutos
    prefetchEnabled: false
  });

  // 🚀 MELHORIA: Monitoramento de performance
  const {
    metrics,
    startRenderTimer,
    endRenderTimer,
    getPerformanceRecommendations
  } = usePerformance(notebooks);

  // 🚀 MELHORIA: Filtros otimizados com cache
  const filteredNotebooks = useMemo(() => {
    const cacheKey = `notebooks-${debouncedSearchTerm}`;
    const cached = searchCache.get(cacheKey);
    if (cached) return cached;

    const filtered = (notebooks || []).filter(notebook =>
      notebook && notebook.name && notebook.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );

    searchCache.set(cacheKey, filtered);
    return filtered;
  }, [notebooks, debouncedSearchTerm, searchCache]);

  const toggleNotebookExpansion = (notebookId: string) => {
    const newExpanded = new Set(expandedNotebooks);
    if (newExpanded.has(notebookId)) {
      newExpanded.delete(notebookId);
    } else {
      newExpanded.add(notebookId);
    }
    setExpandedNotebooks(newExpanded);
  };

  const safeNotebooks = Array.isArray(notebooks) ? notebooks : [];

  // Filtrar arquivos baseado em permissões
  const visibleFiles = useMemo(() => {
    if (!safeNotebooks) return [];
    
    return safeNotebooks.filter(file => {
      // Verificar se o usuário tem pelo menos permissão de leitura
      return checkPermission(
        permissionsState.currentUser.id, 
        file.id, 
        'read'
      );
    });
  }, [safeNotebooks, checkPermission, permissionsState.currentUser.id]);

  // Verificar permissões para ações específicas
  const canCreateFile = useMemo(() => {
    return checkPermission(
      permissionsState.currentUser.id,
      'workspace', // Para criação de arquivos na workspace
      'create'
    );
  }, [checkPermission, permissionsState.currentUser.id]);

  const canEditFile = useCallback((fileId: string) => {
    return checkPermission(
      permissionsState.currentUser.id,
      fileId,
      'update'
    );
  }, [checkPermission, permissionsState.currentUser.id]);

  const canDeleteFile = useCallback((fileId: string) => {
    return checkPermission(
      permissionsState.currentUser.id,
      fileId,
      'delete'
    );
  }, [checkPermission, permissionsState.currentUser.id]);

  const canShareFile = useCallback((fileId: string) => {
    return checkPermission(
      permissionsState.currentUser.id,
      fileId,
      'share'
    );
  }, [checkPermission, permissionsState.currentUser.id]);

  return (
    <div className={cn("flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/30 border-r border-slate-200/60 dark:border-slate-700/50", className)}>
      {/* Header com animação */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200/60 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Book className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Notebooks
          </h2>
          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-full font-medium">
            {safeNotebooks.length}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 🚀 Performance Stats Toggle */}
          <button
            onClick={() => { setShowPerformanceStats(!showPerformanceStats); }}
            className={cn(
              "group relative p-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95",
              showPerformanceStats 
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" 
                : "hover:bg-slate-50 dark:hover:bg-slate-800/20 text-slate-500 dark:text-slate-400"
            )}
            title="Estatísticas de Performance"
          >
            <BarChart3 className="h-4 w-4 transition-colors" />
          </button>

          {canCreateFile && (
            <button
              onClick={onCreateNotebook}
              className="group relative p-2 rounded-lg transition-all duration-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:scale-105 active:scale-95"
              title="Criar Novo Notebook"
            >
              <Plus className="h-4 w-4 text-slate-500 group-hover:text-emerald-600 dark:text-slate-400 dark:group-hover:text-emerald-400 transition-colors" />
              <div className="absolute inset-0 rounded-lg bg-emerald-200/20 dark:bg-emerald-400/10 scale-0 group-hover:scale-100 transition-transform duration-200" />
            </button>
          )}
        </div>
      </div>

      {/* 🚀 Performance Stats Panel */}
      {showPerformanceStats && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700/50 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Render: {metrics.renderTime.toFixed(1)}ms
              </span>
              <span className="flex items-center gap-1">
                <Book className="h-3 w-3" />
                {filteredNotebooks.length} notebooks
              </span>
            </div>
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              Performance: {metrics.renderTime < 30 ? '🚀 Excelente' : metrics.renderTime < 60 ? '⚡ Boa' : '🐌 Lenta'}
            </span>
          </div>
        </div>
      )}

      {/* Search Bar com efeitos otimizado */}
      <div className="p-3 border-b border-slate-200/40 dark:border-slate-700/40">
        <div className="relative group">
          <input
            type="text"
            placeholder="Buscar notebooks..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); }}
            className="w-full pl-3 pr-8 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          {/* 🚀 Indicador de busca ativa */}
          {debouncedSearchTerm && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Zap className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
            </div>
          )}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-400/5 to-blue-400/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
      </div>

      {/* Lista de Notebooks com hover states */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {safeNotebooks.length === 0 ? (
          <EmptyStateOptimized
            icon={Book}
            title="Nenhum notebook ainda"
            description="Organize suas notas criando seu primeiro notebook"
            actionLabel={canCreateFile ? "Criar Primeiro Notebook" : undefined}
            onAction={canCreateFile ? () => {
              console.log('[NotebooksPanel] Criar Primeiro Notebook clicked');
              console.log('[NotebooksPanel] onCreateNotebook function:', typeof onCreateNotebook);
              try {
                onCreateNotebook();
                console.log('[NotebooksPanel] onCreateNotebook called successfully');
              } catch (error) {
                console.error('[NotebooksPanel] Error calling onCreateNotebook:', error);
              }
            } : undefined}
            size="md"
            variant="default"
          />
        ) : filteredNotebooks.length === 0 ? (
          <EmptyStateOptimized
            icon={Book}
            title="Nenhum notebook encontrado"
            description={`Nenhum notebook corresponde à busca "${debouncedSearchTerm}"`}
            size="sm"
            variant="search"
          />
        ) : (
          visibleFiles.map((notebook) => (
            <div key={notebook.id} className="group relative">
              <button
                onClick={() => { onNotebookSelect(notebook.id); }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 relative overflow-hidden",
                  "hover:bg-white hover:shadow-md hover:shadow-slate-200/60 dark:hover:bg-slate-800 dark:hover:shadow-slate-900/60",
                  "active:scale-[0.98] group-hover:translate-x-1",
                  selectedNotebook === notebook.id
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 shadow-md border border-emerald-200/60 dark:border-emerald-700/60"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                {/* Background gradient on hover */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-r transition-opacity duration-300",
                  selectedNotebook === notebook.id
                    ? "from-emerald-400/10 to-blue-400/5 opacity-100"
                    : "from-emerald-400/5 to-blue-400/5 opacity-0 group-hover:opacity-100"
                )} />
                
                {/* Icon with animation */}
                <div className={cn(
                  "relative z-10 p-2 rounded-lg transition-all duration-200",
                  selectedNotebook === notebook.id
                    ? "bg-emerald-100 dark:bg-emerald-900/40"
                    : "bg-slate-100 dark:bg-slate-700 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20"
                )}>
                  <Book className={cn(
                    "h-4 w-4 transition-all duration-200",
                    selectedNotebook === notebook.id
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-500 group-hover:text-emerald-600 dark:text-slate-400 dark:group-hover:text-emerald-400"
                  )} />
                </div>

                {/* Content */}
                <div className="flex-1 relative z-10 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={cn(
                      "font-medium text-sm truncate transition-colors duration-200",
                      selectedNotebook === notebook.id
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-100"
                    )}>
                      {notebook.name || 'Notebook sem nome'}
                    </h3>
                    
                    {selectedNotebook === notebook.id && (
                      <ChevronRight className="h-4 w-4 text-emerald-500 dark:text-emerald-400 transform transition-transform duration-200 group-hover:translate-x-1" />
                    )}
                  </div>
                  
                  {/* Metadata com ícones */}
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span className="text-xs text-slate-400">
                        {notebook.updatedAt ? new Date(notebook.updatedAt).toLocaleDateString('pt-BR') : 'Hoje'}
                      </span>
                    </div>
                    
                    {notebook.isShared && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-blue-400" />
                        <span className="text-xs text-blue-400">Compartilhado</span>
                      </div>
                    )}
                    
                    {notebook.isFavorite && (
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    )}
                  </div>
                </div>

                {/* Hover indicator */}
                <div className={cn(
                  "absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-r-full transition-all duration-300",
                  selectedNotebook === notebook.id
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-y-0 group-hover:opacity-60 group-hover:scale-y-100"
                )} />

                {/* Actions baseadas em permissões */}
                <div className="file-actions">
                  {canEditFile(notebook.id) && (
                    <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <Star className="h-3 w-3" />
                    </button>
                  )}
                  
                  {canShareFile(notebook.id) && (
                    <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <Users className="h-3 w-3" />
                    </button>
                  )}
                  
                  {canDeleteFile(notebook.id) && (
                    <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer com quick actions */}
      <div className="p-3 border-t border-slate-200/40 dark:border-slate-700/40 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{safeNotebooks.length} notebook{safeNotebooks.length !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-2">
            <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <Star className="h-3 w-3" />
            </button>
            <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <Users className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};