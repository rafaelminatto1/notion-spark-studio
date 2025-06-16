import { useState, useEffect, useCallback, useRef } from 'react';
import type { FileItem } from '@/types/common';

interface BackendConfig {
  apiUrl: string;
  timeout: number;
  retryAttempts: number;
  enableMockFallback: boolean;
  enableOfflineSync: boolean;
}

interface BackendState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;
  pendingOperations: number;
}

interface ApiOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'GET' | 'LIST';
  endpoint: string;
  data?: any;
  timestamp: number;
  retries: number;
}

const DEFAULT_CONFIG: BackendConfig = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  retryAttempts: 3,
  enableMockFallback: true,
  enableOfflineSync: true
};

export const useBackendIntegration = (config: Partial<BackendConfig> = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [state, setState] = useState<BackendState>({
    isConnected: false,
    isLoading: false,
    error: null,
    lastSync: null,
    pendingOperations: 0
  });

  const operationQueue = useRef<ApiOperation[]>([]);
  const abortController = useRef<AbortController>();

  // Verificar conectividade com o backend
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${finalConfig.apiUrl}/health`, {
        method: 'GET',
        signal: abortController.current?.signal
      });
      return response.ok;
    } catch (error) {
      console.warn('Backend não disponível:', error);
      return false;
    }
  }, [finalConfig.apiUrl]);

  // Executar operação na API
  const executeOperation = useCallback(async (operation: ApiOperation): Promise<any> => {
    const { type, endpoint, data } = operation;
    
    try {
      const url = `${finalConfig.apiUrl}${endpoint}`;
      const options: RequestInit = {
        method: type === 'GET' || type === 'LIST' ? 'GET' : 
                type === 'CREATE' ? 'POST' :
                type === 'UPDATE' ? 'PUT' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        signal: abortController.current?.signal
      };

      if (data && type !== 'GET' && type !== 'LIST') {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Erro na operação ${operation.type}:`, error);
      
      // Se backend está offline e fallback habilitado, usar mock
      if (finalConfig.enableMockFallback) {
        return await executeMockFallback(operation);
      }
      
      throw error;
    }
  }, [finalConfig]);

  // Mock fallback para desenvolvimento
  const executeMockFallback = useCallback(async (operation: ApiOperation): Promise<any> => {
    await new Promise(resolve => setTimeout(resolve, 200)); // Simular latência
    
    switch (operation.type) {
      case 'LIST':
        return { data: [], total: 0 };
      case 'GET':
        return { data: null };
      case 'CREATE':
        return { data: { ...operation.data, id: Date.now().toString() } };
      case 'UPDATE':
        return { data: operation.data };
      case 'DELETE':
        return { success: true };
      default:
        throw new Error(`Operação ${operation.type} não suportada no mock`);
    }
  }, []);

  // Processar fila de operações
  const processQueue = useCallback(async () => {
    if (operationQueue.current.length === 0) return;

    setState(prev => ({ ...prev, isLoading: true, pendingOperations: operationQueue.current.length }));

    const operations = [...operationQueue.current];
    operationQueue.current = [];

    for (const operation of operations) {
      try {
        await executeOperation(operation);
        console.log(`Operação ${operation.type} executada com sucesso`);
      } catch (error) {
        console.error(`Falha na operação ${operation.id}:`, error);
        
        // Recolocar na fila se não excedeu tentativas
        if (operation.retries < finalConfig.retryAttempts) {
          operationQueue.current.push({
            ...operation,
            retries: operation.retries + 1
          });
        }
      }
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: false, 
      lastSync: new Date(),
      pendingOperations: operationQueue.current.length 
    }));
  }, [executeOperation, finalConfig.retryAttempts]);

  // API methods
  const api = {
    // Files
    files: {
      list: (params?: any) => executeOperation({
        id: Date.now().toString(),
        type: 'LIST',
        endpoint: '/files',
        timestamp: Date.now(),
        retries: 0
      }),
      
      get: (id: string) => executeOperation({
        id: Date.now().toString(),
        type: 'GET',
        endpoint: `/files/${id}`,
        timestamp: Date.now(),
        retries: 0
      }),
      
      create: (file: Partial<FileItem>) => executeOperation({
        id: Date.now().toString(),
        type: 'CREATE',
        endpoint: '/files',
        data: file,
        timestamp: Date.now(),
        retries: 0
      }),
      
      update: (id: string, file: Partial<FileItem>) => executeOperation({
        id: Date.now().toString(),
        type: 'UPDATE',
        endpoint: `/files/${id}`,
        data: file,
        timestamp: Date.now(),
        retries: 0
      }),
      
      delete: (id: string) => executeOperation({
        id: Date.now().toString(),
        type: 'DELETE',
        endpoint: `/files/${id}`,
        timestamp: Date.now(),
        retries: 0
      })
    },

    // Analytics
    analytics: {
      track: (event: any) => executeOperation({
        id: Date.now().toString(),
        type: 'CREATE',
        endpoint: '/analytics/events',
        data: event,
        timestamp: Date.now(),
        retries: 0
      }),
      
      getMetrics: (params?: any) => executeOperation({
        id: Date.now().toString(),
        type: 'GET',
        endpoint: '/analytics/metrics',
        data: params,
        timestamp: Date.now(),
        retries: 0
      })
    },

    // Users
    users: {
      profile: () => executeOperation({
        id: Date.now().toString(),
        type: 'GET',
        endpoint: '/users/profile',
        timestamp: Date.now(),
        retries: 0
      }),
      
      updateProfile: (data: any) => executeOperation({
        id: Date.now().toString(),
        type: 'UPDATE',
        endpoint: '/users/profile',
        data,
        timestamp: Date.now(),
        retries: 0
      })
    }
  };

  // Conectar na inicialização
  useEffect(() => {
    abortController.current = new AbortController();
    
    const connect = async () => {
      const connected = await checkConnection();
      setState(prev => ({ ...prev, isConnected: connected }));
      
      if (connected && finalConfig.enableOfflineSync) {
        processQueue();
      }
    };

    connect();

    // Verificar conexão periodicamente
    const interval = setInterval(connect, 30000); // 30 segundos

    return () => {
      clearInterval(interval);
      abortController.current?.abort();
    };
  }, [checkConnection, processQueue, finalConfig.enableOfflineSync]);

  // Enfileirar operação para execução offline
  const queueOperation = useCallback((operation: Omit<ApiOperation, 'id' | 'timestamp' | 'retries'>) => {
    const fullOperation: ApiOperation = {
      ...operation,
      id: Date.now().toString(),
      timestamp: Date.now(),
      retries: 0
    };

    operationQueue.current.push(fullOperation);
    setState(prev => ({ ...prev, pendingOperations: operationQueue.current.length }));

    // Se conectado, processar imediatamente
    if (state.isConnected) {
      processQueue();
    }
  }, [state.isConnected, processQueue]);

  return {
    ...state,
    api,
    queueOperation,
    processQueue,
    checkConnection,
    config: finalConfig
  };
}; 