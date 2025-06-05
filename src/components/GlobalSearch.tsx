
import React, { useState, useEffect } from 'react';
import { Search, Filter, X, FileText, Hash, Calendar, SortAsc, SortDesc, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useGlobalSearch, SearchResult } from '@/hooks/useGlobalSearch';
import { FileItem } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface GlobalSearchProps {
  files: FileItem[];
  onFileSelect: (fileId: string) => void;
  className?: string;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  files,
  onFileSelect,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const { 
    query, 
    setQuery, 
    filters, 
    setFilters, 
    searchResults, 
    isSearching,
    clearFilters,
    addTagFilter,
    removeTagFilter
  } = useGlobalSearch(files);

  const allTags = Array.from(
    new Set(files.flatMap(f => f.tags || []))
  ).sort();

  const handleFileSelect = (fileId: string) => {
    onFileSelect(fileId);
    setIsOpen(false);
    setQuery('');
  };

  const hasActiveFilters = filters.tags.length > 0 || filters.dateRange || filters.type !== 'all';

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Convert our date range format to react-day-picker format
  const selectedDateRange = filters.dateRange ? {
    from: filters.dateRange.start,
    to: filters.dateRange.end
  } : undefined;

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar páginas, conteúdo, tags..."
          className="pl-10 pr-24 bg-notion-dark-hover border-notion-dark-border"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-6 w-6 p-0",
                  hasActiveFilters && "bg-notion-purple text-white"
                )}
              >
                <Filter className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-notion-dark border-notion-dark-border">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white">Filtros Avançados</h4>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-gray-400 hover:text-white"
                    >
                      Limpar
                    </Button>
                  )}
                </div>
                
                {/* Tags Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Tags</label>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                    {allTags.map(tag => (
                      <Badge
                        key={tag}
                        variant={filters.tags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => {
                          if (filters.tags.includes(tag)) {
                            removeTagFilter(tag);
                          } else {
                            addTagFilter(tag);
                          }
                        }}
                      >
                        <Hash className="h-2 w-2 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Data</label>
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <Calendar className="h-4 w-4 mr-2" />
                        {filters.dateRange ? (
                          `${format(filters.dateRange.start, 'dd/MM/yyyy')} - ${format(filters.dateRange.end, 'dd/MM/yyyy')}`
                        ) : (
                          'Selecionar período'
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="range"
                        selected={selectedDateRange}
                        onSelect={(range) => {
                          if (range?.from && range?.to) {
                            setFilters(prev => ({
                              ...prev,
                              dateRange: { start: range.from!, end: range.to! }
                            }));
                          } else {
                            setFilters(prev => ({
                              ...prev,
                              dateRange: null
                            }));
                          }
                          setDatePickerOpen(false);
                        }}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Sort Options */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1 block">Ordenar por</label>
                    <Select 
                      value={filters.sortBy} 
                      onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value as any }))}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevância</SelectItem>
                        <SelectItem value="modified">Modificado</SelectItem>
                        <SelectItem value="created">Criado</SelectItem>
                        <SelectItem value="name">Nome</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1 block">Ordem</label>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-full"
                      onClick={() => setFilters(prev => ({ 
                        ...prev, 
                        sortOrder: prev.sortOrder === 'desc' ? 'asc' : 'desc' 
                      }))}
                    >
                      {filters.sortOrder === 'desc' ? <SortDesc className="h-3 w-3" /> : <SortAsc className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <kbd className="px-1.5 py-0.5 text-xs bg-notion-dark-hover border border-notion-dark-border rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1 mt-2">
          {filters.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              <Hash className="h-2 w-2 mr-1" />
              {tag}
              <X 
                className="h-2 w-2 ml-1 cursor-pointer" 
                onClick={() => removeTagFilter(tag)}
              />
            </Badge>
          ))}
          {filters.dateRange && (
            <Badge variant="secondary" className="text-xs">
              <Calendar className="h-2 w-2 mr-1" />
              {format(filters.dateRange.start, 'dd/MM')} - {format(filters.dateRange.end, 'dd/MM')}
              <X 
                className="h-2 w-2 ml-1 cursor-pointer" 
                onClick={() => setFilters(prev => ({ ...prev, dateRange: null }))}
              />
            </Badge>
          )}
        </div>
      )}

      {/* Search Results */}
      {isOpen && (query || hasActiveFilters) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-notion-dark border border-notion-dark-border rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center">
              <Search className="h-6 w-6 mx-auto mb-2 animate-pulse text-gray-400" />
              <p className="text-gray-400">Buscando...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum resultado encontrado</p>
              {query && <p className="text-xs mt-1">Tente termos diferentes ou use filtros</p>}
            </div>
          ) : (
            <div className="p-2">
              <div className="text-xs text-gray-400 px-2 py-1 mb-2">
                {searchResults.length} resultado(s) encontrado(s)
              </div>
              {searchResults.map(result => (
                <SearchResultItem
                  key={result.file.id}
                  result={result}
                  query={query}
                  onSelect={() => handleFileSelect(result.file.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

interface SearchResultItemProps {
  result: SearchResult;
  query: string;
  onSelect: () => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({
  result,
  query,
  onSelect
}) => {
  const highlightText = (text: string, highlight: string, startIndex?: number, endIndex?: number) => {
    if (!highlight.trim()) return text;
    
    if (startIndex !== undefined && endIndex !== undefined) {
      return (
        <>
          {text.slice(0, startIndex)}
          <mark className="bg-yellow-400 text-black px-0.5 rounded">
            {text.slice(startIndex, endIndex)}
          </mark>
          {text.slice(endIndex)}
        </>
      );
    }
    
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, index) => (
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark key={index} className="bg-yellow-400 text-black px-0.5 rounded">{part}</mark>
      ) : part
    ));
  };

  return (
    <div
      className="p-3 rounded-md hover:bg-notion-dark-hover cursor-pointer transition-colors border-l-2 border-transparent hover:border-notion-purple"
      onClick={onSelect}
    >
      <div className="flex items-center gap-2 mb-2">
        {result.file.emoji && <span className="text-sm">{result.file.emoji}</span>}
        <FileText className="h-4 w-4 text-gray-400" />
        <span className="font-medium text-white">
          {highlightText(result.file.name, query)}
        </span>
        <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          {format(result.file.updatedAt, 'dd/MM')}
        </div>
      </div>
      
      {result.matches.map((match, index) => (
        <div key={index} className="text-sm text-gray-300 ml-6 mb-1">
          {match.type === 'content' && match.context && (
            <p className="bg-notion-dark-hover px-2 py-1 rounded text-xs">
              {match.startIndex !== undefined && match.endIndex !== undefined ? (
                <>
                  {match.context.slice(0, match.startIndex)}
                  <mark className="bg-yellow-400 text-black px-0.5 rounded">
                    {match.context.slice(match.startIndex, match.endIndex)}
                  </mark>
                  {match.context.slice(match.endIndex)}
                </>
              ) : (
                highlightText(match.context, query)
              )}
            </p>
          )}
          {match.type === 'tag' && (
            <div className="flex items-center gap-1">
              <Hash className="h-3 w-3 text-notion-purple" />
              <span className="text-notion-purple">
                {highlightText(match.text, query)}
              </span>
            </div>
          )}
        </div>
      ))}
      
      {result.file.tags && result.file.tags.length > 0 && (
        <div className="flex items-center gap-1 mt-2 ml-6 flex-wrap">
          {result.file.tags.slice(0, 4).map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              <Hash className="h-2 w-2 mr-1" />
              {tag}
            </Badge>
          ))}
          {result.file.tags.length > 4 && (
            <span className="text-xs text-gray-400">+{result.file.tags.length - 4}</span>
          )}
        </div>
      )}
    </div>
  );
};
