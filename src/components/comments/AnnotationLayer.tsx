import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { Comment } from '@/types/comments';
import { ThreadedComments } from './ThreadedComments';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MessageSquare } from 'lucide-react';

interface AnnotationLayerProps {
  documentId: string;
  onAnnotationAdd?: (comment: Comment) => void;
  onAnnotationUpdate?: (comment: Comment) => void;
  onAnnotationDelete?: (commentId: string) => void;
}

export const AnnotationLayer: React.FC<AnnotationLayerProps> = ({
  documentId,
  onAnnotationAdd,
  onAnnotationUpdate,
  onAnnotationDelete,
}) => {
  const { user } = useAuth();
  const [selectedText, setSelectedText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [annotationPosition, setAnnotationPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection?.toString().trim()) {
      setSelectedText('');
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (containerRect) {
      setAnnotationPosition({
        x: rect.left - containerRect.left,
        y: rect.bottom - containerRect.top + 5,
      });
    }

    setSelectedText(selection.toString());
  }, []);

  const handleAnnotationAdd = useCallback(async (content: string) => {
    if (!user || !selectedText) return;

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      content: '',
      authorId: user?.id ?? 'anonymous',
      authorName: user?.name ?? 'Usuário Anônimo',
      authorAvatar: user?.avatar || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      resolved: false,
    };

    onAnnotationAdd?.(newComment);
    setSelectedText('');
  }, [user, selectedText, onAnnotationAdd]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mouseup', handleTextSelection);
    return () => {
      container.removeEventListener('mouseup', handleTextSelection);
    };
  }, [handleTextSelection]);

  return (
    <div ref={containerRef} className="relative">
      {selectedText && (
        <div
          className="absolute z-50"
          style={{
            left: `${annotationPosition.x}px`,
            top: `${annotationPosition.y}px`,
          }}
        >
          <Popover open={showComments} onOpenChange={setShowComments}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Anotar
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <ThreadedComments
                documentId={documentId}
                onCommentAdd={onAnnotationAdd}
                onCommentUpdate={onAnnotationUpdate}
                onCommentDelete={onAnnotationDelete}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}; 