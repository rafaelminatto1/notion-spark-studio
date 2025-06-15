// Sistema de Colaboração Real-time - FASE 4
// WebSocket para cursors, edição colaborativa e notificações

import { supabase } from '@/integrations/supabase/client';
import { config } from '@/config/environment';
import { supabaseMonitoring } from './supabaseMonitoring';
import { safeGetEnv } from '@/utils/env';

interface User {
  id: string;
  name: string;
  avatar?: string;
  color: string;
}

interface Cursor {
  userId: string;
  user: User;
  x: number;
  y: number;
  elementId?: string;
  timestamp: number;
}

interface CollaborationEvent {
  type: 'cursor' | 'edit' | 'selection' | 'presence' | 'notification';
  userId: string;
  data: any;
  timestamp: number;
  roomId: string;
}

interface Room {
  id: string;
  name: string;
  users: User[];
  isActive: boolean;
}

class CollaborationService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pingInterval: NodeJS.Timeout | null = null;

  private currentUser: User | null = null;
  private currentRoom: string | null = null;
  private cursors = new Map<string, Cursor>();
  private rooms = new Map<string, Room>();
  
  private listeners = {
    cursor: new Set<(cursor: Cursor) => void>(),
    userJoined: new Set<(user: User) => void>(),
    userLeft: new Set<(userId: string) => void>(),
    edit: new Set<(event: CollaborationEvent) => void>(),
    selection: new Set<(event: CollaborationEvent) => void>(),
    notification: new Set<(event: CollaborationEvent) => void>(),
    connected: new Set<() => void>(),
    disconnected: new Set<() => void>(),
    error: new Set<(error: string) => void>()
  };

  constructor() {
    this.setupUserFromAuth();
    console.log('🤝 Collaboration Service initialized');
  }

  private async setupUserFromAuth(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Get user profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile && !error) {
          this.currentUser = {
            id: user.id,
            name: profile.full_name || user.email?.split('@')[0] || 'Anonymous',
            avatar: profile.avatar_url,
            color: this.generateUserColor(user.id)
          };
        }
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          this.currentUser = null;
          this.disconnect();
        } else if (event === 'SIGNED_IN' && session?.user) {
          this.setupUserFromAuth();
        }
      });
    } catch (error) {
      console.warn('Failed to setup collaboration user:', error);
    }
  }

  private generateUserColor(userId: string): string {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
      '#8B5CF6', '#06B6D4', '#F97316', '#EC4899',
      '#84CC16', '#6366F1', '#14B8A6', '#F43F5E'
    ];
    const hash = Array.from(userId).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  async connect(roomId: string): Promise<void> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    if (this.ws?.readyState === WebSocket.OPEN && this.currentRoom === roomId) {
      return; // Already connected to this room
    }

    this.disconnect(); // Disconnect from current room
    this.currentRoom = roomId;

    try {
      // Create or join collaboration session in database
      await this.createCollaborationSession(roomId);

      // WebSocket URL (will fallback to mock in dev)
      const mode = safeGetEnv('NODE_ENV', 'development');
      const wsUrl = mode === 'development' 
        ? 'ws://localhost:8080' 
        : safeGetEnv('VITE_WS_URL', 'wss://ws.notion-spark.com');
      this.ws = new WebSocket(`${wsUrl}/collaboration/${roomId}`);

      this.ws.onopen = () => {
        console.log('🌐 WebSocket connected to room:', roomId);
        this.reconnectAttempts = 0;
        
        // Send initial presence
        this.sendEvent({
          type: 'presence',
          userId: this.currentUser!.id,
          data: { user: this.currentUser, action: 'join' },
          timestamp: Date.now(),
          roomId
        });

        this.startPingPong();
        this.listeners.connected.forEach(fn => fn());
        
        // Track analytics
        supabaseMonitoring.trackUserAction('collaboration_connect', 'collaboration', roomId);
      };

      this.ws.onmessage = (event) => {
        try {
          const collaborationEvent: CollaborationEvent = JSON.parse(event.data);
          this.handleEvent(collaborationEvent);
        } catch (error) {
          console.error('Failed to parse collaboration event:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        this.stopPingPong();
        this.listeners.disconnected.forEach(fn => fn());
        
        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.listeners.error.forEach(fn => fn('Connection error'));
        
        // Track error
        supabaseMonitoring.recordError({
          message: 'WebSocket connection failed',
          severity: 'medium',
          context: { roomId, error: error.toString() }
        });
      };

    } catch (error) {
      console.error('Failed to connect to collaboration:', error);
      throw error;
    }
  }

  private async createCollaborationSession(roomId: string): Promise<void> {
    if (!this.currentUser) return;

    try {
      // TODO: When table exists, use this:
      /*
      const { error } = await supabase
        .from('collaboration_sessions')
        .upsert({
          room_id: roomId,
          user_id: this.currentUser.id,
          is_active: true,
          last_seen: new Date().toISOString()
        });

      if (error) {
        console.warn('Failed to create collaboration session:', error);
      }
      */
      
      console.log('📝 Would create collaboration session for room:', roomId);
    } catch (error) {
      console.warn('Failed to create collaboration session:', error);
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (this.currentRoom) {
        this.connect(this.currentRoom);
      }
    }, delay);
  }

  private startPingPong(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopPingPong(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private sendEvent(event: CollaborationEvent): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    } else {
      console.warn('WebSocket not connected, event not sent:', event.type);
    }
  }

  private handleEvent(event: CollaborationEvent): void {
    switch (event.type) {
      case 'cursor':
        this.handleCursorEvent(event);
        break;
      case 'edit':
        this.listeners.edit.forEach(fn => fn(event));
        break;
      case 'selection':
        this.listeners.selection.forEach(fn => fn(event));
        break;
      case 'presence':
        this.handlePresenceEvent(event);
        break;
      case 'notification':
        this.listeners.notification.forEach(fn => fn(event));
        break;
    }
  }

  private handleCursorEvent(event: CollaborationEvent): void {
    const cursor: Cursor = {
      userId: event.userId,
      user: event.data.user,
      x: event.data.x,
      y: event.data.y,
      elementId: event.data.elementId,
      timestamp: event.timestamp
    };

    this.cursors.set(event.userId, cursor);
    this.listeners.cursor.forEach(fn => fn(cursor));

    // Auto-cleanup old cursors
    setTimeout(() => {
      if (this.cursors.get(event.userId)?.timestamp === cursor.timestamp) {
        this.cursors.delete(event.userId);
      }
    }, 5000);
  }

  private handlePresenceEvent(event: CollaborationEvent): void {
    const { user, action } = event.data;

    if (action === 'join') {
      this.listeners.userJoined.forEach(fn => fn(user));
      console.log('👋 User joined:', user.name);
    } else if (action === 'leave') {
      this.listeners.userLeft.forEach(fn => fn(user.id));
      this.cursors.delete(user.id);
      console.log('👋 User left:', user.name);
    }
  }

  // Public API Methods
  updateCursor(x: number, y: number, elementId?: string): void {
    if (!this.currentUser || !this.currentRoom) return;

    this.sendEvent({
      type: 'cursor',
      userId: this.currentUser.id,
      data: {
        user: this.currentUser,
        x,
        y,
        elementId
      },
      timestamp: Date.now(),
      roomId: this.currentRoom
    });
  }

  sendEdit(operation: string, data: any): void {
    if (!this.currentUser || !this.currentRoom) return;

    this.sendEvent({
      type: 'edit',
      userId: this.currentUser.id,
      data: { operation, ...data },
      timestamp: Date.now(),
      roomId: this.currentRoom
    });

    // Track performance
    supabaseMonitoring.trackPerformance('collaboration', 'edit', Date.now());
  }

  sendSelection(elementId: string, selection: any): void {
    if (!this.currentUser || !this.currentRoom) return;

    this.sendEvent({
      type: 'selection',
      userId: this.currentUser.id,
      data: { elementId, selection },
      timestamp: Date.now(),
      roomId: this.currentRoom
    });
  }

  sendNotification(message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
    if (!this.currentUser || !this.currentRoom) return;

    this.sendEvent({
      type: 'notification',
      userId: this.currentUser.id,
      data: { message, type },
      timestamp: Date.now(),
      roomId: this.currentRoom
    });
  }

  disconnect(): void {
    if (this.ws) {
      // Send leave presence
      if (this.currentUser && this.currentRoom) {
        this.sendEvent({
          type: 'presence',
          userId: this.currentUser.id,
          data: { user: this.currentUser, action: 'leave' },
          timestamp: Date.now(),
          roomId: this.currentRoom
        });
      }

      this.ws.close(1000, 'Intentional disconnect');
      this.ws = null;
    }

    this.stopPingPong();
    this.currentRoom = null;
    this.cursors.clear();
    this.reconnectAttempts = 0;
  }

  // Event Listeners
  onCursor(callback: (cursor: Cursor) => void): () => void {
    this.listeners.cursor.add(callback);
    return () => this.listeners.cursor.delete(callback);
  }

  onUserJoined(callback: (user: User) => void): () => void {
    this.listeners.userJoined.add(callback);
    return () => this.listeners.userJoined.delete(callback);
  }

  onUserLeft(callback: (userId: string) => void): () => void {
    this.listeners.userLeft.add(callback);
    return () => this.listeners.userLeft.delete(callback);
  }

  onEdit(callback: (event: CollaborationEvent) => void): () => void {
    this.listeners.edit.add(callback);
    return () => this.listeners.edit.delete(callback);
  }

  onSelection(callback: (event: CollaborationEvent) => void): () => void {
    this.listeners.selection.add(callback);
    return () => this.listeners.selection.delete(callback);
  }

  onNotification(callback: (event: CollaborationEvent) => void): () => void {
    this.listeners.notification.add(callback);
    return () => this.listeners.notification.delete(callback);
  }

  onConnected(callback: () => void): () => void {
    this.listeners.connected.add(callback);
    return () => this.listeners.connected.delete(callback);
  }

  onDisconnected(callback: () => void): () => void {
    this.listeners.disconnected.add(callback);
    return () => this.listeners.disconnected.delete(callback);
  }

  onError(callback: (error: string) => void): () => void {
    this.listeners.error.add(callback);
    return () => this.listeners.error.delete(callback);
  }

  // Getters
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get currentRoomId(): string | null {
    return this.currentRoom;
  }

  get user(): User | null {
    return this.currentUser;
  }

  getCursors(): Cursor[] {
    return Array.from(this.cursors.values());
  }

  getUserCursor(userId: string): Cursor | undefined {
    return this.cursors.get(userId);
  }

  // Cleanup
  destroy(): void {
    this.disconnect();
    Object.values(this.listeners).forEach(set => set.clear());
  }
}

// Singleton instance
export const collaborationService = new CollaborationService();

// Exports
export { CollaborationService };
export type { User, Cursor, CollaborationEvent, Room }; 