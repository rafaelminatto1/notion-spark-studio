
import type { ICacheProvider } from '../interfaces/IDataProvider';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl?: number;
}

export class MemoryCacheProvider implements ICacheProvider {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize = 1000;

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Check if expired
    if (item.ttl && Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async has(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;
    
    // Check if expired
    if (item.ttl && Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  // Utility methods
  getSize(): number {
    return this.cache.size;
  }

  getCacheStats() {
    const now = Date.now();
    let expired = 0;
    let valid = 0;

    for (const [key, item] of this.cache.entries()) {
      if (item.ttl && now - item.timestamp > item.ttl) {
        expired++;
      } else {
        valid++;
      }
    }

    return { total: this.cache.size, valid, expired };
  }
}
