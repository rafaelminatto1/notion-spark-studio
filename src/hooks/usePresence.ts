'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase-unified';

interface UserPresence {
  id: string;
  user_id: string;
  document_id: string;
  status: 'online' | 'away' | 'offline';
  last_seen: string;
  cursor_position?: number;
  selection_start?: number;
  selection_end?: number;
  user?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

interface CursorPosition {
  user_id: string;
  position: number;
  selection?: { start: number; end: number };
  color: string;
  user: {
    full_name?: string;
    email: string;
  };
}

export const usePresence = (documentId?: string) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [cursors, setCursors] = useState<CursorPosition[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const heartbeatRef = useRef<NodeJS.Timeout>();
  const cursorUpdateRef = useRef<NodeJS.Timeout>();

  // Cores para cursors dos usuários
  const userColors = [
    '#3B82F6', // blue
    '#EF4444', // red
    '#10B981', // green
    '#F59E0B', // yellow
    '#8B5CF6', // purple
    '#F97316', // orange
    '#06B6D4', // cyan
    '#84CC16', // lime
  ];

  const getUserColor = (userId: string) => {
    const index = parseInt(userId.slice(-2), 16) % userColors.length;
    return userColors[index];
  };

  // Conectar presença quando documento carrega
  useEffect(() => {
    if (user && documentId) {
      joinDocument();
      setupRealtimeSubscription();
      startHeartbeat();

      return () => {
        leaveDocument();
        stopHeartbeat();
      };
    }
  }, [user, documentId]);

  // Detectar quando usuário sai da página
  useEffect(() => {
    const handleBeforeUnload = () => {
      leaveDocument();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateStatus('away');
      } else {
        updateStatus('online');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const joinDocument = async () => {
    if (!user || !documentId) return;

    try {
      // Simular entrada no documento
      const mockUsers: UserPresence[] = [
        {
          id: '1',
          user_id: 'user1',
          document_id: documentId,
          status: 'online',
          last_seen: new Date().toISOString(),
          cursor_position: 150,
          user: {
            id: 'user1',
            email: 'joao@empresa.com',
            full_name: 'João Silva',
            avatar_url: ''
          }
        },
        {
          id: '2',
          user_id: 'user2',
          document_id: documentId,
          status: 'online',
          last_seen: new Date().toISOString(),
          cursor_position: 300,
          user: {
            id: 'user2',
            email: 'maria@empresa.com',
            full_name: 'Maria Santos',
            avatar_url: ''
          }
        }
      ];

      // Adicionar usuário atual
      const currentUser: UserPresence = {
        id: 'current',
        user_id: user.id,
        document_id: documentId,
        status: 'online',
        last_seen: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email!,
          full_name: 'Você',
          avatar_url: ''
        }
      };

      setOnlineUsers([...mockUsers, currentUser]);
      setIsOnline(true);

      // Simular cursors
      const mockCursors: CursorPosition[] = mockUsers.map(u => ({
        user_id: u.user_id,
        position: u.cursor_position || 0,
        color: getUserColor(u.user_id),
        user: {
          full_name: u.user?.full_name,
          email: u.user?.email || ''
        }
      }));

      setCursors(mockCursors);

      console.log(`Joined document ${documentId} with ${mockUsers.length + 1} users`);
    } catch (error) {
      console.error('Error joining document:', error);
    }
  };

  const leaveDocument = async () => {
    if (!user || !documentId) return;

    try {
      setIsOnline(false);
      setOnlineUsers(prev => prev.filter(u => u.user_id !== user.id));
      setCursors(prev => prev.filter(c => c.user_id !== user.id));
      
      console.log(`Left document ${documentId}`);
    } catch (error) {
      console.error('Error leaving document:', error);
    }
  };

  const updateStatus = async (status: 'online' | 'away' | 'offline') => {
    if (!user || !documentId) return;

    try {
      setOnlineUsers(prev => prev.map(u => 
        u.user_id === user.id 
          ? { ...u, status, last_seen: new Date().toISOString() }
          : u
      ));

      console.log(`Updated status to ${status}`);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const updateCursor = (position: number, selection?: { start: number; end: number }) => {
    if (!user || !documentId) return;

    // Throttle cursor updates
    if (cursorUpdateRef.current) {
      clearTimeout(cursorUpdateRef.current);
    }

    cursorUpdateRef.current = setTimeout(() => {
      setCursors(prev => {
        const filtered = prev.filter(c => c.user_id !== user.id);
        const newCursor: CursorPosition = {
          user_id: user.id,
          position,
          selection,
          color: getUserColor(user.id),
          user: {
            full_name: 'Você',
            email: user.email!
          }
        };
        return [...filtered, newCursor];
      });

      // Em implementação real, enviaria para Supabase
      console.log(`Updated cursor position: ${position}`, selection);
    }, 100); // Throttle de 100ms
  };

  const setupRealtimeSubscription = () => {
    if (!documentId) return;

    // Simular atualizações em tempo real
    const interval = setInterval(() => {
      // Simular movimento de cursor de outros usuários
      setCursors(prev => prev.map(cursor => {
        if (cursor.user_id !== user?.id) {
          const newPosition = cursor.position + Math.floor(Math.random() * 10) - 5;
          return {
            ...cursor,
            position: Math.max(0, newPosition)
          };
        }
        return cursor;
      }));
    }, 3000);

    return () => clearInterval(interval);
  };

  const startHeartbeat = () => {
    heartbeatRef.current = setInterval(() => {
      updateStatus('online');
    }, 30000); // A cada 30 segundos
  };

  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }
  };

  const getOnlineCount = () => {
    return onlineUsers.filter(u => u.status === 'online').length;
  };

  const getOtherUsers = () => {
    return onlineUsers.filter(u => u.user_id !== user?.id && u.status === 'online');
  };

  const getOtherCursors = () => {
    return cursors.filter(c => c.user_id !== user?.id);
  };

  return {
    onlineUsers,
    cursors,
    isOnline,
    onlineCount: getOnlineCount(),
    otherUsers: getOtherUsers(),
    otherCursors: getOtherCursors(),
    updateCursor,
    updateStatus,
    joinDocument,
    leaveDocument
  };
}; 