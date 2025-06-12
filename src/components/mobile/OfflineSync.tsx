import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, 
  WifiOff, 
  CloudOff, 
  CloudCheck,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  Smartphone
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Tipos para sincronização offline
interface OfflineOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'note' | 'notebook' | 'comment';
  entityId: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'high' | 'medium' | 'low';
}

interface SyncStatus {
  isOnline: boolean;
  isConnected: boolean;
  isSyncing: boolean;
  lastSync: Date | null;
  pendingOperations: number;
  failedOperations: number;
  syncProgress: number;
}

interface CacheEntry {
  id: string;
  data: any;
  timestamp: number;
  expires: number;
  version: number;
}

interface OfflineSyncProps {
  onStatusChange?: (status: SyncStatus) => void;
  syncInterval?: number; // ms
  retryDelay?: number; // ms
  className?: string;
}

// Hook para detectar conectividade
const useConnectivity = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Tentar detectar tipo de conexão
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        setConnectionType(connection.effectiveType || 'unknown');
        
        const handleConnectionChange = () => {
          setConnectionType(connection.effectiveType || 'unknown');
        };
        
        connection.addEventListener('change', handleConnectionChange);
        
        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
          connection.removeEventListener('change', handleConnectionChange);
        };
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, connectionType };
};

// Hook para cache local
const useLocalCache = () => {
  const cache = useRef<Map<string, CacheEntry>>(new Map());

  const set = useCallback((key: string, data: any, ttl: number = 3600000) => { // 1 hora default
    const entry: CacheEntry = {
      id: key,
      data,
      timestamp: Date.now(),
      expires: Date.now() + ttl,
      version: 1
    };
    
    cache.current.set(key, entry);
    
    // Persistir no localStorage
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
    } catch (error) {
      console.warn('Cache persistence failed:', error);
    }
  }, []);

  const get = useCallback((key: string) => {
    let entry = cache.current.get(key);
    
    // Se não está em memória, tentar carregar do localStorage
    if (!entry) {
      try {
        const stored = localStorage.getItem(`cache_${key}`);
        if (stored) {
          entry = JSON.parse(stored);
          if (entry && entry.expires > Date.now()) {
            cache.current.set(key, entry);
          } else {
            localStorage.removeItem(`cache_${key}`);
            return null;
          }
        }
      } catch (error) {
        console.warn('Cache retrieval failed:', error);
        return null;
      }
    }

    // Verificar se não expirou
    if (entry && entry.expires > Date.now()) {
      return entry.data;
    } else {
      cache.current.delete(key);
      localStorage.removeItem(`cache_${key}`);
      return null;
    }
  }, []);

  const remove = useCallback((key: string) => {
    cache.current.delete(key);
    localStorage.removeItem(`cache_${key}`);
  }, []);

  const clear = useCallback(() => {
    cache.current.clear();
    
    // Limpar cache do localStorage
    const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
    keys.forEach(key => localStorage.removeItem(key));
  }, []);

  const size = cache.current.size;

  return { set, get, remove, clear, size };
};

// Hook para fila de operações offline
const useOperationQueue = () => {
  const [operations, setOperations] = useState<OfflineOperation[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Carregar operações do localStorage na inicialização
  useEffect(() => {
    try {
      const stored = localStorage.getItem('offline_operations');
      if (stored) {
        const ops = JSON.parse(stored);
        setOperations(ops);
      }
    } catch (error) {
      console.warn('Failed to load offline operations:', error);
    }
  }, []);

  // Persistir operações no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('offline_operations', JSON.stringify(operations));
    } catch (error) {
      console.warn('Failed to persist offline operations:', error);
    }
  }, [operations]);

  const addOperation = useCallback((operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'>) => {
    const newOperation: OfflineOperation = {
      ...operation,
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0
    };

    setOperations(prev => [...prev, newOperation]);
    return newOperation.id;
  }, []);

  const removeOperation = useCallback((operationId: string) => {
    setOperations(prev => prev.filter(op => op.id !== operationId));
  }, []);

  const retryOperation = useCallback((operationId: string) => {
    setOperations(prev => prev.map(op => 
      op.id === operationId 
        ? { ...op, retryCount: op.retryCount + 1 }
        : op
    ));
  }, []);

  const clearQueue = useCallback(() => {
    setOperations([]);
    localStorage.removeItem('offline_operations');
  }, []);

  return {
    operations,
    isProcessing,
    setIsProcessing,
    addOperation,
    removeOperation,
    retryOperation,
    clearQueue
  };
};

// Componente de status de sincronização
interface SyncStatusIndicatorProps {
  status: SyncStatus;
  connectionType: string;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ status, connectionType }) => {
  const getStatusConfig = () => {
    if (!status.isOnline) {
      return {
        icon: WifiOff,
        color: 'text-red-500',
        bg: 'bg-red-50 border-red-200',
        message: 'Offline',
        description: 'Suas alterações serão sincronizadas quando voltar online'
      };
    }

    if (status.isSyncing) {
      return {
        icon: RefreshCw,
        color: 'text-blue-500',
        bg: 'bg-blue-50 border-blue-200',
        message: 'Sincronizando...',
        description: `${status.syncProgress}% concluído`
      };
    }

    if (status.pendingOperations > 0) {
      return {
        icon: Clock,
        color: 'text-orange-500',
        bg: 'bg-orange-50 border-orange-200',
        message: `${status.pendingOperations} pendente${status.pendingOperations > 1 ? 's' : ''}`,
        description: 'Operações aguardando sincronização'
      };
    }

    if (status.failedOperations > 0) {
      return {
        icon: AlertCircle,
        color: 'text-red-500',
        bg: 'bg-red-50 border-red-200',
        message: `${status.failedOperations} falha${status.failedOperations > 1 ? 's' : ''}`,
        description: 'Algumas operações falharam'
      };
    }

    return {
      icon: CloudCheck,
      color: 'text-green-500',
      bg: 'bg-green-50 border-green-200',
      message: 'Sincronizado',
      description: status.lastSync 
        ? `Última sync: ${status.lastSync.toLocaleTimeString('pt-BR')}`
        : 'Todos os dados estão atualizados'
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-3 p-3 border rounded-lg",
        config.bg
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", config.color)} />
        <div className="flex items-center gap-2">
          {status.isOnline ? (
            <Wifi className="h-3 w-3 text-green-500" />
          ) : (
            <WifiOff className="h-3 w-3 text-red-500" />
          )}
          <span className="text-xs text-gray-500 uppercase tracking-wide">
            {connectionType}
          </span>
        </div>
      </div>
      
      <div className="flex-1">
        <div className={cn("font-medium text-sm", config.color)}>
          {config.message}
        </div>
        <div className="text-xs text-gray-600">
          {config.description}
        </div>
      </div>
    </motion.div>
  );
};

// Componente de operações pendentes
interface PendingOperationsProps {
  operations: OfflineOperation[];
  onRetry: (operationId: string) => void;
  onRemove: (operationId: string) => void;
}

const PendingOperations: React.FC<PendingOperationsProps> = ({ operations, onRetry, onRemove }) => {
  if (operations.length === 0) return null;

  const getOperationIcon = (type: string, entity: string) => {
    if (type === 'create') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (type === 'update') return <RefreshCw className="h-4 w-4 text-blue-500" />;
    if (type === 'delete') return <AlertCircle className="h-4 w-4 text-red-500" />;
    return <Database className="h-4 w-4 text-gray-500" />;
  };

  const getOperationLabel = (type: string, entity: string) => {
    const entityLabels = {
      note: 'nota',
      notebook: 'notebook',
      comment: 'comentário'
    };
    
    const typeLabels = {
      create: 'Criar',
      update: 'Atualizar',
      delete: 'Excluir'
    };

    return `${typeLabels[type as keyof typeof typeLabels]} ${entityLabels[entity as keyof typeof entityLabels]}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-white border border-gray-200 rounded-lg p-4"
    >
      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Operações Pendentes ({operations.length})
      </h3>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {operations.map((operation, index) => (
          <motion.div
            key={operation.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "flex items-center justify-between p-3 border rounded-lg",
              operation.retryCount > 0 ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"
            )}
          >
            <div className="flex items-center gap-3">
              {getOperationIcon(operation.type, operation.entity)}
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {getOperationLabel(operation.type, operation.entity)}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(operation.timestamp).toLocaleTimeString('pt-BR')}
                  {operation.retryCount > 0 && (
                    <span className="ml-2 text-red-600">
                      • {operation.retryCount} tentativa{operation.retryCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onRetry(operation.id)}
                className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                title="Tentar novamente"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
              <button
                onClick={() => onRemove(operation.id)}
                className="p-1 text-red-600 hover:text-red-800 transition-colors"
                title="Remover"
              >
                <AlertCircle className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// Componente principal
export const OfflineSync: React.FC<OfflineSyncProps> = ({
  onStatusChange,
  syncInterval = 30000, // 30 segundos
  retryDelay = 5000, // 5 segundos
  className
}) => {
  const { isOnline, connectionType } = useConnectivity();
  const cache = useLocalCache();
  const { operations, isProcessing, setIsProcessing, addOperation, removeOperation, retryOperation, clearQueue } = useOperationQueue();
  
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline,
    isConnected: isOnline,
    isSyncing: false,
    lastSync: null,
    pendingOperations: 0,
    failedOperations: 0,
    syncProgress: 0
  });

  const [showDetails, setShowDetails] = useState(false);
  const syncIntervalRef = useRef<NodeJS.Timeout>();

  // Atualizar status
  useEffect(() => {
    const failedOps = operations.filter(op => op.retryCount >= op.maxRetries).length;
    
    const newStatus: SyncStatus = {
      isOnline,
      isConnected: isOnline,
      isSyncing: isProcessing,
      lastSync: syncStatus.lastSync,
      pendingOperations: operations.length - failedOps,
      failedOperations: failedOps,
      syncProgress: syncStatus.syncProgress
    };

    setSyncStatus(newStatus);
    onStatusChange?.(newStatus);
  }, [isOnline, isProcessing, operations, onStatusChange]);

  // Processar fila de operações
  const processQueue = useCallback(async () => {
    if (!isOnline || isProcessing || operations.length === 0) return;

    setIsProcessing(true);
    setSyncStatus(prev => ({ ...prev, isSyncing: true, syncProgress: 0 }));

    const totalOperations = operations.length;
    let processedCount = 0;

    for (const operation of operations) {
      try {
        // Simular API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simular possível falha
        if (Math.random() < 0.1 && operation.retryCount < 2) { // 10% chance de falha nas primeiras tentativas
          throw new Error('Network error');
        }

        // Operação bem-sucedida
        removeOperation(operation.id);
        console.log(`Operation ${operation.id} completed successfully`);
        
      } catch (error) {
        console.warn(`Operation ${operation.id} failed:`, error);
        
        if (operation.retryCount < operation.maxRetries) {
          retryOperation(operation.id);
          // Reagendar tentativa
          setTimeout(() => {
            if (isOnline) {
              processQueue();
            }
          }, retryDelay * (operation.retryCount + 1)); // Backoff exponencial
        } else {
          console.error(`Operation ${operation.id} failed permanently`);
        }
      }

      processedCount++;
      setSyncStatus(prev => ({ 
        ...prev, 
        syncProgress: Math.round((processedCount / totalOperations) * 100) 
      }));
    }

    setIsProcessing(false);
    setSyncStatus(prev => ({ 
      ...prev, 
      isSyncing: false, 
      lastSync: new Date(),
      syncProgress: 100
    }));

    // Reset progress após um tempo
    setTimeout(() => {
      setSyncStatus(prev => ({ ...prev, syncProgress: 0 }));
    }, 2000);
  }, [isOnline, isProcessing, operations, removeOperation, retryOperation, retryDelay]);

  // Sincronização automática
  useEffect(() => {
    if (isOnline && operations.length > 0) {
      processQueue();
    }

    // Configurar intervalo de sincronização
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }

    if (isOnline) {
      syncIntervalRef.current = setInterval(() => {
        if (operations.length > 0) {
          processQueue();
        }
      }, syncInterval);
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [isOnline, operations.length, processQueue, syncInterval]);

  // API pública para adicionar operações
  const queueOperation = useCallback((
    type: OfflineOperation['type'],
    entity: OfflineOperation['entity'],
    entityId: string,
    data: any,
    priority: OfflineOperation['priority'] = 'medium'
  ) => {
    return addOperation({
      type,
      entity,
      entityId,
      data,
      priority,
      maxRetries: 3
    });
  }, [addOperation]);

  // Força sincronização manual
  const forceSync = useCallback(() => {
    if (isOnline && !isProcessing) {
      processQueue();
    }
  }, [isOnline, isProcessing, processQueue]);

  return (
    <div className={cn("offline-sync", className)}>
      {/* Status indicator */}
      <SyncStatusIndicator 
        status={syncStatus} 
        connectionType={connectionType}
      />

      {/* Botões de ação */}
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-2 px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Database className="h-4 w-4" />
          Detalhes ({operations.length})
        </button>
        
        <button
          onClick={forceSync}
          disabled={!isOnline || isProcessing || operations.length === 0}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={cn("h-4 w-4", isProcessing && "animate-spin")} />
          Sincronizar
        </button>

        {operations.length > 0 && (
          <button
            onClick={clearQueue}
            className="flex items-center gap-2 px-3 py-1 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
          >
            <AlertCircle className="h-4 w-4" />
            Limpar Fila
          </button>
        )}
      </div>

      {/* Detalhes das operações */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            <PendingOperations
              operations={operations}
              onRetry={retryOperation}
              onRemove={removeOperation}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Informações de cache */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Cache local:</span>
          <div className="flex items-center gap-4">
            <span className="text-gray-900">{cache.size} itens</span>
            <button
              onClick={cache.clear}
              className="text-red-600 hover:text-red-800 transition-colors"
            >
              Limpar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook para usar o sistema de sync em outros componentes
export const useOfflineSync = () => {
  const [syncManager, setSyncManager] = useState<{
    queueOperation: (type: any, entity: any, entityId: string, data: any, priority?: any) => string;
    forceSync: () => void;
    cache: any;
  } | null>(null);

  return syncManager;
};

export default OfflineSync; 