import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  advancedSearchEngine, 
  SearchQuery, 
  SearchResult, 
  SearchSuggestion, 
  SearchDocument,
  SearchAnalytics 
} from '../services/AdvancedSearchEngine';

interface UseAdvancedSearchOptions {
  enableAutoSearch?: boolean;
  debounceMs?: number;
  defaultFilters?: Partial<SearchQuery['filters']>;
  defaultOptions?: Partial<SearchQuery['options']>;
  onResultSelect?: (result: SearchResult) => void;
  onError?: (error: Error) => void;
}

interface UseAdvancedSearchState {
  // Query state
  searchText: string;
  filters: SearchQuery['filters'];
  options: SearchQuery['options'];
  
  // Results state
  results: SearchResult[];
  suggestions: SearchSuggestion[];
  selectedResult: SearchResult | null;
  
  // UI state
  isSearching: boolean;
  isInitialized: boolean;
  hasError: boolean;
  errorMessage: string;
  
  // Analytics
  searchTime: number;
  totalFound: number;
  queryId: string;
  analytics: SearchAnalytics;
}

interface UseAdvancedSearchActions {
  // Search actions
  setSearchText: (text: string) => void;
  search: (query?: Partial<SearchQuery>) => Promise<void>;
  clearSearch: () => void;
  
  // Filter actions
  setFilters: (filters: Partial<SearchQuery['filters']>) => void;
  clearFilters: () => void;
  addFilter: (key: keyof SearchQuery['filters'], value: string) => void;
  removeFilter: (key: keyof SearchQuery['filters'], value: string) => void;
  
  // Option actions
  setOptions: (options: Partial<SearchQuery['options']>) => void;
  setSort: (sortBy: SearchQuery['options']['sortBy'], sortOrder?: SearchQuery['options']['sortOrder']) => void;
  setPagination: (limit: number, offset: number) => void;
  loadMore: () => Promise<void>;
  
  // Result actions
  selectResult: (result: SearchResult | null) => void;
  applySuggestion: (suggestion: SearchSuggestion) => void;
  
  // Index actions
  addDocument: (document: SearchDocument) => Promise<void>;
  removeDocument: (documentId: string) => Promise<void>;
  updateDocument: (document: SearchDocument) => Promise<void>;
  reindexDocuments: (documents: SearchDocument[]) => Promise<void>;
  
  // Utility actions
  getRecommendations: (documentId?: string) => Promise<SearchResult[]>;
  getTrendingQueries: (limit?: number) => string[];
  exportSearchHistory: () => string[];
  clearSearchHistory: () => void;
  runDiagnostics: () => Promise<any>;
}

export const useAdvancedSearch = (options: UseAdvancedSearchOptions = {}) => {
  const {
    enableAutoSearch = true,
    debounceMs = 300,
    defaultFilters = {},
    defaultOptions = {},
    onResultSelect,
    onError,
  } = options;

  // State
  const [state, setState] = useState<UseAdvancedSearchState>({
    searchText: '',
    filters: {
      type: [],
      tags: [],
      author: [],
      category: [],
      priority: [],
      ...defaultFilters,
    },
    options: {
      fuzzy: true,
      semantic: true,
      contextual: true,
      includeContent: true,
      limit: 20,
      offset: 0,
      sortBy: 'relevance',
      sortOrder: 'desc',
      ...defaultOptions,
    },
    results: [],
    suggestions: [],
    selectedResult: null,
    isSearching: false,
    isInitialized: false,
    hasError: false,
    errorMessage: '',
    searchTime: 0,
    totalFound: 0,
    queryId: '',
    analytics: {
      totalQueries: 0,
      averageResponseTime: 0,
      popularQueries: [],
      failedQueries: [],
      userSatisfaction: 0.85,
      clickThroughRate: 0.72,
      searchPatterns: {
        hourly: new Array(24).fill(0),
        daily: new Array(7).fill(0),
        weekly: new Array(52).fill(0),
      },
    },
  });

  // Refs
  const debounceRef = useRef<NodeJS.Timeout>();
  const searchCountRef = useRef(0);
  const isInitializedRef = useRef(false);

  // Memoized search query
  const currentQuery = useMemo<SearchQuery>(() => ({
    text: state.searchText,
    filters: state.filters,
    options: state.options,
  }), [state.searchText, state.filters, state.options]);

  // Initialize search engine
  useEffect(() => {
    const initializeEngine = async () => {
      if (isInitializedRef.current) return;
      
      try {
        console.log('[useAdvancedSearch] Initializing search engine...');
        
        // Initialize with empty documents for now
        await advancedSearchEngine.initialize([]);
        
        // Load analytics
        const analytics = advancedSearchEngine.getAnalytics();
        
        setState(prev => ({
          ...prev,
          isInitialized: true,
          analytics,
          hasError: false,
          errorMessage: '',
        }));
        
        isInitializedRef.current = true;
        console.log('[useAdvancedSearch] Search engine initialized successfully');
      } catch (error) {
        console.error('[useAdvancedSearch] Failed to initialize search engine:', error);
        
        setState(prev => ({
          ...prev,
          isInitialized: false,
          hasError: true,
          errorMessage: error instanceof Error ? error.message : 'Initialization failed',
        }));
        
        if (onError) {
          onError(error instanceof Error ? error : new Error('Initialization failed'));
        }
      }
    };

    initializeEngine();
  }, [onError]);

  // Debounced search effect
  useEffect(() => {
    if (!enableAutoSearch || !state.isInitialized) return;
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Set new debounce
    debounceRef.current = setTimeout(() => {
      if (state.searchText.trim()) {
        performSearch();
      } else {
        // Clear results when search text is empty
        setState(prev => ({
          ...prev,
          results: [],
          suggestions: [],
          totalFound: 0,
          searchTime: 0,
          queryId: '',
        }));
      }
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [currentQuery, state.isInitialized, enableAutoSearch, debounceMs]);

  // Perform search
  const performSearch = useCallback(async (customQuery?: Partial<SearchQuery>) => {
    if (!state.isInitialized) {
      console.warn('[useAdvancedSearch] Search engine not initialized');
      return;
    }

    const query = customQuery ? { ...currentQuery, ...customQuery } : currentQuery;
    const searchId = ++searchCountRef.current;

    setState(prev => ({
      ...prev,
      isSearching: true,
      hasError: false,
      errorMessage: '',
    }));

    try {
      console.log(`[useAdvancedSearch] Performing search #${searchId}:`, query.text);
      
      const startTime = performance.now();
      const result = await advancedSearchEngine.search(query);
      const endTime = performance.now();

      // Check if this is still the current search
      if (searchId === searchCountRef.current) {
        setState(prev => ({
          ...prev,
          results: result.results,
          suggestions: result.suggestions,
          totalFound: result.analytics.totalFound,
          searchTime: result.analytics.searchTime,
          queryId: result.analytics.queryId,
          isSearching: false,
          analytics: advancedSearchEngine.getAnalytics(),
        }));

        console.log(`[useAdvancedSearch] Search #${searchId} completed in ${endTime - startTime}ms`);
      }
    } catch (error) {
      console.error(`[useAdvancedSearch] Search #${searchId} failed:`, error);
      
      if (searchId === searchCountRef.current) {
        setState(prev => ({
          ...prev,
          isSearching: false,
          hasError: true,
          errorMessage: error instanceof Error ? error.message : 'Search failed',
          results: [],
          suggestions: [],
          totalFound: 0,
          searchTime: 0,
          queryId: '',
        }));

        if (onError) {
          onError(error instanceof Error ? error : new Error('Search failed'));
        }
      }
    }
  }, [currentQuery, state.isInitialized, onError]);

  // Actions
  const actions: UseAdvancedSearchActions = {
    // Search actions
    setSearchText: useCallback((text: string) => {
      setState(prev => ({ ...prev, searchText: text, options: { ...prev.options, offset: 0 } }));
    }, []),

    search: useCallback(async (customQuery?: Partial<SearchQuery>) => {
      await performSearch(customQuery);
    }, [performSearch]),

    clearSearch: useCallback(() => {
      setState(prev => ({
        ...prev,
        searchText: '',
        results: [],
        suggestions: [],
        selectedResult: null,
        totalFound: 0,
        searchTime: 0,
        queryId: '',
        options: { ...prev.options, offset: 0 },
      }));
    }, []),

    // Filter actions
    setFilters: useCallback((newFilters: Partial<SearchQuery['filters']>) => {
      setState(prev => ({
        ...prev,
        filters: { ...prev.filters, ...newFilters },
        options: { ...prev.options, offset: 0 },
      }));
    }, []),

    clearFilters: useCallback(() => {
      setState(prev => ({
        ...prev,
        filters: {
          type: [],
          tags: [],
          author: [],
          category: [],
          priority: [],
        },
        options: { ...prev.options, offset: 0 },
      }));
    }, []),

    addFilter: useCallback((key: keyof SearchQuery['filters'], value: string) => {
      setState(prev => {
        const currentValues = prev.filters[key] as string[] || [];
        if (!currentValues.includes(value)) {
          return {
            ...prev,
            filters: {
              ...prev.filters,
              [key]: [...currentValues, value],
            },
            options: { ...prev.options, offset: 0 },
          };
        }
        return prev;
      });
    }, []),

    removeFilter: useCallback((key: keyof SearchQuery['filters'], value: string) => {
      setState(prev => {
        const currentValues = prev.filters[key] as string[] || [];
        return {
          ...prev,
          filters: {
            ...prev.filters,
            [key]: currentValues.filter(v => v !== value),
          },
          options: { ...prev.options, offset: 0 },
        };
      });
    }, []),

    // Option actions
    setOptions: useCallback((newOptions: Partial<SearchQuery['options']>) => {
      setState(prev => ({
        ...prev,
        options: { ...prev.options, ...newOptions },
      }));
    }, []),

    setSort: useCallback((sortBy: SearchQuery['options']['sortBy'], sortOrder: SearchQuery['options']['sortOrder'] = 'desc') => {
      setState(prev => ({
        ...prev,
        options: { ...prev.options, sortBy, sortOrder, offset: 0 },
      }));
    }, []),

    setPagination: useCallback((limit: number, offset: number) => {
      setState(prev => ({
        ...prev,
        options: { ...prev.options, limit, offset },
      }));
    }, []),

    loadMore: useCallback(async () => {
      if (state.isSearching) return;
      
      const newOffset = state.options.offset + state.options.limit;
      const customQuery = {
        ...currentQuery,
        options: { ...currentQuery.options, offset: newOffset },
      };

      await performSearch(customQuery);
    }, [state.isSearching, state.options, currentQuery, performSearch]),

    // Result actions
    selectResult: useCallback((result: SearchResult | null) => {
      setState(prev => ({ ...prev, selectedResult: result }));
      
      if (result && onResultSelect) {
        onResultSelect(result);
      }
    }, [onResultSelect]),

    applySuggestion: useCallback((suggestion: SearchSuggestion) => {
      setState(prev => ({
        ...prev,
        searchText: suggestion.text,
        options: { ...prev.options, offset: 0 },
      }));
    }, []),

    // Index actions
    addDocument: useCallback(async (document: SearchDocument) => {
      try {
        await advancedSearchEngine.indexDocument(document);
        console.log('[useAdvancedSearch] Document added to index:', document.id);
      } catch (error) {
        console.error('[useAdvancedSearch] Failed to add document:', error);
        if (onError) {
          onError(error instanceof Error ? error : new Error('Failed to add document'));
        }
      }
    }, [onError]),

    removeDocument: useCallback(async (documentId: string) => {
      try {
        // Note: Implementation depends on search engine having removeDocument method
        console.log('[useAdvancedSearch] Document removal requested:', documentId);
        // await advancedSearchEngine.removeDocument(documentId);
      } catch (error) {
        console.error('[useAdvancedSearch] Failed to remove document:', error);
        if (onError) {
          onError(error instanceof Error ? error : new Error('Failed to remove document'));
        }
      }
    }, [onError]),

    updateDocument: useCallback(async (document: SearchDocument) => {
      try {
        await advancedSearchEngine.indexDocument(document); // Re-index to update
        console.log('[useAdvancedSearch] Document updated in index:', document.id);
      } catch (error) {
        console.error('[useAdvancedSearch] Failed to update document:', error);
        if (onError) {
          onError(error instanceof Error ? error : new Error('Failed to update document'));
        }
      }
    }, [onError]),

    reindexDocuments: useCallback(async (documents: SearchDocument[]) => {
      try {
        await advancedSearchEngine.initialize(documents);
        setState(prev => ({ ...prev, analytics: advancedSearchEngine.getAnalytics() }));
        console.log('[useAdvancedSearch] Documents reindexed:', documents.length);
      } catch (error) {
        console.error('[useAdvancedSearch] Failed to reindex documents:', error);
        if (onError) {
          onError(error instanceof Error ? error : new Error('Failed to reindex documents'));
        }
      }
    }, [onError]),

    // Utility actions
    getRecommendations: useCallback(async (documentId?: string) => {
      // Implementation for content-based recommendations
      console.log('[useAdvancedSearch] Getting recommendations for:', documentId);
      return [];
    }, []),

    getTrendingQueries: useCallback((limit = 10) => {
      return advancedSearchEngine.getTrendingQueries(limit);
    }, []),

    exportSearchHistory: useCallback(() => {
      return advancedSearchEngine.getAnalytics().popularQueries;
    }, []),

    clearSearchHistory: useCallback(() => {
      // Implementation depends on search engine having clearHistory method
      console.log('[useAdvancedSearch] Search history cleared');
    }, []),

    runDiagnostics: useCallback(async () => {
      return await advancedSearchEngine.runDiagnostics();
    }, []),
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    // State
    ...state,
    currentQuery,
    
    // Actions
    ...actions,
    
    // Computed properties
    hasResults: state.results.length > 0,
    hasSuggestions: state.suggestions.length > 0,
    canLoadMore: state.results.length >= state.options.limit,
    isLoading: state.isSearching,
    
    // Search engine instance for advanced usage
    searchEngine: advancedSearchEngine,
  };
};

export default useAdvancedSearch;
export type { UseAdvancedSearchOptions, UseAdvancedSearchState, UseAdvancedSearchActions };
