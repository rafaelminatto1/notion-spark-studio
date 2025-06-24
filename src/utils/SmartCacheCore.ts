// Tipos para o sistema de cache
export interface CacheEntry<T = unknown> {
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

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  memoryUsage: number;
}

export interface CacheConfig {
  maxSize: number; // MB
  maxEntries: number;
  defaultTTL: number; // ms
  cleanupInterval: number; // ms
  compressionEnabled: boolean;
  persistToDisk: boolean;
  adaptiveEviction: boolean;
}

// Estratégias de eviction
export type EvictionStrategy = 'lru' | 'lfu' | 'ttl' | 'adaptive';

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
    if (this.cache.size > this.config.maxEntries) {
      const toRemove = this.cache.size - this.config.maxEntries;
      this.evictEntries(toRemove);
      removedCount += toRemove;
    }

    this.lastCleanup = now;
    this.updateStats();
    
    if (removedCount > 0) {
      console.log(`[SmartCache] Limpeza realizada: ${removedCount} entradas removidas`);
    }
  }

  private evictEntries(count: number) {
    const entries = Array.from(this.cache.entries());
    
    // Ordenar por estratégia de eviction
    const sorted = entries.sort(([keyA, entryA], [keyB, entryB]) => {
      // Usar estratégia LRU por padrão
      return entryA.lastAccessed - entryB.lastAccessed;
    });

    // Remover as primeiras 'count' entradas
    for (let i = 0; i < count && i < sorted.length; i++) {
      const [key] = sorted[i];
      this.cache.delete(key);
      this.removeFromLRU(key);
      this.accessFrequency.delete(key);
      this.stats.evictionCount++;
    }
  }

  private removeFromLRU(key: string) {
    const index = this.lruOrder.indexOf(key);
    if (index > -1) {
      this.lruOrder.splice(index, 1);
    }
  }

  private updateLRU(key: string) {
    this.removeFromLRU(key);
    this.lruOrder.push(key);
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
    this.updateLRU(key);
    this.updateStats();
    
    if (this.config.persistToDisk) {
      await this.saveToDisk();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      this.updateMissRate();
      return null;
    }

    const now = Date.now();
    
    // Verificar se expirou
    if (this.isExpired(entry, now)) {
      this.cache.delete(key);
      this.removeFromLRU(key);
      this.updateMissRate();
      return null;
    }

    // Atualizar estatísticas de acesso
    entry.accessCount++;
    entry.lastAccessed = now;
    this.updateLRU(key);
    
    // Atualizar frequência
    const currentFreq = this.accessFrequency.get(key) || 0;
    this.accessFrequency.set(key, currentFreq + 1);

    this.updateHitRate();

    // Descomprimir se necessário
    const data = this.config.compressionEnabled 
      ? await this.decompress(entry.data) as T
      : entry.data as T;

    return data;
  }

  async invalidate(key: string): Promise<boolean> {
    const existed = this.cache.has(key);
    if (existed) {
      this.cache.delete(key);
      this.removeFromLRU(key);
      this.accessFrequency.delete(key);
      this.updateStats();
    }
    return existed;
  }

  async invalidateByTag(tag: string): Promise<number> {
    let count = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        this.removeFromLRU(key);
        this.accessFrequency.delete(key);
        count++;
      }
    }
    
    if (count > 0) {
      this.updateStats();
    }
    
    return count;
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.lruOrder = [];
    this.accessFrequency.clear();
    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      missRate: 0,
      evictionCount: 0,
      memoryUsage: 0
    };
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  getHotKeys(limit = 10): Array<{ key: string; accessCount: number; lastAccessed: number }> {
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        lastAccessed: entry.lastAccessed
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);
    
    return entries;
  }

  getColdKeys(limit = 10): Array<{ key: string; accessCount: number; lastAccessed: number }> {
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        lastAccessed: entry.lastAccessed
      }))
      .sort((a, b) => a.accessCount - b.accessCount)
      .slice(0, limit);
    
    return entries;
  }

  getMemoryUsage(): { used: number; percentage: number } {
    const used = this.stats.totalSize;
    const maxSizeMB = this.config.maxSize;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const percentage = (used / maxSizeBytes) * 100;
    
    return { used, percentage };
  }

  private async ensureSpace(requiredSize: number): Promise<void> {
    const memoryUsage = this.getMemoryUsage();
    const maxSizeBytes = this.config.maxSize * 1024 * 1024;
    
    if (memoryUsage.used + requiredSize > maxSizeBytes) {
      const bytesToFree = (memoryUsage.used + requiredSize) - maxSizeBytes;
      await this.evict('adaptive', bytesToFree);
    }
  }

  private selectOptimalEvictionStrategy(): EvictionStrategy {
    const hitRate = this.stats.hitRate;
    const totalAccesses = this.accessLog.length;
    
    if (hitRate > 0.8 && totalAccesses > 100) {
      return 'lfu'; // Alta taxa de acerto, priorizar frequência
    } else if (hitRate < 0.5) {
      return 'lru'; // Baixa taxa de acerto, priorizar recência
    } else {
      return 'adaptive'; // Estratégia híbrida
    }
  }

  private async evict(strategy: EvictionStrategy, requiredSize: number): Promise<void> {
    const candidates = this.getEvictionCandidates(strategy);
    let freedSize = 0;
    
    for (const key of candidates) {
      if (freedSize >= requiredSize) break;
      
      const entry = this.cache.get(key);
      if (entry) {
        freedSize += entry.size;
        this.cache.delete(key);
        this.removeFromLRU(key);
        this.accessFrequency.delete(key);
        this.stats.evictionCount++;
      }
    }
    
    this.updateStats();
  }

  private getEvictionCandidates(strategy: EvictionStrategy): string[] {
    const entries = Array.from(this.cache.entries());
    
    switch (strategy) {
      case 'lru':
        return entries
          .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)
          .map(([key]) => key);
      
      case 'lfu':
        return entries
          .sort(([keyA], [keyB]) => {
            const freqA = this.accessFrequency.get(keyA) || 0;
            const freqB = this.accessFrequency.get(keyB) || 0;
            return freqA - freqB;
          })
          .map(([key]) => key);
      
      case 'ttl':
        return entries
          .sort(([, a], [, b]) => a.timestamp - b.timestamp)
          .map(([key]) => key);
      
      case 'adaptive':
        return entries
          .sort(([, a], [, b]) => this.calculateEvictionScore(a) - this.calculateEvictionScore(b))
          .map(([key]) => key);
      
      default:
        return entries.map(([key]) => key);
    }
  }

  private calculateEvictionScore(entry: CacheEntry): number {
    const now = Date.now();
    const age = now - entry.timestamp;
    const timeSinceLastAccess = now - entry.lastAccessed;
    const accessRate = entry.accessCount / (age || 1);
    
    // Prioridades: critical = 0.1, high = 0.5, medium = 1.0, low = 2.0
    const priorityMultiplier = {
      critical: 0.1,
      high: 0.5,
      medium: 1.0,
      low: 2.0
    }[entry.priority];
    
    // Menor score = maior prioridade para eviction
    return (timeSinceLastAccess * priorityMultiplier) / (accessRate + 1);
  }

  private isExpired(entry: CacheEntry, now = Date.now()): boolean {
    return (now - entry.timestamp) > entry.ttl;
  }

  private calculateSize(data: unknown): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 1024; // 1KB default
    }
  }

  private async compress(data: unknown): Promise<unknown> {
    if (!this.compressionWorker) {
      return data; // Fallback sem compressão
    }

    return new Promise((resolve) => {
      const id = Math.random().toString(36).substr(2, 9);
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data.id === id) {
          this.compressionWorker?.removeEventListener('message', handleMessage);
          resolve(event.data.result);
        }
      };
      
      this.compressionWorker.addEventListener('message', handleMessage);
      this.compressionWorker.postMessage({ id, operation: 'compress', data });
      
      // Timeout fallback
      setTimeout(() => {
        this.compressionWorker?.removeEventListener('message', handleMessage);
        resolve(data);
      }, 5000);
    });
  }

  private async decompress(data: unknown): Promise<unknown> {
    if (!this.compressionWorker) {
      return data; // Fallback sem descompressão
    }

    return new Promise((resolve) => {
      const id = Math.random().toString(36).substr(2, 9);
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data.id === id) {
          this.compressionWorker?.removeEventListener('message', handleMessage);
          resolve(event.data.result);
        }
      };
      
      this.compressionWorker.addEventListener('message', handleMessage);
      this.compressionWorker.postMessage({ id, operation: 'decompress', data });
      
      // Timeout fallback
      setTimeout(() => {
        this.compressionWorker?.removeEventListener('message', handleMessage);
        resolve(data);
      }, 5000);
    });
  }

  private updateMissRate(): void {
    // Simular atualização da taxa de miss
    this.stats.missRate = Math.min(this.stats.missRate + 0.01, 1);
  }

  private updateHitRate(): void {
    // Simular atualização da taxa de hit
    this.stats.hitRate = Math.min(this.stats.hitRate + 0.01, 1);
  }

  private updateStats(): void {
    this.stats.totalEntries = this.cache.size;
    this.stats.totalSize = Array.from(this.cache.values())
      .reduce((total, entry) => total + entry.size, 0);
    
    // Calcular uso de memória
    const maxSizeBytes = this.config.maxSize * 1024 * 1024;
    this.stats.memoryUsage = (this.stats.totalSize / maxSizeBytes) * 100;
  }

  private async saveToDisk(): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        const cacheData = Array.from(this.cache.entries());
        localStorage.setItem('smartcache_data', JSON.stringify({
          cache: cacheData,
          stats: this.stats,
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.warn('Falha ao salvar cache no disco:', error);
    }
  }

  private async loadFromDisk(): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('smartcache_data');
        if (stored) {
          const { cache, stats, timestamp } = JSON.parse(stored);
          
          // Verificar se os dados não são muito antigos (24h)
          if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
            this.cache = new Map(cache);
            this.stats = stats;
            
            // Rebuildar estruturas auxiliares
            for (const [key, entry] of this.cache.entries()) {
              this.lruOrder.push(key);
              this.accessFrequency.set(key, entry.accessCount);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Falha ao carregar cache do disco:', error);
    }
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    if (this.compressionWorker) {
      this.compressionWorker.terminate();
      this.compressionWorker = null;
    }
    
    this.clear();
  }
} 