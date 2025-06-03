
import React, { useState } from 'react';
import { MessageCircle, Trash2, Edit2, Check, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Comment } from '@/types';
import { cn } from '@/lib/utils';

interface CommentItemProps {
  comment: Comment;
  onUpdate: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  className?: string;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onUpdate,
  onDelete,
  className
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const handleSave = () => {
    if (editContent.trim()) {
      onUpdate(comment.id, editContent.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  return (
    <div className={cn(
      "bg-notion-dark border border-notion-dark-border rounded-lg p-3 shadow-lg min-w-64 max-w-80",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">{comment.author}</span>
        </div>
        <div className="flex items-center gap-1">
          {!isEditing && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(comment.id)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="space-y-2">
          <Input
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="text-sm"
            placeholder="Editar comentário..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
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
              onClick={handleSave}
              className="h-6 px-2 text-xs text-green-400 hover:text-green-300"
            >
              <Check className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-200 leading-relaxed">{comment.content}</p>
      )}

      {/* Footer */}
      <div className="mt-2 pt-2 border-t border-notion-dark-border">
        <span className="text-xs text-gray-500">
          {comment.createdAt.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>
    </div>
  );
};
