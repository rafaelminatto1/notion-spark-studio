import { useState, useEffect, useCallback, useRef } from 'react';

// Interfaces para o sistema de cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  priority: 'low' | 'medium' | 'high';
  accessCount: number;
  lastAccess: number;
}

interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  cleanupInterval: number;
  prefetchEnabled: boolean;
  compressionEnabled: boolean;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  totalSize: number;
  averageAccessTime: number;
}

interface PrefetchStrategy {
  key: string;
  probability: number;
  dependencies: string[];
  fetchFn: () => Promise<any>;
}

// Hook principal do sistema de cache avançado
export const useAdvancedCache = <T = any>(config?: Partial<CacheConfig>) => {
  const defaultConfig: CacheConfig = {
    maxSize: 100,
    defaultTTL: 5 * 60 * 1000, // 5 minutos
    cleanupInterval: 30 * 1000, // 30 segundos
    prefetchEnabled: true,
    compressionEnabled: true,
    ...config
  };

  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());
  const metricsRef = useRef<CacheMetrics>({
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0,
    averageAccessTime: 0
  });
  const prefetchStrategiesRef = useRef<Map<string, PrefetchStrategy>>(new Map());
  const accessTimesRef = useRef<number[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [cacheStats, setCacheStats] = useState(metricsRef.current);

  // Compressão de dados (simulada com JSON.stringify para demo)
  const compress = useCallback((data: T): string => {
    if (!defaultConfig.compressionEnabled) return JSON.stringify(data);
    // Em produção, usar bibliotecas como pako ou lz-string
    return JSON.stringify(data);
  }, [defaultConfig.compressionEnabled]);

  const decompress = useCallback((compressed: string): T => {
    return JSON.parse(compressed);
  }, []);

  // Verificar se uma entrada está válida
  const isEntryValid = useCallback((entry: CacheEntry<T>): boolean => {
    const now = Date.now();
    return (now - entry.timestamp) < entry.ttl;
  }, []);

  // Algoritmo LRU com prioridade para eviction
  const evictLRU = useCallback(() => {
    const cache = cacheRef.current;
    if (cache.size <= defaultConfig.maxSize) return;

    // Ordenar por prioridade e depois por último acesso
    const entries = Array.from(cache.entries()).sort(([, a], [, b]) => {
      const priorityWeights = { low: 1, medium: 2, high: 3 };
      const priorityDiff = priorityWeights[a.priority] - priorityWeights[b.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      return a.lastAccess - b.lastAccess;
    });

    // Remover entradas de baixa prioridade primeiro
    const toRemove = entries.slice(0, entries.length - defaultConfig.maxSize);
    toRemove.forEach(([key]) => {
      cache.delete(key);
      metricsRef.current.evictions++;
    });

    metricsRef.current.totalSize = cache.size;
  }, [defaultConfig.maxSize]);

  // Limpar entradas expiradas
  const cleanupExpired = useCallback(() => {
    const cache = cacheRef.current;
    const now = Date.now();
    
    for (const [key, entry] of cache.entries()) {
      if (!isEntryValid(entry)) {
        cache.delete(key);
      }
    }
    
    metricsRef.current.totalSize = cache.size;
  }, [isEntryValid]);

  // Obter item do cache
  const get = useCallback(async (
    key: string,
    fetchFn?: () => Promise<T>,
    options?: {
      priority?: 'low' | 'medium' | 'high';
      ttl?: number;
      forceRefresh?: boolean;
    }
  ): Promise<T | null> => {
    const startTime = performance.now();
    const cache = cacheRef.current;
    
    // Verificar se existe no cache e está válido
    if (!options?.forceRefresh && cache.has(key)) {
      const entry = cache.get(key)!;
      
      if (isEntryValid(entry)) {
        // Cache hit
        entry.accessCount++;
        entry.lastAccess = Date.now();
        metricsRef.current.hits++;
        
        const accessTime = performance.now() - startTime;
        accessTimesRef.current.push(accessTime);
        if (accessTimesRef.current.length > 100) {
          accessTimesRef.current.shift();
        }
        
        return entry.data;
      } else {
        // Entrada expirada
        cache.delete(key);
      }
    }

    // Cache miss - buscar dados se fetchFn fornecida
    if (fetchFn) {
      setIsLoading(true);
      try {
        const data = await fetchFn();
        await set(key, data, {
          priority: options?.priority || 'medium',
          ttl: options?.ttl
        });
        
        metricsRef.current.misses++;
        return data;
      } catch (error) {
        console.error('Erro ao buscar dados para cache:', error);
        return null;
      } finally {
        setIsLoading(false);
      }
    }

    metricsRef.current.misses++;
    return null;
  }, [isEntryValid]);

  // Armazenar item no cache
  const set = useCallback(async (
    key: string,
    data: T,
    options?: {
      priority?: 'low' | 'medium' | 'high';
      ttl?: number;
    }
  ): Promise<void> => {
    const cache = cacheRef.current;
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: options?.ttl || defaultConfig.defaultTTL,
      priority: options?.priority || 'medium',
      accessCount: 1,
      lastAccess: Date.now()
    };

    cache.set(key, entry);
    evictLRU();
    
    metricsRef.current.totalSize = cache.size;
    
    // Trigger prefetch para itens relacionados
    if (defaultConfig.prefetchEnabled) {
      triggerPrefetch(key);
    }
  }, [defaultConfig.defaultTTL, defaultConfig.prefetchEnabled, evictLRU]);

  // Sistema de prefetch inteligente
  const addPrefetchStrategy = useCallback((strategy: PrefetchStrategy) => {
    prefetchStrategiesRef.current.set(strategy.key, strategy);
  }, []);

  const triggerPrefetch = useCallback(async (triggerKey: string) => {
    const strategies = prefetchStrategiesRef.current;
    
    for (const [key, strategy] of strategies.entries()) {
      if (strategy.dependencies.includes(triggerKey)) {
        // Verificar probabilidade de prefetch
        if (Math.random() < strategy.probability) {
          try {
            const data = await strategy.fetchFn();
            await set(key, data, { priority: 'low' });
          } catch (error) {
            console.warn('Erro no prefetch para', key, error);
          }
        }
      }
    }
  }, [set]);

  // Invalidar cache
  const invalidate = useCallback((keyPattern?: string | RegExp) => {
    const cache = cacheRef.current;
    
    if (!keyPattern) {
      // Limpar todo o cache
      cache.clear();
      metricsRef.current.totalSize = 0;
      return;
    }

    if (typeof keyPattern === 'string') {
      if (keyPattern.includes('*')) {
        // Padrão wildcard
        const pattern = keyPattern.replace(/\*/g, '.*');
        const regex = new RegExp(pattern);
        
        for (const key of cache.keys()) {
          if (regex.test(key)) {
            cache.delete(key);
          }
        }
      } else {
        // Chave exata
        cache.delete(keyPattern);
      }
    } else {
      // RegExp
      for (const key of cache.keys()) {
        if (keyPattern.test(key)) {
          cache.delete(key);
        }
      }
    }
    
    metricsRef.current.totalSize = cache.size;
  }, []);

  // Atualizar métricas periodicamente
  useEffect(() => {
    const updateMetrics = () => {
      const times = accessTimesRef.current;
      const avgTime = times.length > 0 
        ? times.reduce((a, b) => a + b, 0) / times.length 
        : 0;
      
      metricsRef.current.averageAccessTime = avgTime;
      setCacheStats({ ...metricsRef.current });
    };

    const interval = setInterval(updateMetrics, 1000);
    return () => { clearInterval(interval); };
  }, []);

  // Cleanup automático
  useEffect(() => {
    const cleanup = () => {
      cleanupExpired();
      evictLRU();
    };

    const interval = setInterval(cleanup, defaultConfig.cleanupInterval);
    return () => { clearInterval(interval); };
  }, [cleanupExpired, evictLRU, defaultConfig.cleanupInterval]);

  // Métodos de análise e debug
  const getCacheInfo = useCallback(() => {
    const cache = cacheRef.current;
    const entries = Array.from(cache.entries()).map(([key, entry]) => ({
      key,
      size: JSON.stringify(entry.data).length,
      age: Date.now() - entry.timestamp,
      ttl: entry.ttl,
      priority: entry.priority,
      accessCount: entry.accessCount,
      isValid: isEntryValid(entry)
    }));

    return {
      totalEntries: cache.size,
      maxSize: defaultConfig.maxSize,
      metrics: metricsRef.current,
      entries: entries.sort((a, b) => b.accessCount - a.accessCount)
    };
  }, [defaultConfig.maxSize, isEntryValid]);

  const preload = useCallback(async (preloadMap: Record<string, () => Promise<T>>) => {
    setIsLoading(true);
    try {
      const promises = Object.entries(preloadMap).map(async ([key, fetchFn]) => {
        try {
          const data = await fetchFn();
          await set(key, data, { priority: 'high' });
        } catch (error) {
          console.warn(`Erro no preload de ${key}:`, error);
        }
      });
      
      await Promise.allSettled(promises);
    } finally {
      setIsLoading(false);
    }
  }, [set]);

  return {
    // Operações principais
    get,
    set,
    invalidate,
    preload,
    
    // Prefetch
    addPrefetchStrategy,
    triggerPrefetch,
    
    // Estado e métricas
    isLoading,
    cacheStats,
    getCacheInfo,
    
    // Utilidades
    cleanup: cleanupExpired,
    clear: () => { invalidate(); }
  };
};

// Hook específico para cache de arquivos
export const useFileCache = () => {
  const cache = useAdvancedCache({
    maxSize: 200,
    defaultTTL: 10 * 60 * 1000, // 10 minutos para arquivos
    prefetchEnabled: true
  });

  useEffect(() => {
    // Estratégias de prefetch para arquivos
    cache.addPrefetchStrategy({
      key: 'recent-files',
      probability: 0.8,
      dependencies: ['file-opened', 'folder-expanded'],
      fetchFn: async () => {
        // Simular busca de arquivos recentes
        return [];
      }
    });

    cache.addPrefetchStrategy({
      key: 'related-files',
      probability: 0.6,
      dependencies: ['file-content-changed'],
      fetchFn: async () => {
        // Simular busca de arquivos relacionados
        return [];
      }
    });
  }, [cache]);

  return cache;
};

// Hook para cache de busca
export const useSearchCache = () => {
  return useAdvancedCache({
    maxSize: 50,
    defaultTTL: 2 * 60 * 1000, // 2 minutos para buscas
    prefetchEnabled: false // Busca não precisa de prefetch
  });
};