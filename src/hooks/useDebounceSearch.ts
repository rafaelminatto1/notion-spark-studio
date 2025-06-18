import { useState, useEffect, useRef, useCallback } from 'react';

export interface SearchAnalytics {
  query: string;
  resultsCount: number;
  searchTime: number;
  timestamp: Date;
  cancelled?: boolean;
}

export interface DebounceSearchOptions {
  delay?: number;
  minQueryLength?: number;
  enableAnalytics?: boolean;
  onAnalytics?: (data: SearchAnalytics) => void;
}

export const useDebounceSearch = (
  initialQuery = '',
  options: DebounceSearchOptions = {}
) => {
  const {
    delay = 300,
    minQueryLength = 2,
    enableAnalytics = true,
    onAnalytics
  } = options;

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [searchCount, setSearchCount] = useState(0);
  
  const searchStartTime = useRef<number>(0);
  const cancelTokenRef = useRef<AbortController | null>(null);
  const analyticsRef = useRef<SearchAnalytics[]>([]);

  // Debounce effect com cancelation
  useEffect(() => {
    // Cancelar pesquisa anterior se existir
    if (cancelTokenRef.current) {
      cancelTokenRef.current.abort();
    }

    // Não fazer debounce se query é muito pequena
    if (query.length < minQueryLength) {
      setDebouncedQuery('');
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchStartTime.current = performance.now();

    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setSearchCount(prev => prev + 1);
    }, delay);

    return () => {
      clearTimeout(timer);
      if (cancelTokenRef.current) {
        cancelTokenRef.current.abort();
      }
    };
  }, [query, delay, minQueryLength]);

  // Reset searching state quando debouncedQuery muda
  useEffect(() => {
    if (debouncedQuery) {
      setIsSearching(false);
    }
  }, [debouncedQuery]);

  // Criar novo cancel token para cada pesquisa
  const createCancelToken = useCallback(() => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.abort();
    }
    cancelTokenRef.current = new AbortController();
    return cancelTokenRef.current;
  }, []);

  // Registrar analytics da pesquisa
  const trackSearchResult = useCallback((resultsCount: number, cancelled = false) => {
    if (!enableAnalytics) return;

    const searchTime = performance.now() - searchStartTime.current;
    const analytics: SearchAnalytics = {
      query: debouncedQuery,
      resultsCount,
      searchTime: Math.round(searchTime),
      timestamp: new Date(),
      cancelled
    };

    analyticsRef.current.push(analytics);
    
    // Manter apenas os últimos 100 registros
    if (analyticsRef.current.length > 100) {
      analyticsRef.current = analyticsRef.current.slice(-100);
    }

    if (onAnalytics) {
      onAnalytics(analytics);
    }
  }, [debouncedQuery, enableAnalytics, onAnalytics]);

  // Limpar query
  const clearQuery = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setIsSearching(false);
    if (cancelTokenRef.current) {
      cancelTokenRef.current.abort();
    }
  }, []);

  // Função helper para busca com timeout
  const searchWithTimeout = useCallback(async <T>(
    searchFn: (query: string, signal: AbortSignal) => Promise<T>,
    timeoutMs = 5000
  ): Promise<T | null> => {
    if (!debouncedQuery) return null;

    const cancelToken = createCancelToken();
    
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => { reject(new Error('Search timeout')); }, timeoutMs);
      });

      const searchPromise = searchFn(debouncedQuery, cancelToken.signal);
      
      const result = await Promise.race([searchPromise, timeoutPromise]);
      return result;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          trackSearchResult(0, true);
        } else {
          console.warn('Search error:', error.message);
        }
      }
      return null;
    }
  }, [debouncedQuery, createCancelToken, trackSearchResult]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (cancelTokenRef.current) {
        cancelTokenRef.current.abort();
      }
    };
  }, []);

  return {
    query,
    setQuery,
    debouncedQuery,
    isSearching,
    searchCount,
    clearQuery,
    trackSearchResult,
    searchWithTimeout,
    createCancelToken: () => cancelTokenRef.current?.signal
  };
}; 