import React, { useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Sparkles, Clock, Tag, FileText, Database, Folder, X, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useDebounce } from '@/hooks/useDebounce';
import { FileItem } from '@/types';
import { cn } from '@/lib/utils';

interface SearchFilters {
  types: ('file' | 'folder' | 'database')[];
  tags: string[];
  dateRange: { from: Date; to: Date } | null;
  minRelevance: number;
  includeContent: boolean;
  exactMatch: boolean;
}

interface SearchResult {
  item: FileItem;
  relevance: number;
  matches: {
    type: 'title' | 'content' | 'tag';
    text: string;
    position: number;
  }[];
  snippet: string;
}

interface AdvancedSemanticSearchProps {
  files: FileItem[];
  onFileSelect: (fileId: string) => void;
  className?: string;
}

export const AdvancedSemanticSearch: React.FC<AdvancedSemanticSearchProps> = ({
  files,
  onFileSelect,
  className
}) => {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    types: ['file', 'folder', 'database'],
    tags: [],
    dateRange: null,
    minRelevance: 30,
    includeContent: true,
    exactMatch: false
  });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Simulação de busca semântica avançada
  const searchResults = useMemo<SearchResult[]>(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) return [];

    const results: SearchResult[] = [];
    const searchTerms = debouncedQuery.toLowerCase().split(' ').filter(term => term.length > 1);

    files.forEach(file => {
      let relevance = 0;
      const matches: SearchResult['matches'] = [];
      
      // Busca no título
      const titleMatch = file.name.toLowerCase().includes(debouncedQuery.toLowerCase());
      if (titleMatch) {
        relevance += 40;
        matches.push({
          type: 'title',
          text: file.name,
          position: file.name.toLowerCase().indexOf(debouncedQuery.toLowerCase())
        });
      }

      // Busca nas tags
      file.tags?.forEach(tag => {
        if (tag.toLowerCase().includes(debouncedQuery.toLowerCase())) {
          relevance += 20;
          matches.push({
            type: 'tag',
            text: tag,
            position: 0
          });
        }
      });

      // Busca no conteúdo (se habilitada)
      if (filters.includeContent && file.content) {
        const contentLower = file.content.toLowerCase();
        searchTerms.forEach(term => {
          const termMatches = (contentLower.match(new RegExp(term, 'g')) || []).length;
          relevance += termMatches * 5;
          
          if (termMatches > 0) {
            const position = contentLower.indexOf(term);
            const snippet = file.content!.substring(Math.max(0, position - 50), position + 50);
            matches.push({
              type: 'content',
              text: snippet,
              position
            });
          }
        });
      }

      // Filtros aplicados
      if (!filters.types.includes(file.type as any)) return;
      if (relevance < filters.minRelevance) return;
      if (filters.tags.length > 0 && !filters.tags.some(tag => file.tags?.includes(tag))) return;

      if (relevance > 0) {
        results.push({
          item: file,
          relevance,
          matches,
          snippet: matches.find(m => m.type === 'content')?.text || 
                   file.content?.substring(0, 150) || ''
        });
      }
    });

    return results.sort((a, b) => b.relevance - a.relevance).slice(0, 20);
  }, [debouncedQuery, files, filters]);

  // Sugestões de IA baseadas na busca
  React.useEffect(() => {
    if (debouncedQuery.length > 2) {
      // Simular sugestões inteligentes
      const suggestions = [
        `arquivos relacionados a "${debouncedQuery}"`,
        `tags similares a "${debouncedQuery}"`,
        `projetos contendo "${debouncedQuery}"`,
        `documentos recentes sobre "${debouncedQuery}"`
      ].slice(0, 3);
      
      setAiSuggestions(suggestions);
    } else {
      setAiSuggestions([]);
    }
  }, [debouncedQuery]);

  const handleSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery && !recentSearches.includes(searchQuery)) {
      setRecentSearches(prev => [searchQuery, ...prev.slice(0, 9)]);
    }
  }, [recentSearches]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      types: ['file', 'folder', 'database'],
      tags: [],
      dateRange: null,
      minRelevance: 30,
      includeContent: true,
      exactMatch: false
    });
  };

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    files.forEach(file => {
      file.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [files]);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'file': return <FileText className="h-4 w-4" />;
      case 'folder': return <Folder className="h-4 w-4" />;
      case 'database': return <Database className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? 
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-1">{part}</mark> : 
        part
    );
  };

  return (
    <div className={cn("relative", className)}>
      {/* Campo de busca principal */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={searchInputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 Busca inteligente com IA..."
            className="pl-10 pr-20 py-3 text-base border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl transition-all duration-200"
            onFocus={() => setIsExpanded(true)}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            {query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuery('')}
                className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "h-6 w-6 p-0 rounded-full transition-colors",
                isExpanded ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400" : ""
              )}
            >
              <Filter className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Indicadores de busca ativa */}
        {(query || searchResults.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-1 flex items-center justify-between px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs">
            <span className="text-gray-600 dark:text-gray-400">
              {searchResults.length} resultados encontrados
            </span>
            {searchResults.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                IA Ativa
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Painel expandido com filtros e resultados */}
      <AnimatePresence>
        {(isExpanded || query) && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 mt-2 z-50"
          >
            <Card className="shadow-xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl">
              <CardContent className="p-0">
                <Tabs defaultValue="results" className="w-full">
                  <div className="px-4 pt-4 pb-2">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="results" className="text-sm">
                        Resultados ({searchResults.length})
                      </TabsTrigger>
                      <TabsTrigger value="filters" className="text-sm">
                        Filtros
                      </TabsTrigger>
                      <TabsTrigger value="ai" className="text-sm">
                        <Sparkles className="h-3 w-3 mr-1" />
                        IA
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="results" className="mt-0 px-4 pb-4">
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {searchResults.length === 0 && query ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Nenhum resultado encontrado</p>
                          <p className="text-xs mt-1">Tente ajustar os filtros ou termos de busca</p>
                        </div>
                      ) : (
                        searchResults.map((result, index) => (
                          <motion.div
                            key={result.item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => onFileSelect(result.item.id)}
                            className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-all duration-200 hover:shadow-md group"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors">
                                {getIconForType(result.item.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                    {highlightMatch(result.item.name, query)}
                                  </h4>
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    {result.relevance}% relevante
                                  </Badge>
                                </div>
                                
                                {result.snippet && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                    {highlightMatch(result.snippet, query)}
                                  </p>
                                )}
                                
                                <div className="flex items-center gap-2 mt-2">
                                  {result.item.tags?.slice(0, 3).map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {highlightMatch(tag, query)}
                                    </Badge>
                                  ))}
                                  {result.matches.length > 0 && (
                                    <span className="text-xs text-gray-500">
                                      {result.matches.length} correspondência(s)
                                    </span>
                                  )}
                                </div>
                              </div>
                              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="filters" className="mt-0 px-4 pb-4 space-y-4">
                    {/* Tipos de arquivo */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Tipos de arquivo
                      </label>
                      <div className="flex gap-2">
                        {(['file', 'folder', 'database'] as const).map(type => (
                          <Button
                            key={type}
                            variant={filters.types.includes(type) ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              const newTypes = filters.types.includes(type)
                                ? filters.types.filter(t => t !== type)
                                : [...filters.types, type];
                              handleFilterChange('types', newTypes);
                            }}
                            className="flex items-center gap-1"
                          >
                            {getIconForType(type)}
                            {type}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Relevância mínima */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Relevância mínima: {filters.minRelevance}%
                      </label>
                      <Slider
                        value={[filters.minRelevance]}
                        onValueChange={([value]) => handleFilterChange('minRelevance', value)}
                        max={100}
                        step={10}
                        className="w-full"
                      />
                    </div>

                    {/* Opções avançadas */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm text-gray-700 dark:text-gray-300">
                          Incluir conteúdo dos arquivos
                        </label>
                        <Switch
                          checked={filters.includeContent}
                          onCheckedChange={(checked) => handleFilterChange('includeContent', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm text-gray-700 dark:text-gray-300">
                          Correspondência exata
                        </label>
                        <Switch
                          checked={filters.exactMatch}
                          onCheckedChange={(checked) => handleFilterChange('exactMatch', checked)}
                        />
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearFilters}
                      className="w-full"
                    >
                      Limpar filtros
                    </Button>
                  </TabsContent>

                  <TabsContent value="ai" className="mt-0 px-4 pb-4 space-y-4">
                    {/* Sugestões de IA */}
                    {aiSuggestions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                          <Sparkles className="h-4 w-4" />
                          Sugestões inteligentes
                        </h4>
                        <div className="space-y-2">
                          {aiSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSearch(suggestion)}
                              className="w-full text-left p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-sm"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Buscas recentes */}
                    {recentSearches.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Buscas recentes
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {recentSearches.slice(0, 5).map((search, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
                              onClick={() => handleSearch(search)}
                            >
                              {search}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags populares */}
                    {allTags.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                          <Tag className="h-4 w-4" />
                          Tags populares
                        </h4>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                          {allTags.slice(0, 20).map(tag => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
                              onClick={() => handleSearch(tag)}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay para fechar */}
      {(isExpanded || query) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}; 