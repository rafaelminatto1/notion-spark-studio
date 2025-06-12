import { useState, useEffect, useCallback } from 'react';
import { Comment } from '@/types/comments';
import { useSupabase } from '@/hooks/useSupabase';
import { useRealtime } from '@/hooks/useRealtime';

export const useComments = (documentId: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { supabase } = useSupabase();
  const { subscribe, unsubscribe } = useRealtime();

  // Carregar comentários iniciais
  useEffect(() => {
    const loadComments = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .eq('document_id', documentId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setComments(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erro ao carregar comentários'));
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, [documentId, supabase]);

  // Inscrever-se em atualizações em tempo real
  useEffect(() => {
    const channel = subscribe(`comments:${documentId}`, {
      event: '*',
      schema: 'public',
      table: 'comments',
      filter: `document_id=eq.${documentId}`,
    }, (payload) => {
      if (payload.eventType === 'INSERT') {
        setComments(prev => [...prev, payload.new as Comment]);
      } else if (payload.eventType === 'UPDATE') {
        setComments(prev => 
          prev.map(comment => 
            comment.id === payload.new.id ? payload.new as Comment : comment
          )
        );
      } else if (payload.eventType === 'DELETE') {
        setComments(prev => 
          prev.filter(comment => comment.id !== payload.old.id)
        );
      }
    });

    return () => {
      unsubscribe(channel);
    };
  }, [documentId, subscribe, unsubscribe]);

  const addComment = useCallback(async (comment: Comment) => {
    try {
      const { error } = await supabase
        .from('comments')
        .insert(comment);

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao adicionar comentário'));
      throw err;
    }
  }, [supabase]);

  const updateComment = useCallback(async (comment: Comment) => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({
          content: comment.content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', comment.id);

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao atualizar comentário'));
      throw err;
    }
  }, [supabase]);

  const deleteComment = useCallback(async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao excluir comentário'));
      throw err;
    }
  }, [supabase]);

  return {
    comments,
    loading,
    error,
    addComment,
    updateComment,
    deleteComment,
  };
};
