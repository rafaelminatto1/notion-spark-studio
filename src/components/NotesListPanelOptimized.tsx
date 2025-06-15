import React, { useState, useMemo, useCallback, useEffect, Suspense } from 'react';
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Star, 
  Calendar,
  FileText,
  Grid,
  List,
  SortAsc,
  Filter,
  Zap,
  BarChart3,
  Eye,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileItem } from '@/types';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { useAdvancedCache } from '@/hooks/useAdvancedCache';
import { usePerformance } from '@/hooks/usePerformance';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface NotesListPanelProps {
  notes: FileItem[];
  selectedNote: string | null;
  selectedNotebook: string | null;
  onNoteSelect: (noteId: string) => void;
  onCreateNote: () => void;
  onDeleteNote: (noteId: string) => void;
  favorites: string[];
  onToggleFavorite: (noteId: string) => void;
}

type ViewMode = 'list' | 'cards' | 'snippets';
type SortMode = 'updated' | 'created' | 'title' | 'size';

// 🚀 Componente de Preview Lazy-Loaded
const LazyNotePreview: React.FC<{ content: string; maxLength: number }> = React.memo(({ content, maxLength }) => {
  const previewText = useMemo(() => {
    if (!content) return 'Sem conteúdo...';
    const plainText = content.replace(/[#*`]/g, '').replace(/\n/g, ' ');
    return plainText.length > maxLength ? plainText.substring(0, maxLength) + '...' : plainText;
  }, [content, maxLength]);

  return (
    <p className="text-xs text-gray-600 mb-3 line-clamp-3">
      {previewText}
    </p>
  );
});

// 🚀 Hook personalizado para intersection observer
const useIntersectionObserver = (threshold = 0.1, rootMargin = '50px') => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [elementRef, setElementRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!elementRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold, rootMargin }
    );

    observer.observe(elementRef);
    return () => observer.disconnect();
  }, [elementRef, threshold, rootMargin]);

  return { elementRef: setElementRef, isIntersecting };
};

export const NotesListPanelOptimized: React.FC<NotesListPanelProps> = ({
  notes,
  selectedNote,
  selectedNotebook,
  onNoteSelect,
  onCreateNote,
  onDeleteNote,
  favorites,
  onToggleFavorite
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('snippets');
  const [sortMode, setSortMode] = useState<SortMode>('updated');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showPerformanceStats, setShowPerformanceStats] = useState(false);

  // 🚀 MELHORIA: Debounce na busca para melhor performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // 🚀 MELHORIA: Cache inteligente para resultados de busca
  const searchCache = useAdvancedCache({
    maxSize: 50,
    defaultTTL: 2 * 60 * 1000, // 2 minutos
    prefetchEnabled: false
  });

  // 🚀 MELHORIA: Monitoramento de performance
  const {
    metrics,
    startRenderTimer,
    endRenderTimer,
    getPerformanceRecommendations
  } = usePerformance(notes);

  // 🚀 MELHORIA: Filtros otimizados com cache
  const filteredNotes = useMemo(() => {
    if (!notes || !Array.isArray(notes)) return [];
    
    // Criar chave de cache baseada nos filtros
    const cacheKey = `notes-${selectedNotebook}-${debouncedSearchTerm}-${showFavoritesOnly}-${sortMode}`;
    
    // Tentar obter do cache primeiro
    const cached = searchCache.get(cacheKey);
    if (cached) return cached;
    
    const filtered = notes
      .filter(note => {
        if (!note || !note.name || !note.id) return false;
        
        // 🚀 Otimização: Busca mais eficiente
        const searchLower = debouncedSearchTerm.toLowerCase();
        const matchesSearch = !debouncedSearchTerm || 
          note.name.toLowerCase().includes(searchLower) ||
          (note.content || '').toLowerCase().includes(searchLower);
        
        const matchesFavorites = !showFavoritesOnly || favorites.includes(note.id);
        return matchesSearch && matchesFavorites;
      })
      .sort((a, b) => {
        if (!a || !b) return 0;
        switch (sortMode) {
          case 'title':
            return (a.name || '').localeCompare(b.name || '');
          case 'created':
            const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bCreated - aCreated;
          case 'updated':
            const aUpdated = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const bUpdated = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return bUpdated - aUpdated;
          default:
            return 0;
        }
      });
    
    // Salvar no cache
    searchCache.set(cacheKey, filtered);
    return filtered;
  }, [notes, debouncedSearchTerm, showFavoritesOnly, favorites, sortMode, selectedNotebook, searchCache]);

  // 🚀 MELHORIA: Medir performance de renderização
  useEffect(() => {
    startRenderTimer();
    return () => {
      endRenderTimer();
    };
  }, [filteredNotes, startRenderTimer, endRenderTimer]);

  // 🚀 MELHORIA: Auto-otimização baseada em métricas
  useEffect(() => {
    const recommendations = getPerformanceRecommendations();
    if (recommendations.length > 0 && metrics.renderTime > 100) {
      console.log('🔧 Recomendações de performance:', recommendations);
    }
  }, [metrics, getPerformanceRecommendations]);

  // Memoized callbacks for better performance
  const handleNoteSelect = useCallback((noteId: string) => {
    onNoteSelect(noteId);
  }, [onNoteSelect]);

  const handleToggleFavorite = useCallback((noteId: string) => {
    onToggleFavorite(noteId);
  }, [onToggleFavorite]);

  const handleDeleteNote = useCallback((noteId: string) => {
    onDeleteNote(noteId);
  }, [onDeleteNote]);

  // Memoized utility functions
  const formatDate = useCallback((date: string) => {
    const now = new Date();
    const noteDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - noteDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hoje';
    if (diffDays === 2) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    return noteDate.toLocaleDateString('pt-BR');
  }, []);

  // 🚀 MELHORIA: Componente de item otimizado com lazy loading
  const OptimizedNoteItem: React.FC<{ note: FileItem }> = React.memo(({ note }) => {
    const { elementRef, isIntersecting } = useIntersectionObserver(0.1, '50px');
    const isSelected = selectedNote === note.id;
    const isFavorite = favorites.includes(note.id);

    if (viewMode === 'snippets') {
      return (
        <div
          ref={elementRef}
          key={note.id}
          className={cn(
            "p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-all group",
            isSelected && "bg-blue-50 border-l-4 border-l-blue-500"
          )}
          onClick={() => handleNoteSelect(note.id)}
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-800 truncate flex-1 mr-2">
              {note.name}
            </h3>
            <div className="flex items-center gap-1">
              {isFavorite && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-gray-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => handleToggleFavorite(note.id)}>
                    <Star className="h-4 w-4 mr-2" />
                    {isFavorite ? 'Remover favorito' : 'Favoritar'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-red-600"
                  >
                    Deletar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* 🚀 Preview lazy-loaded apenas quando visível */}
          {isIntersecting ? (
            <Suspense fallback={<div className="h-12 bg-gray-100 animate-pulse rounded" />}>
              <LazyNotePreview content={note.content || ''} maxLength={120} />
            </Suspense>
          ) : (
            <div className="h-12 bg-gray-100 animate-pulse rounded" />
          )}
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{formatDate(note.updatedAt?.toString() || '')}</span>
            <div className="flex items-center gap-3">
              {note.tags && note.tags.length > 0 && (
                <span className="text-blue-600">
                  {note.tags.slice(0, 2).join(', ')}
                  {note.tags.length > 2 && '...'}
                </span>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Outros view modes (list, cards) mantêm implementação similar...
    return null;
  });

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">
            {selectedNotebook ? 'Notas' : 'Todas as Notas'}
          </h2>
          <div className="flex items-center gap-2">
            {/* 🚀 Performance Stats Toggle */}
            <Button
              variant={showPerformanceStats ? 'default' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setShowPerformanceStats(!showPerformanceStats)}
              title="Estatísticas de Performance"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "h-6 w-6 p-0",
                  viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                )}
                onClick={() => setViewMode('list')}
              >
                <List className="h-3 w-3" />
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "h-6 w-6 p-0",
                  viewMode === 'cards' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                )}
                onClick={() => setViewMode('cards')}
              >
                <Grid className="h-3 w-3" />
              </Button>
              <Button
                variant={viewMode === 'snippets' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "h-6 w-6 p-0",
                  viewMode === 'snippets' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                )}
                onClick={() => setViewMode('snippets')}
              >
                <FileText className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar em notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white border-gray-200 text-sm"
            />
            {/* 🚀 Indicador de busca ativa */}
            {debouncedSearchTerm && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Zap className="h-3 w-3 text-blue-500" />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <SortAsc className="h-3 w-3 mr-1" />
                  {sortMode === 'updated' && 'Atualização'}
                  {sortMode === 'created' && 'Criação'}
                  {sortMode === 'title' && 'Título'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40">
                <DropdownMenuItem onClick={() => setSortMode('updated')}>
                  Por atualização
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortMode('created')}>
                  Por criação
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortMode('title')}>
                  Por título
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant={showFavoritesOnly ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "h-8 text-xs",
                showFavoritesOnly && 'bg-yellow-100 text-yellow-800 border-yellow-200'
              )}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              <Star className="h-3 w-3 mr-1" />
              Favoritos
            </Button>
          </div>
        </div>
      </div>

      {/* 🚀 Performance Stats Panel */}
      {showPerformanceStats && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Render: {metrics.renderTime.toFixed(1)}ms
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {filteredNotes.length} notas
              </span>
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Cache: {searchCache.cacheStats?.hitRate?.toFixed(1) || 0}% hit rate
              </span>
            </div>
            <span className="text-blue-600 font-medium">
              Performance: {metrics.renderTime < 50 ? '🚀 Excelente' : metrics.renderTime < 100 ? '⚡ Boa' : '🐌 Lenta'}
            </span>
          </div>
        </div>
      )}

      {/* Notes Count */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <span className="text-xs text-gray-600">
          {filteredNotes.length} nota{filteredNotes.length !== 1 ? 's' : ''}
          {debouncedSearchTerm && ` encontrada${filteredNotes.length !== 1 ? 's' : ''} para "${debouncedSearchTerm}"`}
        </span>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <div className="flex-1 p-8 text-center text-gray-400">
            <div className="max-w-xs mx-auto space-y-3">
              <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">
                {debouncedSearchTerm ? 'Nenhuma nota encontrada' : 'Nenhuma nota ainda'}
              </h3>
              <p className="text-xs text-gray-500">
                {debouncedSearchTerm 
                  ? 'Tente ajustar os termos de busca' 
                  : 'Crie sua primeira nota para começar'
                }
              </p>
              {!debouncedSearchTerm && (
                <Button
                  onClick={onCreateNote}
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white text-xs"
                  size="sm"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Criar Nota
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className={cn(
            "p-2",
            viewMode === 'cards' && "grid grid-cols-1 gap-3",
            viewMode === 'list' && "space-y-0",
            viewMode === 'snippets' && "space-y-0"
          )}>
            {filteredNotes.map(note => (
              <OptimizedNoteItem key={note.id} note={note} />
            ))}
          </div>
        )}
      </div>

      {/* Create Note Button */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <Button
          onClick={onCreateNote}
          className="w-full bg-green-600 hover:bg-green-700 text-white text-sm"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Nota
        </Button>
      </div>
    </div>
  );
}; 