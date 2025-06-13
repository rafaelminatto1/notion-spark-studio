import React, { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useComments } from '@/hooks/useComments';
import { Comment, CommentThread } from '@/types/comments';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ThreadedCommentsProps {
  documentId: string;
  onCommentAdd?: (comment: Comment) => void;
  onCommentUpdate?: (comment: Comment) => void;
  onCommentDelete?: (commentId: string) => void;
}

export const ThreadedComments: React.FC<ThreadedCommentsProps> = ({
  documentId,
  onCommentAdd,
  onCommentUpdate,
  onCommentDelete,
}) => {
  const { user } = useAuth();
  const { comments, addComment, updateComment, deleteComment } = useComments(documentId);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    const comment: Comment = {
      id: crypto.randomUUID(),
      content: newComment,
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar,
      createdAt: new Date(),
      updatedAt: new Date(),
      x: 0,
      y: 0,
      resolved: false,
      parentId: replyingTo,
    };

    await addComment(comment);
    onCommentAdd?.(comment);
    setNewComment('');
    setReplyingTo(null);
  }, [newComment, user, replyingTo, documentId, addComment, onCommentAdd]);

  const renderComment = (comment: Comment) => {
    const replies = comments.filter(c => c.parentId === comment.id);

    return (
      <div key={comment.id} className="space-y-4">
        <div className="flex space-x-4">
          <Avatar src={comment.authorAvatar} alt={comment.authorName} />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">{comment.authorName}</span>
                <span className="text-sm text-gray-500 ml-2">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>
              {user?.id === comment.authorId && (
                <div className="space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCommentUpdate?.(comment)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCommentDelete?.(comment.id)}
                  >
                    Excluir
                  </Button>
                </div>
              )}
            </div>
            <p className="mt-1">{comment.content}</p>
            <Button
              variant="link"
              size="sm"
              onClick={() => setReplyingTo(comment.id)}
            >
              Responder
            </Button>
          </div>
        </div>
        {replies.length > 0 && (
          <div className="ml-12 space-y-4">
            {replies.map(reply => renderComment(reply))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={replyingTo ? "Escreva sua resposta..." : "Adicione um comentário..."}
          className="min-h-[100px]"
        />
        <div className="flex justify-end space-x-2">
          {replyingTo && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setReplyingTo(null)}
            >
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={!newComment.trim()}>
            {replyingTo ? "Responder" : "Comentar"}
          </Button>
        </div>
      </form>

      <div className="space-y-6">
        {comments
          .filter(comment => !comment.parentId)
          .map(comment => renderComment(comment))}
      </div>
    </div>
  );
}; 