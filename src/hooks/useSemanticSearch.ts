import { useState, useMemo, useCallback } from 'react';
import Fuse from 'fuse.js';
import { FileItem } from '@/types';

export interface SearchConfig {
  algorithm: 'fuzzy' | 'exact' | 'semantic' | 'regex';
  threshold: number;
  maxResults: number;
  type?: string;
  sorting?: string;
  filters?: {
    fileType?: string[];
    dateRange?: { from: Date; to: Date };
  };
  highlighting?: boolean;
  suggestions?: boolean;
  facets?: boolean;
}

export interface SemanticSearchConfig extends SearchConfig {
  // Adicional configs específicas para busca semântica
}

export interface SemanticSearchFilters {
  fileType?: string[];
  dateRange?: { from: Date; to: Date };
  tags?: string[];
  authors?: string[];
}

export interface SearchResult {
  item: FileItem;
  score: number;
  relevance: number;
  highlights: string[];
  reasons: string[];
}

export interface SearchFilters {
  types: ('file' | 'folder' | 'database')[];
  tags: string[];
  dateRange: { start: Date; end: Date } | null;
  hasContent: boolean;
}

const defaultConfig: SearchConfig = {
  algorithm: 'fuzzy',
  threshold: 0.3,
  maxResults: 50
};

const defaultFilters: SearchFilters = {
  types: ['file', 'folder', 'database'],
  tags: [],
  dateRange: null,
  hasContent: false
};

export const useSemanticSearch = (files: FileItem[]) => {
  const [query, setQuery] = useState('');
  const [config, setConfig] = useState<SearchConfig>(defaultConfig);
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);

  // Configuração do Fuse.js
  const fuseOptions = useMemo(() => ({
    keys: [
      { name: 'name', weight: 0.4 },
      { name: 'content', weight: 0.3 },
      { name: 'description', weight: 0.2 },
      { name: 'tags', weight: 0.1 }
    ],
    threshold: config.threshold,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
    shouldSort: true
  }), [config.threshold]);

  const fuse = useMemo(() => new Fuse(files, fuseOptions), [files, fuseOptions]);

  // Calcular relevância
  const calculateRelevance = useCallback((file: FileItem, queryLower: string): number => {
    let relevance = 0;
    
    // Nome corresponde = alta relevância
    if (file.name.toLowerCase().includes(queryLower)) relevance += 0.4;
    
    // Conteúdo corresponde = média relevância
    if (file.content?.toLowerCase().includes(queryLower)) relevance += 0.3;
    
    // Tags correspondem = baixa relevância
    if (file.tags?.some(tag => tag.toLowerCase().includes(queryLower))) relevance += 0.2;
    
    // Arquivo recente = bonus
    const daysSince = (Date.now() - new Date(file.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 7) relevance += 0.1;
    
    return Math.min(1, relevance);
  }, []);

  // Gerar razões da correspondência
  const generateReasons = useCallback((file: FileItem, queryLower: string): string[] => {
    const reasons: string[] = [];
    
    if (file.name.toLowerCase().includes(queryLower)) {
      reasons.push('Correspondência no nome');
    }
    if (file.content?.toLowerCase().includes(queryLower)) {
      reasons.push('Correspondência no conteúdo');
    }
    if (file.tags?.some(tag => tag.toLowerCase().includes(queryLower))) {
      reasons.push('Correspondência nas tags');
    }
    
    const daysSince = (Date.now() - new Date(file.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 1) reasons.push('Modificado hoje');
    else if (daysSince < 7) reasons.push('Modificado recentemente');
    
    return reasons;
  }, []);

  // Aplicar filtros
  const applyFilters = useCallback((files: FileItem[]): FileItem[] => {
    return files.filter(file => {
      // Filtro por tipo
      if (!filters.types.includes(file.type as any)) return false;
      
      // Filtro por tags
      if (filters.tags.length > 0) {
        const hasTag = filters.tags.some(tag => 
          file.tags?.some(fileTag => fileTag.toLowerCase().includes(tag.toLowerCase()))
        );
        if (!hasTag) return false;
      }
      
      // Filtro por data
      if (filters.dateRange) {
        const fileDate = new Date(file.updatedAt);
        if (fileDate < filters.dateRange.start || fileDate > filters.dateRange.end) {
          return false;
        }
      }
      
      // Filtro por conteúdo
      if (filters.hasContent && (!file.content || file.content.trim().length === 0)) {
        return false;
      }
      
      return true;
    });
  }, [filters]);

  // Busca principal
  const searchResults = useMemo((): SearchResult[] => {
    if (!query.trim()) return [];

    const queryLower = query.toLowerCase();
    const filteredFiles = applyFilters(files);
    let results: SearchResult[] = [];

    switch (config.algorithm) {
      case 'fuzzy': {
        const fuseResults = fuse.search(query);
        results = fuseResults
          .filter(result => filteredFiles.some(f => f.id === result.item.id))
          .map(result => ({
            item: result.item,
            score: 1 - (result.score || 0),
            relevance: calculateRelevance(result.item, queryLower),
            highlights: [query],
            reasons: generateReasons(result.item, queryLower)
          }));
        break;
      }

      case 'exact': {
        results = filteredFiles
          .filter(file => 
            file.name.toLowerCase().includes(queryLower) ||
            file.content?.toLowerCase().includes(queryLower) ||
            file.description?.toLowerCase().includes(queryLower)
          )
          .map(file => ({
            item: file,
            score: 1,
            relevance: calculateRelevance(file, queryLower),
            highlights: [query],
            reasons: generateReasons(file, queryLower)
          }));
        break;
      }

      case 'regex': {
        try {
          const regex = new RegExp(query, 'gi');
          results = filteredFiles
            .filter(file => 
              regex.test(file.name) ||
              regex.test(file.content || '') ||
              regex.test(file.description || '')
            )
            .map(file => ({
              item: file,
              score: 0.9,
              relevance: calculateRelevance(file, queryLower),
              highlights: [query],
              reasons: generateReasons(file, queryLower)
            }));
        } catch {
          results = [];
        }
        break;
      }

      case 'semantic': {
        // Busca semântica básica com sinônimos
        const synonyms: Record<string, string[]> = {
          'documento': ['arquivo', 'texto', 'nota', 'paper'],
          'projeto': ['trabalho', 'task', 'assignment'],
          'reunião': ['meeting', 'encontro', 'call'],
          'ideia': ['conceito', 'thought', 'insight'],
          'plano': ['strategy', 'roadmap', 'plan']
        };

        const expandedTerms = [queryLower];
        for (const [key, values] of Object.entries(synonyms)) {
          if (queryLower.includes(key)) {
            expandedTerms.push(...values);
          }
          if (values.some(v => queryLower.includes(v))) {
            expandedTerms.push(key);
          }
        }

        results = filteredFiles
          .map(file => {
            const fileText = (file.name + ' ' + (file.content || '') + ' ' + (file.description || '')).toLowerCase();
            let semanticScore = 0;
            
            expandedTerms.forEach(term => {
              if (fileText.includes(term)) {
                semanticScore += term === queryLower ? 1 : 0.7;
              }
            });

            return semanticScore > 0 ? {
              item: file,
              score: Math.min(1, semanticScore),
              relevance: calculateRelevance(file, queryLower),
              highlights: expandedTerms,
              reasons: generateReasons(file, queryLower)
            } : null;
          })
          .filter((result): result is SearchResult => result !== null);
        break;
      }
    }

    // Ordenar por relevância combinada
    return results
      .sort((a, b) => {
        const scoreA = (a.score * 0.7) + (a.relevance * 0.3);
        const scoreB = (b.score * 0.7) + (b.relevance * 0.3);
        return scoreB - scoreA;
      })
      .slice(0, config.maxResults);
  }, [query, config, filters, files, fuse, applyFilters, calculateRelevance, generateReasons]);

  // Estatísticas da busca
  const searchStats = useMemo(() => ({
    totalResults: searchResults.length,
    averageScore: searchResults.length > 0 
      ? searchResults.reduce((sum, r) => sum + r.score, 0) / searchResults.length 
      : 0,
    hasExactMatches: searchResults.some(r => r.score > 0.9),
    algorithms: {
      fuzzy: searchResults.filter(r => r.score < 1).length,
      exact: searchResults.filter(r => r.score === 1).length
    }
  }), [searchResults]);

  // Controles
  const updateConfig = useCallback((newConfig: Partial<SearchConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setFilters(defaultFilters);
  }, []);

  return {
    query,
    setQuery,
    config,
    setConfig: updateConfig,
    updateConfig,
    filters,
    updateFilters,
    clearSearch,
    results: searchResults,
    stats: searchStats,
    isSearching: query.trim().length > 0,
    facets: [],
    suggestions: [],
    search: () => searchResults,
    totalResults: searchResults.length,
    searchTime: 0,
    addFilter: (type: string, value: string) => {
      // Implementação básica
    },
    removeFilter: (type: string, value: string) => {
      // Implementação básica
    },
    recentSearches: [],
    saveSearch: (name: string) => {
      // Implementação básica
    },
    savedSearches: []
  };
}; 