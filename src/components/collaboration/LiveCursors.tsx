import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MousePointer2, Cursor } from 'lucide-react';
import { cn } from '@/lib/utils';

// Tipos para cursores em tempo real
interface CursorUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
}

interface CursorPosition {
  x: number;
  y: number;
  lastUpdate: number;
}

interface LiveCursor {
  user: CursorUser;
  position: CursorPosition;
  isTyping: boolean;
  currentElement?: string; // ID do elemento onde está editando
  selectionRange?: {
    start: number;
    end: number;
    text?: string;
  };
}

interface LiveCursorsProps {
  currentUser: CursorUser;
  documentId: string;
  className?: string;
  onCursorMove?: (position: CursorPosition) => void;
  onStartTyping?: (elementId: string) => void;
  onStopTyping?: () => void;
}

// Hook para gerenciar cursores em tempo real
const useLiveCursors = (documentId: string, currentUser: CursorUser) => {
  const [cursors, setCursors] = useState<Map<string, LiveCursor>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  // Simular WebSocket ou real-time connection
  useEffect(() => {
    // TODO: Implementar conexão real com Supabase Realtime ou Socket.io
    const mockConnection = {
      connect: () => {
        setIsConnected(true);
        console.log(`Conectado ao documento ${documentId} como ${currentUser.name}`);
      },
      disconnect: () => {
        setIsConnected(false);
        setCursors(new Map());
      },
      sendCursorUpdate: (position: CursorPosition) => {
        // Simular broadcast para outros usuários
        console.log('Enviando posição do cursor:', position);
      },
      onCursorUpdate: (callback: (userId: string, cursor: LiveCursor) => void) => {
        // Simular recebimento de atualizações de cursor
        // Em produção, isso seria connected via WebSocket
      }
    };

    mockConnection.connect();

    return () => {
      mockConnection.disconnect();
    };
  }, [documentId, currentUser]);

  const updateCursor = useCallback((userId: string, cursor: LiveCursor) => {
    setCursors(prev => {
      const newCursors = new Map(prev);
      newCursors.set(userId, cursor);
      return newCursors;
    });

    // Auto-remove cursors inativos após 5 segundos
    setTimeout(() => {
      setCursors(prev => {
        const newCursors = new Map(prev);
        const existingCursor = newCursors.get(userId);
        if (existingCursor && Date.now() - existingCursor.position.lastUpdate > 5000) {
          newCursors.delete(userId);
        }
        return newCursors;
      });
    }, 5000);
  }, []);

  const removeCursor = useCallback((userId: string) => {
    setCursors(prev => {
      const newCursors = new Map(prev);
      newCursors.delete(userId);
      return newCursors;
    });
  }, []);

  const broadcastCursorPosition = useCallback((position: CursorPosition) => {
    if (!isConnected) return;

    const cursor: LiveCursor = {
      user: currentUser,
      position,
      isTyping: false
    };

    // TODO: Enviar via WebSocket real
    console.log('Broadcasting cursor position:', cursor);
  }, [currentUser, isConnected]);

  const broadcastTypingStatus = useCallback((isTyping: boolean, elementId?: string) => {
    if (!isConnected) return;

    const cursor: LiveCursor = {
      user: currentUser,
      position: { x: 0, y: 0, lastUpdate: Date.now() },
      isTyping,
      currentElement: elementId
    };

    // TODO: Enviar via WebSocket real
    console.log('Broadcasting typing status:', cursor);
  }, [currentUser, isConnected]);

  return {
    cursors: Array.from(cursors.values()),
    isConnected,
    updateCursor,
    removeCursor,
    broadcastCursorPosition,
    broadcastTypingStatus
  };
};

// Componente individual do cursor
interface CursorComponentProps {
  cursor: LiveCursor;
  isVisible: boolean;
}

const CursorComponent: React.FC<CursorComponentProps> = ({ cursor, isVisible }) => {
  const { user, position, isTyping } = cursor;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.15 }}
          className="fixed pointer-events-none z-50"
          style={{
            left: position.x,
            top: position.y,
            transform: 'translate(-2px, -2px)'
          }}
        >
          {/* Cursor Icon */}
          <div 
            className="relative"
            style={{ color: user.color }}
          >
            <MousePointer2 
              className="h-5 w-5 drop-shadow-sm" 
              fill="currentColor"
              stroke="white"
              strokeWidth={0.5}
            />
            
            {/* User Label */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-6 left-0 min-w-max"
            >
              <div 
                className="flex items-center gap-2 px-2 py-1 text-xs text-white rounded-md shadow-lg"
                style={{ backgroundColor: user.color }}
              >
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="h-4 w-4 rounded-full"
                  />
                ) : (
                  <User className="h-3 w-3" />
                )}
                <span className="font-medium">
                  {user.name}
                  {isTyping && (
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="ml-1"
                    >
                      digitando...
                    </motion.span>
                  )}
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Componente principal dos cursores em tempo real
export const LiveCursors: React.FC<LiveCursorsProps> = ({
  currentUser,
  documentId,
  className,
  onCursorMove,
  onStartTyping,
  onStopTyping
}) => {
  const {
    cursors,
    isConnected,
    broadcastCursorPosition,
    broadcastTypingStatus
  } = useLiveCursors(documentId, currentUser);

  // Rastrear movimento do mouse
  useEffect(() => {
    let isThrottled = false;

    const handleMouseMove = (e: MouseEvent) => {
      if (isThrottled) return;
      
      isThrottled = true;
      setTimeout(() => { isThrottled = false; }, 50); // Throttle de 50ms

      const position: CursorPosition = {
        x: e.clientX,
        y: e.clientY,
        lastUpdate: Date.now()
      };

      broadcastCursorPosition(position);
      onCursorMove?.(position);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [broadcastCursorPosition, onCursorMove]);

  // Rastrear estado de digitação
  useEffect(() => {
    let typingTimeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.isContentEditable || target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        const elementId = target.id || target.className;
        
        broadcastTypingStatus(true, elementId);
        onStartTyping?.(elementId);

        // Parar de "digitar" após 2 segundos de inatividade
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
          broadcastTypingStatus(false);
          onStopTyping?.();
        }, 2000);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(typingTimeout);
    };
  }, [broadcastTypingStatus, onStartTyping, onStopTyping]);

  // Status de conexão
  const connectionStatus = useMemo(() => {
    const activeUsers = cursors.length + 1; // +1 para o usuário atual
    return {
      isConnected,
      activeUsers,
      message: isConnected 
        ? `${activeUsers} usuário${activeUsers > 1 ? 's' : ''} ativo${activeUsers > 1 ? 's' : ''}`
        : 'Desconectado'
    };
  }, [cursors.length, isConnected]);

  return (
    <div className={cn("live-cursors-container", className)}>
      {/* Status de Colaboração */}
      <div className="fixed top-4 right-4 z-40">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm rounded-lg shadow-lg border",
            isConnected 
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          )}
        >
          <div 
            className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-green-500" : "bg-red-500"
            )}
          />
          <span className="font-medium">{connectionStatus.message}</span>
        </motion.div>
      </div>

      {/* Renderizar cursores de outros usuários */}
      {cursors.map((cursor) => (
        <CursorComponent
          key={cursor.user.id}
          cursor={cursor}
          isVisible={cursor.user.id !== currentUser.id}
        />
      ))}

      {/* Indicadores de usuários digitando em elementos específicos */}
      <div className="fixed bottom-4 left-4 z-40 space-y-2">
        <AnimatePresence>
          {cursors
            .filter(cursor => cursor.isTyping && cursor.currentElement)
            .map((cursor) => (
              <motion.div
                key={`typing-${cursor.user.id}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-lg"
              >
                {cursor.user.avatar ? (
                  <img 
                    src={cursor.user.avatar} 
                    alt={cursor.user.name}
                    className="h-5 w-5 rounded-full"
                  />
                ) : (
                  <div 
                    className="h-5 w-5 rounded-full flex items-center justify-center text-xs text-white font-medium"
                    style={{ backgroundColor: cursor.user.color }}
                  >
                    {cursor.user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-gray-600">
                  <strong>{cursor.user.name}</strong> está digitando...
                </span>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cursor.user.color }}
                />
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LiveCursors; 