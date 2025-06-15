import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Filter, Calendar, Tag, FileText, Folder, Star, Clock, User, X, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { FileItem } from '@/types';

interface SearchFilter {
  type: 'all' | 'notes' | 'notebooks';
  dateRange: {
    from?: Date;
    to?: Date;
  };
  tags: string[];
  favorites: boolean;
  recent: boolean;
}

interface SearchResult {
  item: FileItem;
  matchType: 'title' | 'content' | 'tag';
  matchText: string;
  relevanceScore: number;
}

interface GlobalSearchProps {
  files: FileItem[];
  onSelectResult: (fileId: string) => void;
  onClose?: () => void;
  placeholder?: string;
  className?: string;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  files,
  onSelectResult,
  onClose,
  className
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilter>({
    type: 'all',
    dateRange: {},
    tags: [],
    favorites: false,
    recent: false
  });
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);

  // Get all unique tags from files
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    files.forEach(file => {
      file.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [files]);

  // Advanced search logic
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const results: SearchResult[] = [];
    const searchTerm = query.toLowerCase();

    files.forEach(file => {
      // Apply filters first
      if (filters.type !== 'all') {
        if (filters.type === 'notes' && file.type === 'folder') return;
        if (filters.type === 'notebooks' && file.type === 'file') return;
      }

      if (filters.favorites && !file.isFavorite) return;

      if (filters.recent) {
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        if (new Date(file.updatedAt) < dayAgo) return;
      }

      if (filters.dateRange.from || filters.dateRange.to) {
        const fileDate = new Date(file.updatedAt);
        if (filters.dateRange.from && fileDate < filters.dateRange.from) return;
        if (filters.dateRange.to && fileDate > filters.dateRange.to) return;
      }

      if (filters.tags.length > 0) {
        const hasTag = filters.tags.some(tag => file.tags?.includes(tag));
        if (!hasTag) return;
      }

      // Search in title
      if (file.name.toLowerCase().includes(searchTerm)) {
        results.push({
          item: file,
          matchType: 'title',
          matchText: file.name,
          relevanceScore: file.name.toLowerCase().indexOf(searchTerm) === 0 ? 100 : 80
        });
      }

      // Search in content
      if (file.content && file.content.toLowerCase().includes(searchTerm)) {
        const contentIndex = file.content.toLowerCase().indexOf(searchTerm);
        const startIndex = Math.max(0, contentIndex - 50);
        const endIndex = Math.min(file.content.length, contentIndex + 50);
        const matchText = file.content.substring(startIndex, endIndex);

        results.push({
          item: file,
          matchType: 'content',
          matchText: `...${matchText}...`,
          relevanceScore: 60
        });
      }

      // Search in tags
      const matchingTags = file.tags?.filter(tag => 
        tag.toLowerCase().includes(searchTerm)
      );
      if (matchingTags && matchingTags.length > 0) {
        results.push({
          item: file,
          matchType: 'tag',
          matchText: matchingTags.join(', '),
          relevanceScore: 70
        });
      }
    });

    // Remove duplicates and sort by relevance
    const uniqueResults = results.reduce((acc, result) => {
      const existing = acc.find(r => r.item.id === result.item.id);
      if (!existing || result.relevanceScore > existing.relevanceScore) {
        return acc.filter(r => r.item.id !== result.item.id).concat(result);
      }
      return acc;
    }, [] as SearchResult[]);

    return uniqueResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }, [query, files, filters]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedResultIndex(prev => 
            Math.min(prev + 1, searchResults.length - 1)
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedResultIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (searchResults[selectedResultIndex]) {
            handleSelectResult(searchResults[selectedResultIndex].item.id);
          }
          break;
        case 'Escape':
          e.preventDefault();
          handleClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, searchResults, selectedResultIndex]);

  const handleSelectResult = useCallback((fileId: string) => {
    onSelectResult(fileId);
    setIsOpen(false);
    setQuery('');
    onClose?.();
  }, [onSelectResult, onClose]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    onClose?.();
  }, [onClose]);

  const toggleFilter = (filterType: keyof SearchFilter, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const toggleTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      dateRange: {},
      tags: [],
      favorites: false,
      recent: false
    });
  };

  const hasActiveFilters = filters.type !== 'all' || filters.favorites || filters.recent || 
    filters.tags.length > 0 || filters.dateRange.from || filters.dateRange.to;

  return (
    <div className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedResultIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar em todas as notas e notebooks..."
          className="pl-10 pr-10 h-9 text-sm"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => setQuery('')}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl z-[100] max-h-96 overflow-hidden">
          {/* Filters Bar */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50">
            <div className="flex items-center gap-2 flex-wrap">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-7 text-xs",
                      hasActiveFilters && "border-blue-500 bg-blue-50 text-blue-700"
                    )}
                  >
                    <Filter className="h-3 w-3 mr-1" />
                    Filtros {hasActiveFilters && `(${
                      [filters.type !== 'all', filters.favorites, filters.recent, 
                       filters.tags.length > 0, filters.dateRange.from || filters.dateRange.to]
                       .filter(Boolean).length
                    })`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4 z-[110]" align="start">
                  <div className="space-y-4">
                    {/* Type Filter */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Tipo</label>
                      <div className="flex gap-2">
                        {[
                          { value: 'all', label: 'Todos', icon: Search },
                          { value: 'notes', label: 'Notas', icon: FileText },
                          { value: 'notebooks', label: 'Notebooks', icon: Folder }
                        ].map(({ value, label, icon: Icon }) => (
                          <Button
                            key={value}
                            variant={filters.type === value ? 'default' : 'outline'}
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => toggleFilter('type', value)}
                          >
                            <Icon className="h-3 w-3 mr-1" />
                            {label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Quick Filters */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Filtros Rápidos</label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={filters.favorites}
                            onCheckedChange={(checked) => toggleFilter('favorites', checked)}
                          />
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className="text-sm">Apenas favoritos</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={filters.recent}
                            onCheckedChange={(checked) => toggleFilter('recent', checked)}
                          />
                          <Clock className="h-3 w-3 text-blue-500" />
                          <span className="text-sm">Modificados nas últimas 24h</span>
                        </div>
                      </div>
                    </div>

                    {/* Tags Filter */}
                    {availableTags.length > 0 && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">Tags</label>
                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                          {availableTags.map(tag => (
                            <Badge
                              key={tag}
                              variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                              className="text-xs cursor-pointer"
                              onClick={() => toggleTag(tag)}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        disabled={!hasActiveFilters}
                      >
                        Limpar Filtros
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Active Filters Display */}
              {filters.tags.map(tag => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs"
                >
                  <Tag className="h-2 w-2 mr-1" />
                  {tag}
                  <X
                    className="h-2 w-2 ml-1 cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="max-h-72 overflow-y-auto">
            {query.trim() === '' ? (
              <div className="p-4 text-center text-slate-500">
                <Search className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">Digite para buscar...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-4 text-center text-slate-500">
                <Search className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">Nenhum resultado encontrado</p>
                <p className="text-xs text-slate-400 mt-1">
                  Tente ajustar os filtros ou termos de busca
                </p>
              </div>
            ) : (
              searchResults.map((result, index) => (
                <button
                  key={`${result.item.id}-${result.matchType}`}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-600 last:border-b-0",
                    index === selectedResultIndex && "bg-blue-50 dark:bg-blue-900/20"
                  )}
                  onClick={() => handleSelectResult(result.item.id)}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    {result.item.type === 'folder' ? (
                      <Folder className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    ) : (
                      <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                        {result.item.name}
                      </h4>
                      {result.item.isFavorite && (
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      )}
                      <Badge variant="outline" className="text-xs">
                        {result.matchType === 'title' && 'Título'}
                        {result.matchType === 'content' && 'Conteúdo'}
                        {result.matchType === 'tag' && 'Tag'}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-slate-500 truncate">
                      {result.matchText}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-2 w-2 text-slate-400" />
                      <span className="text-xs text-slate-400">
                        {new Date(result.item.updatedAt).toLocaleDateString('pt-BR')}
                      </span>
                      {result.item.tags && result.item.tags.length > 0 && (
                        <>
                          <span className="text-slate-300">•</span>
                          <div className="flex gap-1">
                            {result.item.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs h-4">
                                {tag}
                              </Badge>
                            ))}
                            {result.item.tags.length > 2 && (
                              <span className="text-xs text-slate-400">
                                +{result.item.tags.length - 2}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <ArrowRight className="h-3 w-3 text-slate-400 flex-shrink-0" />
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {searchResults.length > 0 && (
            <div className="p-2 border-t border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''}
                </span>
                <span>
                  ↑↓ navegar • Enter selecionar • Esc fechar
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
