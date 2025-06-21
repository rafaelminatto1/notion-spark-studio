/**
 * Sistema Avançado de Cache com IA e Otimização Automática
 * - Cache inteligente com previsão de uso
 * - Estratégias de cache adaptativas
 * - Limpeza automática baseada em padrões
 * - Compressão de dados
 * - Métricas e analytics
 */

// Tipos para o sistema de cache
interface CacheEntry<T = unknown> {
  key: string;
  data: T;
  timestamp: number;
  lastAccessed: number;
  accessCount: number;
  ttl: number; // Time to live in ms
  size: number; // em bytes
  priority: CachePriority;
  tags: string[];
  compressed: boolean;
  metadata: CacheMetadata;
}

interface CacheMetadata {
  source: string;
  version: string;
  dependencies: string[];
  computationCost: number; // 1-10 scale
  predictedNextAccess?: number;
  userPattern?: UserAccessPattern;
}

interface UserAccessPattern {
  timeOfDay: number[];
  dayOfWeek: number[];
  frequency: 'rare' | 'occasional' | 'frequent' | 'constant';
  seasonality: 'none' | 'daily' | 'weekly' | 'monthly';
}

type CachePriority = 'low' | 'medium' | 'high' | 'critical';

interface CacheStrategy {
  type: 'lru' | 'lfu' | 'fifo' | 'adaptive' | 'predictive';
  maxSize: number; // em MB
  ttlDefault: number; // em ms
  compressionThreshold: number; // em bytes
  cleanupInterval: number; // em ms
}

interface CacheMetrics {
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  totalSize: number;
  entryCount: number;
  averageAccessTime: number;
  compressionRatio: number;
  memoryPressure: number;
  predictiveAccuracy: number;
}

interface CacheEvent {
  type: 'hit' | 'miss' | 'set' | 'delete' | 'cleanup' | 'compress' | 'predict';
  key: string;
  timestamp: number;
  duration?: number;
  size?: number;
  metadata?: any;
}

class AdvancedCacheManager {
  private cache = new Map<string, CacheEntry>();
  private metrics: CacheMetrics;
  private events: CacheEvent[] = [];
  private strategy: CacheStrategy;
  private cleanupTimer?: NodeJS.Timeout;
  private compressionWorker?: Worker;
  private accessPatterns = new Map<string, UserAccessPattern>();
  private predictions = new Map<string, number>();

  constructor(strategy: Partial<CacheStrategy> = {}) {
    this.strategy = {
      type: 'adaptive',
      maxSize: 50, // 50MB
      ttlDefault: 30 * 60 * 1000, // 30 minutos
      compressionThreshold: 1024, // 1KB
      cleanupInterval: 5 * 60 * 1000, // 5 minutos
      ...strategy
    };

    this.metrics = {
      hitRate: 0,
      missRate: 0,
      totalHits: 0,
      totalMisses: 0,
      totalSize: 0,
      entryCount: 0,
      averageAccessTime: 0,
      compressionRatio: 0,
      memoryPressure: 0,
      predictiveAccuracy: 0
    };

    this.initializeWorkers();
    this.startCleanupTimer();
    this.loadPersistedData();
  }

  /**
   * Inicializar Web Workers para operações pesadas
   */
  private initializeWorkers() {
    try {
      // Worker para compressão (simulado - em produção seria um worker real)
      this.compressionWorker = null; // Placeholder
    } catch (error) {
      console.warn('Web Workers não disponíveis, usando fallback síncrono');
    }
  }

  /**
   * Calcular tamanho estimado de um objeto
   */
  private calculateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return JSON.stringify(data).length * 2; // Estimativa
    }
  }

  /**
   * Comprimir dados se necessário
   */
  private async compressData(data: any): Promise<{ data: any; compressed: boolean; ratio: number }> {
    const originalSize = this.calculateSize(data);
    
    if (originalSize < this.strategy.compressionThreshold) {
      return { data, compressed: false, ratio: 1 };
    }

    try {
      // Simulação de compressão (em produção seria LZ4 ou similar)
      const compressed = JSON.stringify(data);
      const compressedSize = compressed.length * 0.6; // Simular 40% de compressão
      
      this.recordEvent({
        type: 'compress',
        key: 'data',
        timestamp: Date.now(),
        size: originalSize,
        metadata: { compressedSize, ratio: originalSize / compressedSize }
      });

      return {
        data: compressed,
        compressed: true,
        ratio: originalSize / compressedSize
      };
    } catch (error) {
      return { data, compressed: false, ratio: 1 };
    }
  }

  /**
   * Descomprimir dados
   */
  private async decompressData(entry: CacheEntry): Promise<any> {
    if (!entry.compressed) {
      return entry.data;
    }

    try {
      // Simulação de descompressão
      return JSON.parse(entry.data);
    } catch (error) {
      console.error('Erro ao descomprimir dados:', error);
      return entry.data;
    }
  }

  /**
   * Analisar padrões de acesso do usuário
   */
  private analyzeAccessPattern(key: string): UserAccessPattern {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    let pattern = this.accessPatterns.get(key);
    
    if (!pattern) {
      pattern = {
        timeOfDay: [],
        dayOfWeek: [],
        frequency: 'rare',
        seasonality: 'none'
      };
    }

    // Atualizar padrões
    pattern.timeOfDay.push(hour);
    pattern.dayOfWeek.push(dayOfWeek);

    // Manter apenas últimos 100 acessos
    if (pattern.timeOfDay.length > 100) {
      pattern.timeOfDay = pattern.timeOfDay.slice(-50);
      pattern.dayOfWeek = pattern.dayOfWeek.slice(-50);
    }

    // Calcular frequência
    const totalAccesses = pattern.timeOfDay.length;
    if (totalAccesses > 50) pattern.frequency = 'constant';
    else if (totalAccesses > 20) pattern.frequency = 'frequent';
    else if (totalAccesses > 5) pattern.frequency = 'occasional';

    this.accessPatterns.set(key, pattern);
    return pattern;
  }

  /**
   * Prever próximo acesso usando IA simples
   */
  private predictNextAccess(key: string, pattern: UserAccessPattern): number {
    const now = Date.now();
    
    if (pattern.frequency === 'rare') {
      return now + 24 * 60 * 60 * 1000; // 24 horas
    }

    // Análise de padrão temporal
    const avgHourOfAccess = pattern.timeOfDay.reduce((sum, hour) => sum + hour, 0) / pattern.timeOfDay.length;
    const currentHour = new Date().getHours();
    
    // Calcular próximo acesso baseado no padrão
    let hoursUntilNext = Math.abs(avgHourOfAccess - currentHour);
    if (hoursUntilNext === 0) hoursUntilNext = 1;
    
    const prediction = now + (hoursUntilNext * 60 * 60 * 1000);
    this.predictions.set(key, prediction);
    
    return prediction;
  }

  /**
   * Determinar prioridade de cache baseada em múltiplos fatores
   */
  private calculatePriority(metadata: CacheMetadata, pattern: UserAccessPattern): CachePriority {
    let score = 0;

    // Custo computacional
    score += metadata.computationCost * 10;

    // Frequência de acesso
    switch (pattern.frequency) {
      case 'constant': score += 40; break;
      case 'frequent': score += 30; break;
      case 'occasional': score += 20; break;
      case 'rare': score += 10; break;
    }

    // Dependências (dados críticos)
    score += metadata.dependencies.length * 5;

    if (score >= 70) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  /**
   * Gravar evento para analytics
   */
  private recordEvent(event: CacheEvent) {
    this.events.push(event);
    
    // Manter apenas últimos 1000 eventos
    if (this.events.length > 1000) {
      this.events = this.events.slice(-500);
    }
  }

  /**
   * Obter item do cache
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now();
    const entry = this.cache.get(key);

    if (!entry) {
      this.metrics.totalMisses++;
      this.recordEvent({
        type: 'miss',
        key,
        timestamp: Date.now(),
        duration: performance.now() - startTime
      });
      return null;
    }

    // Verificar TTL
    const now = Date.now();
    if (now > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      this.metrics.totalMisses++;
      this.recordEvent({
        type: 'miss',
        key,
        timestamp: now,
        duration: performance.now() - startTime,
        metadata: { reason: 'expired' }
      });
      return null;
    }

    // Atualizar estatísticas de acesso
    entry.lastAccessed = now;
    entry.accessCount++;
    
    // Analisar padrão de acesso
    const pattern = this.analyzeAccessPattern(key);
    entry.metadata.predictedNextAccess = this.predictNextAccess(key, pattern);
    entry.metadata.userPattern = pattern;

    this.metrics.totalHits++;
    this.recordEvent({
      type: 'hit',
      key,
      timestamp: now,
      duration: performance.now() - startTime
    });

    // Descomprimir se necessário
    const data = await this.decompressData(entry);
    return data as T;
  }

  /**
   * Definir item no cache
   */
  async set<T>(
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      priority?: CachePriority;
      tags?: string[];
      metadata?: Partial<CacheMetadata>;
    } = {}
  ): Promise<void> {
    const startTime = performance.now();
    const now = Date.now();

    // Comprimir dados se necessário
    const { data: processedData, compressed, ratio } = await this.compressData(data);
    const size = this.calculateSize(processedData);

    // Verificar pressão de memória
    await this.checkMemoryPressure(size);

    const pattern = this.accessPatterns.get(key) || {
      timeOfDay: [],
      dayOfWeek: [],
      frequency: 'rare' as const,
      seasonality: 'none' as const
    };

    const metadata: CacheMetadata = {
      source: 'user',
      version: '1.0',
      dependencies: [],
      computationCost: 1,
      ...options.metadata
    };

    const priority = options.priority || this.calculatePriority(metadata, pattern);

    const entry: CacheEntry<T> = {
      key,
      data: processedData,
      timestamp: now,
      lastAccessed: now,
      accessCount: 1,
      ttl: options.ttl || this.strategy.ttlDefault,
      size,
      priority,
      tags: options.tags || [],
      compressed,
      metadata: {
        ...metadata,
        predictedNextAccess: this.predictNextAccess(key, pattern),
        userPattern: pattern
      }
    };

    this.cache.set(key, entry);
    this.updateMetrics();

    this.recordEvent({
      type: 'set',
      key,
      timestamp: now,
      duration: performance.now() - startTime,
      size,
      metadata: { compressed, compressionRatio: ratio }
    });
  }

  /**
   * Verificar pressão de memória e limpar se necessário
   */
  private async checkMemoryPressure(newEntrySize: number) {
    const currentSize = this.metrics.totalSize;
    const maxSizeBytes = this.strategy.maxSize * 1024 * 1024;
    
    if (currentSize + newEntrySize > maxSizeBytes) {
      const spaceNeeded = (currentSize + newEntrySize) - maxSizeBytes;
      await this.smartCleanup(spaceNeeded);
    }
  }

  /**
   * Limpeza inteligente baseada em estratégia
   */
  private async smartCleanup(spaceNeeded: number): Promise<void> {
    const entries = Array.from(this.cache.entries());
    let freedSpace = 0;

    // Ordenar por estratégia
    let sortedEntries;
    
    switch (this.strategy.type) {
      case 'lru':
        sortedEntries = entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
        break;
        
      case 'lfu':
        sortedEntries = entries.sort(([, a], [, b]) => a.accessCount - b.accessCount);
        break;
        
      case 'adaptive':
        sortedEntries = entries.sort(([, a], [, b]) => {
          const scoreA = this.calculateAdaptiveScore(a);
          const scoreB = this.calculateAdaptiveScore(b);
          return scoreA - scoreB;
        });
        break;
        
      case 'predictive':
        sortedEntries = entries.sort(([, a], [, b]) => {
          const nextA = a.metadata.predictedNextAccess || Infinity;
          const nextB = b.metadata.predictedNextAccess || Infinity;
          return nextB - nextA; // Remover os que serão acessados mais tarde
        });
        break;
        
      default:
        sortedEntries = entries;
    }

    // Remover entradas até liberar espaço suficiente
    for (const [key, entry] of sortedEntries) {
      if (freedSpace >= spaceNeeded) break;
      
      // Não remover entradas críticas a menos que seja extremamente necessário
      if (entry.priority === 'critical' && freedSpace < spaceNeeded * 0.8) {
        continue;
      }

      this.cache.delete(key);
      freedSpace += entry.size;
      
      this.recordEvent({
        type: 'cleanup',
        key,
        timestamp: Date.now(),
        size: entry.size,
        metadata: { reason: 'memory_pressure', strategy: this.strategy.type }
      });
    }

    this.updateMetrics();
  }

  /**
   * Calcular score adaptativo para limpeza
   */
  private calculateAdaptiveScore(entry: CacheEntry): number {
    const now = Date.now();
    const age = now - entry.timestamp;
    const timeSinceAccess = now - entry.lastAccessed;
    
    let score = 0;
    
    // Prioridade (maior = manter mais tempo)
    const priorityMultiplier = {
      'critical': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    };
    score += priorityMultiplier[entry.priority];
    
    // Frequência de acesso
    score += Math.log(entry.accessCount + 1) * 2;
    
    // Custo computacional
    score += entry.metadata.computationCost;
    
    // Penalizar por idade e tempo sem acesso
    score -= (age / (1000 * 60 * 60)) * 0.1; // Horas
    score -= (timeSinceAccess / (1000 * 60 * 60)) * 0.2; // Horas
    
    // Bonus para dados comprimidos (economizam espaço)
    if (entry.compressed) {
      score += 0.5;
    }
    
    // Previsão de próximo acesso
    if (entry.metadata.predictedNextAccess) {
      const timeUntilNext = entry.metadata.predictedNextAccess - now;
      if (timeUntilNext < 60 * 60 * 1000) { // Próxima hora
        score += 2;
      }
    }
    
    return score;
  }

  /**
   * Atualizar métricas
   */
  private updateMetrics() {
    const entries = Array.from(this.cache.values());
    
    this.metrics.entryCount = entries.length;
    this.metrics.totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    
    const totalRequests = this.metrics.totalHits + this.metrics.totalMisses;
    if (totalRequests > 0) {
      this.metrics.hitRate = (this.metrics.totalHits / totalRequests) * 100;
      this.metrics.missRate = (this.metrics.totalMisses / totalRequests) * 100;
    }

    // Calcular razão de compressão média
    const compressedEntries = entries.filter(e => e.compressed);
    if (compressedEntries.length > 0) {
      this.metrics.compressionRatio = compressedEntries.length / entries.length * 100;
    }

    // Calcular pressão de memória
    const maxSizeBytes = this.strategy.maxSize * 1024 * 1024;
    this.metrics.memoryPressure = (this.metrics.totalSize / maxSizeBytes) * 100;
  }

  /**
   * Limpeza automática por timer
   */
  private startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.performScheduledCleanup();
    }, this.strategy.cleanupInterval);
  }

  /**
   * Limpeza programada
   */
  private async performScheduledCleanup() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    for (const [key, entry] of entries) {
      // Remover entradas expiradas
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
        this.recordEvent({
          type: 'cleanup',
          key,
          timestamp: now,
          metadata: { reason: 'expired' }
        });
      }
    }
    
    this.updateMetrics();
  }

  /**
   * Deletar item específico
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    if (result) {
      this.updateMetrics();
      this.recordEvent({
        type: 'delete',
        key,
        timestamp: Date.now()
      });
    }
    return result;
  }

  /**
   * Limpar todo o cache
   */
  clear(): void {
    this.cache.clear();
    this.accessPatterns.clear();
    this.predictions.clear();
    this.updateMetrics();
  }

  /**
   * Obter métricas atuais
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Obter análise detalhada
   */
  getAnalytics() {
    return {
      metrics: this.getMetrics(),
      topKeys: this.getTopKeys(),
      accessPatterns: Array.from(this.accessPatterns.entries()),
      predictions: Array.from(this.predictions.entries()),
      recentEvents: this.events.slice(-50),
      recommendations: this.getRecommendations()
    };
  }

  /**
   * Obter chaves mais acessadas
   */
  private getTopKeys() {
    return Array.from(this.cache.entries())
      .sort(([, a], [, b]) => b.accessCount - a.accessCount)
      .slice(0, 10)
      .map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        size: entry.size,
        priority: entry.priority
      }));
  }

  /**
   * Obter recomendações de otimização
   */
  private getRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.metrics.hitRate < 70) {
      recommendations.push('Taxa de hit baixa - considere aumentar TTL ou melhorar previsibilidade');
    }
    
    if (this.metrics.memoryPressure > 80) {
      recommendations.push('Alta pressão de memória - considere aumentar limite ou melhorar limpeza');
    }
    
    if (this.metrics.compressionRatio < 30) {
      recommendations.push('Baixa taxa de compressão - ajuste threshold de compressão');
    }
    
    const avgAccessCount = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.accessCount, 0) / this.cache.size;
    
    if (avgAccessCount < 2) {
      recommendations.push('Muitos dados acessados apenas uma vez - revisar estratégia de cache');
    }
    
    return recommendations;
  }

  /**
   * Carregar dados persistidos (localStorage)
   */
  private loadPersistedData() {
    try {
      const saved = localStorage.getItem('advanced-cache-patterns');
      if (saved) {
        const patterns = JSON.parse(saved);
        this.accessPatterns = new Map(patterns);
      }
    } catch (error) {
      console.warn('Erro ao carregar padrões de cache:', error);
    }
  }

  /**
   * Salvar dados importantes
   */
  persist() {
    try {
      const patterns = Array.from(this.accessPatterns.entries());
      localStorage.setItem('advanced-cache-patterns', JSON.stringify(patterns));
    } catch (error) {
      console.warn('Erro ao salvar padrões de cache:', error);
    }
  }

  /**
   * Destruir instância
   */
  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    if (this.compressionWorker) {
      this.compressionWorker.terminate();
    }
    
    this.persist();
    this.clear();
  }
}

// Instância singleton
let globalCacheManager: AdvancedCacheManager | null = null;

/**
 * Obter instância global do cache manager
 */
export const getCacheManager = (strategy?: Partial<CacheStrategy>): AdvancedCacheManager => {
  if (!globalCacheManager) {
    globalCacheManager = new AdvancedCacheManager(strategy);
  }
  return globalCacheManager;
};

/**
 * Hook para usar o cache manager no React
 */
export const useCacheManager = (strategy?: Partial<CacheStrategy>) => {
  return getCacheManager(strategy);
};

export default AdvancedCacheManager; 