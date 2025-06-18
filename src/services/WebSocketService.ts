import { safeGetEnv } from '@/utils/env';

// Proper function signatures instead of Function type
type EventCallback<T = unknown> = (data: T) => void;
type MessageHandler = (event: MessageEvent) => void;
type ErrorHandler = (event: Event) => void;
type CloseHandler = (event: CloseEvent) => void;

interface WebSocketEventListeners {
  [key: string]: EventCallback[];
}

interface ConnectionConfig {
  url: string;
  protocols?: string[];
  reconnectDelay: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  timeout: number;
}

interface QueuedMessage {
  type: string;
  data: unknown;
  timestamp: number;
}

interface ConnectionStats {
  connected: boolean;
  reconnectAttempts: number;
  lastConnected: Date | null;
  totalMessages: number;
  totalErrors: number;
}

interface MessageData {
  type: string;
  data: unknown;
  timestamp?: number;
  id?: string;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private eventListeners: WebSocketEventListeners = {};
  private isConnecting = false;
  private reconnectAttempts = 0;
  private messageQueue: QueuedMessage[] = [];
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private connectionConfig: ConnectionConfig;
  private stats: ConnectionStats = {
    connected: false,
    reconnectAttempts: 0,
    lastConnected: null,
    totalMessages: 0,
    totalErrors: 0
  };

  constructor(config?: Partial<ConnectionConfig>) {
    const defaultUrl = safeGetEnv('VITE_WS_URL', 'ws://localhost:8080');
    
    this.connectionConfig = {
      url: defaultUrl,
      protocols: [],
      reconnectDelay: 1000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      timeout: 10000,
      ...config
    };
  }

  // Event subscription methods
  on<T = unknown>(event: string, callback: EventCallback<T>): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback as EventCallback);
  }

  off(event: string, callback?: EventCallback): void {
    if (!this.eventListeners[event]) return;

    if (callback) {
      const index = this.eventListeners[event].indexOf(callback);
      if (index > -1) {
        this.eventListeners[event].splice(index, 1);
      }
    } else {
      delete this.eventListeners[event];
    }
  }

  private emit<T = unknown>(event: string, data: T): void {
    if (!this.eventListeners[event]) return;

    this.eventListeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in WebSocket event handler for ${event}:`, error);
      }
    });
  }

  // Connection management
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      await this.createConnection();
    } catch (error) {
      this.isConnecting = false;
      this.handleConnectionError(error);
      throw error;
    }
  }

  private createConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.connectionConfig.url, this.connectionConfig.protocols);
        
        const connectionTimeout = setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            this.ws?.close();
            reject(new Error('Connection timeout'));
          }
        }, this.connectionConfig.timeout);

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.stats.connected = true;
          this.stats.lastConnected = new Date();
          
          this.emit('connected', { timestamp: Date.now() });
          this.startHeartbeat();
          this.flushMessageQueue();
          resolve();
        };

        this.ws.onmessage = this.handleMessage.bind(this);
        this.ws.onerror = this.handleError.bind(this);
        this.ws.onclose = this.handleClose.bind(this);

      } catch (error) {
        clearTimeout(connectionTimeout);
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.stopHeartbeat();
    this.clearReconnectTimeout();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.stats.connected = false;
    this.emit('disconnected', { reason: 'manual', timestamp: Date.now() });
  }

  // Message handling
  private handleMessage: MessageHandler = (event) => {
    try {
      this.stats.totalMessages++;
      
      let messageData: MessageData;
      try {
        messageData = JSON.parse(event.data as string) as MessageData;
      } catch {
        // If not JSON, treat as plain text
        messageData = {
          type: 'text',
          data: event.data,
          timestamp: Date.now()
        };
      }

      this.emit('message', messageData);
      
      if (messageData.type) {
        this.emit(messageData.type, messageData.data);
      }

      // Handle special system messages
      if (messageData.type === 'pong') {
        this.emit('heartbeat', { received: Date.now() });
      }

    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      this.emit('error', { type: 'message_parse_error', error, timestamp: Date.now() });
    }
  };

  private handleError: ErrorHandler = (event) => {
    this.stats.totalErrors++;
    console.error('WebSocket error:', event);
    this.emit('error', { 
      type: 'connection_error', 
      event, 
      timestamp: Date.now() 
    });
  };

  private handleClose: CloseHandler = (event) => {
    this.stats.connected = false;
    this.stopHeartbeat();
    
    this.emit('disconnected', {
      code: event.code,
      reason: event.reason || 'Unknown',
      wasClean: event.wasClean,
      timestamp: Date.now()
    });

    // Auto-reconnect if not a clean disconnect
    if (!event.wasClean && this.reconnectAttempts < this.connectionConfig.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  };

  // Reconnection logic
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) return;

    this.reconnectAttempts++;
    this.stats.reconnectAttempts = this.reconnectAttempts;
    
    const delay = this.connectionConfig.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    this.emit('reconnecting', {
      attempt: this.reconnectAttempts,
      maxAttempts: this.connectionConfig.maxReconnectAttempts,
      delay,
      timestamp: Date.now()
    });

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      void this.connect().catch(error => {
        console.error('Reconnection failed:', error);
        
        if (this.reconnectAttempts >= this.connectionConfig.maxReconnectAttempts) {
          this.emit('reconnect_failed', {
            attempts: this.reconnectAttempts,
            lastError: error,
            timestamp: Date.now()
          });
        }
      });
    }, delay);
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private handleConnectionError(error: unknown): void {
    console.error('WebSocket connection error:', error);
    this.emit('connection_failed', {
      error,
      attempt: this.reconnectAttempts + 1,
      timestamp: Date.now()
    });
  }

  // Message sending
  send(type: string, data: unknown): boolean {
    const message: MessageData = {
      type,
      data,
      timestamp: Date.now(),
      id: this.generateMessageId()
    };

    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        this.emit('message_sent', message);
        return true;
      } catch (error) {
        console.error('Failed to send message:', error);
        this.queueMessage(message);
        return false;
      }
    } else {
      this.queueMessage(message);
      return false;
    }
  }

  private queueMessage(message: MessageData): void {
    this.messageQueue.push({
      type: message.type,
      data: message.data,
      timestamp: message.timestamp ?? Date.now()
    });

    // Limit queue size
    if (this.messageQueue.length > 100) {
      this.messageQueue.shift();
    }

    this.emit('message_queued', message);
  }

  private flushMessageQueue(): void {
    if (this.messageQueue.length === 0) return;

    const messages = [...this.messageQueue];
    this.messageQueue = [];

    for (const queuedMessage of messages) {
      this.send(queuedMessage.type, queuedMessage.data);
    }

    this.emit('queue_flushed', { count: messages.length, timestamp: Date.now() });
  }

  // Heartbeat mechanism
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send('ping', { timestamp: Date.now() });
      }
    }, this.connectionConfig.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Utility methods
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionState(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'closed';
      default:
        return 'unknown';
    }
  }

  getStats(): ConnectionStats {
    return { ...this.stats };
  }

  getQueueSize(): number {
    return this.messageQueue.length;
  }

  // Configuration updates
  updateConfig(config: Partial<ConnectionConfig>): void {
    this.connectionConfig = { ...this.connectionConfig, ...config };
  }

  // Cleanup
  destroy(): void {
    this.disconnect();
    this.eventListeners = {};
    this.messageQueue = [];
  }

  // Specific message types for common use cases
  sendNotification(title: string, message: string, data?: Record<string, unknown>): boolean {
    return this.send('notification', {
      title,
      message,
      data: data ?? {},
      timestamp: Date.now()
    });
  }

  sendUserAction(action: string, payload: Record<string, unknown>): boolean {
    return this.send('user_action', {
      action,
      payload,
      userId: this.getUserId(),
      timestamp: Date.now()
    });
  }

  sendSystemEvent(event: string, details: Record<string, unknown>): boolean {
    return this.send('system_event', {
      event,
      details,
      timestamp: Date.now()
    });
  }

  private getUserId(): string | null {
    // This would typically come from your auth system
    return localStorage.getItem('userId') || null;
  }

  // Real-time collaboration features
  sendCollaborationEvent(type: string, payload: Record<string, unknown>): boolean {
    return this.send('collaboration', {
      type,
      payload,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      timestamp: Date.now()
    });
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  // Performance monitoring
  sendPerformanceMetric(metric: string, value: number, metadata?: Record<string, unknown>): boolean {
    return this.send('performance_metric', {
      metric,
      value,
      metadata: metadata ?? {},
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    });
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
export default WebSocketService; 