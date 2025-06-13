import React, { createContext, useContext, useCallback } from 'react';

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'share' | 'comment' | 'admin';

interface SimplePermissionsState {
  currentUser: {
    id: string;
    roles: string[];
    teams: string[];
  };
}

interface SimplePermissionsContextType {
  state: SimplePermissionsState;
  checkPermission: (userId: string, resourceId: string, action: PermissionAction) => boolean;
  getUserPermissions: (userId: string) => any[];
}

const SimplePermissionsContext = createContext<SimplePermissionsContextType | null>(null);

// Estado inicial simplificado
const initialState: SimplePermissionsState = {
  currentUser: {
    id: 'default-user',
    roles: ['admin'],
    teams: []
  }
};

export const SimplePermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const state = initialState;

  // Sistema de permissões simplificado que sempre permite operações básicas
  const checkPermission = useCallback((
    userId: string, 
    resourceId: string, 
    action: PermissionAction
  ): boolean => {
    console.log('[SimplePermissions] Checking permission:', { userId, resourceId, action });
    
    // Sempre permitir para o usuário padrão (modo desenvolvimento/demo)
    if (userId === 'default-user') {
      console.log('[SimplePermissions] Default user - permission granted');
      return true;
    }

    // Sempre permitir operações básicas
    if (['create', 'read', 'update'].includes(action)) {
      console.log('[SimplePermissions] Basic operation - permission granted');
      return true;
    }

    // Para workspace, sempre permitir
    if (resourceId === 'workspace') {
      console.log('[SimplePermissions] Workspace operation - permission granted');
      return true;
    }

    console.log('[SimplePermissions] Permission granted by default');
    return true; // Por padrão, permitir tudo em modo desenvolvimento
  }, []);

  const getUserPermissions = useCallback((userId: string) => {
    return []; // Retornar array vazio - não precisamos de permissões específicas
  }, []);

  const value = {
    state,
    checkPermission,
    getUserPermissions
  };

  return (
    <SimplePermissionsContext.Provider value={value}>
      {children}
    </SimplePermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(SimplePermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within SimplePermissionsProvider');
  }
  return context;
}; 