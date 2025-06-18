
import type { IDataProvider, ICacheProvider } from './interfaces/IDataProvider';
import { IndexedDBProvider } from './providers/IndexedDBProvider';
import { MemoryCacheProvider } from './providers/MemoryCacheProvider';
import type { FileItem } from '@/types';

class DataService {
  private provider: IDataProvider;
  private cache: ICacheProvider;
  private isOffline = false;

  constructor() {
    this.provider = new IndexedDBProvider();
    this.cache = new MemoryCacheProvider();
    this.init();
  }

  private async init() {
    try {
      await this.provider.connect();
      console.log('DataService: Provider connected successfully');
    } catch (error) {
      console.error('DataService: Failed to connect provider:', error);
      this.isOffline = true;
    }

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOffline = false;
      this.syncPendingOperations();
    });

    window.addEventListener('offline', () => {
      this.isOffline = true;
    });
  }

  // File operations with caching
  async getFile<T = FileItem>(id: string): Promise<T | null> {
    const cacheKey = `file:${id}`;
    
    // Try cache first
    const cached = await this.cache.get<T>(cacheKey);
    if (cached) return cached;

    // Fallback to provider
    const file = await this.provider.getFile<T>(id);
    if (file) {
      await this.cache.set(cacheKey, file, 5 * 60 * 1000); // 5 min TTL
    }
    
    return file;
  }

  async getAllFiles<T = FileItem>(): Promise<T[]> {
    const cacheKey = 'files:all';
    
    // Try cache first
    const cached = await this.cache.get<T[]>(cacheKey);
    if (cached) return cached;

    // Fallback to provider
    const files = await this.provider.getAllFiles<T>();
    await this.cache.set(cacheKey, files, 2 * 60 * 1000); // 2 min TTL
    
    return files;
  }

  async createFile<T = FileItem>(data: T): Promise<string> {
    const id = await this.provider.createFile(data);
    
    // Update cache
    await this.cache.set(`file:${id}`, data);
    await this.cache.delete('files:all'); // Invalidate list cache
    
    return id;
  }

  async updateFile<T = FileItem>(id: string, updates: Partial<T>): Promise<void> {
    await this.provider.updateFile(id, updates);
    
    // Update cache
    const existing = await this.cache.get<T>(`file:${id}`);
    if (existing) {
      await this.cache.set(`file:${id}`, { ...existing, ...updates });
    }
    await this.cache.delete('files:all'); // Invalidate list cache
  }

  async deleteFile(id: string): Promise<void> {
    await this.provider.deleteFile(id);
    
    // Update cache
    await this.cache.delete(`file:${id}`);
    await this.cache.delete('files:all'); // Invalidate list cache
  }

  async searchFiles<T = FileItem>(query: string): Promise<T[]> {
    const cacheKey = `search:${query}`;
    
    // Try cache first
    const cached = await this.cache.get<T[]>(cacheKey);
    if (cached) return cached;

    // Fallback to provider
    const results = await this.provider.searchFiles<T>(query);
    await this.cache.set(cacheKey, results, 1 * 60 * 1000); // 1 min TTL
    
    return results;
  }

  // Workspace operations
  async saveWorkspace(data: any): Promise<void> {
    await this.provider.saveWorkspace(data);
    await this.cache.set('workspace:current', data);
  }

  async loadWorkspace(): Promise<any> {
    const cached = await this.cache.get('workspace:current');
    if (cached) return cached;

    const workspace = await this.provider.loadWorkspace();
    if (workspace) {
      await this.cache.set('workspace:current', workspace);
    }
    
    return workspace;
  }

  // Query operations
  async query<T>(collection: string, filters?: Record<string, any>): Promise<T[]> {
    const cacheKey = `query:${collection}:${JSON.stringify(filters || {})}`;
    
    const cached = await this.cache.get<T[]>(cacheKey);
    if (cached) return cached;

    const results = await this.provider.query<T>(collection, filters);
    await this.cache.set(cacheKey, results, 1 * 60 * 1000); // 1 min TTL
    
    return results;
  }

  // Cache management
  async invalidateCache(pattern?: string): Promise<void> {
    if (pattern) {
      // TODO: Implement pattern-based cache invalidation
      console.log(`Invalidating cache pattern: ${pattern}`);
    } else {
      await this.cache.clear();
    }
  }

  // Connection status
  isConnected(): boolean {
    return this.provider.isConnected() && !this.isOffline;
  }

  isOnline(): boolean {
    return !this.isOffline;
  }

  // Offline operations queue (placeholder for future implementation)
  private pendingOperations: Array<{ type: string; data: any }> = [];

  private async syncPendingOperations(): Promise<void> {
    if (this.pendingOperations.length === 0) return;
    
    console.log(`Syncing ${this.pendingOperations.length} pending operations`);
    // TODO: Implement sync logic
    this.pendingOperations = [];
  }

  // Stats and debugging
  getCacheStats() {
    return (this.cache as MemoryCacheProvider).getCacheStats();
  }

  getProviderType(): string {
    return this.provider.constructor.name;
  }
}

// Singleton instance
export const dataService = new DataService();
export default dataService;
