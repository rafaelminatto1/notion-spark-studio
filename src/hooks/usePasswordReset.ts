
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePasswordReset = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const requestPasswordReset = async (email: string) => {
    setLoading(true);
    
    try {
      // Log da tentativa de reset de senha para auditoria
      await supabase.rpc('log_password_reset_attempt', {
        _email: email,
        _ip_address: window.location.hostname,
        _user_agent: navigator.userAgent
      });

      // Solicitar reset de senha
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Erro ao solicitar reset de senha:', error);
        
        // Log do erro para monitoramento
        toast({
          title: "Erro ao enviar email",
          description: "Não foi possível enviar o email de reset. Tente novamente em alguns minutos.",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada e pasta de spam. O link expira em 15 minutos.",
      });

      return true;
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro inesperado",
        description: "Tente novamente mais tarde",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (newPassword: string) => {
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Erro ao atualizar senha:', error);
        toast({
          title: "Erro ao atualizar senha",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      // Log da atualização bem-sucedida
      toast({
        title: "Senha atualizada!",
        description: "Sua senha foi alterada com sucesso"
      });

      return true;
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro inesperado",
        description: "Tente novamente mais tarde",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    requestPasswordReset,
    updatePassword,
    loading
  };
};
