
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from './useSupabaseAuth';

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
  const { user } = useSupabaseAuth();

  const loadFiles = useCallback(async () => {
    if (!user) {
      setFiles([]);
      setLoading(false);
      return;
    }

    try {
      console.log('[useSupabaseFiles] Loading files for user:', user.id);
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[useSupabaseFiles] Error loading files:', error);
        toast({
          title: "Erro ao carregar arquivos",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      // Cast the data to ensure proper typing
      const typedData = data?.map(file => ({
        ...file,
        type: file.type as 'file' | 'folder'
      })) || [];

      console.log('[useSupabaseFiles] Files loaded successfully:', typedData.length);
      setFiles(typedData);
    } catch (error) {
      console.error('[useSupabaseFiles] Error loading files:', error);
      toast({
        title: "Erro ao carregar arquivos",
        description: "Falha ao carregar arquivos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    console.log('[useSupabaseFiles] Setting up subscriptions for user:', user?.id);
    loadFiles();

    if (!user) return;

    // Create a unique channel name to avoid conflicts
    const channelName = `files-changes-${user.id}-${Date.now()}`;
    
    // Set up realtime subscription
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'files',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('[useSupabaseFiles] Realtime update received:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newFile = payload.new as SupabaseFile;
            console.log('[useSupabaseFiles] Adding new file:', newFile);
            setFiles(prev => {
              // Check if file already exists to avoid duplicates
              const exists = prev.find(f => f.id === newFile.id);
              if (exists) {
                console.log('[useSupabaseFiles] File already exists, skipping');
                return prev;
              }
              console.log('[useSupabaseFiles] File added to state');
              return [...prev, newFile];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedFile = payload.new as SupabaseFile;
            console.log('[useSupabaseFiles] Updating file:', updatedFile);
            setFiles(prev => prev.map(file => 
              file.id === updatedFile.id ? updatedFile : file
            ));
          } else if (payload.eventType === 'DELETE') {
            const deletedFile = payload.old as SupabaseFile;
            console.log('[useSupabaseFiles] Deleting file:', deletedFile);
            setFiles(prev => prev.filter(file => file.id !== deletedFile.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('[useSupabaseFiles] Subscription status:', status);
      });

    return () => {
      console.log('[useSupabaseFiles] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [loadFiles, user]);

  const createFile = useCallback(async (
    name: string, 
    parentId?: string, 
    type: 'file' | 'folder' = 'file',
    content?: string,
    emoji?: string
  ) => {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return null;
    }

    try {
      console.log('[useSupabaseFiles] Creating file:', { name, parentId, type });
      const { data, error } = await supabase
        .from('files')
        .insert({
          name,
          type,
          parent_id: parentId,
          content: content || '',
          emoji,
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('[useSupabaseFiles] Error creating file:', error);
        toast({
          title: "Erro ao criar arquivo",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      console.log('[useSupabaseFiles] File created successfully:', data);
      toast({
        title: "Arquivo criado",
        description: `${type === 'folder' ? 'Pasta' : 'Nota'} "${name}" criada com sucesso`
      });

      // The realtime subscription will handle adding the file to the state
      return data.id;
    } catch (error) {
      console.error('[useSupabaseFiles] Error creating file:', error);
      toast({
        title: "Erro ao criar arquivo",
        description: "Falha ao criar arquivo",
        variant: "destructive"
      });
      return null;
    }
  }, [toast, user]);

  const updateFile = useCallback(async (id: string, updates: Partial<SupabaseFile>) => {
    if (!user) {
      toast({
        title: "Erro de autenticação", 
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('[useSupabaseFiles] Updating file:', id, updates);
      const { error } = await supabase
        .from('files')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('[useSupabaseFiles] Error updating file:', error);
        toast({
          title: "Erro ao atualizar arquivo",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('[useSupabaseFiles] File updated successfully');
      toast({
        title: "Arquivo atualizado",
        description: "Arquivo salvo com sucesso"
      });
    } catch (error) {
      console.error('[useSupabaseFiles] Error updating file:', error);
      toast({
        title: "Erro ao atualizar arquivo",
        description: "Falha ao salvar arquivo",
        variant: "destructive"
      });
    }
  }, [toast, user]);

  const deleteFile = useCallback(async (id: string) => {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Usuário não autenticado", 
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('[useSupabaseFiles] Deleting file:', id);
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[useSupabaseFiles] Error deleting file:', error);
        toast({
          title: "Erro ao deletar arquivo",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('[useSupabaseFiles] File deleted successfully');
      toast({
        title: "Arquivo deletado",
        description: "Arquivo removido com sucesso"
      });
    } catch (error) {
      console.error('[useSupabaseFiles] Error deleting file:', error);
      toast({
        title: "Erro ao deletar arquivo",
        description: "Falha ao remover arquivo",
        variant: "destructive"
      });
    }
  }, [toast, user]);

  return {
    files,
    loading,
    createFile,
    updateFile,
    deleteFile,
    loadFiles
  };
};
