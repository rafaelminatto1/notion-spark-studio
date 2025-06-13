import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRealtime } from '@/hooks/useRealtime';
import { Avatar } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';

interface CursorPosition {
  x: number;
  y: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  lastUpdate: number;
}

export interface CollaboratorCursor {
  userId: string;
  userName: string;
  userAvatar?: string;
  x: number;
  y: number;
  color: string;
  lastSeen: Date;
}

export interface LiveCursorsProps {
  collaborators: CollaboratorCursor[];
  currentUserId: string;
  documentId: string;
  containerRef: React.RefObject<HTMLElement>;
  onCursorUpdate: (position: { x: number; y: number; line: number; column: number }) => void;
  onSelectionUpdate: (selection: { start: number; end: number; text: string }) => void;
  className?: string;
}

export const LiveCursors: React.FC<LiveCursorsProps> = ({
  collaborators,
  currentUserId,
  documentId,
  containerRef,
  onCursorUpdate,
  onSelectionUpdate,
  className = ''
}) => {
  const { user } = useAuth();
  const { subscribe, unsubscribe } = useRealtime();
  const cursorsRef = useRef<Record<string, CursorPosition>>({});
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!user || !containerRef.current) return;

    const container = containerRef.current;
    const channel = subscribe(`cursors:${documentId}`, {
      event: '*',
      schema: 'public',
      table: 'cursor_positions',
      filter: `document_id=eq.${documentId}`,
    }, (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const cursor = payload.new as CursorPosition;
        if (cursor.userId !== user.id) {
          cursorsRef.current[cursor.userId] = {
            ...cursor,
            lastUpdate: Date.now(),
          };
        }
      } else if (payload.eventType === 'DELETE') {
        const cursor = payload.old as CursorPosition;
        delete cursorsRef.current[cursor.userId];
      }
    });

    const handleMouseMove = (e: MouseEvent) => {
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const cursor: CursorPosition = {
        x,
        y,
        userId: user.id,
        userName: user.name || '',
        userAvatar: user.avatar,
        lastUpdate: Date.now(),
      };

      // Atualizar posição local
      cursorsRef.current[user.id] = cursor;

      // Enviar para o servidor
      channel.send({
        type: 'broadcast',
        event: 'cursor_move',
        payload: cursor,
      });
    };

    const animate = () => {
      const now = Date.now();
      const cursors = Object.values(cursorsRef.current);
      const container = containerRef.current;

      if (container) {
        // Remover cursores antigos
        Object.entries(cursorsRef.current).forEach(([userId, cursor]) => {
          if (now - cursor.lastUpdate > 5000) {
            delete cursorsRef.current[userId];
          }
        });

        // Atualizar posições dos cursores
        cursors.forEach(cursor => {
          const element = document.getElementById(`cursor-${cursor.userId}`);
          if (element) {
            element.style.transform = `translate(${cursor.x}px, ${cursor.y}px)`;
          }
        });
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    container.addEventListener('mousemove', handleMouseMove);
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      unsubscribe(channel);
    };
  }, [documentId, user, subscribe, unsubscribe]);

  return (
    <div className={className}>
      <AnimatePresence>
        {collaborators
          .filter(cursor => cursor.userId !== currentUserId)
          .map(cursor => (
            <motion.div
              key={cursor.userId}
              className="absolute pointer-events-none z-50"
              style={{
                left: cursor.x,
                top: cursor.y,
                color: cursor.color
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <div className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cursor.color }}
                />
                <span className="text-xs bg-black text-white px-1 py-0.5 rounded">
                  {cursor.userName}
                </span>
              </div>
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
}; 