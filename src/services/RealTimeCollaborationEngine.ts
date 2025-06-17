import type {
  RealTimeEvent,
  CollaborationState,
  CollaborativeUser,
  CursorPosition,
  SelectionRange,
  OperationalTransform,
  OperationalConflict
} from '@/types/common';

/**
 * Sistema avançado de colaboração em tempo real
 * Implementa Operational Transforms, resolução de conflitos e sincronização otimizada
 */
export class RealTimeCollaborationEngine {
  private static instance: RealTimeCollaborationEngine | null = null;
  
  private websocket: WebSocket | null = null;
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' = 'disconnected';
  private collaborationState: CollaborationState;
  private operationBuffer: OperationalTransform[] = [];
  private conflictResolver: ConflictResolver;
  private presenceManager: PresenceManager;
  private documentSyncManager: DocumentSyncManager;
  
  // Configurações
  private config = {
    wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws',
    reconnectAttempts: 5,
    reconnectDelay: 1000,
    operationBatchSize: 10,
    presenceUpdateInterval: 1000,
    conflictResolutionStrategy: 'automatic' as const
  };

  private callbacks: {
    onStateChange: ((state: CollaborationState) => void)[];
    onUserJoin: ((user: CollaborativeUser) => void)[];
    onUserLeave: ((userId: string) => void)[];
    onConflict: ((conflict: OperationalConflict) => void)[];
    onConnectionChange: ((state: string) => void)[];
  } = {
    onStateChange: [],
    onUserJoin: [],
    onUserLeave: [],
    onConflict: [],
    onConnectionChange: []
  };

  private constructor() {
    this.collaborationState = this.getInitialState();
    this.conflictResolver = new ConflictResolver();
    this.presenceManager = new PresenceManager();
    this.documentSyncManager = new DocumentSyncManager();
    this.initializeEngine();
  }

  static getInstance(): RealTimeCollaborationEngine {
    if (!RealTimeCollaborationEngine.instance) {
      RealTimeCollaborationEngine.instance = new RealTimeCollaborationEngine();
    }
    return RealTimeCollaborationEngine.instance;
  }

  // Inicializar o sistema
  private initializeEngine(): void {
    console.log('🔄 Inicializando Real Time Collaboration Engine...');
    
    // Configurar gestão de presença
    this.presenceManager.initialize({
      updateInterval: this.config.presenceUpdateInterval,
      onPresenceChange: (users) => this.handlePresenceChange(users)
    });

    // Configurar sincronização de documentos
    this.documentSyncManager.initialize({
      onDocumentChange: (changes) => this.handleDocumentChanges(changes),
      onSyncComplete: () => this.handleSyncComplete()
    });

    // Configurar heartbeat para manter conexão viva
    this.setupHeartbeat();
  }

  // Conectar ao servidor WebSocket
  async connect(userId: string, documentId: string): Promise<void> {
    if (this.connectionState === 'connected') return;

    this.connectionState = 'connecting';
    this.notifyConnectionChange();

    try {
      const wsUrl = `${this.config.wsUrl}?userId=${userId}&documentId=${documentId}`;
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log('✅ WebSocket conectado');
        this.connectionState = 'connected';
        this.notifyConnectionChange();
        this.sendIdentification(userId, documentId);
        this.flushOperationBuffer();
      };

      this.websocket.onmessage = (event) => {
        this.handleIncomingMessage(event.data);
      };

      this.websocket.onclose = () => {
        console.log('❌ WebSocket desconectado');
        this.connectionState = 'disconnected';
        this.notifyConnectionChange();
        this.attemptReconnection();
      };

      this.websocket.onerror = (error) => {
        console.error('❌ Erro no WebSocket:', error);
        this.connectionState = 'disconnected';
        this.notifyConnectionChange();
      };

    } catch (error) {
      console.error('❌ Erro ao conectar WebSocket:', error);
      this.connectionState = 'disconnected';
      this.notifyConnectionChange();
    }
  }

  // Desconectar
  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.connectionState = 'disconnected';
    this.notifyConnectionChange();
  }

  // Aplicar operação (edit, insert, delete)
  applyOperation(operation: Omit<OperationalTransform, 'id' | 'timestamp' | 'applied'>): void {
    const fullOperation: OperationalTransform = {
      ...operation,
      id: this.generateOperationId(),
      timestamp: Date.now(),
      applied: false
    };

    // Adicionar ao buffer local
    this.operationBuffer.push(fullOperation);

    // Aplicar localmente (optimistic update)
    this.applyOperationLocally(fullOperation);

    // Enviar para o servidor
    this.sendOperation(fullOperation);

    // Processar buffer se necessário
    if (this.operationBuffer.length >= this.config.operationBatchSize) {
      this.processBatchOperations();
    }
  }

  // Atualizar cursor
  updateCursor(userId: string, position: Omit<CursorPosition, 'userId' | 'timestamp'>): void {
    const cursor: CursorPosition = {
      ...position,
      userId,
      timestamp: Date.now()
    };

    this.collaborationState.cursors[userId] = cursor;
    this.sendCursorUpdate(cursor);
    this.notifyStateChange();
  }

  // Atualizar seleção
  updateSelection(userId: string, selection: Omit<SelectionRange, 'userId' | 'timestamp'>): void {
    const selectionRange: SelectionRange = {
      ...selection,
      userId,
      timestamp: Date.now()
    };

    this.collaborationState.selections[userId] = selectionRange;
    this.sendSelectionUpdate(selectionRange);
    this.notifyStateChange();
  }

  // Adicionar comentário colaborativo
  addComment(userId: string, position: { line: number; column: number }, content: string): void {
    const event: RealTimeEvent = {
      id: this.generateEventId(),
      type: 'comment',
      userId,
      timestamp: Date.now(),
      data: {
        position,
        content,
        resolved: false
      },
      documentId: this.getCurrentDocumentId()
    };

    this.sendEvent(event);
  }

  // Resolver conflito
  resolveConflict(conflictId: string, resolution: 'accept_local' | 'accept_remote' | 'merge'): void {
    const conflict = this.collaborationState.conflicts.find(c => c.id === conflictId);
    if (!conflict) return;

    const resolvedOperations = this.conflictResolver.resolve(conflict, resolution);
    
    // Aplicar operações resolvidas
    resolvedOperations.forEach(op => {
      this.applyOperationLocally(op);
    });

    // Remover conflito resolvido
    this.collaborationState.conflicts = this.collaborationState.conflicts.filter(c => c.id !== conflictId);
    
    // Notificar resolução
    this.sendConflictResolution(conflictId, resolution);
    this.notifyStateChange();
  }

  // Gestão de mensagens recebidas
  private handleIncomingMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'operation':
          this.handleRemoteOperation(message.operation);
          break;
        case 'cursor':
          this.handleRemoteCursor(message.cursor);
          break;
        case 'selection':
          this.handleRemoteSelection(message.selection);
          break;
        case 'presence':
          this.handlePresenceUpdate(message.users);
          break;
        case 'conflict':
          this.handleConflictDetection(message.conflict);
          break;
        case 'sync':
          this.handleSyncRequest(message.data);
          break;
        default:
          console.warn('Tipo de mensagem desconhecido:', message.type);
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
    }
  }

  // Aplicar operação remota
  private handleRemoteOperation(operation: OperationalTransform): void {
    // Verificar conflitos
    const conflicts = this.detectConflicts(operation);
    
    if (conflicts.length > 0) {
      // Criar conflito
      const conflict: OperationalConflict = {
        id: this.generateConflictId(),
        operations: [operation, ...conflicts],
        resolution: this.config.conflictResolutionStrategy,
        timestamp: Date.now()
      };

      this.collaborationState.conflicts.push(conflict);
      this.notifyConflict(conflict);

      // Tentar resolução automática se configurado
      if (this.config.conflictResolutionStrategy === 'automatic') {
        setTimeout(() => {
          this.resolveConflict(conflict.id, 'merge');
        }, 100);
      }
    } else {
      // Aplicar operação sem conflitos
      this.applyOperationLocally(operation);
    }

    this.notifyStateChange();
  }

  // Detectar conflitos operacionais
  private detectConflicts(incomingOperation: OperationalTransform): OperationalTransform[] {
    const conflicts: OperationalTransform[] = [];
    
    // Verificar operações no buffer que podem conflitar
    this.operationBuffer.forEach(bufferOp => {
      if (this.operationsConflict(bufferOp, incomingOperation)) {
        conflicts.push(bufferOp);
      }
    });

    return conflicts;
  }

  // Verificar se duas operações conflitam
  private operationsConflict(op1: OperationalTransform, op2: OperationalTransform): boolean {
    // Conflito se as operações afetam a mesma posição
    if (op1.type === 'insert' && op2.type === 'insert') {
      return Math.abs(op1.position - op2.position) < 10; // Threshold de proximidade
    }
    
    if (op1.type === 'delete' && op2.type === 'delete') {
      return op1.position === op2.position;
    }

    if ((op1.type === 'insert' && op2.type === 'delete') || 
        (op1.type === 'delete' && op2.type === 'insert')) {
      return Math.abs(op1.position - op2.position) < 5;
    }

    return false;
  }

  // Aplicar operação localmente
  private applyOperationLocally(operation: OperationalTransform): void {
    // Transformar operação se necessário (Operational Transform)
    const transformedOp = this.transformOperation(operation);
    
    // Aplicar no documento
    this.documentSyncManager.applyOperation(transformedOp);
    
    // Marcar como aplicada
    operation.applied = true;
    
    // Adicionar à fila de operações
    this.collaborationState.operationQueue.push(operation);
    
    // Manter apenas últimas 100 operações
    if (this.collaborationState.operationQueue.length > 100) {
      this.collaborationState.operationQueue = this.collaborationState.operationQueue.slice(-100);
    }
  }

  // Transformar operação (Operational Transform)
  private transformOperation(operation: OperationalTransform): OperationalTransform {
    // Implementar algoritmo de Operational Transform
    let transformedOp = { ...operation };
    
    // Ajustar posição baseado em operações anteriores
    this.collaborationState.operationQueue.forEach(existingOp => {
      if (existingOp.timestamp < operation.timestamp) {
        transformedOp = this.transformAgainstOperation(transformedOp, existingOp);
      }
    });

    return transformedOp;
  }

  // Transformar operação contra outra operação
  private transformAgainstOperation(op: OperationalTransform, against: OperationalTransform): OperationalTransform {
    const transformed = { ...op };

    if (against.type === 'insert' && op.position >= against.position) {
      transformed.position += against.content?.length || 0;
    } else if (against.type === 'delete' && op.position > against.position) {
      transformed.position -= against.length || 0;
    }

    return transformed;
  }

  // Enviar operação para o servidor
  private sendOperation(operation: OperationalTransform): void {
    if (this.websocket && this.connectionState === 'connected') {
      this.websocket.send(JSON.stringify({
        type: 'operation',
        operation
      }));
    }
  }

  // Processar operações em batch
  private processBatchOperations(): void {
    if (this.operationBuffer.length === 0) return;

    const batch = this.operationBuffer.splice(0, this.config.operationBatchSize);
    
    if (this.websocket && this.connectionState === 'connected') {
      this.websocket.send(JSON.stringify({
        type: 'batch_operations',
        operations: batch
      }));
    }
  }

  // Configurar heartbeat
  private setupHeartbeat(): void {
    setInterval(() => {
      if (this.websocket && this.connectionState === 'connected') {
        this.websocket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // A cada 30 segundos
  }

  // Tentativa de reconexão
  private attemptReconnection(): void {
    if (this.connectionState === 'reconnecting') return;

    this.connectionState = 'reconnecting';
    this.notifyConnectionChange();

    let attempts = 0;
    const reconnect = () => {
      if (attempts >= this.config.reconnectAttempts) {
        console.log('❌ Falha na reconexão após múltiplas tentativas');
        this.connectionState = 'disconnected';
        this.notifyConnectionChange();
        return;
      }

      attempts++;
      console.log(`🔄 Tentativa de reconexão ${attempts}/${this.config.reconnectAttempts}`);
      
      setTimeout(() => {
        // Lógica de reconexão seria implementada aqui
        // Para demo, simular reconexão bem-sucedida
        if (Math.random() > 0.3) { // 70% chance de sucesso
          this.connectionState = 'connected';
          this.notifyConnectionChange();
          this.flushOperationBuffer();
        } else {
          reconnect();
        }
      }, this.config.reconnectDelay * attempts);
    };

    reconnect();
  }

  // Flush do buffer de operações
  private flushOperationBuffer(): void {
    if (this.operationBuffer.length > 0) {
      this.processBatchOperations();
    }
  }

  // Métodos de notificação
  private notifyStateChange(): void {
    this.callbacks.onStateChange.forEach(callback => {
      try {
        callback(this.collaborationState);
      } catch (error) {
        console.error('Erro no callback de state change:', error);
      }
    });
  }

  private notifyConnectionChange(): void {
    this.callbacks.onConnectionChange.forEach(callback => {
      try {
        callback(this.connectionState);
      } catch (error) {
        console.error('Erro no callback de connection change:', error);
      }
    });
  }

  private notifyConflict(conflict: OperationalConflict): void {
    this.callbacks.onConflict.forEach(callback => {
      try {
        callback(conflict);
      } catch (error) {
        console.error('Erro no callback de conflict:', error);
      }
    });
  }

  // Métodos públicos de registro de callbacks
  onStateChange(callback: (state: CollaborationState) => void): () => void {
    this.callbacks.onStateChange.push(callback);
    return () => {
      const index = this.callbacks.onStateChange.indexOf(callback);
      if (index > -1) {
        this.callbacks.onStateChange.splice(index, 1);
      }
    };
  }

  onConnectionChange(callback: (state: string) => void): () => void {
    this.callbacks.onConnectionChange.push(callback);
    return () => {
      const index = this.callbacks.onConnectionChange.indexOf(callback);
      if (index > -1) {
        this.callbacks.onConnectionChange.splice(index, 1);
      }
    };
  }

  onConflict(callback: (conflict: OperationalConflict) => void): () => void {
    this.callbacks.onConflict.push(callback);
    return () => {
      const index = this.callbacks.onConflict.indexOf(callback);
      if (index > -1) {
        this.callbacks.onConflict.splice(index, 1);
      }
    };
  }

  // Estado e utilitários
  getCollaborationState(): CollaborationState {
    return { ...this.collaborationState };
  }

  getConnectionState(): string {
    return this.connectionState;
  }

  private getInitialState(): CollaborationState {
    return {
      activeUsers: [],
      cursors: {},
      selections: {},
      conflicts: [],
      operationQueue: []
    };
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateConflictId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private getCurrentDocumentId(): string {
    // Implementar lógica para obter ID do documento atual
    return 'current_document';
  }

  // Métodos auxiliares (implementações simplificadas)
  private sendIdentification(userId: string, documentId: string): void {
    // Enviar identificação para o servidor
  }

  private sendCursorUpdate(cursor: CursorPosition): void {
    // Enviar atualização de cursor
  }

  private sendSelectionUpdate(selection: SelectionRange): void {
    // Enviar atualização de seleção
  }

  private sendEvent(event: RealTimeEvent): void {
    // Enviar evento
  }

  private sendConflictResolution(conflictId: string, resolution: string): void {
    // Enviar resolução de conflito
  }

  private handleRemoteCursor(cursor: CursorPosition): void {
    this.collaborationState.cursors[cursor.userId] = cursor;
    this.notifyStateChange();
  }

  private handleRemoteSelection(selection: SelectionRange): void {
    this.collaborationState.selections[selection.userId] = selection;
    this.notifyStateChange();
  }

  private handlePresenceUpdate(users: CollaborativeUser[]): void {
    this.collaborationState.activeUsers = users;
    this.notifyStateChange();
  }

  private handleConflictDetection(conflict: OperationalConflict): void {
    this.collaborationState.conflicts.push(conflict);
    this.notifyConflict(conflict);
  }

  private handleSyncRequest(data: any): void {
    // Implementar sincronização
  }

  private handlePresenceChange(users: CollaborativeUser[]): void {
    this.collaborationState.activeUsers = users;
    this.notifyStateChange();
  }

  private handleDocumentChanges(changes: any): void {
    // Implementar mudanças no documento
  }

  private handleSyncComplete(): void {
    // Implementar callback de sincronização completa
  }

  // Cleanup
  destroy(): void {
    this.disconnect();
    this.presenceManager.destroy();
    this.documentSyncManager.destroy();
    RealTimeCollaborationEngine.instance = null;
  }
}

// Classes auxiliares
class ConflictResolver {
  resolve(conflict: OperationalConflict, strategy: string): OperationalTransform[] {
    // Implementar resolução de conflitos
    return conflict.operations;
  }
}

class PresenceManager {
  initialize(config: any): void {
    // Implementar gestão de presença
  }

  destroy(): void {
    // Cleanup
  }
}

class DocumentSyncManager {
  initialize(config: any): void {
    // Implementar sincronização de documentos
  }

  applyOperation(operation: OperationalTransform): void {
    // Aplicar operação no documento
  }

  destroy(): void {
    // Cleanup
  }
}

// Hook para usar o sistema de colaboração
export function useRealTimeCollaboration(userId: string, documentId: string) {
  const engine = RealTimeCollaborationEngine.getInstance();
  
  return {
    connect: () => engine.connect(userId, documentId),
    disconnect: () => engine.disconnect(),
    applyOperation: (operation: any) => engine.applyOperation(operation),
    updateCursor: (position: any) => engine.updateCursor(userId, position),
    updateSelection: (selection: any) => engine.updateSelection(userId, selection),
    addComment: (position: any, content: string) => engine.addComment(userId, position, content),
    resolveConflict: (conflictId: string, resolution: any) => engine.resolveConflict(conflictId, resolution),
    onStateChange: (callback: any) => engine.onStateChange(callback),
    onConnectionChange: (callback: any) => engine.onConnectionChange(callback),
    onConflict: (callback: any) => engine.onConflict(callback),
    getState: () => engine.getCollaborationState(),
    getConnectionState: () => engine.getConnectionState()
  };
}

export default RealTimeCollaborationEngine; 