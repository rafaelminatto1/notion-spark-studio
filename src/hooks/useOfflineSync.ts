
import { useState, useEffect, useCallback, useRef } from 'react';
import { useIndexedDB } from './useIndexedDB';
import { useToast } from './use-toast';
import { FileItem } from '@/types';

export interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

export interface ConflictResolution {
  operationId: string;
  resolution: 'local' | 'remote' | 'merge';
  mergedData?: any;
}

export const useOfflineSync = () => {
  const { isReady, getAll, set, remove, query } = useIndexedDB();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([]);
  const [conflicts, setConflicts] = useState<PendingOperation[]>([]);
  const syncIntervalRef = useRef<NodeJS.Timeout>();

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Conexão restaurada",
        description: "Sincronizando dados...",
      });
      syncPendingOperations();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Modo offline",
        description: "As alterações serão sincronizadas quando a conexão for restaurada",
        variant: "destructive"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load pending operations on startup
  useEffect(() => {
    const loadPendingOperations = async () => {
      if (!isReady) return;
      
      try {
        const operations = await query<PendingOperation>('offline_queue');
        setPendingOperations(operations.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        ));
      } catch (error) {
        console.error('Error loading pending operations:', error);
      }
    };

    loadPendingOperations();
  }, [isReady, query]);

  // Auto-sync when online
  useEffect(() => {
    if (isOnline && pendingOperations.length > 0) {
      syncPendingOperations();
    }

    // Set up periodic sync
    if (isOnline) {
      syncIntervalRef.current = setInterval(() => {
        if (pendingOperations.length > 0) {
          syncPendingOperations();
        }
      }, 30000); // Sync every 30 seconds
    } else {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [isOnline, pendingOperations.length]);

  // Add operation to queue
  const queueOperation = useCallback(async (
    type: 'create' | 'update' | 'delete',
    collection: string,
    data: any
  ): Promise<void> => {
    if (!isReady) return;

    const operation: PendingOperation = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      collection,
      data: {
        ...data,
        localTimestamp: new Date(),
        version: data.version || 1
      },
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: 3
    };

    try {
      await set('offline_queue', operation);
      setPendingOperations(prev => [...prev, operation]);

      if (isOnline) {
        // Try to sync immediately if online
        setTimeout(() => syncPendingOperations(), 100);
      }
    } catch (error) {
      console.error('Error queueing operation:', error);
      toast({
        title: "Erro de sincronização",
        description: "Falha ao adicionar operação na fila",
        variant: "destructive"
      });
    }
  }, [isReady, set, isOnline]);

  // Simulate server sync (replace with real API calls)
  const syncOperation = async (operation: PendingOperation): Promise<'success' | 'conflict' | 'error'> => {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

      // Simulate conflict (10% chance)
      if (Math.random() < 0.1 && operation.type === 'update') {
        return 'conflict';
      }

      // Simulate success
      console.log(`Synced operation ${operation.id}:`, operation);
      return 'success';
    } catch (error) {
      console.error('Sync error:', error);
      return 'error';
    }
  };

  // Sync all pending operations
  const syncPendingOperations = useCallback(async () => {
    if (!isOnline || isSyncing || pendingOperations.length === 0) return;

    setIsSyncing(true);
    const operationsToSync = [...pendingOperations];
    const newConflicts: PendingOperation[] = [];
    const completedOperations: string[] = [];

    try {
      for (const operation of operationsToSync) {
        const result = await syncOperation(operation);

        if (result === 'success') {
          completedOperations.push(operation.id);
          await remove('offline_queue', operation.id);
        } else if (result === 'conflict') {
          newConflicts.push(operation);
          await remove('offline_queue', operation.id);
        } else if (result === 'error') {
          // Increment retry count
          const updatedOperation = {
            ...operation,
            retryCount: operation.retryCount + 1
          };

          if (updatedOperation.retryCount >= updatedOperation.maxRetries) {
            console.error('Max retries reached for operation:', operation.id);
            await remove('offline_queue', operation.id);
            completedOperations.push(operation.id);
          } else {
            await set('offline_queue', updatedOperation);
          }
        }
      }

      // Update local state
      setPendingOperations(prev => 
        prev.filter(op => !completedOperations.includes(op.id))
          .map(op => {
            const updated = operationsToSync.find(o => o.id === op.id);
            return updated && updated.retryCount > op.retryCount ? updated : op;
          })
      );

      if (newConflicts.length > 0) {
        setConflicts(prev => [...prev, ...newConflicts]);
        toast({
          title: "Conflitos detectados",
          description: `${newConflicts.length} operação(ões) tem conflitos que precisam ser resolvidos`,
          variant: "destructive"
        });
      }

      if (completedOperations.length > 0) {
        toast({
          title: "Sincronização completa",
          description: `${completedOperations.length} operação(ões) sincronizada(s) com sucesso`
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Erro de sincronização",
        description: "Falha durante a sincronização",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, pendingOperations, remove, set]);

  // Resolve conflict
  const resolveConflict = useCallback(async (resolution: ConflictResolution) => {
    const conflict = conflicts.find(c => c.id === resolution.operationId);
    if (!conflict) return;

    try {
      let finalData = conflict.data;

      if (resolution.resolution === 'merge' && resolution.mergedData) {
        finalData = resolution.mergedData;
      } else if (resolution.resolution === 'remote') {
        // Use remote data (simulate fetching from server)
        finalData = { ...conflict.data, content: 'Remote version content' };
      }

      // Apply resolution
      if (conflict.type === 'update') {
        await set(conflict.collection, finalData);
      }

      // Remove from conflicts
      setConflicts(prev => prev.filter(c => c.id !== resolution.operationId));

      toast({
        title: "Conflito resolvido",
        description: `Conflito resolvido usando versão ${resolution.resolution}`
      });
    } catch (error) {
      console.error('Error resolving conflict:', error);
      toast({
        title: "Erro na resolução",
        description: "Falha ao resolver conflito",
        variant: "destructive"
      });
    }
  }, [conflicts, set]);

  // Force sync
  const forceSync = useCallback(() => {
    if (isOnline) {
      syncPendingOperations();
    } else {
      toast({
        title: "Sem conexão",
        description: "Não é possível sincronizar sem conexão com a internet",
        variant: "destructive"
      });
    }
  }, [isOnline, syncPendingOperations]);

  // Clear all pending operations (dangerous)
  const clearPendingOperations = useCallback(async () => {
    try {
      for (const operation of pendingOperations) {
        await remove('offline_queue', operation.id);
      }
      setPendingOperations([]);
      toast({
        title: "Fila limpa",
        description: "Todas as operações pendentes foram removidas"
      });
    } catch (error) {
      console.error('Error clearing pending operations:', error);
    }
  }, [pendingOperations, remove]);

  return {
    isOnline,
    isSyncing,
    pendingOperations,
    conflicts,
    queueOperation,
    syncPendingOperations,
    resolveConflict,
    forceSync,
    clearPendingOperations
  };
};
