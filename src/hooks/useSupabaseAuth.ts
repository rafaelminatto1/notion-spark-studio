import { useState, useEffect } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { getSupabaseClient, initializeSupabase } from '@/lib/supabase-config';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
  isOfflineMode: boolean;
}

export const useSupabaseAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
    isOfflineMode: false,
  });

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('[useSupabaseAuth] Inicializando autenticação...');
        
        // Inicializar Supabase
        const { client, isConnected, isOfflineMode } = await initializeSupabase();
        
        if (!mounted) return;

        // Se não há cliente (modo offline)
        if (!client) {
          console.log('[useSupabaseAuth] Modo offline ativado');
          setAuthState(prev => ({
            ...prev,
            loading: false,
            isOfflineMode: true,
          }));
          return;
        }

        // Se não há conexão, mas há cliente
        if (!isConnected) {
          console.log('[useSupabaseAuth] Cliente disponível mas sem conexão');
          setAuthState(prev => ({
            ...prev,
            loading: false,
            isOfflineMode: true,
          }));
          return;
        }

        // Obter sessão atual
        const { data: { session }, error: sessionError } = await client.auth.getSession();
        
        if (!mounted) return;

        if (sessionError) {
          console.error('[useSupabaseAuth] Erro ao obter sessão:', sessionError);
          setAuthState(prev => ({
            ...prev,
            error: sessionError,
            loading: false,
            isOfflineMode,
          }));
          return;
        }

        // Atualizar estado com sessão
        setAuthState(prev => ({
          ...prev,
          user: session?.user ?? null,
          session,
          loading: false,
          error: null,
          isOfflineMode,
        }));

        console.log('[useSupabaseAuth] Estado inicial configurado:', {
          hasUser: !!session?.user,
          hasSession: !!session,
          isOfflineMode,
        });

        // Configurar listener para mudanças de autenticação
        const { data: { subscription } } = client.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return;

            console.log('[useSupabaseAuth] Mudança de estado:', event, {
              hasUser: !!session?.user,
              hasSession: !!session,
            });

            setAuthState(prev => ({
              ...prev,
              user: session?.user ?? null,
              session,
              error: null,
              loading: false,
              isOfflineMode,
            }));
          }
        );

        // Cleanup
        return () => {
          subscription.unsubscribe();
        };

      } catch (error) {
        console.error('[useSupabaseAuth] Erro na inicialização:', error);
        
        if (!mounted) return;

        setAuthState(prev => ({
          ...prev,
          error: error as AuthError,
          loading: false,
          isOfflineMode: true,
        }));
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // Funções de autenticação
  const signIn = async (email: string, password: string) => {
    const client = getSupabaseClient();
    
    if (!client) {
      throw new Error('Supabase não está disponível. Verifique sua conexão.');
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthState(prev => ({ ...prev, error, loading: false }));
        throw error;
      }

      return data;
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        error: error as AuthError, 
        loading: false 
      }));
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    const client = getSupabaseClient();
    
    if (!client) {
      throw new Error('Supabase não está disponível. Verifique sua conexão.');
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await client.auth.signUp({
        email,
        password,
      });

      if (error) {
        setAuthState(prev => ({ ...prev, error, loading: false }));
        throw error;
      }

      return data;
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        error: error as AuthError, 
        loading: false 
      }));
      throw error;
    }
  };

  const signOut = async () => {
    const client = getSupabaseClient();
    
    if (!client) {
      // Em modo offline, apenas limpar estado local
      setAuthState(prev => ({
        ...prev,
        user: null,
        session: null,
        error: null,
      }));
      return;
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { error } = await client.auth.signOut();

      if (error) {
        setAuthState(prev => ({ ...prev, error, loading: false }));
        throw error;
      }

      setAuthState(prev => ({
        ...prev,
        user: null,
        session: null,
        loading: false,
        error: null,
      }));
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        error: error as AuthError, 
        loading: false 
      }));
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    const client = getSupabaseClient();
    
    if (!client) {
      throw new Error('Supabase não está disponível. Verifique sua conexão.');
    }

    try {
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      throw error;
    }
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    resetPassword,
    // Aliases para compatibilidade com formulários existentes
    signInWithEmail: signIn,
    signUpWithEmail: signUp,
    signInWithGoogle: async () => {
      const client = getSupabaseClient();
      if (!client) {
        console.error('[useSupabaseAuth] Cliente não disponível para Google OAuth');
        return;
      }
      
      try {
        const { data, error } = await client.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`
          }
        });
        
        if (error) {
          console.error('[useSupabaseAuth] Erro no login com Google:', error);
          throw error;
        }
        
        console.log('[useSupabaseAuth] Login com Google iniciado');
        return data;
      } catch (error) {
        console.error('[useSupabaseAuth] Erro no signInWithGoogle:', error);
        throw error;
      }
    },
  };
};
