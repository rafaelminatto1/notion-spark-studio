import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase-config';

export interface AuthUser extends User {
  name?: string;
  avatar?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
}

export interface AuthAPI {
  // Estado atual
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  
  // Ações de autenticação
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { name?: string; avatar?: string }) => Promise<void>;
  
  // Gerenciamento de usuário
  updateUser: (updates: Partial<AuthUser>) => Promise<boolean>;
  updatePreferences: (preferences: Partial<AuthUser['preferences']>) => Promise<boolean>;
  
  // Utilities
  generateUserColor: (userId: string) => string;
  getCurrentUserId: () => string;
  getCurrentUser: () => AuthUser | null;
}

// Context para autenticação
export const AuthContext = createContext<AuthAPI | null>(null);

// Hook principal de autenticação
export const useAuth = (): AuthAPI => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Verificar sessão atual
    const checkSession = async () => {
      try {
        const supabase = getSupabaseClient();
        
        if (!supabase) {
          console.warn('[useAuth] Supabase não disponível, modo offline');
          setLoading(false);
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, avatar')
            .eq('id', session.user.id)
            .single();

          setUser({
            ...session.user,
            name: profile?.name,
            avatar: profile?.avatar,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erro ao verificar sessão'));
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const supabase = getSupabaseClient();
    
    if (!supabase) {
      return;
    }

    // Inscrever-se em mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, avatar')
            .eq('id', session.user.id)
            .single();

          setUser({
            ...session.user,
            name: profile?.name,
            avatar: profile?.avatar,
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        throw new Error('Supabase não está disponível');
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao fazer login'));
      throw err;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    try {
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        throw new Error('Supabase não está disponível');
      }

      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;

      if (user) {
        await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              name,
              email,
            },
          ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao criar conta'));
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        throw new Error('Supabase não está disponível');
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao fazer logout'));
      throw err;
    }
  }, []);

  const updateProfile = useCallback(async (updates: { name?: string; avatar?: string }) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      const supabase = getSupabaseClient();
      
      if (!supabase) {
        throw new Error('Supabase não está disponível');
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      setUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao atualizar perfil'));
      throw err;
    }
  }, [user]);

  // Gerar cor única para usuário
  const generateUserColorFromId = useCallback((userId: string): string => {
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 60%)`;
  }, []);

  // Atualizar dados do usuário
  const updateUser = useCallback(async (updates: Partial<AuthUser>): Promise<boolean> => {
    try {
      if (!user) return false;
      
      const updatedUser = {
        ...user,
        ...updates,
      };
      
      await updateProfile(updates);
      
      return true;
    } catch (error) {
      console.error('[Auth] Update user error:', error);
      return false;
    }
  }, [user, updateProfile]);

  // Atualizar preferências do usuário
  const updatePreferences = useCallback(async (preferences: Partial<AuthUser['preferences']>): Promise<boolean> => {
    try {
      if (!user) return false;
      
      // Implementar lógica de preferências quando necessário
      console.log('[Auth] Update preferences:', preferences);
      
      return true;
    } catch (error) {
      console.error('[Auth] Update preferences error:', error);
      return false;
    }
  }, [user]);

  // Utilities
  const generateUserColor = useCallback((userId: string): string => {
    return generateUserColorFromId(userId);
  }, [generateUserColorFromId]);

  const getCurrentUserId = useCallback((): string => {
    return user?.id || '';
  }, [user]);

  const getCurrentUser = useCallback((): AuthUser | null => {
    return user;
  }, [user]);

  return {
    user,
    isAuthenticated: !!user,
    isLoading: loading,
    error,
    signIn,
    signUp,
    signOut,
    updateProfile,
    updateUser,
    updatePreferences,
    generateUserColor,
    getCurrentUserId,
    getCurrentUser
  };
};

// Provider e Context serão implementados em arquivo separado .tsx
// Por enquanto, usar o hook diretamente

export default useAuth;