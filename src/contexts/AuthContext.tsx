import type { ReactNode} from 'react';
import React, { createContext, useContext, useMemo } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useSupabaseAuth();
  
  // Usar useMemo para evitar re-criação constante do objeto
  const authValue: AuthContextType = useMemo(() => {
    const value = {
      user: auth?.user || null,
      session: auth?.session || null,
      loading: auth?.loading ?? true
    };
    
    // Log apenas quando houver mudanças significativas
    if (!auth?.loading) {
      console.log('[AuthContext] Estado atualizado:', {
        hasUser: !!value.user,
        hasSession: !!value.session,
        isLoading: value.loading
      });
    }
    
    return value;
  }, [auth?.user, auth?.session, auth?.loading]);

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext deve ser usado dentro de um AuthProvider');
  }
  return context;
}; 