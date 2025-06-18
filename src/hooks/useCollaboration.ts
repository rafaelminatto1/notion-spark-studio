import { useState, useEffect, useCallback, useRef } from 'react';
import type { CollaboratorCursor } from '@/components/collaboration/LiveCursors';
import type { Operation } from '@/components/collaboration/OperationalTransform';
import type { Comment } from '@/components/collaboration/CommentsSystem';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './useAuth';
import { useRealtime } from './useRealtime';

export interface CollaborationState {
  cursors: CollaboratorCursor[];
  operations: Operation[];
  comments: Comment[];
  isOnline: boolean;
  latency: number;
  conflictCount: number;
  presences: Record<string, any>;
  conflicts: any[];
}

interface UseCollaborationProps {
  documentId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  websocketUrl?: string;
  onContentChange?: (content: string) => void;
  onError?: (error: Error) => void;
}

export const useCollaboration = ({
  documentId,
  userId,
  userName,
  userAvatar,
  websocketUrl = process.env.NODE_ENV === 'development'
    ? 'ws://localhost:8080/collaboration'
    : process.env.VITE_WS_URL || 'wss://ws.notion-spark.com/collaboration',
  onContentChange,
  onError
}: UseCollaborationProps) => {
  const { user } = useAuth();
  const { subscribe, unsubscribe } = useRealtime();
  const [state, setState] = useState<CollaborationState>({
    cursors: [],
    operations: [],
    comments: [],
    isOnline: false,
    latency: 0,
    conflictCount: 0,
    presences: {},
    conflicts: [],
  });

  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Initialize WebSocket connection
  const connectWebSocket = useCallback(() => {
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        return; // Already connected
      }

      wsRef.current = new WebSocket(`${websocketUrl}?documentId=${documentId}&userId=${userId}`);

      wsRef.current.onopen = () => {
        console.log('🔗 Collaboration WebSocket connected');
        setState(prev => ({ ...prev, isOnline: true }));
        reconnectAttempts.current = 0;

        // Send initial presence
        sendMessage({
          type: 'presence',
          data: {
            userId,
            userName,
            userAvatar,
            isOnline: true
          }
        });

        // Start heartbeat
        heartbeatRef.current = setInterval(() => {
          sendMessage({ type: 'ping', timestamp: Date.now() });
        }, 30000);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('🔌 Collaboration WebSocket disconnected', event.code);
        setState(prev => ({ ...prev, isOnline: false }));
        
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
          heartbeatRef.current = null;
        }

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connectWebSocket();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('🚨 Collaboration WebSocket error:', error);
        onError?.(new Error('WebSocket connection failed'));
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      onError?.(error as Error);
    }
  }, [documentId, userId, userName, userAvatar, websocketUrl, onError]);

  // Send message through WebSocket
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  }, []);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'pong':
        // Calculate latency
        const latency = Date.now() - message.timestamp;
        setState(prev => ({ ...prev, latency }));
        break;

      case 'cursor-update':
        setState(prev => ({
          ...prev,
          cursors: prev.cursors.map(cursor =>
            cursor.userId === message.data.userId
              ? { ...cursor, ...message.data }
              : cursor
          ).concat(
            prev.cursors.find(c => c.userId === message.data.userId)
              ? []
              : [{ ...message.data, id: uuidv4() }]
          )
        }));
        break;

      case 'operation':
        setState(prev => ({
          ...prev,
          operations: [...prev.operations, message.data]
        }));
        break;

      case 'comment-added':
        setState(prev => ({
          ...prev,
          comments: [...prev.comments, message.data]
        }));
        break;

      case 'comment-updated':
        setState(prev => ({
          ...prev,
          comments: prev.comments.map(comment =>
            comment.id === message.data.id
              ? { ...comment, ...message.data }
              : comment
          )
        }));
        break;

      case 'comment-deleted':
        setState(prev => ({
          ...prev,
          comments: prev.comments.filter(comment => comment.id !== message.data.id)
        }));
        break;

      case 'presence-update':
        setState(prev => ({
          ...prev,
          cursors: message.data.online
            ? prev.cursors.map(cursor =>
                cursor.userId === message.data.userId
                  ? { ...cursor, ...message.data }
                  : cursor
              )
            : prev.cursors.filter(cursor => cursor.userId !== message.data.userId)
        }));
        break;

      case 'conflict-detected':
        setState(prev => ({
          ...prev,
          conflictCount: prev.conflictCount + 1
        }));
        console.warn('🚨 Collaboration conflict detected:', message.data);
        break;

      default:
        console.log('📨 Unknown message type:', message.type);
    }
  }, []);

  // Cursor management
  const updateCursor = useCallback((position: { x: number; y: number; line: number; column: number }) => {
    const cursorData = {
      userId,
      userName,
      userColor: `hsl(${Math.abs(userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 360}, 70%, 60%)`,
      userAvatar,
      position,
      lastActivity: new Date(),
      isTyping: true,
      isViewing: false
    };

    sendMessage({
      type: 'cursor-update',
      data: cursorData
    });
  }, [userId, userName, userAvatar, sendMessage]);

  const updateSelection = useCallback((selection: { start: { line: number; column: number }; end: { line: number; column: number } }) => {
    sendMessage({
      type: 'selection-update',
      data: {
        userId,
        selection,
        lastActivity: new Date()
      }
    });
  }, [userId, sendMessage]);

  // Operation management
  const sendOperation = useCallback((operation: Operation) => {
    sendMessage({
      type: 'operation',
      data: operation
    });
  }, [sendMessage]);

  const receiveOperation = useCallback((callback: (operation: Operation) => void) => {
    const unsubscribe = () => {
      // This would be handled by the WebSocket message handler
    };

    // Operations are handled through WebSocket messages
    return unsubscribe;
  }, []);

  // Comment management
  const addComment = useCallback((comment: Omit<Comment, 'id' | 'createdAt' | 'reactions' | 'thread' | 'isPinned' | 'isResolved'>) => {
    const fullComment: Comment = {
      ...comment,
      id: uuidv4(),
      createdAt: new Date(),
      reactions: [],
      isPinned: false,
      isResolved: false
    };

    sendMessage({
      type: 'comment-add',
      data: fullComment
    });

    // Optimistically update local state
    setState(prev => ({
      ...prev,
      comments: [...prev.comments, fullComment]
    }));
  }, [sendMessage]);

  const updateComment = useCallback((commentId: string, updates: Partial<Comment>) => {
    sendMessage({
      type: 'comment-update',
      data: { id: commentId, ...updates }
    });

    // Optimistically update local state
    setState(prev => ({
      ...prev,
      comments: prev.comments.map(comment =>
        comment.id === commentId
          ? { ...comment, ...updates, updatedAt: new Date() }
          : comment
      )
    }));
  }, [sendMessage]);

  const deleteComment = useCallback((commentId: string) => {
    sendMessage({
      type: 'comment-delete',
      data: { id: commentId }
    });

    // Optimistically update local state
    setState(prev => ({
      ...prev,
      comments: prev.comments.filter(comment => comment.id !== commentId)
    }));
  }, [sendMessage]);

  const replyToComment = useCallback((parentId: string, reply: Omit<Comment, 'id' | 'createdAt' | 'reactions' | 'thread' | 'isPinned' | 'isResolved'>) => {
    const fullReply: Comment = {
      ...reply,
      id: uuidv4(),
      createdAt: new Date(),
      reactions: [],
      isPinned: false,
      isResolved: false
    };

    sendMessage({
      type: 'comment-reply',
      data: { parentId, reply: fullReply }
    });

    // Optimistically update local state
    setState(prev => ({
      ...prev,
      comments: prev.comments.map(comment =>
        comment.id === parentId
          ? {
              ...comment,
              thread: [...(comment.thread || []), fullReply]
            }
          : comment
      )
    }));
  }, [sendMessage]);

  const addReaction = useCallback((commentId: string, reaction: { type: 'like' | 'love' | 'laugh' | 'dislike'; userId: string; userName: string }) => {
    sendMessage({
      type: 'reaction-add',
      data: { commentId, reaction }
    });

    // Optimistically update local state
    setState(prev => ({
      ...prev,
      comments: prev.comments.map(comment =>
        comment.id === commentId
          ? {
              ...comment,
              reactions: [...comment.reactions.filter(r => !(r.userId === reaction.userId && r.type === reaction.type)), reaction]
            }
          : comment
      )
    }));
  }, [sendMessage]);

  const removeReaction = useCallback((commentId: string, userId: string, type: string) => {
    sendMessage({
      type: 'reaction-remove',
      data: { commentId, userId, type }
    });

    // Optimistically update local state
    setState(prev => ({
      ...prev,
      comments: prev.comments.map(comment =>
        comment.id === commentId
          ? {
              ...comment,
              reactions: comment.reactions.filter(r => !(r.userId === userId && r.type === type))
            }
          : comment
      )
    }));
  }, [sendMessage]);

  const mentionUser = useCallback((userName: string) => {
    sendMessage({
      type: 'mention',
      data: { mentionedUser: userName, mentionedBy: userId }
    });
  }, [userId, sendMessage]);

  // Presence management
  const updatePresence = useCallback((isTyping: boolean, isViewing = true) => {
    sendMessage({
      type: 'presence-update',
      data: {
        userId,
        userName,
        userAvatar,
        isTyping,
        isViewing,
        lastActivity: new Date()
      }
    });
  }, [userId, userName, userAvatar, sendMessage]);

  // Initialize connection
  useEffect(() => {
    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence(false, false);
      } else {
        updatePresence(false, true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => { document.removeEventListener('visibilitychange', handleVisibilityChange); };
  }, [updatePresence]);

  // Auto-cleanup inactive cursors
  useEffect(() => {
    const interval = setInterval(() => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      setState(prev => ({
        ...prev,
        cursors: prev.cursors.filter(cursor => cursor.lastActivity > fiveMinutesAgo)
      }));
    }, 60000); // Check every minute

    return () => { clearInterval(interval); };
  }, []);

  // Inscrever-se em comentários
  useEffect(() => {
    if (!user) return;

    const commentsChannel = subscribe(`comments:${documentId}`, {
      event: '*',
      schema: 'public',
      table: 'comments',
      filter: `document_id=eq.${documentId}`,
    }, (payload) => {
      if (payload.eventType === 'INSERT') {
        setState(prev => ({
          ...prev,
          comments: [...prev.comments, payload.new as Comment],
        }));
      } else if (payload.eventType === 'UPDATE') {
        setState(prev => ({
          ...prev,
          comments: prev.comments.map(comment =>
            comment.id === payload.new.id ? payload.new as Comment : comment
          ),
        }));
      } else if (payload.eventType === 'DELETE') {
        setState(prev => ({
          ...prev,
          comments: prev.comments.filter(comment => comment.id !== payload.old.id),
        }));
      }
    });

    return () => {
      unsubscribe(commentsChannel);
    };
  }, [documentId, user, subscribe, unsubscribe]);

  // Inscrever-se em cursores
  useEffect(() => {
    if (!user) return;

    const cursorsChannel = subscribe(`cursors:${documentId}`, {
      event: '*',
      schema: 'public',
      table: 'cursor_positions',
      filter: `document_id=eq.${documentId}`,
    }, (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const cursor = payload.new;
        setState(prev => ({
          ...prev,
          cursors: {
            ...prev.cursors,
            [cursor.userId]: cursor,
          },
        }));
      } else if (payload.eventType === 'DELETE') {
        const cursor = payload.old;
        setState(prev => {
          const newCursors = { ...prev.cursors };
          delete newCursors[cursor.userId];
          return {
            ...prev,
            cursors: newCursors,
          };
        });
      }
    });

    return () => {
      unsubscribe(cursorsChannel);
    };
  }, [documentId, user, subscribe, unsubscribe]);

  // Inscrever-se em presenças
  useEffect(() => {
    if (!user) return;

    const presencesChannel = subscribe(`presence:${documentId}`, {
      event: '*',
      schema: 'public',
      table: 'presences',
      filter: `document_id=eq.${documentId}`,
    }, (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const presence = payload.new;
        setState(prev => ({
          ...prev,
          presences: {
            ...prev.presences,
            [presence.userId]: presence,
          },
        }));
      } else if (payload.eventType === 'DELETE') {
        const presence = payload.old;
        setState(prev => {
          const newPresences = { ...prev.presences };
          delete newPresences[presence.userId];
          return {
            ...prev,
            presences: newPresences,
          };
        });
      }
    });

    return () => {
      unsubscribe(presencesChannel);
    };
  }, [documentId, user, subscribe, unsubscribe]);

  // Inscrever-se em conflitos
  useEffect(() => {
    if (!user) return;

    const conflictsChannel = subscribe(`conflicts:${documentId}`, {
      event: '*',
      schema: 'public',
      table: 'document_conflicts',
      filter: `document_id=eq.${documentId}`,
    }, (payload) => {
      if (payload.eventType === 'INSERT') {
        setState(prev => ({
          ...prev,
          conflicts: [...prev.conflicts, payload.new],
        }));
      } else if (payload.eventType === 'UPDATE') {
        setState(prev => ({
          ...prev,
          conflicts: prev.conflicts.map(conflict =>
            conflict.id === payload.new.id ? payload.new : conflict
          ),
        }));
      } else if (payload.eventType === 'DELETE') {
        setState(prev => ({
          ...prev,
          conflicts: prev.conflicts.filter(conflict => conflict.id !== payload.old.id),
        }));
      }
    });

    return () => {
      unsubscribe(conflictsChannel);
    };
  }, [documentId, user, subscribe, unsubscribe]);

  // Inscrever-se em operações
  useEffect(() => {
    if (!user) return;

    const operationsChannel = subscribe(`operations:${documentId}`, {
      event: '*',
      schema: 'public',
      table: 'document_operations',
      filter: `document_id=eq.${documentId}`,
    }, (payload) => {
      if (payload.eventType === 'INSERT') {
        setState(prev => ({
          ...prev,
          operations: [...prev.operations, payload.new],
        }));
      }
    });

    return () => {
      unsubscribe(operationsChannel);
    };
  }, [documentId, user, subscribe, unsubscribe]);

  const addCommentRealtime = useCallback(async (comment: Comment) => {
    if (!user) return;

    const channel = subscribe(`comments:${documentId}`, {
      event: 'INSERT',
      schema: 'public',
      table: 'comments',
      filter: `document_id=eq.${documentId}`,
    }, () => {});

    try {
      await channel.send({
        type: 'broadcast',
        event: 'comment_add',
        payload: comment,
      });
    } finally {
      unsubscribe(channel);
    }
  }, [documentId, user, subscribe, unsubscribe]);

  const updateCommentRealtime = useCallback(async (comment: Comment) => {
    if (!user) return;

    const channel = subscribe(`comments:${documentId}`, {
      event: 'UPDATE',
      schema: 'public',
      table: 'comments',
      filter: `document_id=eq.${documentId}`,
    }, () => {});

    try {
      await channel.send({
        type: 'broadcast',
        event: 'comment_update',
        payload: comment,
      });
    } finally {
      unsubscribe(channel);
    }
  }, [documentId, user, subscribe, unsubscribe]);

  const deleteCommentRealtime = useCallback(async (commentId: string) => {
    if (!user) return;

    const channel = subscribe(`comments:${documentId}`, {
      event: 'DELETE',
      schema: 'public',
      table: 'comments',
      filter: `document_id=eq.${documentId}`,
    }, () => {});

    try {
      await channel.send({
        type: 'broadcast',
        event: 'comment_delete',
        payload: { commentId },
      });
    } finally {
      unsubscribe(channel);
    }
  }, [documentId, user, subscribe, unsubscribe]);

  const updateCursorRealtime = useCallback(async (x: number, y: number) => {
    if (!user) return;

    const channel = subscribe(`cursors:${documentId}`, {
      event: '*',
      schema: 'public',
      table: 'cursor_positions',
      filter: `document_id=eq.${documentId}`,
    }, () => {});

    try {
      await channel.send({
        type: 'broadcast',
        event: 'cursor_move',
        payload: {
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          x,
          y,
          lastUpdate: Date.now(),
        },
      });
    } finally {
      unsubscribe(channel);
    }
  }, [documentId, user, subscribe, unsubscribe]);

  const updatePresenceRealtime = useCallback(async (section?: string) => {
    if (!user) return;

    const channel = subscribe(`presence:${documentId}`, {
      event: '*',
      schema: 'public',
      table: 'presences',
      filter: `document_id=eq.${documentId}`,
    }, () => {});

    try {
      await channel.send({
        type: 'broadcast',
        event: 'presence_update',
        payload: {
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          lastSeen: Date.now(),
          status: 'online',
          currentSection: section,
        },
      });
    } finally {
      unsubscribe(channel);
    }
  }, [documentId, user, subscribe, unsubscribe]);

  const applyOperationRealtime = useCallback(async (operation: any) => {
    if (!user) return;

    const channel = subscribe(`operations:${documentId}`, {
      event: '*',
      schema: 'public',
      table: 'document_operations',
      filter: `document_id=eq.${documentId}`,
    }, () => {});

    try {
      await channel.send({
        type: 'broadcast',
        event: 'operation_apply',
        payload: {
          ...operation,
          userId: user.id,
          userName: user.name,
          timestamp: Date.now(),
        },
      });
    } finally {
      unsubscribe(channel);
    }
  }, [documentId, user, subscribe, unsubscribe]);

  const resolveConflictRealtime = useCallback(async (conflictId: string, resolution: 'keep' | 'discard' | 'merge') => {
    if (!user) return;

    const channel = subscribe(`conflicts:${documentId}`, {
      event: '*',
      schema: 'public',
      table: 'document_conflicts',
      filter: `document_id=eq.${documentId}`,
    }, () => {});

    try {
      await channel.send({
        type: 'broadcast',
        event: 'conflict_resolve',
        payload: {
          conflictId,
          resolution,
          resolvedBy: user.id,
          resolvedAt: Date.now(),
        },
      });
    } finally {
      unsubscribe(channel);
    }
  }, [documentId, user, subscribe, unsubscribe]);

  return {
    // State
    ...state,

    // Cursor management
    updateCursor,
    updateSelection,

    // Operation management
    sendOperation,
    receiveOperation,

    // Comment management
    addComment,
    updateComment,
    deleteComment,
    replyToComment,
    addReaction,
    removeReaction,
    mentionUser,

    // Presence management
    updatePresence,

    // Connection management
    reconnect: connectWebSocket,
    disconnect: () => wsRef.current?.close(),

    // Utilities
    isConnected: state.isOnline && wsRef.current?.readyState === WebSocket.OPEN,
    getActiveCollaborators: () => state.cursors.filter(cursor => {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      return cursor.lastActivity > oneMinuteAgo;
    }),
    getCollaborationStats: () => ({
      totalOperations: state.operations.length,
      totalComments: state.comments.length,
      activeUsers: state.cursors.length,
      latency: state.latency,
      conflicts: state.conflictCount
    }),

    // Realtime management
    addCommentRealtime,
    updateCommentRealtime,
    deleteCommentRealtime,
    updateCursorRealtime,
    updatePresenceRealtime,
    applyOperationRealtime,
    resolveConflictRealtime,
  };
}; 