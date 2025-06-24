import { useState, useEffect, useCallback, useContext } from 'react';
import type { SmartCacheSystem, CacheStats} from './SmartCacheCore';
import { CacheConfig } from './SmartCacheCore';

// Context será importado do SmartCacheProvider.tsx
interface CacheContextType {
  cacheSystem: SmartCacheSystem;
}

// Este será definido no SmartCacheProvider.tsx
declare const CacheContext: React.Context<CacheContextType | undefined>;

export function useSmartCache() {
  const context = useContext(CacheContext);
  
  if (!context) {
    throw new Error('useSmartCache deve ser usado dentro de um CacheProvider');
  }

  const { cacheSystem } = context;
  const [stats, setStats] = useState<CacheStats>(cacheSystem.getStats());

  const set = useCallback(async <T>(
    key: string,
    data: T,
    options?: {
      ttl?: number;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      tags?: string[];
      metadata?: Record<string, unknown>;
    }
  ) => {
    await cacheSystem.set(key, data, options);
    setStats(cacheSystem.getStats());
  }, [cacheSystem]);

  const get = useCallback(async <T>(key: string): Promise<T | null> => {
    const result = await cacheSystem.get<T>(key);
    setStats(cacheSystem.getStats());
    return result;
  }, [cacheSystem]);

  const invalidate = useCallback(async (key: string): Promise<boolean> => {
    const result = await cacheSystem.invalidate(key);
    setStats(cacheSystem.getStats());
    return result;
  }, [cacheSystem]);

  const invalidateByTag = useCallback(async (tag: string): Promise<number> => {
    const result = await cacheSystem.invalidateByTag(tag);
    setStats(cacheSystem.getStats());
    return result;
  }, [cacheSystem]);

  const clear = useCallback(async (): Promise<void> => {
    await cacheSystem.clear();
    setStats(cacheSystem.getStats());
  }, [cacheSystem]);

  const getHotKeys = useCallback((limit = 10) => {
    return cacheSystem.getHotKeys(limit);
  }, [cacheSystem]);

  const getColdKeys = useCallback((limit = 10) => {
    return cacheSystem.getColdKeys(limit);
  }, [cacheSystem]);

  const getMemoryUsage = useCallback(() => {
    return cacheSystem.getMemoryUsage();
  }, [cacheSystem]);

  const refreshStats = useCallback(() => {
    setStats(cacheSystem.getStats());
  }, [cacheSystem]);

  // Atualizar stats periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(cacheSystem.getStats());
    }, 5000); // Atualizar a cada 5 segundos

    return () => clearInterval(interval);
  }, [cacheSystem]);

  return {
    set,
    get,
    invalidate,
    invalidateByTag,
    clear,
    stats,
    getHotKeys,
    getColdKeys,
    getMemoryUsage,
    refreshStats,
    cacheSystem
  };
}

export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    tags?: string[];
    enabled?: boolean;
    refetchOnMount?: boolean;
  } = {}
) {
  const {
    ttl = 300000, // 5 minutos
    priority = 'medium',
    tags = [],
    enabled = true,
    refetchOnMount = false
  } = options;

  const { get, set } = useSmartCache();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      // Verificar cache primeiro (a menos que seja forçado)
      if (!force) {
        const cached = await get<T>(key);
        if (cached !== null) {
          setData(cached);
          setIsLoading(false);
          return cached;
        }
      }

      // Buscar dados novos
      setIsValidating(true);
      const newData = await fetcher();
      
      // Salvar no cache
      await set(key, newData, { ttl, priority, tags });
      setData(newData);
      
      return newData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
      setIsValidating(false);
    }
  }, [key, fetcher, get, set, ttl, priority, tags, enabled]);

  const invalidate = useCallback(async () => {
    const cache = useSmartCache();
    await cache.invalidate(key);
    setData(null);
  }, [key]);

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  // Fetch inicial
  useEffect(() => {
    if (enabled && (refetchOnMount || data === null)) {
      fetchData();
    }
  }, [fetchData, enabled, refetchOnMount, data]);

  return {
    data,
    isLoading,
    error,
    isValidating,
    invalidate,
    refresh,
    refetch: refresh
  };
} 