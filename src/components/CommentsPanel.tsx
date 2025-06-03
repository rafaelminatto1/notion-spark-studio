
import React, { useState } from 'react';
import { MessageCircle, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CommentItem } from '@/components/CommentItem';
import { Comment } from '@/types';
import { cn } from '@/lib/utils';

interface CommentsPanelProps {
  comments: Comment[];
  isAddingComment: boolean;
  commentPosition: { x: number; y: number };
  onAddComment: (content: string) => void;
  onUpdateComment: (commentId: string, content: string) => void;
  onDeleteComment: (commentId: string) => void;
  onCancelAddingComment: () => void;
  className?: string;
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({
  comments,
  isAddingComment,
  commentPosition,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onCancelAddingComment,
  className
}) => {
  const [newCommentContent, setNewCommentContent] = useState('');

  const handleAddComment = () => {
    if (newCommentContent.trim()) {
      onAddComment(newCommentContent.trim());
      setNewCommentContent('');
    }
  };

  const handleCancel = () => {
    setNewCommentContent('');
    onCancelAddingComment();
  };

  return (
    <div className={cn("relative", className)}>
      {/* Comentários existentes posicionados absolutamente */}
      {comments.map(comment => (
        <div
          key={comment.id}
          className="absolute z-10"
          style={{
            left: comment.x,
            top: comment.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          {/* Indicador visual */}
          <div className="mb-1 flex justify-center">
            <div className="bg-notion-purple rounded-full p-1">
              <MessageCircle className="h-3 w-3 text-white" />
            </div>
          </div>
          
          {/* Comentário */}
          <CommentItem
            comment={comment}
            onUpdate={onUpdateComment}
            onDelete={onDeleteComment}
          />
        </div>
      ))}

      {/* Formulário para novo comentário */}
      {isAddingComment && (
        <div
          className="absolute z-20"
          style={{
            left: commentPosition.x,
            top: commentPosition.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          {/* Indicador visual */}
          <div className="mb-1 flex justify-center">
            <div className="bg-notion-blue rounded-full p-1 animate-pulse">
              <Plus className="h-3 w-3 text-white" />
            </div>
          </div>

          {/* Formulário */}
          <div className="bg-notion-dark border border-notion-dark-border rounded-lg p-3 shadow-lg min-w-64">
            <div className="space-y-2">
              <Input
                value={newCommentContent}
                onChange={(e) => setNewCommentContent(e.target.value)}
                placeholder="Adicionar comentário..."
                className="text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddComment();
                  if (e.key === 'Escape') handleCancel();
                }}
                autoFocus
              />
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="h-6 px-2 text-xs"
                >
                  <X className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddComment}
                  className="h-6 px-2 text-xs text-notion-purple hover:text-notion-purple/80"
                  disabled={!newCommentContent.trim()}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
