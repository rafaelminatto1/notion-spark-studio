
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SupabaseFile {
  id: string;
  user_id: string;
  name: string;
  type: 'file' | 'folder';
  parent_id?: string;
  content?: string;
  emoji?: string;
  description?: string;
  tags?: string[];
  is_public: boolean;
  is_protected: boolean;
  show_in_sidebar: boolean;
  created_at: string;
  updated_at: string;
}

export const useSupabaseFiles = () => {
  const [files, setFiles] = useState<SupabaseFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadFiles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading files:', error);
        toast({
          title: "Erro ao carregar arquivos",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setFiles(data || []);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: "Erro ao carregar arquivos",
        description: "Falha ao carregar arquivos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadFiles();

    // Set up realtime subscription
    const channel = supabase
      .channel('files-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'files'
        },
        (payload) => {
          console.log('Files change:', payload);
          loadFiles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadFiles]);

  const createFile = useCallback(async (
    name: string, 
    parentId?: string, 
    type: 'file' | 'folder' = 'file',
    content?: string,
    emoji?: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('files')
        .insert({
          name,
          type,
          parent_id: parentId,
          content: content || '',
          emoji
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating file:', error);
        toast({
          title: "Erro ao criar arquivo",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Arquivo criado",
        description: `${type === 'folder' ? 'Pasta' : 'Arquivo'} "${name}" criado com sucesso`
      });

      return data.id;
    } catch (error) {
      console.error('Error creating file:', error);
      toast({
        title: "Erro ao criar arquivo",
        description: "Falha ao criar arquivo",
        variant: "destructive"
      });
      return null;
    }
  }, [toast]);

  const updateFile = useCallback(async (id: string, updates: Partial<SupabaseFile>) => {
    try {
      const { error } = await supabase
        .from('files')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating file:', error);
        toast({
          title: "Erro ao atualizar arquivo",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Arquivo atualizado",
        description: "Arquivo salvo com sucesso"
      });
    } catch (error) {
      console.error('Error updating file:', error);
      toast({
        title: "Erro ao atualizar arquivo",
        description: "Falha ao salvar arquivo",
        variant: "destructive"
      });
    }
  }, [toast]);

  const deleteFile = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting file:', error);
        toast({
          title: "Erro ao deletar arquivo",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Arquivo deletado",
        description: "Arquivo removido com sucesso"
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Erro ao deletar arquivo",
        description: "Falha ao remover arquivo",
        variant: "destructive"
      });
    }
  }, [toast]);

  return {
    files,
    loading,
    createFile,
    updateFile,
    deleteFile,
    loadFiles
  };
};
