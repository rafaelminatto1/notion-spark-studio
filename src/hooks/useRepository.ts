
import { useState, useEffect, useCallback } from 'react';
import { useDataService } from './useDataService';
import { FileItem } from '@/types';

interface RepositoryOptions {
  autoLoad?: boolean;
  cacheTime?: number;
  enableOptimisticUpdates?: boolean;
}

export const useRepository = <T = FileItem>(
  collection: string = 'files',
  options: RepositoryOptions = {}
) => {
  const {
    autoLoad = true,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    enableOptimisticUpdates = true
  } = options;

  const dataService = useDataService();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  // Load data
  const load = useCallback(async (filters?: Record<string, any>) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = filters 
        ? await dataService.query<T>(collection, filters)
        : await dataService.getAllFiles<T>();
      
      setData(result);
      setLastFetch(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [dataService, collection]);

  // Create item
  const create = useCallback(async (item: Omit<T, 'id'>): Promise<string | null> => {
    try {
      const newItem = {
        ...item,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      } as T;

      if (enableOptimisticUpdates) {
        setData(prev => [...prev, newItem]);
      }

      const id = await dataService.createFile(newItem);

      if (!enableOptimisticUpdates) {
        await load(); // Reload data
      }

      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item');
      if (enableOptimisticUpdates) {
        await load(); // Revert optimistic update
      }
      return null;
    }
  }, [dataService, enableOptimisticUpdates, load]);

  // Update item
  const update = useCallback(async (id: string, updates: Partial<T>): Promise<boolean> => {
    try {
      const updatedItem = {
        ...updates,
        updatedAt: new Date()
      } as Partial<T>;

      if (enableOptimisticUpdates) {
        setData(prev => prev.map(item => 
          (item as any).id === id ? { ...item, ...updatedItem } : item
        ));
      }

      await dataService.updateFile(id, updatedItem);

      if (!enableOptimisticUpdates) {
        await load(); // Reload data
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
      if (enableOptimisticUpdates) {
        await load(); // Revert optimistic update
      }
      return false;
    }
  }, [dataService, enableOptimisticUpdates, load]);

  // Delete item
  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      if (enableOptimisticUpdates) {
        setData(prev => prev.filter(item => (item as any).id !== id));
      }

      await dataService.deleteFile(id);

      if (!enableOptimisticUpdates) {
        await load(); // Reload data
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
      if (enableOptimisticUpdates) {
        await load(); // Revert optimistic update
      }
      return false;
    }
  }, [dataService, enableOptimisticUpdates, load]);

  // Get single item
  const getById = useCallback(async (id: string): Promise<T | null> => {
    try {
      return await dataService.getFile<T>(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get item');
      return null;
    }
  }, [dataService]);

  // Search items
  const search = useCallback(async (query: string): Promise<T[]> => {
    try {
      return await dataService.searchFiles<T>(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search');
      return [];
    }
  }, [dataService]);

  // Check if data is stale
  const isStale = useCallback(() => {
    if (!lastFetch) return true;
    return Date.now() - lastFetch.getTime() > cacheTime;
  }, [lastFetch, cacheTime]);

  // Refresh if stale
  const refreshIfStale = useCallback(async () => {
    if (isStale()) {
      await load();
    }
  }, [isStale, load]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  return {
    // Data
    data,
    loading,
    error,
    lastFetch,
    
    // Operations
    load,
    create,
    update,
    remove,
    getById,
    search,
    
    // Utilities
    isStale,
    refreshIfStale,
    
    // Connection status
    isConnected: dataService.isConnected,
    isOnline: dataService.isOnline
  };
};
