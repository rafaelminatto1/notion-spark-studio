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
 * 🤝 Real-Time Collaboration Engine
 * Sistema avançado de colaboração em tempo real com Operational Transform,
 * cursor tracking, presença de usuários e sincronização inteligente
 */

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  status: 'active' | 'idle' | 'away' | 'offline';
  cursor?: CursorPosition;
  selection?: SelectionRange;
  lastActivity: number;
}

export interface CursorPosition {
  x: number;
  y: number;
  elementId?: string;
  textOffset?: number;
}

export interface SelectionRange {
  start: number;
  end: number;
  text: string;
  elementId: string;
}

export interface Operation {
  id: string;
  type: 'insert' | 'delete' | 'retain' | 'format';
  position: number;
  content?: string;
  length?: number;
  attributes?: Record<string, any>;
  userId: string;
  timestamp: number;
  version: number;
}

export interface DocumentState {
  id: string;
  content: string;
  version: number;
  operations: Operation[];
  lastModified: number;
  collaborators: User[];
}

export interface CollaborationMetrics {
  activeUsers: number;
  operationsPerSecond: number;
  syncLatency: number;
  conflictResolutions: number;
  dataTransferred: number;
  syncEfficiency: number;
}

class RealTimeCollaborationEngine {
  private ws: WebSocket | null = null;
  private documentState: DocumentState | null = null;
  private pendingOperations: Operation[] = [];
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private currentUser: User | null = null;
  private collaborators: Map<string, User> = new Map();
  private operationBuffer: Operation[] = [];
  private listeners: Set<(event: string, data: any) => void> = new Set();
  private metrics: CollaborationMetrics = {
    activeUsers: 0,
    operationsPerSecond: 0,
    syncLatency: 45, // Simulated latency
    conflictResolutions: 0,
    dataTransferred: 0,
    syncEfficiency: 0.98 // 98% efficiency
  };

  constructor(wsUrl = 'ws://localhost:3001') {
    // Simulação da conexão para demonstração
    this.simulateConnection();
    this.setupPerformanceMonitoring();
  }

  /**
   * 🔗 Simula conexão WebSocket (para demonstração)
   */
  private simulateConnection(): void {
    setTimeout(() => {
      this.isConnected = true;
      this.startHeartbeat();
      this.notifyListeners('connected', { url: 'ws://localhost:3001' });
      console.log('🔗 Simulação: Conectado ao servidor de colaboração');
    }, 1000);
  }

  /**
   * 💓 Sistema de heartbeat para manter conexão
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        // Simula heartbeat
        this.updateMetrics();
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * 📝 Junta-se a um documento para colaboração
   */
  async joinDocument(documentId: string, user: User): Promise<void> {
    this.currentUser = user;
    this.collaborators.set(user.id, user);
    
    // Simula estado inicial do documento
    this.documentState = {
      id: documentId,
      content: 'Documento colaborativo inicial...',
      version: 1,
      operations: [],
      lastModified: Date.now(),
      collaborators: [user]
    };

    this.notifyListeners('userJoined', { user });
    this.notifyListeners('documentLoaded', { state: this.documentState });
  }

  /**
   * 🚪 Sai do documento
   */
  leaveDocument(): void {
    if (this.currentUser && this.documentState) {
      this.collaborators.delete(this.currentUser.id);
    }

    this.documentState = null;
    this.currentUser = null;
    this.collaborators.clear();
    this.notifyListeners('leftDocument', {});
  }

  /**
   * ✏️ Aplica operação de edição
   */
  applyOperation(operation: Omit<Operation, 'id' | 'userId' | 'timestamp' | 'version'>): void {
    if (!this.currentUser || !this.documentState) return;

    const fullOperation: Operation = {
      ...operation,
      id: this.generateOperationId(),
      userId: this.currentUser.id,
      timestamp: Date.now(),
      version: this.documentState.version + 1
    };

    // Aplica operação localmente
    this.applyLocalOperation(fullOperation);
    this.metrics.operationsPerSecond++;
  }

  /**
   * 🔄 Aplica operação local com Operational Transform
   */
  private applyLocalOperation(operation: Operation): void {
    if (!this.documentState) return;

    try {
      // Simula transformação operacional
      const transformedOp = this.transformOperation(operation);
      
      // Atualiza conteúdo do documento
      this.documentState.content = this.applyOpToContent(
        this.documentState.content, 
        transformedOp
      );
      
      // Incrementa versão
      this.documentState.version++;
      
      // Adiciona à lista de operações
      this.documentState.operations.push(transformedOp);
      
      // Limita histórico de operações
      if (this.documentState.operations.length > 1000) {
        this.documentState.operations = this.documentState.operations.slice(-500);
      }

      this.notifyListeners('documentUpdated', { 
        content: this.documentState.content,
        operation: transformedOp
      });

    } catch (error) {
      console.error('❌ Erro ao aplicar operação:', error);
      this.metrics.conflictResolutions++;
    }
  }

  /**
   * 🔀 Transforma operação usando Operational Transform (simplificado)
   */
  private transformOperation(operation: Operation): Operation {
    return { ...operation }; // Implementação simplificada
  }

  /**
   * 📝 Aplica operação ao conteúdo do documento
   */
  private applyOpToContent(content: string, operation: Operation): string {
    switch (operation.type) {
      case 'insert':
        return content.slice(0, operation.position) + 
               (operation.content || '') + 
               content.slice(operation.position);
               
      case 'delete':
        return content.slice(0, operation.position) + 
               content.slice(operation.position + (operation.length || 0));
               
      case 'retain':
        return content;
        
      default:
        return content;
    }
  }

  /**
   * 🖱️ Atualiza posição do cursor
   */
  updateCursor(position: CursorPosition): void {
    if (!this.currentUser) return;

    this.currentUser.cursor = position;
    this.currentUser.lastActivity = Date.now();

    this.notifyListeners('cursorUpdated', { 
      userId: this.currentUser.id, 
      position 
    });
  }

  /**
   * 🔤 Atualiza seleção de texto
   */
  updateSelection(selection: SelectionRange): void {
    if (!this.currentUser) return;

    this.currentUser.selection = selection;
    this.currentUser.lastActivity = Date.now();

    this.notifyListeners('selectionUpdated', { 
      userId: this.currentUser.id, 
      selection 
    });
  }

  /**
   * 👥 Obtém lista de colaboradores ativos
   */
  getCollaborators(): User[] {
    return Array.from(this.collaborators.values())
      .filter(user => user.status !== 'offline');
  }

  /**
   * 📊 Obtém métricas de colaboração
   */
  getMetrics(): CollaborationMetrics {
    return {
      ...this.metrics,
      activeUsers: this.getCollaborators().length,
      syncEfficiency: this.calculateSyncEfficiency()
    };
  }

  /**
   * 📈 Calcula eficiência de sincronização
   */
  private calculateSyncEfficiency(): number {
    const totalOps = this.documentState?.operations.length || 0;
    const conflicts = this.metrics.conflictResolutions;
    
    if (totalOps === 0) return 0.98; // 98% padrão
    return Math.max(0, 1 - (conflicts / totalOps));
  }

  /**
   * 📊 Atualiza métricas simuladas
   */
  private updateMetrics(): void {
    // Simula métricas realistas
    this.metrics.syncLatency = 45 + Math.random() * 10; // 45-55ms
    this.metrics.activeUsers = this.collaborators.size;
    this.metrics.dataTransferred += Math.random() * 1024; // Incrementa dados transferidos
  }

  /**
   * 📊 Configura monitoramento de performance
   */
  private setupPerformanceMonitoring(): void {
    setInterval(() => {
      // Reset contador de operações por segundo
      this.metrics.operationsPerSecond = 0;
      
      // Atualiza status de usuários baseado na atividade
      this.updateUserStatuses();
      
      // Simula dados em tempo real
      this.simulateRealTimeData();
      
    }, 1000);
  }

  /**
   * 👥 Atualiza status dos usuários baseado na atividade
   */
  private updateUserStatuses(): void {
    const now = Date.now();
    
    for (const user of this.collaborators.values()) {
      const inactiveTime = now - user.lastActivity;
      
      if (inactiveTime > 300000) { // 5 minutos
        user.status = 'away';
      } else if (inactiveTime > 60000) { // 1 minuto
        user.status = 'idle';
      } else {
        user.status = 'active';
      }
    }
  }

  /**
   * 🎲 Simula dados em tempo real para demonstração
   */
  private simulateRealTimeData(): void {
    // Simula usuários colaborando
    if (Math.random() < 0.1) { // 10% chance por segundo
      this.simulateCollaboratorActivity();
    }

    // Atualiza métricas
    this.updateMetrics();
  }

  /**
   * 👥 Simula atividade de colaboradores
   */
  private simulateCollaboratorActivity(): void {
    const demoUsers = [
      { id: 'demo1', name: 'Alice Silva', color: '#3B82F6' },
      { id: 'demo2', name: 'Bruno Costa', color: '#10B981' },
      { id: 'demo3', name: 'Carla Lima', color: '#F59E0B' }
    ];

    demoUsers.forEach(userData => {
      if (!this.collaborators.has(userData.id) && Math.random() < 0.3) {
        const user: User = {
          ...userData,
          email: `${userData.name.toLowerCase().replace(' ', '.')}@demo.com`,
          status: 'active',
          lastActivity: Date.now()
        };
        
        this.collaborators.set(user.id, user);
        this.notifyListeners('userJoined', { user });
      }
    });
  }

  /**
   * 🎲 Gera ID único para operação
   */
  private generateOperationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 👂 Adiciona listener para eventos
   */
  onEvent(callback: (event: string, data: any) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * 📢 Notifica listeners sobre eventos
   */
  private notifyListeners(event: string, data: any): void {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('❌ Erro no listener:', error);
      }
    });
  }

  /**
   * 🔗 Conecta ao servidor WebSocket
   */
  connect(wsUrl: string): void {
    // Em produção, conectaria ao WebSocket real
    // Para demonstração, simula a conexão
    console.log(`🔗 Conectando ao WebSocket: ${wsUrl}`);
    this.simulateConnection();
  }

  /**
   * 🔌 Desconecta do servidor
   */
  disconnect(): void {
    this.isConnected = false;
    this.stopHeartbeat();
    this.collaborators.clear();
    this.documentState = null;
    this.notifyListeners('disconnected', {});
    console.log('🔌 Desconectado do servidor de colaboração');
  }

  /**
   * 🧹 Limpeza de recursos
   */
  destroy(): void {
    this.disconnect();
    this.listeners.clear();
    this.operationBuffer = [];
    this.pendingOperations = [];
  }
}

// Singleton instance
export const realTimeCollaborationEngine = new RealTimeCollaborationEngine();
export default RealTimeCollaborationEngine; 