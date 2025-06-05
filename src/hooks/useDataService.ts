
import { useState, useEffect, useCallback } from 'react';
import { dataService } from '@/services/DataService';
import { FileItem } from '@/types';

export const useDataService = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(dataService.isConnected());
      setIsOnline(dataService.isOnline());
    };

    // Initial check
    checkConnection();

    // Check every 5 seconds
    const interval = setInterval(checkConnection, 5000);

    return () => clearInterval(interval);
  }, []);

  // File operations
  const getFile = useCallback(async <T = FileItem>(id: string): Promise<T | null> => {
    return await dataService.getFile<T>(id);
  }, []);

  const getAllFiles = useCallback(async <T = FileItem>(): Promise<T[]> => {
    return await dataService.getAllFiles<T>();
  }, []);

  const createFile = useCallback(async <T = FileItem>(data: T): Promise<string> => {
    return await dataService.createFile<T>(data);
  }, []);

  const updateFile = useCallback(async <T = FileItem>(id: string, updates: Partial<T>): Promise<void> => {
    return await dataService.updateFile<T>(id, updates);
  }, []);

  const deleteFile = useCallback(async (id: string): Promise<void> => {
    return await dataService.deleteFile(id);
  }, []);

  const searchFiles = useCallback(async <T = FileItem>(query: string): Promise<T[]> => {
    return await dataService.searchFiles<T>(query);
  }, []);

  // Workspace operations
  const saveWorkspace = useCallback(async (data: any): Promise<void> => {
    return await dataService.saveWorkspace(data);
  }, []);

  const loadWorkspace = useCallback(async (): Promise<any> => {
    return await dataService.loadWorkspace();
  }, []);

  // Query operations
  const query = useCallback(async <T>(collection: string, filters?: Record<string, any>): Promise<T[]> => {
    return await dataService.query<T>(collection, filters);
  }, []);

  // Cache management
  const invalidateCache = useCallback(async (pattern?: string): Promise<void> => {
    return await dataService.invalidateCache(pattern);
  }, []);

  // Stats
  const getCacheStats = useCallback(() => {
    return dataService.getCacheStats();
  }, []);

  const getProviderType = useCallback(() => {
    return dataService.getProviderType();
  }, []);

  return {
    // Connection status
    isConnected,
    isOnline,
    
    // File operations
    getFile,
    getAllFiles,
    createFile,
    updateFile,
    deleteFile,
    searchFiles,
    
    // Workspace operations
    saveWorkspace,
    loadWorkspace,
    
    // Query operations
    query,
    
    // Cache management
    invalidateCache,
    
    // Stats and debugging
    getCacheStats,
    getProviderType
  };
};
