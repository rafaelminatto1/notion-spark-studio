import type { Task, TaskFilters } from '@/types/task';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

export class TaskCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private stats = { hits: 0, misses: 0 };
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000;

  /**
   * Gera chave única para cache baseada nos filtros
   */
  private generateCacheKey(operation: string, params?: any): string {
    if (!params) return `task:${operation}`;
    
    const sortedParams = JSON.stringify(params, Object.keys(params).sort());
    return `task:${operation}:${btoa(sortedParams)}`;
  }

  /**
   * Verifica se entrada está válida (não expirada)
   */
  private isValid(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Remove entradas expiradas
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp >= entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Controla tamanho máximo do cache (LRU-like)
   */
  private evictIfNeeded(): void {
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      // Remove 20% das entradas mais antigas
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = Math.floor(this.MAX_CACHE_SIZE * 0.2);
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
  }

  /**
   * Armazena dados no cache
   */
  set<T>(operation: string, data: T, params?: any, ttl = this.DEFAULT_TTL): void {
    this.cleanup();
    this.evictIfNeeded();

    const key = this.generateCacheKey(operation, params);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Recupera dados do cache
   */
  get<T>(operation: string, params?: any): T | null {
    const key = this.generateCacheKey(operation, params);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (!this.isValid(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data as T;
  }

  /**
   * Invalida cache relacionado a uma tarefa específica
   */
  invalidateTask(taskId: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      // Invalida todas as queries que podem ter incluído esta tarefa
      if (key.includes('task:getTasks:') || 
          key.includes('task:getTasksByUser:') || 
          key.includes('task:getById:')) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Invalida cache relacionado a um usuário
   */
  invalidateUser(userId: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes('task:getTasksByUser:') || key.includes('task:getTasks:')) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0
    };
  }

  /**
   * Força limpeza do cache
   */
  maintenance(): void {
    this.cleanup();
    this.evictIfNeeded();
  }
}

// Singleton instance
export const taskCacheService = new TaskCacheService(); 