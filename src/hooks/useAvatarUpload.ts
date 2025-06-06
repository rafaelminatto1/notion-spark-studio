
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAvatarUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const uploadAvatar = useCallback(async (file: File, userId: string): Promise<string | null> => {
    try {
      setIsUploading(true);

      // Validar arquivo
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erro no upload",
          description: "Por favor, selecione uma imagem válida",
          variant: "destructive"
        });
        return null;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast({
          title: "Arquivo muito grande",
          description: "O avatar deve ter no máximo 5MB",
          variant: "destructive"
        });
        return null;
      }

      // Criar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

      // Upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage error:', error);
        toast({
          title: "Erro no upload",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      // Atualizar perfil do usuário
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar: urlData.publicUrl })
        .eq('id', userId);

      if (updateError) {
        console.error('Profile update error:', updateError);
        toast({
          title: "Erro ao atualizar perfil",
          description: updateError.message,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Avatar atualizado",
        description: "Seu avatar foi atualizado com sucesso"
      });

      return urlData.publicUrl;

    } catch (error) {
      console.error('Avatar upload error:', error);
      toast({
        title: "Erro no upload",
        description: "Falha ao fazer upload do avatar",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [toast]);

  const deleteAvatar = useCallback(async (userId: string, avatarUrl?: string) => {
    try {
      setIsUploading(true);

      if (avatarUrl) {
        // Extrair path do avatar da URL
        const path = avatarUrl.split('/').slice(-2).join('/');
        
        // Deletar do storage
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([path]);

        if (deleteError) {
          console.error('Storage delete error:', deleteError);
        }
      }

      // Remover avatar do perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar: null })
        .eq('id', userId);

      if (updateError) {
        toast({
          title: "Erro ao remover avatar",
          description: updateError.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Avatar removido",
        description: "Avatar removido com sucesso"
      });

      return true;

    } catch (error) {
      console.error('Avatar delete error:', error);
      toast({
        title: "Erro ao remover avatar",
        description: "Falha ao remover avatar",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsUploading(false);
    }
  }, [toast]);

  return {
    uploadAvatar,
    deleteAvatar,
    isUploading
  };
};
