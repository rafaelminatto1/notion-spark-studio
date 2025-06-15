import { useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSupabaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Função para inicializar o estado de autenticação
  const initializeAuth = useCallback(async () => {
    try {
      console.log('[useSupabaseAuth] Inicializando autenticação...');
      
      // Verificar sessão atual
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[useSupabaseAuth] Erro ao obter sessão:', sessionError);
        throw sessionError;
      }

      if (currentSession) {
        console.log('[useSupabaseAuth] Sessão encontrada:', currentSession.user?.email);
        setSession(currentSession);
        setUser(currentSession.user);
      } else {
        console.log('[useSupabaseAuth] Nenhuma sessão encontrada');
        setSession(null);
        setUser(null);
      }
    } catch (error) {
      console.error('[useSupabaseAuth] Erro na inicialização:', error);
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Inicializar autenticação
    initializeAuth();

    // Configurar listener de mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('[useSupabaseAuth] Estado de autenticação alterado:', {
          event,
          userEmail: session?.user?.email,
          hasSession: !!session
        });

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Tratar eventos específicos
        if (event === 'SIGNED_IN' && session?.user) {
          toast({
            title: "Login realizado",
            description: `Bem-vindo, ${session.user.user_metadata?.name || session.user.email}!`,
            duration: 3000
          });
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: "Logout realizado",
            description: "Até a próxima!"
          });
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('[useSupabaseAuth] Token atualizado com sucesso');
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initializeAuth, toast]);

  const signInWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });

      if (error) {
        console.error('Erro no login com Google:', error);
        toast({
          title: "Erro no login",
          description: error.message || "Falha ao fazer login com Google",
          variant: "destructive"
        });
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Erro inesperado no login com Google:', error);
      toast({
        title: "Erro no login",
        description: "Falha inesperada ao fazer login com Google",
        variant: "destructive"
      });
      return { error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Erro no login:', error);
        
        let errorMessage = "Falha ao fazer login";
        if (error.message?.includes('Invalid login credentials')) {
          errorMessage = "Email ou senha incorretos";
        } else if (error.message?.includes('Email not confirmed')) {
          errorMessage = "Email não confirmado. Verifique sua caixa de entrada";
        } else if (error.message?.includes('Too many requests')) {
          errorMessage = "Muitas tentativas. Tente novamente em alguns minutos";
        }

        toast({
          title: "Erro no login",
          description: errorMessage,
          variant: "destructive"
        });
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Erro inesperado no login:', error);
      toast({
        title: "Erro no login",
        description: "Falha inesperada ao fazer login",
        variant: "destructive"
      });
      return { error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const signUpWithEmail = useCallback(async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name
          }
        }
      });

      if (error) {
        console.error('Erro no cadastro:', error);
        
        let errorMessage = "Falha ao criar conta";
        if (error.message?.includes('User already registered')) {
          errorMessage = "Este email já está cadastrado";
        } else if (error.message?.includes('Password should be at least')) {
          errorMessage = "Senha muito fraca";
        } else if (error.message?.includes('Invalid email')) {
          errorMessage = "Email inválido";
        }

        toast({
          title: "Erro no cadastro",
          description: errorMessage,
          variant: "destructive"
        });
        return { error };
      }

      toast({
        title: "Cadastro realizado",
        description: "Verifique seu email para confirmar a conta",
        duration: 5000
      });

      return { error: null };
    } catch (error) {
      console.error('Erro inesperado no cadastro:', error);
      toast({
        title: "Erro no cadastro",
        description: "Falha inesperada ao criar conta",
        variant: "destructive"
      });
      return { error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) {
        console.error('Erro ao enviar email de reset:', error);
        toast({
          title: "Erro ao enviar email",
          description: error.message || "Falha ao enviar email de redefinição",
          variant: "destructive"
        });
        return { error };
      }

      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha",
        duration: 5000
      });

      return { error: null };
    } catch (error) {
      console.error('Erro inesperado no reset:', error);
      toast({
        title: "Erro ao enviar email",
        description: "Falha inesperada ao enviar email de reset",
        variant: "destructive"
      });
      return { error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Erro ao atualizar senha:', error);
        toast({
          title: "Erro ao atualizar senha",
          description: error.message || "Falha ao atualizar a senha",
          variant: "destructive"
        });
        return { error };
      }

      toast({
        title: "Senha atualizada",
        description: "Sua senha foi atualizada com sucesso"
      });

      return { error: null };
    } catch (error) {
      console.error('Erro inesperado ao atualizar senha:', error);
      toast({
        title: "Erro ao atualizar senha",
        description: "Falha inesperada ao atualizar a senha",
        variant: "destructive"
      });
      return { error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erro ao fazer logout:', error);
        toast({
          title: "Erro ao sair",
          description: error.message || "Falha ao fazer logout",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro inesperado no logout:', error);
      toast({
        title: "Erro ao sair",
        description: "Falha inesperada ao fazer logout",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    signIn: async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    updatePassword
  };
};
