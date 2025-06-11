import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Eye, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CollaboratorCursor {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  userAvatar?: string;
  position: {
    x: number;
    y: number;
    line: number;
    column: number;
  };
  selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  lastActivity: Date;
  isTyping: boolean;
  isViewing: boolean;
}

interface LiveCursorsProps {
  collaborators: CollaboratorCursor[];
  currentUserId: string;
  containerRef: React.RefObject<HTMLElement>;
  onCursorUpdate: (position: { x: number; y: number; line: number; column: number }) => void;
  onSelectionUpdate: (selection: { start: { line: number; column: number }; end: { line: number; column: number } }) => void;
  className?: string;
}

export const LiveCursors: React.FC<LiveCursorsProps> = ({
  collaborators,
  currentUserId,
  containerRef,
  onCursorUpdate,
  onSelectionUpdate,
  className
}) => {
  const [isActive, setIsActive] = useState(true);
  const [showTooltips, setShowTooltips] = useState(true);

  // Filter out current user and inactive collaborators
  const activeCursors = useMemo(() => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return collaborators.filter(cursor => 
      cursor.userId !== currentUserId && 
      cursor.lastActivity > fiveMinutesAgo
    );
  }, [collaborators, currentUserId]);

  // Handle mouse movement tracking
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isActive || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate approximate line and column based on position
    const lineHeight = 24; // Approximate line height
    const charWidth = 8; // Approximate character width
    const line = Math.floor(y / lineHeight);
    const column = Math.floor(x / charWidth);

    onCursorUpdate({ x, y, line, column });
  }, [isActive, containerRef, onCursorUpdate]);

  // Handle text selection tracking
  const handleSelectionChange = useCallback(() => {
    if (!isActive) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const startContainer = range.startContainer;
    const endContainer = range.endContainer;

    // Simplified line/column calculation
    const startLine = 0; // Would need proper text parsing
    const startColumn = range.startOffset;
    const endLine = 0;
    const endColumn = range.endOffset;

    onSelectionUpdate({
      start: { line: startLine, column: startColumn },
      end: { line: endLine, column: endColumn }
    });
  }, [isActive, onSelectionUpdate]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleMouseMove, handleSelectionChange, containerRef]);

  const CursorTooltip = ({ cursor }: { cursor: CollaboratorCursor }) => (
    <div className="absolute z-50 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 10 }}
        className="bg-black/90 text-white text-xs px-2 py-1 rounded-lg shadow-lg backdrop-blur-sm"
        style={{ 
          transform: `translate(${cursor.position.x + 15}px, ${cursor.position.y - 35}px)`,
          borderColor: cursor.userColor 
        }}
      >
        <div className="flex items-center gap-2">
          {cursor.userAvatar ? (
            <img 
              src={cursor.userAvatar} 
              alt={cursor.userName}
              className="w-4 h-4 rounded-full"
            />
          ) : (
            <div 
              className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: cursor.userColor }}
            >
              {cursor.userName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-medium">{cursor.userName}</span>
          {cursor.isTyping && (
            <div className="flex gap-0.5">
              <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
          {cursor.isViewing && !cursor.isTyping && (
            <Eye className="w-3 h-3" />
          )}
        </div>
      </motion.div>
    </div>
  );

  const CollaboratorCursor = ({ cursor }: { cursor: CollaboratorCursor }) => (
    <div className="absolute pointer-events-none z-40">
      {/* Selection highlight */}
      {cursor.selection && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          exit={{ opacity: 0 }}
          className="absolute rounded"
          style={{
            backgroundColor: cursor.userColor,
            // Simplified positioning - would need proper text measurement
            left: cursor.position.x,
            top: cursor.position.y,
            width: Math.abs((cursor.selection.end.column - cursor.selection.start.column) * 8),
            height: 24,
          }}
        />
      )}

      {/* Cursor */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
        className="absolute"
        style={{
          transform: `translate(${cursor.position.x}px, ${cursor.position.y}px)`,
        }}
      >
        {/* Cursor line */}
        <motion.div
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          className="w-0.5 h-6 rounded-full"
          style={{ backgroundColor: cursor.userColor }}
        />

        {/* Cursor flag */}
        <div 
          className="absolute -top-1 -left-1 w-3 h-4 rounded-sm shadow-lg"
          style={{ backgroundColor: cursor.userColor }}
        >
          <div className="absolute top-full left-0 w-0 h-0 border-l-[6px] border-t-[4px] border-transparent"
            style={{ borderTopColor: cursor.userColor }}
          />
        </div>

        {/* User indicator */}
        <div 
          className="absolute -top-3 left-4 w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-bold text-white"
          style={{ backgroundColor: cursor.userColor }}
        >
          {cursor.userAvatar ? (
            <img 
              src={cursor.userAvatar} 
              alt={cursor.userName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            cursor.userName.charAt(0).toUpperCase()
          )}
        </div>
      </motion.div>

      {/* Tooltip */}
      {showTooltips && <CursorTooltip cursor={cursor} />}
    </div>
  );

  return (
    <div className={cn("relative pointer-events-none", className)}>
      <AnimatePresence>
        {activeCursors.map((cursor) => (
          <CollaboratorCursor key={cursor.id} cursor={cursor} />
        ))}
      </AnimatePresence>

      {/* Collaborators indicator */}
      {activeCursors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed top-4 right-4 bg-workspace-surface/90 backdrop-blur-sm rounded-lg p-3 border border-white/10 shadow-lg pointer-events-auto z-50"
        >
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-white">
              Colaboradores ({activeCursors.length})
            </span>
          </div>
          
          <div className="space-y-1">
            {activeCursors.map((cursor) => (
              <div key={cursor.id} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cursor.userColor }}
                />
                <span className="text-gray-300 truncate max-w-20">
                  {cursor.userName}
                </span>
                {cursor.isTyping && (
                  <Edit3 className="w-3 h-3 text-blue-400" />
                )}
                {cursor.isViewing && !cursor.isTyping && (
                  <Eye className="w-3 h-3 text-gray-400" />
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowTooltips(!showTooltips)}
            className="mt-2 text-xs text-gray-400 hover:text-white transition-colors"
          >
            {showTooltips ? 'Ocultar nomes' : 'Mostrar nomes'}
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default LiveCursors; 