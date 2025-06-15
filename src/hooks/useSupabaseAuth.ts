import { useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, initializeSupabase } from '@/lib/supabase-config';
import { useToast } from '@/hooks/use-toast';

export const useSupabaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const { toast } = useToast();

  // Função para inicializar o estado de autenticação
  const initializeAuth = useCallback(async () => {
    try {
      console.log('[useSupabaseAuth] Inicializando autenticação...');
      
      // Inicializar Supabase de forma segura
      const initResult = await initializeSupabase();
      
      if (!initResult.success) {
        if (initResult.offline) {
          console.log('[useSupabaseAuth] Modo offline ativado');
          setIsOffline(true);
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
        
        throw new Error('Falha na inicialização do Supabase');
      }
      
      // Verificar sessão atual
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[useSupabaseAuth] Erro ao obter sessão:', sessionError);
        // Não lançar erro, apenas logar e continuar
        setSession(null);
        setUser(null);
      } else if (currentSession) {
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
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let subscription: any = null;

    // Inicializar autenticação
    initializeAuth();

    // Configurar listener de mudanças de autenticação apenas se não estiver offline
    if (!isOffline) {
      try {
        const { data } = supabase.auth.onAuthStateChange(
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
        
        subscription = data.subscription;
      } catch (error) {
        console.error('[useSupabaseAuth] Erro ao configurar listener:', error);
      }
    }

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [initializeAuth, toast, isOffline]);

  const signInWithGoogle = useCallback(async () => {
    if (isOffline) {
      toast({
        title: "Modo offline",
        description: "Login não disponível no modo offline",
        variant: "destructive"
      });
      return { error: new Error('Offline mode') };
    }

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
  }, [toast, isOffline]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (isOffline) {
      toast({
        title: "Modo offline",
        description: "Login não disponível no modo offline",
        variant: "destructive"
      });
      return { error: new Error('Offline mode') };
    }

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
  }, [toast, isOffline]);

  const signUpWithEmail = useCallback(async (email: string, password: string, name: string) => {
    if (isOffline) {
      toast({
        title: "Modo offline",
        description: "Cadastro não disponível no modo offline",
        variant: "destructive"
      });
      return { error: new Error('Offline mode') };
    }

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
  }, [toast, isOffline]);

  const resetPassword = useCallback(async (email: string) => {
    if (isOffline) {
      toast({
        title: "Modo offline",
        description: "Reset de senha não disponível no modo offline",
        variant: "destructive"
      });
      return { error: new Error('Offline mode') };
    }

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
  }, [toast, isOffline]);

  const updatePassword = useCallback(async (newPassword: string) => {
    if (isOffline) {
      toast({
        title: "Modo offline",
        description: "Atualização de senha não disponível no modo offline",
        variant: "destructive"
      });
      return { error: new Error('Offline mode') };
    }

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
  }, [toast, isOffline]);

  const signOut = useCallback(async () => {
    if (isOffline) {
      // No modo offline, apenas limpar o estado local
      setUser(null);
      setSession(null);
      toast({
        title: "Logout realizado",
        description: "Sessão encerrada (modo offline)"
      });
      return;
    }

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
  }, [toast, isOffline]);

  return {
    user,
    session,
    loading,
    isOffline,
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
