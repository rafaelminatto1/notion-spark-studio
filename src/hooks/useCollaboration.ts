import { useState, useEffect, useCallback, useRef } from 'react';
import { CollaboratorCursor } from '@/components/collaboration/LiveCursors';
import { Operation } from '@/components/collaboration/OperationalTransform';
import { Comment } from '@/components/collaboration/CommentsSystem';
import { v4 as uuidv4 } from 'uuid';

export interface CollaborationState {
  cursors: CollaboratorCursor[];
  operations: Operation[];
  comments: Comment[];
  isOnline: boolean;
  latency: number;
  conflictCount: number;
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
  websocketUrl = 'ws://localhost:8080/collaboration',
  onContentChange,
  onError
}: UseCollaborationProps) => {
  const [state, setState] = useState<CollaborationState>({
    cursors: [],
    operations: [],
    comments: [],
    isOnline: false,
    latency: 0,
    conflictCount: 0
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
  const updatePresence = useCallback((isTyping: boolean, isViewing: boolean = true) => {
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
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
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

    return () => clearInterval(interval);
  }, []);

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
    })
  };
}; 