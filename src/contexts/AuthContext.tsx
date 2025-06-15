import React, { createContext, useContext, ReactNode } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

interface AuthContextType {
  user: any;
  session: any;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useSupabaseAuth();
  
  console.log('[AuthContext] Inicializando AuthProvider:', {
    hasAuth: !!auth,
    hasUser: !!auth?.user,
    hasSession: !!auth?.session,
    isLoading: auth?.loading
  });

  // Garantir que sempre temos um objeto válido
  const authValue: AuthContextType = {
    user: auth?.user || null,
    session: auth?.session || null,
    loading: auth?.loading ?? true
  };

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