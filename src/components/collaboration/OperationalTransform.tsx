import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Merge, 
  GitBranch, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Users,
  ArrowRight,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useRealtime } from '@/hooks/useRealtime';

// Tipos para Operational Transform
export interface TextOperation {
  id: string;
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
  timestamp: number;
  userId: string;
  userName: string;
  documentVersion: number;
}

// Alias para compatibilidade com imports existentes
export type Operation = TextOperation;

export interface DocumentState {
  content: string;
  version: number;
  lastModified: Date;
  activeOperations: TextOperation[];
}

export interface ConflictInfo {
  id: string;
  operations: TextOperation[];
  type: 'concurrent_edit' | 'version_mismatch' | 'user_conflict';
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
  resolution?: 'manual' | 'auto_merge' | 'user_choice';
}

interface OperationalTransformProps {
  documentId: string;
  initialContent: string;
  currentUserId: string;
  onContentChange: (content: string, operation: TextOperation) => void;
  onConflictDetected: (conflict: ConflictInfo) => void;
  onConflictResolved: (conflictId: string, resolution: string) => void;
  className?: string;
}

// Hook para gerenciar Operational Transform
const useOperationalTransform = (
  documentId: string, 
  initialContent: string,
  currentUserId: string
) => {
  const [documentState, setDocumentState] = useState<DocumentState>({
    content: initialContent,
    version: 1,
    lastModified: new Date(),
    activeOperations: []
  });

  const [pendingOperations, setPendingOperations] = useState<TextOperation[]>([]);
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'conflict' | 'offline'>('synced');

  const operationQueue = useRef<TextOperation[]>([]);
  const lastAcknowledgedVersion = useRef(1);

  // Simular conexão WebSocket
  useEffect(() => {
    setIsConnected(true);
    console.log(`OT conectado ao documento ${documentId}`);

    // Simular recebimento de operações de outros usuários
    const simulateRemoteOperations = () => {
      const mockOperations: TextOperation[] = [
        {
          id: `op-${Date.now()}-1`,
          type: 'insert',
          position: Math.floor(Math.random() * documentState.content.length),
          content: ' [editado por outro usuário]',
          timestamp: Date.now(),
          userId: 'user-2',
          userName: 'Maria Silva',
          documentVersion: documentState.version + 1
        }
      ];

      // Simular conflito ocasional
      if (Math.random() < 0.1) { // 10% chance de conflito
        setTimeout(() => {
          handleRemoteOperations(mockOperations);
        }, Math.random() * 3000 + 1000);
      }
    };

    const interval = setInterval(simulateRemoteOperations, 10000);
    return () => { clearInterval(interval); };
  }, [documentId]);

  // Aplicar operação local
  const applyLocalOperation = useCallback((operation: TextOperation) => {
    setDocumentState(prev => {
      const newContent = applyOperationToText(prev.content, operation);
      const newState = {
        ...prev,
        content: newContent,
        version: prev.version + 1,
        lastModified: new Date(),
        activeOperations: [...prev.activeOperations, operation]
      };

      // Adicionar à fila de operações pendentes
      operationQueue.current.push(operation);
      setSyncStatus('syncing');

      // Simular envio para servidor
      setTimeout(() => {
        acknowledgePendingOperations([operation]);
      }, 100 + Math.random() * 500);

      return newState;
    });
  }, []);

  // Lidar com operações remotas
  const handleRemoteOperations = useCallback((operations: TextOperation[]) => {
    setDocumentState(prev => {
      let newContent = prev.content;
      let newVersion = prev.version;
      const newActiveOperations = [...prev.activeOperations];

      for (const operation of operations) {
        // Verificar conflitos
        const hasConflict = checkForConflicts(operation, prev.activeOperations);
        
        if (hasConflict) {
          const conflict: ConflictInfo = {
            id: `conflict-${Date.now()}`,
            operations: [operation, ...prev.activeOperations.slice(-3)],
            type: 'concurrent_edit',
            severity: 'medium',
            resolved: false
          };
          
          setConflicts(prevConflicts => [...prevConflicts, conflict]);
          setSyncStatus('conflict');
        } else {
          // Transformar operação baseada no estado atual
          const transformedOperation = transformOperation(operation, prev.activeOperations);
          newContent = applyOperationToText(newContent, transformedOperation);
          newActiveOperations.push(transformedOperation);
          newVersion = Math.max(newVersion, operation.documentVersion);
        }
      }

      return {
        ...prev,
        content: newContent,
        version: newVersion,
        activeOperations: newActiveOperations.slice(-10) // Manter apenas últimas 10
      };
    });
  }, []);

  // Reconhecer operações enviadas
  const acknowledgePendingOperations = useCallback((operations: TextOperation[]) => {
    setPendingOperations(prev => 
      prev.filter(pending => !operations.some(ack => ack.id === pending.id))
    );
    
    operationQueue.current = operationQueue.current.filter(
      pending => !operations.some(ack => ack.id === pending.id)
    );

    if (operationQueue.current.length === 0) {
      setSyncStatus('synced');
    }
  }, []);

  // Resolver conflito
  const resolveConflict = useCallback((conflictId: string, resolution: 'accept_local' | 'accept_remote' | 'merge') => {
    setConflicts(prev => 
      prev.map(conflict => 
        conflict.id === conflictId 
          ? { ...conflict, resolved: true, resolution: resolution === 'merge' ? 'auto_merge' : 'user_choice' }
          : conflict
      )
    );

    // Se não há mais conflitos não resolvidos, voltar ao estado synced
    const hasUnresolvedConflicts = conflicts.some(c => !c.resolved && c.id !== conflictId);
    if (!hasUnresolvedConflicts) {
      setSyncStatus('synced');
    }
  }, [conflicts]);

  return {
    documentState,
    pendingOperations,
    conflicts,
    isConnected,
    syncStatus,
    applyLocalOperation,
    handleRemoteOperations,
    resolveConflict
  };
};

// Aplicar operação ao texto
const applyOperationToText = (text: string, operation: TextOperation): string => {
  switch (operation.type) {
    case 'insert':
      return text.slice(0, operation.position) + 
             (operation.content || '') + 
             text.slice(operation.position);
    
    case 'delete':
      return text.slice(0, operation.position) + 
             text.slice(operation.position + (operation.length || 0));
    
    case 'retain':
      return text; // Operação de retenção não altera o texto
    
    default:
      return text;
  }
};

// Verificar conflitos entre operações
const checkForConflicts = (operation: TextOperation, activeOperations: TextOperation[]): boolean => {
  return activeOperations.some(active => {
    // Conflito se operações se sobrepõem
    const activeEnd = active.position + (active.length || active.content?.length ?? 0);
    const operationEnd = operation.position + (operation.length || operation.content?.length ?? 0);
    
    return (
      active.userId !== operation.userId &&
      operation.timestamp - active.timestamp < 5000 && // 5 segundos de janela
      (
        (operation.position >= active.position && operation.position <= activeEnd) ||
        (operationEnd >= active.position && operationEnd <= activeEnd)
      )
    );
  });
};

// Transformar operação baseada em operações concorrentes
const transformOperation = (operation: TextOperation, concurrentOps: TextOperation[]): TextOperation => {
  const transformedOp = { ...operation };
  
  // Ajustar posição baseado em operações anteriores
  for (const concurrentOp of concurrentOps) {
    if (concurrentOp.timestamp < operation.timestamp) {
      if (concurrentOp.type === 'insert' && concurrentOp.position <= transformedOp.position) {
        transformedOp.position += concurrentOp.content?.length ?? 0;
      } else if (concurrentOp.type === 'delete' && concurrentOp.position < transformedOp.position) {
        transformedOp.position -= concurrentOp.length || 0;
      }
    }
  }
  
  return transformedOp;
};

// Componente de status de sincronização
interface SyncStatusProps {
  status: 'synced' | 'syncing' | 'conflict' | 'offline';
  conflictsCount: number;
  pendingCount: number;
}

const SyncStatus: React.FC<SyncStatusProps> = ({ status, conflictsCount, pendingCount }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'synced':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-50 border-green-200',
          message: 'Sincronizado'
        };
      case 'syncing':
        return {
          icon: Clock,
          color: 'text-blue-600',
          bg: 'bg-blue-50 border-blue-200',
          message: `Sincronizando... (${pendingCount})`
        };
      case 'conflict':
        return {
          icon: AlertTriangle,
          color: 'text-orange-600',
          bg: 'bg-orange-50 border-orange-200',
          message: `${conflictsCount} conflito${conflictsCount > 1 ? 's' : ''}`
        };
      case 'offline':
        return {
          icon: AlertTriangle,
          color: 'text-red-600',
          bg: 'bg-red-50 border-red-200',
          message: 'Offline'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm border rounded-lg",
        config.bg
      )}
    >
      <Icon className={cn("h-4 w-4", config.color)} />
      <span className={cn("font-medium", config.color)}>
        {config.message}
      </span>
    </motion.div>
  );
};

// Componente principal
export const OperationalTransform: React.FC<OperationalTransformProps> = ({
  documentId,
  initialContent,
  currentUserId,
  onContentChange,
  onConflictDetected,
  onConflictResolved,
  className
}) => {
  const {
    documentState,
    pendingOperations,
    conflicts,
    isConnected,
    syncStatus,
    applyLocalOperation,
    handleRemoteOperations,
    resolveConflict
  } = useOperationalTransform(documentId, initialContent, currentUserId);

  const { user } = useAuth();
  const { subscribe, unsubscribe } = useRealtime();
  const contentRef = useRef(initialContent);
  const operationsRef = useRef<Operation[]>([]);
  const pendingOperationsRef = useRef<Operation[]>([]);

  // Notificar sobre mudanças de conteúdo
  useEffect(() => {
    const lastOperation = documentState.activeOperations[documentState.activeOperations.length - 1];
    if (lastOperation) {
      onContentChange(documentState.content, lastOperation);
    }
  }, [documentState.content, documentState.activeOperations, onContentChange]);

  // Notificar sobre conflitos
  useEffect(() => {
    const unresolvedConflicts = conflicts.filter(c => !c.resolved);
    if (unresolvedConflicts.length > 0) {
      const latestConflict = unresolvedConflicts[unresolvedConflicts.length - 1];
      onConflictDetected(latestConflict);
    }
  }, [conflicts, onConflictDetected]);

  const applyOperation = useCallback((operation: Operation, content: string): string => {
    if (operation.type === 'insert' && operation.text) {
      return (
        content.slice(0, operation.position) +
        operation.text +
        content.slice(operation.position)
      );
    } else if (operation.type === 'delete') {
      return (
        content.slice(0, operation.position) +
        content.slice(operation.position + 1)
      );
    }
    return content;
  }, []);

  const transformOperation = useCallback((
    op1: Operation,
    op2: Operation
  ): Operation => {
    if (op1.timestamp > op2.timestamp) {
      return op1;
    }

    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position < op2.position) {
        return op1;
      } else {
        return {
          ...op1,
          position: op1.position + (op2.text?.length ?? 0),
        };
      }
    } else if (op1.type === 'insert' && op2.type === 'delete') {
      if (op1.position <= op2.position) {
        return op1;
      } else {
        return {
          ...op1,
          position: op1.position - 1,
        };
      }
    } else if (op1.type === 'delete' && op2.type === 'insert') {
      if (op1.position < op2.position) {
        return op1;
      } else {
        return {
          ...op1,
          position: op1.position + (op2.text?.length ?? 0),
        };
      }
    } else if (op1.type === 'delete' && op2.type === 'delete') {
      if (op1.position < op2.position) {
        return op1;
      } else if (op1.position > op2.position) {
        return {
          ...op1,
          position: op1.position - 1,
        };
      } else {
        return {
          ...op1,
          type: 'delete',
          position: -1, // Marca como operação já aplicada
        };
      }
    }

    return op1;
  }, []);

  const handleLocalChange = useCallback((operation: Operation) => {
    if (!user) return;

    const newOperation: Operation = {
      ...operation,
      userId: user.id,
      timestamp: Date.now(),
    };

    // Aplicar operação localmente
    contentRef.current = applyOperation(newOperation, contentRef.current);
    onContentChange(contentRef.current, newOperation);

    // Adicionar à lista de operações pendentes
    pendingOperationsRef.current.push(newOperation);
  }, [user, applyOperation, onContentChange]);

  useEffect(() => {
    if (!user) return;

    const channel = subscribe(`operations:${documentId}`, {
      event: '*',
      schema: 'public',
      table: 'document_operations',
      filter: `document_id=eq.${documentId}`,
    }, (payload) => {
      if (payload.eventType === 'INSERT') {
        const operation = payload.new as Operation;
        if (operation.userId === user.id) return;

        // Transformar operação contra operações pendentes
        let transformedOperation = operation;
        pendingOperationsRef.current.forEach(pendingOp => {
          transformedOperation = transformOperation(transformedOperation, pendingOp);
        });

        // Aplicar operação transformada
        if (transformedOperation.position >= 0) {
          contentRef.current = applyOperation(transformedOperation, contentRef.current);
          onContentChange(contentRef.current, transformedOperation);
        }

        // Adicionar à lista de operações
        operationsRef.current.push(operation);
      }
    });

    return () => {
      unsubscribe(channel);
    };
  }, [documentId, user, subscribe, unsubscribe, applyOperation, transformOperation, onContentChange]);

  const insertText = useCallback((position: number, text: string) => {
    handleLocalChange({
      type: 'insert',
      position,
      text,
      timestamp: Date.now(),
      userId: user?.id || '',
    });
  }, [user, handleLocalChange]);

  const deleteText = useCallback((position: number) => {
    handleLocalChange({
      type: 'delete',
      position,
      timestamp: Date.now(),
      userId: user?.id || '',
    });
  }, [user, handleLocalChange]);

  return (
    <div className={cn("operational-transform", className)}>
      {/* Status de Sincronização */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
        <SyncStatus
          status={syncStatus}
          conflictsCount={conflicts.filter(c => !c.resolved).length}
          pendingCount={pendingOperations.length}
        />
      </div>

      {/* Conflitos Ativos */}
      <AnimatePresence>
        {conflicts.filter(c => !c.resolved).map((conflict) => (
          <motion.div
            key={conflict.id}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-16 left-1/2 transform -translate-x-1/2 z-40 max-w-md"
          >
            <div className="bg-white border border-orange-200 rounded-lg shadow-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Merge className="h-5 w-5 text-orange-600" />
                <h3 className="font-semibold text-gray-900">Conflito Detectado</h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Edições simultâneas detectadas. Como deseja resolver?
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    resolveConflict(conflict.id, 'accept_local');
                    onConflictResolved(conflict.id, 'accept_local');
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Manter Minha Versão
                </button>
                <button
                  onClick={() => {
                    resolveConflict(conflict.id, 'accept_remote');
                    onConflictResolved(conflict.id, 'accept_remote');
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Aceitar Remota
                </button>
                <button
                  onClick={() => {
                    resolveConflict(conflict.id, 'merge');
                    onConflictResolved(conflict.id, 'merge');
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                >
                  Mesclar
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Operações Recentes */}
      {documentState.activeOperations.length > 0 && (
        <div className="fixed bottom-4 right-4 z-30 max-w-sm">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Operações Recentes
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {documentState.activeOperations.slice(-5).map((op, index) => (
                <div key={op.id} className="flex items-center gap-2 text-xs text-gray-600">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    op.type === 'insert' ? 'bg-green-500' : 'bg-red-500'
                  )} />
                  <span className="truncate">
                    {op.userName} {op.type === 'insert' ? 'inseriu' : 'deletou'} 
                    {op.content && ` "${op.content.slice(0, 10)}..."`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationalTransform; 