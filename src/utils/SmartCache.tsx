import React, { createContext, useContext, useEffect, useState } from 'react';

// Tipos para o sistema de cache
interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  metadata?: Record<string, unknown>;
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  memoryUsage: number;
}

interface CacheConfig {
  maxSize: number; // MB
  maxEntries: number;
  defaultTTL: number; // ms
  cleanupInterval: number; // ms
  compressionEnabled: boolean;
  persistToDisk: boolean;
  adaptiveEviction: boolean;
}

// Estratégias de eviction
type EvictionStrategy = 'lru' | 'lfu' | 'ttl' | 'adaptive';

// Classe principal do cache inteligente
export class SmartCacheSystem {
  private cache = new Map<string, CacheEntry>();
  private lruOrder: string[] = [];
  private accessFrequency = new Map<string, number>();
  private lastCleanup = Date.now();
  private compressionWorker: Worker | null = null;
  private stats: CacheStats;
  private accessLog: Array<{ key: string; timestamp: number }> = [];
  private cleanupTimer: NodeJS.Timeout | null = null;
  
  constructor(private config: CacheConfig) {
    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      missRate: 0,
      evictionCount: 0,
      memoryUsage: 0
    };
    this.initializeCompression();
    this.startCleanupTimer();
  }

  private initializeCompression() {
    if (typeof Worker !== 'undefined' && this.config.compressionEnabled) {
      try {
        // Criar worker para compressão apenas se necessário
        const workerCode = `
          self.onmessage = function(e) {
            const { id, operation, data } = e.data;
            
            if (operation === 'compress') {
              // Simulação de compressão (em produção usaria bibliotecas reais)
              const compressed = JSON.stringify(data);
              self.postMessage({ id, result: compressed, size: compressed.length });
            } else if (operation === 'decompress') {
              const decompressed = JSON.parse(data);
              self.postMessage({ id, result: decompressed });
            }
          };
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this.compressionWorker = new Worker(URL.createObjectURL(blob));
      } catch (error) {
        console.warn('Compression worker não disponível:', error);
      }
    }
  }

  private startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.performMaintenance();
    }, this.config.cleanupInterval || 300000); // 5 minutos
  }

  private performMaintenance() {
    const now = Date.now();
    let removedCount = 0;
    
    // Remover entradas expiradas
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry, now)) {
        this.cache.delete(key);
        this.removeFromLRU(key);
        removedCount++;
      }
    }

    // Se ainda estamos acima do limite, remover por estratégia
    if (this.cache.size > this.config.maxSize) {
      const toRemove = this.cache.size - this.config.maxSize;
      this.evictEntries(toRemove);
      removedCount += toRemove;
    }

    this.lastCleanup = now;
    
    if (removedCount > 0) {
      console.log(`[SmartCache] Limpeza realizada: ${removedCount.toString()} entradas removidas`);
    }
  }

  private evictEntries(count: number) {
    const entries = Array.from(this.cache.entries());
    
    // Ordenar por estratégia de eviction
    const sorted = entries.sort(([keyA, entryA], [keyB, entryB]) => {
      switch (this.config.adaptiveEviction) {
        case 'lru': {
          return entryA.lastAccessed - entryB.lastAccessed;
        }
        case 'lfu': {
          const freqA = this.accessFrequency.get(keyA) ?? 0;
          const freqB = this.accessFrequency.get(keyB) ?? 0;
          return freqA - freqB;
        }
        case 'ttl': {
          return entryA.timestamp - entryB.timestamp;
        }
        default: {
          return entryA.lastAccessed - entryB.lastAccessed;
        }
      }
    });

    // Remover as primeiras 'count' entradas
    for (let i = 0; i < count && i < sorted.length; i++) {
      const [key] = sorted[i];
      this.cache.delete(key);
      this.removeFromLRU(key);
      this.accessFrequency.delete(key);
    }
  }

  // Métodos principais
  async set<T>(
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      tags?: string[];
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<void> {
    const {
      ttl = this.config.defaultTTL,
      priority = 'medium',
      tags = [],
      metadata = {}
    } = options;

    // Calcular tamanho
    const size = this.calculateSize(data);
    
    // Verificar se precisa fazer eviction
    await this.ensureSpace(size);

    // Comprimir dados se habilitado
    const processedData = this.config.compressionEnabled 
      ? await this.compress(data) 
      : data;

    const entry: CacheEntry<T> = {
      data: processedData,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
      size,
      priority,
      tags,
      metadata
    };

    this.cache.set(key, entry);
    this.updateStats();
    
    if (this.config.persistToDisk) {
      await this.saveToDisk();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.updateMissRate();
      return null;
    }

    // Verificar TTL
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.updateMissRate();
      return null;
    }

    // Atualizar estatísticas de acesso
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.accessLog.push({ key, timestamp: Date.now() });
    
    // Manter log limitado
    if (this.accessLog.length > 1000) {
      this.accessLog = this.accessLog.slice(-500);
    }

    this.updateHitRate();

    // Descomprimir se necessário
    const data = this.config.compressionEnabled 
      ? await this.decompress(entry.data) 
      : entry.data;

    return data as T;
  }

  async invalidate(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.updateStats();
      if (this.config.persistToDisk) {
        await this.saveToDisk();
      }
    }
    return deleted;
  }

  async invalidateByTag(tag: string): Promise<number> {
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    if (count > 0) {
      this.updateStats();
      if (this.config.persistToDisk) {
        await this.saveToDisk();
      }
    }
    
    return count;
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.accessLog = [];
    this.updateStats();
    
    if (this.config.persistToDisk) {
      localStorage.removeItem('smart-cache-data');
    }
  }

  // Métodos de análise e otimização
  getStats(): CacheStats {
    return { ...this.stats };
  }

  getHotKeys(limit = 10): Array<{ key: string; accessCount: number; lastAccessed: number }> {
    return Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        lastAccessed: entry.lastAccessed
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);
  }

  getColdKeys(limit = 10): Array<{ key: string; accessCount: number; lastAccessed: number }> {
    const now = Date.now();
    return Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        lastAccessed: entry.lastAccessed,
        age: now - entry.lastAccessed
      }))
      .sort((a, b) => a.accessCount - b.accessCount || b.age - a.age)
      .slice(0, limit);
  }

  getMemoryUsage(): { used: number; percentage: number } {
    const used = this.stats.totalSize;
    const max = this.config.maxSize * 1024 * 1024; // Convert MB to bytes
    return {
      used,
      percentage: (used / max) * 100
    };
  }

  // Estratégias de eviction
  private async ensureSpace(requiredSize: number): Promise<void> {
    const currentSize = this.stats.totalSize;
    const maxSize = this.config.maxSize * 1024 * 1024; // MB to bytes
    
    if (currentSize + requiredSize <= maxSize && this.cache.size < this.config.maxEntries) {
      return;
    }

    const strategy = this.config.adaptiveEviction 
      ? this.selectOptimalEvictionStrategy() 
      : 'lru';

    await this.evict(strategy, requiredSize);
  }

  private selectOptimalEvictionStrategy(): EvictionStrategy {
    const hitRate = this.stats.hitRate / (this.stats.hitRate + this.stats.missRate);
    const memoryPressure = this.getMemoryUsage().percentage;
    
    // Estratégia adaptativa baseada em condições
    if (memoryPressure > 90) {
      return 'ttl'; // Remover expirados primeiro
    } else if (hitRate < 0.5) {
      return 'lfu'; // Remover menos frequentemente usados
    } else {
      return 'lru'; // Estratégia padrão
    }
  }

  private async evict(strategy: EvictionStrategy, requiredSize: number): Promise<void> {
    const candidates = this.getEvictionCandidates(strategy);
    let freedSize = 0;
    let evicted = 0;

    for (const key of candidates) {
      const entry = this.cache.get(key);
      if (entry && entry.priority !== 'critical') {
        freedSize += entry.size;
        this.cache.delete(key);
        evicted++;
        
        if (freedSize >= requiredSize) {
          break;
        }
      }
    }

    this.stats.evictionCount += evicted;
    this.updateStats();
  }

  private getEvictionCandidates(strategy: EvictionStrategy): string[] {
    const entries = Array.from(this.cache.entries());
    
    switch (strategy) {
      case 'lru': {
        // Least Recently Used
        const sortedByAccess = entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
        return sortedByAccess.slice(0, Math.ceil(entries.length * 0.3)).map(([key]) => key);
      }
      
      case 'lfu': {
        // Least Frequently Used  
        const sortedByFrequency = entries.sort((a, b) => a[1].accessCount - b[1].accessCount);
        return sortedByFrequency.slice(0, Math.ceil(entries.length * 0.3)).map(([key]) => key);
      }
      
      case 'ttl': {
        // Time To Live - remover expirados primeiro
        const expiredKeys = entries
          .filter(([, entry]) => this.isExpired(entry))
          .map(([key]) => key);
        return expiredKeys;
      }
      
      case 'adaptive': {
        // Estratégia adaptativa baseada em múltiplos fatores
        const scoredEntries = entries.map(([key, entry]) => ({
          key,
          score: this.calculateEvictionScore(entry)
        }));
        
        scoredEntries.sort((a, b) => a.score - b.score);
        return scoredEntries.slice(0, Math.ceil(entries.length * 0.3)).map(item => item.key);
      }
      
      default:
        return [];
    }
  }

  private calculateEvictionScore(entry: CacheEntry): number {
    const now = Date.now();
    const age = now - entry.lastAccessed;
    const frequency = entry.accessCount;
    const priorityWeight = { low: 1, medium: 2, high: 3, critical: 10 }[entry.priority];
    const sizeWeight = entry.size / (1024 * 1024); // MB
    
    // Score mais baixo = candidato melhor para eviction
    return (age / 1000) + (1 / (frequency + 1)) + sizeWeight - priorityWeight;
  }

  // Métodos utilitários
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.timestamp + entry.ttl;
  }

  private calculateSize(data: unknown): number {
    return JSON.stringify(data).length;
  }

  private async compress(data: unknown): Promise<unknown> {
    try {
      // Simular compressão (em produção usar LZ4, Brotli, etc.)
      const jsonString = JSON.stringify(data);
      
      // Para dados pequenos, não comprimir
      if (jsonString.length < 1024) {
        return data;
      }
      
      // Compressão básica (em produção usar biblioteca real)
      return {
        _compressed: true,
        data: btoa(jsonString),
        originalSize: jsonString.length
      };
    } catch {
      return data;
    }
  }

  private async decompress(data: unknown): Promise<unknown> {
    try {
      if (typeof data === 'object' && data !== null && '_compressed' in data) {
        const compressed = data as { _compressed: boolean; data: string };
        return JSON.parse(atob(compressed.data));
      }
      return data;
    } catch {
      return data;
    }
  }

  private updateMissRate(): void {
    if (typeof this.stats.missRate === 'number') {
      this.stats.missRate++;
    } else {
      this.stats.missRate = 1;
    }
  }

  private updateHitRate(): void {
    if (typeof this.stats.hitRate === 'number') {
      this.stats.hitRate++;
    } else {
      this.stats.hitRate = 1;
    }
  }

  private updateStats(): void {
    this.stats.totalEntries = this.cache.size;
    this.stats.totalSize = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.size, 0);
    
    const total = this.stats.hitRate + this.stats.missRate;
    if (total > 0) {
      this.stats.hitRate = (this.stats.hitRate / total) * 100;
      this.stats.missRate = (this.stats.missRate / total) * 100;
    }
    
    this.stats.memoryUsage = this.getMemoryUsage().percentage;
  }

  private async saveToDisk(): Promise<void> {
    if (!this.config.persistToDisk) return;

    try {
      const data = {
        cache: Array.from(this.cache.entries()),
        stats: this.stats,
        timestamp: Date.now()
      };
      
      localStorage.setItem('smart-cache-data', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save cache to disk:', error);
    }
  }

  private async loadFromDisk(): Promise<void> {
    if (!this.config.persistToDisk) return;

    try {
      const stored = localStorage.getItem('smart-cache-data');
      if (!stored) return;

      const data = JSON.parse(stored);
      const age = Date.now() - data.timestamp;
      
      // Não carregar cache muito antigo (mais de 1 dia)
      if (age > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('smart-cache-data');
        return;
      }

      // Restaurar cache
      this.cache = new Map(data.cache);
      
      // Limpar entradas expiradas
      await this.cleanup();
      
      this.updateStats();
    } catch (error) {
      console.warn('Failed to load cache from disk:', error);
      localStorage.removeItem('smart-cache-data');
    }
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cache.clear();
  }
}

// Context para React
const CacheContext = createContext<SmartCacheSystem | null>(null);

// Provider do cache
interface CacheProviderProps {
  children: React.ReactNode;
  config?: Partial<CacheConfig>;
}

export const CacheProvider: React.FC<CacheProviderProps> = ({ children, config }) => {
  const [cache] = useState(() => new SmartCacheSystem(config as CacheConfig));

  useEffect(() => {
    return () => {
      cache.destroy();
    };
  }, [cache]);

  return (
    <CacheContext.Provider value={cache}>
      {children}
    </CacheContext.Provider>
  );
};

// Hook para usar o cache
export function useSmartCache() {
  const cache = useContext(CacheContext);
  
  // Proteção SSR - retornar mock quando contexto não disponível
  if (!cache) {
    if (typeof window === 'undefined') {
      // Durante SSR, retornar mock object
      return {
        set: async () => {},
        get: async () => null,
        invalidate: async () => false,
        invalidateByTag: async () => 0,
        clear: async () => {},
        getStats: () => ({
          totalEntries: 0,
          totalSize: 0,
          hitRate: 0,
          missRate: 0,
          evictionCount: 0,
          memoryUsage: 0
        }),
        getHotKeys: () => [],
        getColdKeys: () => [],
        getMemoryUsage: () => ({ used: 0, percentage: 0 }),
        destroy: () => {}
      };
    }
    
    throw new Error('useSmartCache must be used within a CacheProvider');
  }
  
  return cache;
}

// Hook para cache de dados com React
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
  const cache = useSmartCache();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const {
    ttl,
    priority = 'medium',
    tags = [],
    enabled = true,
    refetchOnMount = true
  } = options;

  const fetchData = async (force = false) => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);

    try {
      // Verificar cache primeiro (apenas no cliente)
      if (typeof window !== 'undefined' && !force) {
        const cached = await cache.get<T>(key);
        if (cached) {
          setData(cached);
          setLoading(false);
          return;
        }
      }

      // Buscar dados
      const result = await fetcher();
      setData(result);
      
      // Salvar no cache (apenas no cliente)
      if (typeof window !== 'undefined') {
        await cache.set(key, result, { ttl, priority, tags });
      }
      
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const invalidate = async () => {
    if (typeof window !== 'undefined') {
      await cache.invalidate(key);
    }
  };

  const refresh = () => fetchData(true);

  useEffect(() => {
    if (refetchOnMount) {
      fetchData();
    }
  }, [key, enabled]);

  return {
    data,
    loading,
    error,
    refresh,
    invalidate,
    fetchData
  };
}

// Componente de monitoramento do cache
export const CacheMonitor: React.FC = () => {
  const cache = useSmartCache();
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [hotKeys, setHotKeys] = useState<Array<{ key: string; accessCount: number }>>([]);

  useEffect(() => {
    const updateStats = () => {
      setStats(cache.getStats());
      setHotKeys(cache.getHotKeys(5));
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);

    return () => { clearInterval(interval); };
  }, [cache]);

  if (!stats) return null;

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h3 className="font-semibold mb-3">Cache Statistics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-white p-3 rounded">
          <div className="text-sm text-gray-600">Entries</div>
          <div className="text-lg font-bold">{stats.totalEntries}</div>
        </div>
        
        <div className="bg-white p-3 rounded">
          <div className="text-sm text-gray-600">Size</div>
          <div className="text-lg font-bold">
            {(stats.totalSize / 1024 / 1024).toFixed(1)}MB
          </div>
        </div>
        
        <div className="bg-white p-3 rounded">
          <div className="text-sm text-gray-600">Hit Rate</div>
          <div className="text-lg font-bold text-green-600">
            {stats.hitRate.toFixed(1)}%
          </div>
        </div>
        
        <div className="bg-white p-3 rounded">
          <div className="text-sm text-gray-600">Evictions</div>
          <div className="text-lg font-bold">{stats.evictionCount}</div>
        </div>
      </div>

      <div className="bg-white p-3 rounded">
        <h4 className="font-medium mb-2">Hot Keys</h4>
        <div className="space-y-1">
          {hotKeys.map(({ key, accessCount }) => (
            <div key={key} className="flex justify-between text-sm">
              <span className="truncate">{key}</span>
              <span className="text-gray-600">{accessCount} hits</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default {
  SmartCacheSystem,
  CacheProvider,
  useSmartCache,
  useCachedData,
  CacheMonitor
}; 