import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRealtime } from '@/hooks/useRealtime';
import { Avatar } from '@/components/ui/avatar';

interface CursorPosition {
  x: number;
  y: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  lastUpdate: number;
}

interface LiveCursorsProps {
  documentId: string;
}

export const LiveCursors: React.FC<LiveCursorsProps> = ({ documentId }) => {
  const { user } = useAuth();
  const { subscribe, unsubscribe } = useRealtime();
  const cursorsRef = useRef<Record<string, CursorPosition>>({});
  const containerRef = useRef<HTMLDivElement>(null);
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
    <div ref={containerRef} className="relative w-full h-full">
      {Object.entries(cursorsRef.current).map(([userId, cursor]) => (
        <div
          key={userId}
          id={`cursor-${userId}`}
          className="absolute pointer-events-none transition-transform duration-100"
          style={{
            transform: `translate(${cursor.x}px, ${cursor.y}px)`,
          }}
        >
          <div className="flex items-center space-x-2">
            <Avatar src={cursor.userAvatar} alt={cursor.userName} size="sm" />
            <div className="bg-primary text-primary-foreground px-2 py-1 rounded-md text-sm">
              {cursor.userName}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}; 