import { getSupabaseClient } from '@/lib/supabase-config';
import { useState, useEffect, useCallback } from 'react';
import type { FileItem } from '@/types/FileItem';
import { useToast } from '@/hooks/use-toast';

export const useSupabaseFiles = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Development data for when Supabase is not available
  const developmentFiles: FileItem[] = [
    {
      id: 'dev-1',
      name: 'Welcome.md',
      type: 'file',
      content: '# Welcome to Notion Spark Studio\n\nThis is a development environment.',
      path: '/Welcome.md',
      size: 1024,
      lastModified: new Date().toISOString(),
      isDirectory: false,
      parentId: null,
      metadata: {
        tags: ['welcome', 'demo'],
        description: 'Welcome file for development'
      }
    },
    {
      id: 'dev-2',
      name: 'Notes',
      type: 'folder',
      content: '',
      path: '/Notes',
      size: 0,
      lastModified: new Date().toISOString(),
      isDirectory: true,
      parentId: null,
      children: [],
      metadata: {
        tags: ['folder'],
        description: 'Notes folder'
      }
    }
  ];

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        console.log('[useSupabaseFiles] Supabase não disponível, usando dados de desenvolvimento');
        setFiles(developmentFiles);
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('[useSupabaseFiles] No user found, using development data');
        setFiles(developmentFiles);
        setLoading(false);
        return;
      }

      console.log('[useSupabaseFiles] Setting up subscriptions for user:', user.id);

      // Try to load files from Supabase
      const { data: filesData, error: filesError } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filesError) {
        console.warn('[useSupabaseFiles] Error loading files, using development data:', filesError);
        setFiles(developmentFiles);
      } else {
        // Convert Supabase data to FileItem format
        const convertedFiles: FileItem[] = (filesData || []).map(file => ({
          id: file.id,
          name: file.name,
          type: file.type as 'file' | 'folder',
          content: file.content || '',
          path: file.path,
          size: file.size || 0,
          lastModified: file.updated_at || file.created_at,
          isDirectory: file.type === 'folder',
          parentId: file.parent_id,
          metadata: file.metadata || {}
        }));

        setFiles(convertedFiles.length > 0 ? convertedFiles : developmentFiles);
      }

    } catch (err) {
      console.error('[useSupabaseFiles] Error loading files:', err);
      setError('Failed to load files');
      setFiles(developmentFiles);
      
      toast({
        title: "Erro ao carregar arquivos",
        description: "Usando dados de desenvolvimento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const saveFile = useCallback(async (file: Partial<FileItem>) => {
    try {
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        console.warn('[useSupabaseFiles] Cannot save file - Supabase not available');
        toast({
          title: "Modo offline",
          description: "Não é possível salvar arquivos no modo offline",
          variant: "destructive"
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const fileData = {
        name: file.name,
        type: file.type,
        content: file.content,
        path: file.path,
        size: file.size,
        parent_id: file.parentId,
        metadata: file.metadata,
        user_id: user.id
      };

      let result;
      if (file.id?.startsWith('dev-')) {
        // Creating new file (development ID)
        const { data, error } = await supabase
          .from('files')
          .insert([fileData])
          .select()
          .single();
        result = { data, error };
      } else if (file.id) {
        // Updating existing file
        const { data, error } = await supabase
          .from('files')
          .update(fileData)
          .eq('id', file.id)
          .eq('user_id', user.id)
          .select()
          .single();
        result = { data, error };
      } else {
        // Creating new file
        const { data, error } = await supabase
          .from('files')
          .insert([fileData])
          .select()
          .single();
        result = { data, error };
      }

      if (result.error) {
        throw result.error;
      }

      toast({
        title: "Arquivo salvo",
        description: `${file.name} foi salvo com sucesso`
      });

      // Reload files
      loadFiles();

    } catch (err) {
      console.error('[useSupabaseFiles] Error saving file:', err);
      toast({
        title: "Erro ao salvar arquivo",
        description: "Falha ao salvar o arquivo",
        variant: "destructive"
      });
    }
  }, [toast, loadFiles]);

  const deleteFile = useCallback(async (fileId: string) => {
    try {
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        console.warn('[useSupabaseFiles] Cannot delete file - Supabase not available');
        toast({
          title: "Modo offline",
          description: "Não é possível deletar arquivos no modo offline",
          variant: "destructive"
        });
        return;
      }

      if (fileId.startsWith('dev-')) {
        console.warn('[useSupabaseFiles] Cannot delete development file');
        toast({
          title: "Arquivo de desenvolvimento",
          description: "Não é possível deletar arquivos de desenvolvimento",
          variant: "destructive"
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Arquivo deletado",
        description: "Arquivo removido com sucesso"
      });

      // Reload files
      loadFiles();

    } catch (err) {
      console.error('[useSupabaseFiles] Error deleting file:', err);
      toast({
        title: "Erro ao deletar arquivo",
        description: "Falha ao remover o arquivo",
        variant: "destructive"
      });
    }
  }, [toast, loadFiles]);

  useEffect(() => {
    loadFiles();

    const supabase = getSupabaseClient();
    
    if (!supabase) {
      console.log('[useSupabaseFiles] No user found, using development data');
      return;
    }

    // Set up real-time subscription
    const { data: { user } } = supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const subscription = supabase
          .channel('files_changes')
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'files',
              filter: `user_id=eq.${data.user.id}`
            }, 
            () => {
              console.log('[useSupabaseFiles] Files changed, reloading...');
              loadFiles();
            }
          )
          .subscribe();

        return () => {
          subscription.unsubscribe();
        };
      }
    });

  }, [loadFiles]);

  return {
    files,
    loading,
    error,
    loadFiles,
    saveFile,
    deleteFile
  };
};
