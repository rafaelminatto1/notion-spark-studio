
import { useState, useCallback } from 'react';
import { Comment } from '@/types';

export const useComments = (fileId: string | null, comments: Comment[] = []) => {
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [commentPosition, setCommentPosition] = useState({ x: 0, y: 0 });

  const addComment = useCallback((content: string, elementId: string, x: number, y: number) => {
    if (!fileId) return null;

    const newComment: Comment = {
      id: Date.now().toString(),
      content,
      author: 'Usuário',
      createdAt: new Date(),
      x,
      y,
      elementId
    };

    return newComment;
  }, [fileId]);

  const deleteComment = useCallback((commentId: string) => {
    return comments.filter(comment => comment.id !== commentId);
  }, [comments]);

  const updateComment = useCallback((commentId: string, newContent: string) => {
    return comments.map(comment =>
      comment.id === commentId
        ? { ...comment, content: newContent }
        : comment
    );
  }, [comments]);

  const getCommentsForElement = useCallback((elementId: string) => {
    return comments.filter(comment => comment.elementId === elementId);
  }, [comments]);

  const startAddingComment = useCallback((x: number, y: number) => {
    setCommentPosition({ x, y });
    setIsAddingComment(true);
  }, []);

  const cancelAddingComment = useCallback(() => {
    setIsAddingComment(false);
    setCommentPosition({ x: 0, y: 0 });
  }, []);

  return {
    selectedComment,
    setSelectedComment,
    isAddingComment,
    commentPosition,
    addComment,
    deleteComment,
    updateComment,
    getCommentsForElement,
    startAddingComment,
    cancelAddingComment
  };
};
