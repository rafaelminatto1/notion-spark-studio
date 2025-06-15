// Browser-compatible EventEmitter implementation
class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, callback: Function): this {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    if (!this.events[event]) {
      return false;
    }
    
    this.events[event].forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
    
    return true;
  }

  off(event: string, callback?: Function): this {
    if (!this.events[event]) {
      return this;
    }
    
    if (!callback) {
      delete this.events[event];
    } else {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
    
    return this;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
    return this;
  }
}

// Tipos para colaboração em tempo real
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  userId: string;
  documentId?: string;
}

export interface CollaborationEvent {
  type: 'cursor-update' | 'content-change' | 'user-join' | 'user-leave' | 'comment-add' | 'comment-update' | 'presence-update';
  payload: any;
  metadata: {
    userId: string;
    timestamp: number;
    documentId?: string;
  };
}

export interface ConnectionOptions {
  url: string;
  userId: string;
  userName: string;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
  timeout?: number;
}

export class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private heartbeatInterval = 30000;
  private heartbeatTimer: number | null = null;
  private reconnectTimer: number | null = null;
  private connectionTimeout = 10000;
  private messageQueue: WebSocketMessage[] = [];
  private lastPing = 0;
  private latency = 0;

  constructor(private options: ConnectionOptions) {
    super();
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.reconnectInterval = options.reconnectInterval || 3000;
    this.heartbeatInterval = options.heartbeatInterval || 30000;
    this.connectionTimeout = options.timeout || 10000;
  }

  // Conectar ao WebSocket
  async connect(): Promise<void> {
    if (this.isConnected || this.isConnecting) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.isConnecting = true;
      
      try {
        // Para desenvolvimento, usar WebSocket local ou mock
        const wsUrl = this.options.url || this.getWebSocketUrl();
        
        console.log(`[WebSocket] Connecting to ${wsUrl}...`);
        this.ws = new WebSocket(wsUrl);

        // Timeout de conexão
        const connectionTimer = setTimeout(() => {
          if (!this.isConnected) {
            this.ws?.close();
            this.isConnecting = false;
            reject(new Error('Connection timeout'));
          }
        }, this.connectionTimeout);

        this.ws.onopen = () => {
          clearTimeout(connectionTimer);
          this.isConnected = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          
          console.log('[WebSocket] Connected successfully');
          
          // Enviar handshake
          this.sendMessage({
            type: 'handshake',
            data: {
              userId: this.options.userId,
              userName: this.options.userName,
              timestamp: Date.now()
            },
            timestamp: Date.now(),
            userId: this.options.userId
          });

          // Processar fila de mensagens
          this.processMessageQueue();
          
          // Iniciar heartbeat
          this.startHeartbeat();
          
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onclose = (event) => {
          this.handleDisconnection(event);
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Connection error:', error);
          this.isConnecting = false;
          this.emit('error', error);
          
          if (!this.isConnected) {
            reject(error);
          }
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  // Desconectar
  disconnect(): void {
    console.log('[WebSocket] Disconnecting...');
    
    this.stopHeartbeat();
    this.stopReconnection();
    
    if (this.ws) {
      this.ws.close(1000, 'Normal closure');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.emit('disconnected');
  }

  // Enviar mensagem
  sendMessage(message: Omit<WebSocketMessage, 'timestamp' | 'userId'>): void {
    const fullMessage: WebSocketMessage = {
      ...message,
      timestamp: Date.now(),
      userId: this.options.userId
    };

    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(fullMessage));
        console.log('[WebSocket] Message sent:', fullMessage.type);
      } catch (error) {
        console.error('[WebSocket] Failed to send message:', error);
        this.queueMessage(fullMessage);
      }
    } else {
      console.log('[WebSocket] Queueing message (not connected):', fullMessage.type);
      this.queueMessage(fullMessage);
    }
  }

  // Entrar em documento para colaboração
  joinDocument(documentId: string): void {
    this.sendMessage({
      type: 'join-document',
      data: { documentId },
      documentId
    });
  }

  // Sair de documento
  leaveDocument(documentId: string): void {
    this.sendMessage({
      type: 'leave-document',
      data: { documentId },
      documentId
    });
  }

  // Enviar atualização de cursor
  sendCursorUpdate(documentId: string, position: { x: number; y: number; line?: number; column?: number }): void {
    this.sendMessage({
      type: 'cursor-update',
      data: {
        documentId,
        position,
        timestamp: Date.now()
      },
      documentId
    });
  }

  // Enviar mudança de conteúdo
  sendContentChange(documentId: string, operation: any): void {
    this.sendMessage({
      type: 'content-change',
      data: {
        documentId,
        operation,
        timestamp: Date.now()
      },
      documentId
    });
  }

  // Enviar comentário
  sendComment(documentId: string, comment: any): void {
    this.sendMessage({
      type: 'comment-add',
      data: {
        documentId,
        comment,
        timestamp: Date.now()
      },
      documentId
    });
  }

  // Enviar status de presença
  sendPresenceUpdate(documentId: string, presence: { isTyping: boolean; isViewing: boolean }): void {
    this.sendMessage({
      type: 'presence-update',
      data: {
        documentId,
        presence,
        timestamp: Date.now()
      },
      documentId
    });
  }

  // Obter latência
  getLatency(): number {
    return this.latency;
  }

  // Verificar se está conectado
  isConnectionOpen(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  // Handlers privados
  private getWebSocketUrl(): string {
    if (process.env.NODE_ENV === 'development') {
      return 'ws://localhost:3001/collaboration';
    }
    return process.env.VITE_WS_URL || 'wss://ws.notion-spark.com/collaboration';
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      // Tratar pong para cálculo de latência
      if (message.type === 'pong') {
        this.latency = Date.now() - this.lastPing;
        this.emit('latency-update', this.latency);
        return;
      }

      // Transformar em evento de colaboração
      const collaborationEvent: CollaborationEvent = {
        type: message.type as any,
        payload: message.data,
        metadata: {
          userId: message.userId,
          timestamp: message.timestamp,
          documentId: message.documentId
        }
      };

      console.log('[WebSocket] Received:', collaborationEvent.type);
      this.emit('message', collaborationEvent);
      this.emit(collaborationEvent.type, collaborationEvent.payload, collaborationEvent.metadata);

    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error);
    }
  }

  private handleDisconnection(event: CloseEvent): void {
    console.log('[WebSocket] Disconnected:', event.code, event.reason);
    
    this.isConnected = false;
    this.stopHeartbeat();
    
    this.emit('disconnected', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean
    });

    // Auto-reconectar se habilitado
    if (this.options.autoReconnect !== false && event.code !== 1000) {
      this.attemptReconnection();
    }
  }

  private attemptReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached');
      this.emit('reconnection-failed');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.emit('reconnecting', this.reconnectAttempts);
      this.connect().catch((error) => {
        console.error('[WebSocket] Reconnection failed:', error);
        this.attemptReconnection();
      });
    }, delay);
  }

  private stopReconnection(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.lastPing = Date.now();
        this.sendMessage({
          type: 'ping',
          data: { timestamp: this.lastPing }
        });
      }
    }, this.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private queueMessage(message: WebSocketMessage): void {
    // Limitar tamanho da fila
    if (this.messageQueue.length >= 100) {
      this.messageQueue.shift(); // Remove oldest message
    }
    
    this.messageQueue.push(message);
  }

  private processMessageQueue(): void {
    if (this.messageQueue.length === 0) return;
    
    console.log(`[WebSocket] Processing ${this.messageQueue.length} queued messages`);
    
    const messages = [...this.messageQueue];
    this.messageQueue = [];
    
    messages.forEach(message => {
      try {
        this.ws?.send(JSON.stringify(message));
      } catch (error) {
        console.error('[WebSocket] Failed to send queued message:', error);
        this.queueMessage(message);
      }
    });
  }
}

// Instância singleton para uso global
let wsInstance: WebSocketService | null = null;

export const createWebSocketService = (options: ConnectionOptions): WebSocketService => {
  if (wsInstance) {
    wsInstance.disconnect();
  }
  
  wsInstance = new WebSocketService(options);
  return wsInstance;
};

export const getWebSocketService = (): WebSocketService | null => {
  return wsInstance;
};

// Mock WebSocket para desenvolvimento
export class MockWebSocketService extends EventEmitter {
  private isConnected = false;
  private mockLatency = 50;
  private mockUsers: any[] = [];

  constructor(private options: ConnectionOptions) {
    super();
  }

  async connect(): Promise<void> {
    // Simular delay de conexão
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.isConnected = true;
    this.emit('connected');
    
    // Simular usuários online
    setTimeout(() => {
      this.mockUsers = [
        { id: 'user-1', name: 'Ana Silva', color: '#10B981' },
        { id: 'user-2', name: 'João Santos', color: '#8B5CF6' }
      ];
      
      this.mockUsers.forEach(user => {
        this.emit('user-join', user, { userId: user.id, timestamp: Date.now() });
      });
    }, 2000);
  }

  disconnect(): void {
    this.isConnected = false;
    this.emit('disconnected');
  }

  sendMessage(message: any): void {
    if (!this.isConnected) return;
    
    // Simular echo para teste
    setTimeout(() => {
      this.emit('message', {
        type: message.type,
        payload: message.data,
        metadata: {
          userId: 'mock-user',
          timestamp: Date.now()
        }
      });
    }, this.mockLatency);
  }

  joinDocument(documentId: string): void {
    this.sendMessage({ type: 'join-document', data: { documentId } });
  }

  leaveDocument(documentId: string): void {
    this.sendMessage({ type: 'leave-document', data: { documentId } });
  }

  sendCursorUpdate(documentId: string, position: any): void {
    this.sendMessage({ type: 'cursor-update', data: { documentId, position } });
  }

  sendContentChange(documentId: string, operation: any): void {
    this.sendMessage({ type: 'content-change', data: { documentId, operation } });
  }

  sendComment(documentId: string, comment: any): void {
    this.sendMessage({ type: 'comment-add', data: { documentId, comment } });
  }

  sendPresenceUpdate(documentId: string, presence: any): void {
    this.sendMessage({ type: 'presence-update', data: { documentId, presence } });
  }

  getLatency(): number {
    return this.mockLatency;
  }

  isConnectionOpen(): boolean {
    return this.isConnected;
  }
}

export default WebSocketService; 