import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useSupabase } from './useSupabase';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

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
  
  const { supabase } = useSupabase();

  useEffect(() => {
    // Verificar sessão atual
    const checkSession = async () => {
      try {
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
  }, [supabase]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao fazer login'));
      throw err;
    }
  }, [supabase]);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    try {
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
  }, [supabase]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao fazer logout'));
      throw err;
    }
  }, [supabase]);

  const updateProfile = useCallback(async (updates: { name?: string; avatar?: string }) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

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
  }, [supabase, user]);

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

  // Atualizar preferências
  const updatePreferences = useCallback(async (preferences: Partial<AuthUser['preferences']>): Promise<boolean> => {
    try {
      if (!user) return false;
      
      const updatedUser = {
        ...user,
        preferences: {
          ...user.preferences,
          ...preferences
        },
      };
      
      await updateProfile(updatedUser);
      
      return true;
    } catch (error) {
      console.error('[Auth] Update preferences error:', error);
      return false;
    }
  }, [user, updateProfile]);

  // Utility functions
  const generateUserColor = useCallback((userId: string): string => {
    return generateUserColorFromId(userId);
  }, [generateUserColorFromId]);

  const getCurrentUserId = useCallback((): string => {
    return user?.id || 'anonymous-user';
  }, [user]);

  const getCurrentUser = useCallback((): AuthUser | null => {
    return user;
  }, [user]);

  return {
    // Estado
    user,
    isAuthenticated: !!user,
    isLoading: loading,
    error,
    
    // Ações
    signIn,
    signUp,
    signOut,
    updateProfile,
    updateUser,
    updatePreferences,
    
    // Utilities
    generateUserColor,
    getCurrentUserId,
    getCurrentUser
  };
};

// Provider e Context serão implementados em arquivo separado .tsx
// Por enquanto, usar o hook diretamente

export default useAuth;