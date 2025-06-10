import { useState, useCallback, useMemo, useRef } from 'react';
import Fuse from 'fuse.js';
import { FileItem } from '../types/FileItem';
import { DatabaseItem } from '../types/DatabaseItem';

export interface SemanticSearchFilters {
  fileType?: ('file' | 'folder' | 'database')[];
  tags?: string[];
  dateRange?: { from: Date; to: Date };
  author?: string[];
  workspace?: string;
  hasAttachments?: boolean;
  language?: string;
  wordCount?: { min: number; max: number };
}

export interface SemanticSearchConfig {
  type: 'fuzzy' | 'exact' | 'semantic' | 'regex';
  filters: SemanticSearchFilters;
  sorting: 'relevance' | 'recent' | 'alphabetical' | 'size' | 'connections';
  highlighting: boolean;
  suggestions: boolean;
  facets: boolean;
  maxResults?: number;
}

export interface SearchResult {
  item: FileItem | DatabaseItem;
  score: number;
  matches: {
    key: string;
    indices: [number, number][];
    value: string;
  }[];
  highlights: string[];
}

export interface SearchFacet {
  key: string;
  label: string;
  values: Array<{
    value: string;
    count: number;
    selected: boolean;
  }>;
}

export interface SemanticSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  config: SemanticSearchConfig;
  setConfig: (config: Partial<SemanticSearchConfig>) => void;
  results: SearchResult[];
  facets: SearchFacet[];
  suggestions: string[];
  isSearching: boolean;
  totalResults: number;
  searchTime: number;
  search: (customQuery?: string) => Promise<void>;
  clearSearch: () => void;
  addFilter: (key: keyof SemanticSearchFilters, value: any) => void;
  removeFilter: (key: keyof SemanticSearchFilters) => void;
  recentSearches: string[];
  saveSearch: (name: string) => void;
  savedSearches: Array<{ name: string; query: string; config: SemanticSearchConfig }>;
}

const DEFAULT_CONFIG: SemanticSearchConfig = {
  type: 'fuzzy',
  filters: {},
  sorting: 'relevance',
  highlighting: true,
  suggestions: true,
  facets: true,
  maxResults: 50
};

export const useSemanticSearch = (
  items: (FileItem | DatabaseItem)[],
  enableCache = true
): SemanticSearchReturn => {
  const [query, setQuery] = useState('');
  const [config, setConfigState] = useState<SemanticSearchConfig>(DEFAULT_CONFIG);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [facets, setFacets] = useState<SearchFacet[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [searchTime, setSearchTime] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<Array<{ name: string; query: string; config: SemanticSearchConfig }>>([]);

  const searchCache = useRef(new Map<string, SearchResult[]>());

  // Configuração do Fuse.js para busca fuzzy
  const fuseOptions = useMemo(() => ({
    keys: [
      { name: 'title', weight: 0.7 },
      { name: 'content', weight: 0.3 },
      { name: 'tags', weight: 0.2 },
      { name: 'metadata.description', weight: 0.1 }
    ],
    threshold: 0.3,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
    shouldSort: true,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    ignoreLocation: false,
    useExtendedSearch: true
  }), []);

  const fuse = useMemo(() => new Fuse(items, fuseOptions), [items, fuseOptions]);

  // Filtrar itens baseado nos filtros aplicados
  const filterItems = useCallback((items: (FileItem | DatabaseItem)[], filters: SemanticSearchFilters) => {
    return items.filter(item => {
      // Filtro por tipo de arquivo
      if (filters.fileType && filters.fileType.length > 0) {
        if (!filters.fileType.includes(item.type as any)) return false;
      }

      // Filtro por tags
      if (filters.tags && filters.tags.length > 0) {
        const itemTags = item.tags || [];
        if (!filters.tags.some(tag => itemTags.includes(tag))) return false;
      }

      // Filtro por data
      if (filters.dateRange) {
        const itemDate = new Date(item.lastModified);
        if (itemDate < filters.dateRange.from || itemDate > filters.dateRange.to) return false;
      }

      // Filtro por autor
      if (filters.author && filters.author.length > 0) {
        if (!filters.author.includes(item.author || '')) return false;
      }

      // Filtro por workspace
      if (filters.workspace) {
        if (item.workspaceId !== filters.workspace) return false;
      }

      // Filtro por anexos
      if (filters.hasAttachments !== undefined) {
        const hasAttachments = (item.attachments?.length || 0) > 0;
        if (hasAttachments !== filters.hasAttachments) return false;
      }

      // Filtro por contagem de palavras
      if (filters.wordCount) {
        const wordCount = item.content?.split(/\s+/).length || 0;
        if (wordCount < filters.wordCount.min || wordCount > filters.wordCount.max) return false;
      }

      return true;
    });
  }, []);

  // Busca exata
  const exactSearch = useCallback((query: string, items: (FileItem | DatabaseItem)[]): SearchResult[] => {
    const lowerQuery = query.toLowerCase();
    return items
      .filter(item => 
        item.title.toLowerCase().includes(lowerQuery) ||
        item.content?.toLowerCase().includes(lowerQuery)
      )
      .map(item => ({
        item,
        score: 0,
        matches: [],
        highlights: [query]
      }));
  }, []);

  // Busca regex
  const regexSearch = useCallback((query: string, items: (FileItem | DatabaseItem)[]): SearchResult[] => {
    try {
      const regex = new RegExp(query, 'gi');
      return items
        .filter(item => 
          regex.test(item.title) ||
          regex.test(item.content || '')
        )
        .map(item => ({
          item,
          score: 0,
          matches: [],
          highlights: [query]
        }));
    } catch {
      return [];
    }
  }, []);

  // Busca semântica (simulada com análise de contexto)
  const semanticSearch = useCallback((query: string, items: (FileItem | DatabaseItem)[]): SearchResult[] => {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const semanticScores = items.map(item => {
      let score = 0;
      const content = `${item.title} ${item.content || ''}`.toLowerCase();
      
      // Análise de contexto simples
      queryTerms.forEach(term => {
        // Busca exata
        if (content.includes(term)) {
          score += 10;
        }
        
        // Busca por sinônimos simples
        const synonyms = getSynonyms(term);
        synonyms.forEach(synonym => {
          if (content.includes(synonym)) {
            score += 5;
          }
        });
        
        // Proximidade de palavras
        const termIndex = content.indexOf(term);
        if (termIndex !== -1) {
          queryTerms.forEach(otherTerm => {
            if (otherTerm !== term) {
              const otherIndex = content.indexOf(otherTerm);
              if (otherIndex !== -1) {
                const distance = Math.abs(termIndex - otherIndex);
                if (distance < 50) {
                  score += Math.max(0, 3 - distance / 10);
                }
              }
            }
          });
        }
      });

      return { item, score };
    });

    return semanticScores
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(result => ({
        item: result.item,
        score: result.score,
        matches: [],
        highlights: queryTerms
      }));
  }, []);

  // Função simples de sinônimos (pode ser expandida)
  const getSynonyms = useCallback((word: string): string[] => {
    const synonymMap: Record<string, string[]> = {
      'importante': ['crucial', 'relevante', 'significativo'],
      'projeto': ['trabalho', 'tarefa', 'empreendimento'],
      'documento': ['arquivo', 'texto', 'paper'],
      'reunião': ['encontro', 'meeting', 'sessão'],
      'ideia': ['conceito', 'noção', 'pensamento']
    };
    
    return synonymMap[word] || [];
  }, []);

  // Ordenar resultados
  const sortResults = useCallback((results: SearchResult[], sorting: SemanticSearchConfig['sorting']): SearchResult[] => {
    const sortedResults = [...results];
    
    switch (sorting) {
      case 'relevance':
        return sortedResults.sort((a, b) => (b.score || 0) - (a.score || 0));
      
      case 'recent':
        return sortedResults.sort((a, b) => 
          new Date(b.item.lastModified).getTime() - new Date(a.item.lastModified).getTime()
        );
      
      case 'alphabetical':
        return sortedResults.sort((a, b) => a.item.title.localeCompare(b.item.title));
      
      case 'size':
        return sortedResults.sort((a, b) => 
          (b.item.content?.length || 0) - (a.item.content?.length || 0)
        );
      
      case 'connections':
        return sortedResults.sort((a, b) => 
          (b.item.connections?.length || 0) - (a.item.connections?.length || 0)
        );
      
      default:
        return sortedResults;
    }
  }, []);

  // Gerar facetas
  const generateFacets = useCallback((results: SearchResult[]): SearchFacet[] => {
    const facets: SearchFacet[] = [];
    
    // Faceta por tipo
    const typeCounts = results.reduce((acc, result) => {
      const type = result.item.type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    facets.push({
      key: 'type',
      label: 'Tipo',
      values: Object.entries(typeCounts).map(([value, count]) => ({
        value,
        count,
        selected: config.filters.fileType?.includes(value as any) || false
      }))
    });

    // Faceta por tags
    const allTags = results.flatMap(result => result.item.tags || []);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    facets.push({
      key: 'tags',
      label: 'Tags',
      values: Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([value, count]) => ({
          value,
          count,
          selected: config.filters.tags?.includes(value) || false
        }))
    });

    return facets;
  }, [config.filters]);

  // Gerar sugestões
  const generateSuggestions = useCallback((query: string): string[] => {
    if (query.length < 2) return [];
    
    const suggestions = new Set<string>();
    
    // Sugestões baseadas em títulos
    items.forEach(item => {
      const words = item.title.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.startsWith(query.toLowerCase()) && word !== query.toLowerCase()) {
          suggestions.add(word);
        }
      });
    });

    // Sugestões baseadas em tags
    items.forEach(item => {
      item.tags?.forEach(tag => {
        if (tag.toLowerCase().startsWith(query.toLowerCase())) {
          suggestions.add(tag);
        }
      });
    });

    return Array.from(suggestions).slice(0, 5);
  }, [items]);

  // Função principal de busca
  const search = useCallback(async (customQuery?: string) => {
    const searchQuery = customQuery || query;
    if (!searchQuery.trim()) {
      setResults([]);
      setFacets([]);
      setSuggestions([]);
      setTotalResults(0);
      return;
    }

    setIsSearching(true);
    const startTime = performance.now();

    try {
      // Verificar cache
      const cacheKey = `${searchQuery}-${JSON.stringify(config)}`;
      if (enableCache && searchCache.current.has(cacheKey)) {
        const cachedResults = searchCache.current.get(cacheKey)!;
        setResults(cachedResults);
        setTotalResults(cachedResults.length);
        setIsSearching(false);
        return;
      }

      // Filtrar itens
      const filteredItems = filterItems(items, config.filters);

      // Executar busca baseada no tipo
      let searchResults: SearchResult[] = [];
      
      switch (config.type) {
        case 'exact':
          searchResults = exactSearch(searchQuery, filteredItems);
          break;
        
        case 'regex':
          searchResults = regexSearch(searchQuery, filteredItems);
          break;
        
        case 'semantic':
          searchResults = semanticSearch(searchQuery, filteredItems);
          break;
        
        case 'fuzzy':
        default:
          const fuseResults = fuse.search(searchQuery);
          searchResults = fuseResults
            .filter(result => filteredItems.includes(result.item))
            .map(result => ({
              item: result.item,
              score: 1 - (result.score || 0),
              matches: result.matches || [],
              highlights: config.highlighting ? [searchQuery] : []
            }));
          break;
      }

      // Ordenar resultados
      searchResults = sortResults(searchResults, config.sorting);

      // Limitar resultados
      if (config.maxResults) {
        searchResults = searchResults.slice(0, config.maxResults);
      }

      // Gerar facetas e sugestões
      const facets = config.facets ? generateFacets(searchResults) : [];
      const suggestions = config.suggestions ? generateSuggestions(searchQuery) : [];

      // Salvar no cache
      if (enableCache) {
        searchCache.current.set(cacheKey, searchResults);
      }

      // Adicionar às buscas recentes
      if (searchQuery && !recentSearches.includes(searchQuery)) {
        setRecentSearches(prev => [searchQuery, ...prev.slice(0, 9)]);
      }

      setResults(searchResults);
      setFacets(facets);
      setSuggestions(suggestions);
      setTotalResults(searchResults.length);

    } catch (error) {
      console.error('Erro na busca:', error);
      setResults([]);
      setFacets([]);
      setSuggestions([]);
      setTotalResults(0);
    } finally {
      const endTime = performance.now();
      setSearchTime(endTime - startTime);
      setIsSearching(false);
    }
  }, [query, config, items, fuse, filterItems, exactSearch, regexSearch, semanticSearch, sortResults, generateFacets, generateSuggestions, recentSearches, enableCache]);

  // Funções utilitárias
  const setConfig = useCallback((newConfig: Partial<SemanticSearchConfig>) => {
    setConfigState(prev => ({ ...prev, ...newConfig }));
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setFacets([]);
    setSuggestions([]);
    setTotalResults(0);
  }, []);

  const addFilter = useCallback((key: keyof SemanticSearchFilters, value: any) => {
    setConfig({
      filters: {
        ...config.filters,
        [key]: value
      }
    });
  }, [config.filters, setConfig]);

  const removeFilter = useCallback((key: keyof SemanticSearchFilters) => {
    const newFilters = { ...config.filters };
    delete newFilters[key];
    setConfig({ filters: newFilters });
  }, [config.filters, setConfig]);

  const saveSearch = useCallback((name: string) => {
    const newSavedSearch = { name, query, config };
    setSavedSearches(prev => [...prev, newSavedSearch]);
  }, [query, config]);

  return {
    query,
    setQuery,
    config,
    setConfig,
    results,
    facets,
    suggestions,
    isSearching,
    totalResults,
    searchTime,
    search,
    clearSearch,
    addFilter,
    removeFilter,
    recentSearches,
    saveSearch,
    savedSearches
  };
};