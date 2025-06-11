import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useCollaboration } from '@/hooks/useCollaboration';
import { CollaboratorCursor } from './LiveCursors';
import { Operation } from './OperationalTransform';
import { Comment } from './CommentsSystem';
import { toast } from 'sonner';

interface CollaborationContextType {
  // State
  cursors: CollaboratorCursor[];
  operations: Operation[];
  comments: Comment[];
  isOnline: boolean;
  latency: number;
  conflictCount: number;
  isConnected: boolean;

  // Cursor management
  updateCursor: (position: { x: number; y: number; line: number; column: number }) => void;
  updateSelection: (selection: { start: { line: number; column: number }; end: { line: number; column: number } }) => void;

  // Operation management
  sendOperation: (operation: Operation) => void;
  receiveOperation: (callback: (operation: Operation) => void) => () => void;

  // Comment management
  addComment: (comment: Omit<Comment, 'id' | 'createdAt' | 'reactions' | 'thread' | 'isPinned' | 'isResolved'>) => void;
  updateComment: (commentId: string, updates: Partial<Comment>) => void;
  deleteComment: (commentId: string) => void;
  replyToComment: (parentId: string, reply: Omit<Comment, 'id' | 'createdAt' | 'reactions' | 'thread' | 'isPinned' | 'isResolved'>) => void;
  addReaction: (commentId: string, reaction: { type: 'like' | 'love' | 'laugh' | 'dislike'; userId: string; userName: string }) => void;
  removeReaction: (commentId: string, userId: string, type: string) => void;
  mentionUser: (userName: string) => void;

  // Presence management
  updatePresence: (isTyping: boolean, isViewing?: boolean) => void;

  // Connection management
  reconnect: () => void;
  disconnect: () => void;

  // Utilities
  getActiveCollaborators: () => CollaboratorCursor[];
  getCollaborationStats: () => {
    totalOperations: number;
    totalComments: number;
    activeUsers: number;
    latency: number;
    conflicts: number;
  };
}

const CollaborationContext = createContext<CollaborationContextType | null>(null);

interface CollaborationProviderProps {
  children: ReactNode;
  documentId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  websocketUrl?: string;
  onContentChange?: (content: string) => void;
  enabled?: boolean;
}

export const CollaborationProvider: React.FC<CollaborationProviderProps> = ({
  children,
  documentId,
  userId,
  userName,
  userAvatar,
  websocketUrl,
  onContentChange,
  enabled = true
}) => {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const collaboration = useCollaboration({
    documentId,
    userId,
    userName,
    userAvatar,
    websocketUrl,
    onContentChange,
    onError: (error) => {
      console.error('🚨 Collaboration error:', error);
      setConnectionStatus('error');
      
      toast.error('Erro de Colaboração', {
        description: 'Não foi possível conectar ao servidor de colaboração. Tentando reconectar...',
        action: {
          label: 'Reconectar',
          onClick: () => collaboration.reconnect()
        }
      });
    }
  });

  // Monitor connection status
  useEffect(() => {
    if (!enabled) {
      setConnectionStatus('disconnected');
      return;
    }

    if (collaboration.isConnected) {
      setConnectionStatus('connected');
      setLastSyncTime(new Date());
      
      if (connectionStatus === 'connecting' || connectionStatus === 'error') {
        toast.success('Colaboração Ativa', {
          description: `Conectado como ${userName}. Colaboração em tempo real habilitada.`
        });
      }
    } else if (collaboration.isOnline) {
      setConnectionStatus('connecting');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [collaboration.isConnected, collaboration.isOnline, enabled, userName, connectionStatus]);

  // Handle new collaborators joining
  useEffect(() => {
    const activeCollaborators = collaboration.getActiveCollaborators();
    const previousCount = collaboration.cursors.length;
    const currentCount = activeCollaborators.length;

    if (currentCount > previousCount && currentCount > 1) {
      const newCollaborator = activeCollaborators[activeCollaborators.length - 1];
      toast.info('Novo Colaborador', {
        description: `${newCollaborator.userName} entrou no documento`,
        duration: 3000
      });
    }
  }, [collaboration.cursors.length, collaboration.getActiveCollaborators]);

  // Handle conflicts
  useEffect(() => {
    if (collaboration.conflictCount > 0) {
      toast.warning('Conflito de Edição', {
        description: 'Um conflito foi detectado e resolvido automaticamente.',
        duration: 4000
      });
    }
  }, [collaboration.conflictCount]);

  // Auto-sync indicator
  useEffect(() => {
    if (collaboration.isConnected) {
      const interval = setInterval(() => {
        setLastSyncTime(new Date());
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [collaboration.isConnected]);

  // Provide mock implementation when collaboration is disabled
  const mockCollaboration: CollaborationContextType = {
    cursors: [],
    operations: [],
    comments: [],
    isOnline: false,
    latency: 0,
    conflictCount: 0,
    isConnected: false,
    updateCursor: () => {},
    updateSelection: () => {},
    sendOperation: () => {},
    receiveOperation: () => () => {},
    addComment: () => {},
    updateComment: () => {},
    deleteComment: () => {},
    replyToComment: () => {},
    addReaction: () => {},
    removeReaction: () => {},
    mentionUser: () => {},
    updatePresence: () => {},
    reconnect: () => {},
    disconnect: () => {},
    getActiveCollaborators: () => [],
    getCollaborationStats: () => ({
      totalOperations: 0,
      totalComments: 0,
      activeUsers: 0,
      latency: 0,
      conflicts: 0
    })
  };

  const contextValue = enabled ? collaboration : mockCollaboration;

  return (
    <CollaborationContext.Provider value={contextValue}>
      {children}

      {/* Connection Status Indicator */}
      {enabled && (
        <div className="fixed bottom-4 left-4 z-50">
          <div className={`
            flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300
            ${connectionStatus === 'connected' 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : connectionStatus === 'connecting'
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              : connectionStatus === 'error'
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
            }
          `}>
            <div className={`
              w-2 h-2 rounded-full
              ${connectionStatus === 'connected' 
                ? 'bg-green-400 animate-pulse' 
                : connectionStatus === 'connecting'
                ? 'bg-yellow-400 animate-pulse'
                : connectionStatus === 'error'
                ? 'bg-red-400'
                : 'bg-gray-400'
              }
            `} />
            
            <span>
              {connectionStatus === 'connected' && `Colaboração Ativa`}
              {connectionStatus === 'connecting' && 'Conectando...'}
              {connectionStatus === 'error' && 'Erro de Conexão'}
              {connectionStatus === 'disconnected' && 'Offline'}
            </span>

            {connectionStatus === 'connected' && collaboration.latency > 0 && (
              <span className="text-gray-400">
                • {collaboration.latency}ms
              </span>
            )}

            {collaboration.getActiveCollaborators().length > 0 && (
              <span className="text-gray-400">
                • {collaboration.getActiveCollaborators().length + 1} usuários
              </span>
            )}
          </div>

          {lastSyncTime && connectionStatus === 'connected' && (
            <div className="text-xs text-gray-500 mt-1 text-center">
              Última sync: {lastSyncTime.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}

      {/* Collaboration Stats (Development only) */}
      {process.env.NODE_ENV === 'development' && enabled && (
        <div className="fixed top-4 left-4 bg-black/80 text-white text-xs p-3 rounded-lg font-mono z-50">
          <div className="font-bold mb-2">📊 Collaboration Stats</div>
          <div>Status: {connectionStatus}</div>
          <div>Operations: {collaboration.operations.length}</div>
          <div>Comments: {collaboration.comments.length}</div>
          <div>Active Users: {collaboration.getActiveCollaborators().length + 1}</div>
          <div>Latency: {collaboration.latency}ms</div>
          <div>Conflicts: {collaboration.conflictCount}</div>
          {lastSyncTime && (
            <div>Last Sync: {lastSyncTime.toLocaleTimeString()}</div>
          )}
        </div>
      )}
    </CollaborationContext.Provider>
  );
};

export const useCollaborationContext = (): CollaborationContextType => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaborationContext must be used within a CollaborationProvider');
  }
  return context;
};

export default CollaborationProvider; 