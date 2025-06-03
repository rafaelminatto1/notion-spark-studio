
import React, { useState } from 'react';
import { Search, Filter, X, FileText, Hash, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useGlobalSearch, SearchResult } from '@/hooks/useGlobalSearch';
import { FileItem } from '@/types';
import { cn } from '@/lib/utils';

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
  const { query, setQuery, filters, setFilters, searchResults } = useGlobalSearch(files);

  const allTags = Array.from(
    new Set(files.flatMap(f => f.tags || []))
  );

  const toggleTagFilter = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const clearFilters = () => {
    setFilters({
      tags: [],
      dateRange: null,
      type: 'all'
    });
  };

  const handleFileSelect = (fileId: string) => {
    onFileSelect(fileId);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar em todas as páginas..."
          className="pl-10 pr-20 bg-notion-dark-hover border-notion-dark-border"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-6 w-6 p-0",
                  (filters.tags.length > 0 || filters.dateRange) && "bg-notion-purple text-white"
                )}
              >
                <Filter className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-notion-dark border-notion-dark-border">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white">Filtros</h4>
                  {(filters.tags.length > 0 || filters.dateRange) && (
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
                
                <div>
                  <label className="text-sm font-medium text-gray-300">Tags</label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {allTags.map(tag => (
                      <Badge
                        key={tag}
                        variant={filters.tags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => toggleTagFilter(tag)}
                      >
                        <Hash className="h-2 w-2 mr-1" />
                        {tag}
                      </Badge>
                    ))}
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

      {/* Search Results */}
      {isOpen && (query || filters.tags.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-notion-dark border border-notion-dark-border rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {searchResults.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum resultado encontrado</p>
            </div>
          ) : (
            <div className="p-2">
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
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, index) => (
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark key={index} className="bg-yellow-400 text-black">{part}</mark>
      ) : part
    ));
  };

  return (
    <div
      className="p-3 rounded-md hover:bg-notion-dark-hover cursor-pointer transition-colors"
      onClick={onSelect}
    >
      <div className="flex items-center gap-2 mb-2">
        {result.file.emoji && <span>{result.file.emoji}</span>}
        <FileText className="h-4 w-4 text-gray-400" />
        <span className="font-medium text-white">
          {highlightText(result.file.name, query)}
        </span>
      </div>
      
      {result.matches.map((match, index) => (
        <div key={index} className="text-sm text-gray-300 ml-6">
          {match.type === 'content' && match.context && (
            <p className="truncate">
              ...{highlightText(match.context, query)}...
            </p>
          )}
          {match.type === 'tag' && (
            <div className="flex items-center gap-1">
              <Hash className="h-3 w-3" />
              {highlightText(match.text, query)}
            </div>
          )}
        </div>
      ))}
      
      {result.file.tags && result.file.tags.length > 0 && (
        <div className="flex items-center gap-1 mt-2 ml-6">
          {result.file.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              <Hash className="h-2 w-2 mr-1" />
              {tag}
            </Badge>
          ))}
          {result.file.tags.length > 3 && (
            <span className="text-xs text-gray-400">+{result.file.tags.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
};
