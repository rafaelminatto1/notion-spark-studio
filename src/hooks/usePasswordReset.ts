
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PasswordResetResponse {
  success: boolean;
  message?: string;
  token?: string;
  expires_at?: string;
}

interface TokenValidationResponse {
  valid: boolean;
  message?: string;
  user_id?: string;
}

export const usePasswordReset = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const requestPasswordReset = async (email: string) => {
    setLoading(true);
    
    try {
      // Use our custom secure token function instead of Supabase's default
      const { data, error } = await supabase.rpc('request_password_reset_with_otp', {
        _email: email,
        _ip_address: window.location.hostname,
        _user_agent: navigator.userAgent
      });

      if (error) {
        console.error('Erro ao solicitar reset de senha:', error);
        toast({
          title: "Erro ao enviar email",
          description: "Não foi possível enviar o email de reset. Tente novamente em alguns minutos.",
          variant: "destructive"
        });
        return false;
      }

      const response = data as PasswordResetResponse;
      if (response?.success) {
        toast({
          title: "Email enviado!",
          description: "Verifique sua caixa de entrada e pasta de spam. O link expira em 15 minutos por segurança.",
        });
        return true;
      }

      return false;
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
      // First validate the token from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      if (!token) {
        toast({
          title: "Token inválido",
          description: "Link de reset inválido ou expirado",
          variant: "destructive"
        });
        return false;
      }

      // Validate the token using our secure function
      const { data: validationResult, error: validationError } = await supabase.rpc('validate_password_reset_token', {
        _token: token
      });

      if (validationError) {
        toast({
          title: "Token inválido",
          description: "Token inválido ou expirado",
          variant: "destructive"
        });
        return false;
      }

      const validation = validationResult as TokenValidationResponse;
      if (!validation?.valid) {
        toast({
          title: "Token inválido",
          description: validation?.message || "Token inválido ou expirado",
          variant: "destructive"
        });
        return false;
      }

      // Update the password using Supabase Auth
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

      // Mark the token as used
      await supabase.rpc('use_password_reset_token', {
        _token: token
      });

      toast({
        title: "Senha atualizada!",
        description: "Sua senha foi alterada com sucesso. Você será redirecionado para fazer login."
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
