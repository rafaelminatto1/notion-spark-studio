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

// MODO DESENVOLVIMENTO: Dados padrão quando não há usuário autenticado
const createDevelopmentData = (): SupabaseFile[] => {
  const now = new Date().toISOString();
  return [
    {
      id: 'dev-notebook-1',
      user_id: 'dev-user',
      name: 'Meu Primeiro Notebook',
      type: 'folder',
      is_public: false,
      is_protected: false,
      show_in_sidebar: true,
      created_at: now,
      updated_at: now,
      emoji: '📚'
    },
    {
      id: 'dev-note-1',
      user_id: 'dev-user', 
      name: 'Nota de Boas-vindas',
      type: 'file',
      parent_id: 'dev-notebook-1',
      content: '# Bem-vindo ao Notion Spark Studio! 🎉\n\nEsta é sua primeira nota. Comece a escrever suas ideias aqui!\n\n## Recursos:\n- ✅ Markdown suportado\n- 📝 Edição em tempo real\n- 🎨 Interface moderna\n- 📱 Responsivo',
      is_public: false,
      is_protected: false,
      show_in_sidebar: true,
      created_at: now,
      updated_at: now,
      emoji: '👋'
    }
  ];
};

export const useSupabaseFiles = () => {
  const [files, setFiles] = useState<SupabaseFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const loadFiles = useCallback(async () => {
    // MODO DESENVOLVIMENTO: Se não há usuário, usar dados locais
    if (!user) {
      console.log('[useSupabaseFiles] No user found, using development data');
      const devData = createDevelopmentData();
      setFiles(devData);
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
        // FALLBACK: Em caso de erro, usar dados de desenvolvimento
        console.log('[useSupabaseFiles] Falling back to development data');
        const devData = createDevelopmentData();
        setFiles(devData);
        toast({
          title: "Modo Desenvolvimento",
          description: "Usando dados de exemplo. Configure o Supabase para dados reais.",
          variant: "default"
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
      // FALLBACK: Em caso de erro, usar dados de desenvolvimento
      console.log('[useSupabaseFiles] Falling back to development data');
      const devData = createDevelopmentData();
      setFiles(devData);
      toast({
        title: "Modo Desenvolvimento",
        description: "Usando dados de exemplo. Configure o Supabase para dados reais.",
        variant: "default"
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
    // MODO DESENVOLVIMENTO: Se não há usuário, criar arquivo local
    if (!user) {
      console.log('[useSupabaseFiles] Creating file in development mode:', { name, parentId, type });
      const newFile: SupabaseFile = {
        id: `dev-${Date.now()}`,
        user_id: 'dev-user',
        name,
        type,
        parent_id: parentId,
        content: content || (type === 'file' ? '# ' + name + '\n\nComece a escrever aqui...' : undefined),
        emoji,
        is_public: false,
        is_protected: false,
        show_in_sidebar: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setFiles(prev => [...prev, newFile]);
      
      toast({
        title: "Arquivo criado (Dev Mode)",
        description: `${type === 'folder' ? 'Pasta' : 'Nota'} "${name}" criada com sucesso`
      });

      return newFile.id;
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
          user_id: user.id,
          is_public: false,
          is_protected: false,
          show_in_sidebar: true
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
      
      // Add file immediately to local state for instant feedback
      const newFile = {
        ...data,
        type: data.type as 'file' | 'folder'
      };
      
      setFiles(prev => {
        const exists = prev.find(f => f.id === newFile.id);
        if (exists) return prev;
        return [...prev, newFile];
      });

      toast({
        title: "Arquivo criado",
        description: `${type === 'folder' ? 'Pasta' : 'Nota'} "${name}" criada com sucesso`
      });

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
    // MODO DESENVOLVIMENTO: Se não há usuário, atualizar arquivo local
    if (!user) {
      console.log('[useSupabaseFiles] Updating file in development mode:', id, updates);
      setFiles(prev => prev.map(file => 
        file.id === id 
          ? { ...file, ...updates, updated_at: new Date().toISOString() }
          : file
      ));
      
      // Only show toast if content was not updated (to avoid spam during auto-save)
      if (!updates.content) {
        toast({
          title: "Arquivo atualizado (Dev Mode)",
          description: "Arquivo salvo com sucesso"
        });
      }
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
      
      // Only show toast if content was not updated (to avoid spam during auto-save)
      if (!updates.content) {
        toast({
          title: "Arquivo atualizado",
          description: "Arquivo salvo com sucesso"
        });
      }
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
    // MODO DESENVOLVIMENTO: Se não há usuário, deletar arquivo local
    if (!user) {
      console.log('[useSupabaseFiles] Deleting file in development mode:', id);
      setFiles(prev => prev.filter(file => file.id !== id));
      
      toast({
        title: "Arquivo deletado (Dev Mode)",
        description: "Arquivo removido com sucesso"
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
