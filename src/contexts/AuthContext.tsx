import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

interface AuthContextType {
  user: any;
  session: any;
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // Retornar um estado padrão em vez de lançar erro
    console.warn('[AuthContext] useAuth chamado fora do AuthProvider, retornando estado padrão');
    return {
      user: null,
      session: null,
      loading: true
    };
  }
  return context;
}; 