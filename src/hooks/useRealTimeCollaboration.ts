import { useState, useEffect, useCallback, useRef } from 'react';
import RealTimeCollaborationEngine from '@/services/RealTimeCollaborationEngine';
import type {
  CollaborationState,
  CollaborativeUser,
  CursorPosition,
  SelectionRange,
  OperationalConflict,
  OperationalTransform
} from '@/types/common';

interface UseRealTimeCollaborationReturn {
  // Estado da colaboração
  collaborationState: CollaborationState;
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
  isConnected: boolean;
  
  // Usuários ativos
  activeUsers: CollaborativeUser[];
  currentUser: CollaborativeUser | null;
  
  // Cursors e seleções
  cursors: Record<string, CursorPosition>;
  selections: Record<string, SelectionRange>;
  
  // Conflitos
  conflicts: OperationalConflict[];
  hasConflicts: boolean;
  
  // Métricas
  metrics: {
    latency: number;
    operationsPerSecond: number;
    conflictRate: number;
    syncEfficiency: number;
  };
  
  // Ações
  connect: () => Promise<void>;
  disconnect: () => void;
  
  // Operações
  insertText: (position: number, text: string) => void;
  deleteText: (position: number, length: number) => void;
  updateCursor: (line: number, column: number) => void;
  updateSelection: (start: { line: number; column: number }, end: { line: number; column: number }) => void;
  
  // Comentários
  addComment: (position: { line: number; column: number }, content: string) => void;
  
  // Resolução de conflitos
  resolveConflict: (conflictId: string, resolution: 'accept_local' | 'accept_remote' | 'merge') => void;
  
  // Configuração
  configure: (config: CollaborationConfig) => void;
}

interface CollaborationConfig {
  autoResolveConflicts?: boolean;
  enablePresence?: boolean;
  enableCursors?: boolean;
  enableSelections?: boolean;
  conflictResolutionStrategy?: 'manual' | 'automatic' | 'last_writer_wins';
}

export function useRealTimeCollaboration(
  userId: string,
  documentId: string,
  userInfo: { name: string; avatar?: string; color?: string },
  initialConfig: CollaborationConfig = {}
): UseRealTimeCollaborationReturn {
  // Estado
  const [collaborationState, setCollaborationState] = useState<CollaborationState>({
    activeUsers: [],
    cursors: {},
    selections: {},
    conflicts: [],
    operationQueue: []
  });
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>('disconnected');
  const [currentUser, setCurrentUser] = useState<CollaborativeUser | null>(null);
  const [metrics, setMetrics] = useState({
    latency: 0,
    operationsPerSecond: 0,
    conflictRate: 0,
    syncEfficiency: 100
  });
  
  // Refs
  const engineRef = useRef<RealTimeCollaborationEngine | null>(null);
  const configRef = useRef<CollaborationConfig>({
    autoResolveConflicts: true,
    enablePresence: true,
    enableCursors: true,
    enableSelections: true,
    conflictResolutionStrategy: 'automatic',
    ...initialConfig
  });
  const operationCountRef = useRef(0);
  const latencyTimestampsRef = useRef<Map<string, number>>(new Map());
  
  // Estados derivados
  const isConnected = connectionState === 'connected';
  const activeUsers = collaborationState.activeUsers;
  const cursors = collaborationState.cursors;
  const selections = collaborationState.selections;
  const conflicts = collaborationState.conflicts;
  const hasConflicts = conflicts.length > 0;
  
  // Inicializar engine
  useEffect(() => {
    engineRef.current = RealTimeCollaborationEngine.getInstance();
    
    // Configurar user atual
    setCurrentUser({
      id: userId,
      name: userInfo.name,
      avatar: userInfo.avatar,
      color: userInfo.color || '#3B82F6',
      lastActivity: Date.now(),
      isTyping: false,
      currentDocument: documentId
    });
    
    return () => {
      if (engineRef.current) {
        engineRef.current.disconnect();
      }
    };
  }, [userId, documentId, userInfo]);
  
  // Setup callbacks quando engine estiver pronto
  useEffect(() => {
    if (!engineRef.current) return;
    
    // Callback para mudanças de estado
    const unsubscribeStateChange = engineRef.current.onStateChange((newState) => {
      setCollaborationState(newState);
      updateMetrics(newState);
    });
    
    // Callback para mudanças de conexão
    const unsubscribeConnectionChange = engineRef.current.onConnectionChange((newConnectionState) => {
      setConnectionState(newConnectionState as any);
    });
    
    // Callback para conflitos
    const unsubscribeConflict = engineRef.current.onConflict((conflict) => {
      console.warn('🚨 Conflito detectado:', conflict);
      
      // Auto-resolver se configurado
      if (configRef.current.autoResolveConflicts) {
        setTimeout(() => {
          resolveConflict(conflict.id, 'merge');
        }, 1000);
      }
    });
    
    return () => {
      unsubscribeStateChange();
      unsubscribeConnectionChange();
      unsubscribeConflict();
    };
  }, []);
  
  // Conectar ao servidor
  const connect = useCallback(async () => {
    if (!engineRef.current || connectionState !== 'disconnected') return;
    
    try {
      await engineRef.current.connect(userId, documentId);
    } catch (error) {
      console.error('Erro ao conectar colaboração:', error);
    }
  }, [userId, documentId, connectionState]);
  
  // Desconectar
  const disconnect = useCallback(() => {
    if (!engineRef.current) return;
    
    engineRef.current.disconnect();
  }, []);
  
  // Inserir texto
  const insertText = useCallback((position: number, text: string) => {
    if (!engineRef.current || !isConnected) return;
    
    const operation: Omit<OperationalTransform, 'id' | 'timestamp' | 'applied'> = {
      type: 'insert',
      position,
      content: text,
      userId
    };
    
    // Registrar timestamp para medir latência
    const operationId = `${Date.now()}_${Math.random()}`;
    latencyTimestampsRef.current.set(operationId, Date.now());
    
    engineRef.current.applyOperation(operation);
    operationCountRef.current++;
  }, [userId, isConnected]);
  
  // Deletar texto
  const deleteText = useCallback((position: number, length: number) => {
    if (!engineRef.current || !isConnected) return;
    
    const operation: Omit<OperationalTransform, 'id' | 'timestamp' | 'applied'> = {
      type: 'delete',
      position,
      length,
      userId
    };
    
    engineRef.current.applyOperation(operation);
    operationCountRef.current++;
  }, [userId, isConnected]);
  
  // Atualizar cursor
  const updateCursor = useCallback((line: number, column: number) => {
    if (!engineRef.current || !isConnected || !configRef.current.enableCursors) return;
    
    engineRef.current.updateCursor(userId, { line, column });
  }, [userId, isConnected]);
  
  // Atualizar seleção
  const updateSelection = useCallback((
    start: { line: number; column: number },
    end: { line: number; column: number }
  ) => {
    if (!engineRef.current || !isConnected || !configRef.current.enableSelections) return;
    
    engineRef.current.updateSelection(userId, { start, end });
  }, [userId, isConnected]);
  
  // Adicionar comentário
  const addComment = useCallback((
    position: { line: number; column: number },
    content: string
  ) => {
    if (!engineRef.current || !isConnected) return;
    
    engineRef.current.addComment(userId, position, content);
  }, [userId, isConnected]);
  
  // Resolver conflito
  const resolveConflict = useCallback((
    conflictId: string,
    resolution: 'accept_local' | 'accept_remote' | 'merge'
  ) => {
    if (!engineRef.current) return;
    
    engineRef.current.resolveConflict(conflictId, resolution);
    
    // Atualizar métricas de conflito
    setMetrics(prev => ({
      ...prev,
      conflictRate: Math.max(0, prev.conflictRate - 5)
    }));
  }, []);
  
  // Configurar colaboração
  const configure = useCallback((config: CollaborationConfig) => {
    configRef.current = { ...configRef.current, ...config };
  }, []);
  
  // Atualizar métricas
  const updateMetrics = useCallback((state: CollaborationState) => {
    // Calcular operações por segundo
    const now = Date.now();
    const opsPerSecond = operationCountRef.current / ((now - (window as any).appStartTime || now) / 1000);
    
    // Calcular taxa de conflito
    const conflictRate = state.conflicts.length > 0 ? 
      (state.conflicts.length / Math.max(1, state.operationQueue.length)) * 100 : 0;
    
    // Calcular eficiência de sincronização
    const appliedOps = state.operationQueue.filter(op => op.applied).length;
    const syncEfficiency = state.operationQueue.length > 0 ? 
      (appliedOps / state.operationQueue.length) * 100 : 100;
    
    setMetrics(prev => ({
      ...prev,
      operationsPerSecond: Math.round(opsPerSecond * 10) / 10,
      conflictRate: Math.round(conflictRate * 10) / 10,
      syncEfficiency: Math.round(syncEfficiency * 10) / 10
    }));
  }, []);
  
  // Auto-conectar quando componente monta
  useEffect(() => {
    if (connectionState === 'disconnected') {
      connect();
    }
  }, [connect, connectionState]);
  
  // Simular latência
  useEffect(() => {
    const interval = setInterval(() => {
      // Simular latência baseada na conexão
      const simulatedLatency = connectionState === 'connected' ? 
        Math.random() * 50 + 20 : // 20-70ms quando conectado
        0;
      
      setMetrics(prev => ({
        ...prev,
        latency: Math.round(simulatedLatency)
      }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [connectionState]);
  
  // Monitor de atividade do usuário (typing indicator)
  useEffect(() => {
    let typingTimeout: NodeJS.Timeout;
    
    const handleTyping = () => {
      if (currentUser) {
        // Marcar como digitando
        setCurrentUser(prev => prev ? { ...prev, isTyping: true } : null);
        
        // Limpar timeout anterior
        clearTimeout(typingTimeout);
        
        // Definir novo timeout para parar de digitar
        typingTimeout = setTimeout(() => {
          setCurrentUser(prev => prev ? { ...prev, isTyping: false } : null);
        }, 2000);
      }
    };
    
    // Escutar eventos de digitação
    document.addEventListener('keydown', handleTyping);
    
    return () => {
      document.removeEventListener('keydown', handleTyping);
      clearTimeout(typingTimeout);
    };
  }, [currentUser]);
  
  // Cleanup na desmontagem
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);
  
  return {
    // Estado
    collaborationState,
    connectionState,
    isConnected,
    
    // Usuários
    activeUsers,
    currentUser,
    
    // Cursors e seleções
    cursors,
    selections,
    
    // Conflitos
    conflicts,
    hasConflicts,
    
    // Métricas
    metrics,
    
    // Ações
    connect,
    disconnect,
    
    // Operações
    insertText,
    deleteText,
    updateCursor,
    updateSelection,
    
    // Comentários
    addComment,
    
    // Conflitos
    resolveConflict,
    
    // Configuração
    configure
  };
} 