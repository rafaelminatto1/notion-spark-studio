import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Users, 
  Clock, 
  Globe, 
  Lock, 
  Unlock, 
  User, 
  UserCheck,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Share,
  MessageSquare,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Tipos para o sistema de permissões
export interface AdvancedPermission {
  id: string;
  subject: {
    type: 'user' | 'role' | 'team';
    id: string;
    name: string;
  };
  resource: {
    type: 'file' | 'folder' | 'workspace' | 'database' | 'field';
    id: string;
    path?: string;
    name: string;
  };
  actions: PermissionAction[];
  conditions: PermissionConditions;
  inheritance: 'block' | 'allow' | 'inherit';
  priority: number; // 1-10, maior = mais prioridade
  createdAt: Date;
  createdBy: string;
  expiresAt?: Date;
  isActive: boolean;
}

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'share' | 'comment' | 'admin';

export interface PermissionConditions {
  timeRestriction?: {
    allowedHours: { start: string; end: string }[];
    timezone: string;
    daysOfWeek?: number[]; // 0-6, domingo=0
  };
  ipWhitelist?: string[];
  deviceRestriction?: 'mobile' | 'desktop' | 'any';
  locationRestriction?: {
    allowedCountries?: string[];
    blockedCountries?: string[];
  };
  collaborationLimit?: {
    maxConcurrentUsers?: number;
    maxDailyAccess?: number;
  };
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // Permission IDs
  isBuiltIn: boolean;
  createdAt: Date;
  members: string[]; // User IDs
}

export interface Team {
  id: string;
  name: string;
  description: string;
  members: string[]; // User IDs
  roles: string[]; // Role IDs
  createdAt: Date;
}

export interface PermissionAuditLog {
  id: string;
  action: 'granted' | 'denied' | 'revoked' | 'modified';
  userId: string;
  resourceId: string;
  permissionId: string;
  details: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

// Estado do sistema de permissões
interface PermissionsState {
  permissions: AdvancedPermission[];
  roles: Role[];
  teams: Team[];
  auditLogs: PermissionAuditLog[];
  currentUser: {
    id: string;
    roles: string[];
    teams: string[];
  };
  settings: {
    enableAuditLog: boolean;
    enableTimeRestrictions: boolean;
    enableLocationRestrictions: boolean;
    defaultPermissionDuration: number; // days
  };
}

type PermissionsAction = 
  | { type: 'ADD_PERMISSION'; payload: AdvancedPermission }
  | { type: 'UPDATE_PERMISSION'; payload: { id: string; updates: Partial<AdvancedPermission> } }
  | { type: 'REMOVE_PERMISSION'; payload: string }
  | { type: 'ADD_ROLE'; payload: Role }
  | { type: 'UPDATE_ROLE'; payload: { id: string; updates: Partial<Role> } }
  | { type: 'REMOVE_ROLE'; payload: string }
  | { type: 'ADD_TEAM'; payload: Team }
  | { type: 'UPDATE_TEAM'; payload: { id: string; updates: Partial<Team> } }
  | { type: 'REMOVE_TEAM'; payload: string }
  | { type: 'LOG_ACTION'; payload: Omit<PermissionAuditLog, 'id' | 'timestamp'> }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<PermissionsState['settings']> };

// Estado inicial
const initialState: PermissionsState = {
  permissions: [],
  roles: [
    {
      id: 'admin',
      name: 'Administrador',
      description: 'Acesso total ao sistema',
      permissions: [],
      isBuiltIn: true,
      createdAt: new Date(),
      members: ['default-user']
    },
    {
      id: 'editor',
      name: 'Editor',
      description: 'Pode criar e editar conteúdo',
      permissions: [],
      isBuiltIn: true,
      createdAt: new Date(),
      members: []
    },
    {
      id: 'viewer',
      name: 'Visualizador',
      description: 'Apenas visualização',
      permissions: [],
      isBuiltIn: true,
      createdAt: new Date(),
      members: []
    }
  ],
  teams: [],
  auditLogs: [],
  currentUser: {
    id: 'default-user',
    roles: ['admin'],
    teams: []
  },
  settings: {
    enableAuditLog: false,
    enableTimeRestrictions: false,
    enableLocationRestrictions: false,
    defaultPermissionDuration: 365
  }
};

// Reducer
function permissionsReducer(state: PermissionsState, action: PermissionsAction): PermissionsState {
  switch (action.type) {
    case 'ADD_PERMISSION':
      return {
        ...state,
        permissions: [...state.permissions, action.payload]
      };

    case 'UPDATE_PERMISSION':
      return {
        ...state,
        permissions: state.permissions.map(p => 
          p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
        )
      };

    case 'REMOVE_PERMISSION':
      return {
        ...state,
        permissions: state.permissions.filter(p => p.id !== action.payload)
      };

    case 'ADD_ROLE':
      return {
        ...state,
        roles: [...state.roles, action.payload]
      };

    case 'UPDATE_ROLE':
      return {
        ...state,
        roles: state.roles.map(r => 
          r.id === action.payload.id ? { ...r, ...action.payload.updates } : r
        )
      };

    case 'REMOVE_ROLE':
      return {
        ...state,
        roles: state.roles.filter(r => r.id !== action.payload && !r.isBuiltIn)
      };

    case 'ADD_TEAM':
      return {
        ...state,
        teams: [...state.teams, action.payload]
      };

    case 'UPDATE_TEAM':
      return {
        ...state,
        teams: state.teams.map(t => 
          t.id === action.payload.id ? { ...t, ...action.payload.updates } : t
        )
      };

    case 'REMOVE_TEAM':
      return {
        ...state,
        teams: state.teams.filter(t => t.id !== action.payload)
      };

    case 'LOG_ACTION':
      const auditLog: PermissionAuditLog = {
        ...action.payload,
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      };
      return {
        ...state,
        auditLogs: [auditLog, ...state.auditLogs.slice(0, 999)] // Manter apenas 1000 logs
      };

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload }
      };

    default:
      return state;
  }
}

// Context
const PermissionsContext = createContext<{
  state: PermissionsState;
  dispatch: React.Dispatch<PermissionsAction>;
  checkPermission: (userId: string, resourceId: string, action: PermissionAction) => boolean;
  getUserPermissions: (userId: string) => AdvancedPermission[];
  createPermission: (permission: Omit<AdvancedPermission, 'id' | 'createdAt'>) => void;
  evaluateConditions: (conditions: PermissionConditions) => boolean;
} | null>(null);

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionsProvider');
  }
  return context;
};

// Provider
export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(permissionsReducer, initialState);

  // Verificar se um usuário tem permissão para uma ação específica
  const checkPermission = useCallback((
    userId: string, 
    resourceId: string, 
    action: PermissionAction
  ): boolean => {
    console.log('[PermissionsEngine] Checking permission:', { userId, resourceId, action });
    console.log('[PermissionsEngine] DEVELOPMENT MODE - All permissions granted');
    
    // MODO DESENVOLVIMENTO: Sempre permitir todas as operações
    return true;
    
    /* 
    // Código original comentado temporariamente
    console.log('[PermissionsEngine] Current user:', state.currentUser);
    console.log('[PermissionsEngine] User roles:', state.currentUser.roles);

    // Verificar se o usuário é admin - admin tem acesso total
    if (state.currentUser.roles.includes('admin')) {
      console.log('[PermissionsEngine] User is admin, granting permission');
      return true;
    }

    // Para recursos 'workspace', permitir criação por padrão para usuários autenticados
    if (resourceId === 'workspace' && (action === 'create' || action === 'read')) {
      console.log('[PermissionsEngine] Workspace access granted for basic operations');
      return true;
    }

    // Buscar permissões diretas do usuário
    const userPermissions = state.permissions.filter(p => 
      p.subject.type === 'user' && 
      p.subject.id === userId &&
      p.resource.id === resourceId &&
      p.actions.includes(action) &&
      p.isActive
    );

    // Buscar permissões por roles
    const userRoles = state.roles.filter(r => r.members.includes(userId));
    const rolePermissions = state.permissions.filter(p => 
      p.subject.type === 'role' && 
      userRoles.some(r => r.id === p.subject.id) &&
      p.resource.id === resourceId &&
      p.actions.includes(action) &&
      p.isActive
    );

    // Buscar permissões por teams
    const userTeams = state.teams.filter(t => t.members.includes(userId));
    const teamPermissions = state.permissions.filter(p => 
      p.subject.type === 'team' && 
      userTeams.some(t => t.id === p.subject.id) &&
      p.resource.id === resourceId &&
      p.actions.includes(action) &&
      p.isActive
    );

    // Combinar todas as permissões
    const allPermissions = [...userPermissions, ...rolePermissions, ...teamPermissions];
    console.log('[PermissionsEngine] Found permissions:', allPermissions.length);

    // Ordenar por prioridade (maior prioridade primeiro)
    allPermissions.sort((a, b) => b.priority - a.priority);

    // Avaliar condições e herança
    for (const permission of allPermissions) {
      // Verificar se a permissão não expirou
      if (permission.expiresAt && permission.expiresAt < new Date()) {
        continue;
      }

      // Avaliar condições
      if (!evaluateConditions(permission.conditions)) {
        continue;
      }

      // Se chegou até aqui, a permissão é válida
      if (permission.inheritance === 'block') {
        console.log('[PermissionsEngine] Permission explicitly blocked');
        return false; // Explicitamente bloqueado
      }
      
      if (permission.inheritance === 'allow') {
        console.log('[PermissionsEngine] Permission explicitly allowed');
        return true; // Explicitamente permitido
      }
    }

    // Para ações básicas de leitura e criação, permitir por padrão para usuários com role editor
    if (state.currentUser.roles.includes('editor') && (action === 'create' || action === 'read' || action === 'update')) {
      console.log('[PermissionsEngine] Editor role granted for basic operations');
      return true;
    }

    // Para visualizadores, permitir apenas leitura
    if (state.currentUser.roles.includes('viewer') && action === 'read') {
      console.log('[PermissionsEngine] Viewer role granted for read operations');
      return true;
    }

    console.log('[PermissionsEngine] Permission denied by default');
    // Se não encontrou permissões específicas, negado por padrão (mas com mais liberalidade para admins)
    return false;
    */
  }, []);

  // Obter todas as permissões de um usuário
  const getUserPermissions = useCallback((userId: string): AdvancedPermission[] => {
    const userPermissions = state.permissions.filter(p => 
      p.subject.type === 'user' && p.subject.id === userId
    );

    const userRoles = state.roles.filter(r => r.members.includes(userId));
    const rolePermissions = state.permissions.filter(p => 
      p.subject.type === 'role' && userRoles.some(r => r.id === p.subject.id)
    );

    const userTeams = state.teams.filter(t => t.members.includes(userId));
    const teamPermissions = state.permissions.filter(p => 
      p.subject.type === 'team' && userTeams.some(t => t.id === p.subject.id)
    );

    return [...userPermissions, ...rolePermissions, ...teamPermissions];
  }, [state.permissions, state.roles, state.teams]);

  // Criar nova permissão
  const createPermission = useCallback((
    permission: Omit<AdvancedPermission, 'id' | 'createdAt'>
  ) => {
    const newPermission: AdvancedPermission = {
      ...permission,
      id: `perm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };

    dispatch({ type: 'ADD_PERMISSION', payload: newPermission });

    // Log da ação
    if (state.settings.enableAuditLog) {
      dispatch({
        type: 'LOG_ACTION',
        payload: {
          action: 'granted',
          userId: state.currentUser.id,
          resourceId: permission.resource.id,
          permissionId: newPermission.id,
          details: `Permissão ${permission.actions.join(', ')} concedida para ${permission.subject.name}`
        }
      });
    }
  }, [state.currentUser.id, state.settings.enableAuditLog]);

  // Avaliar condições de uma permissão
  const evaluateConditions = useCallback((conditions: PermissionConditions): boolean => {
    const now = new Date();

    // Verificar restrições de horário
    if (conditions.timeRestriction && state.settings.enableTimeRestrictions) {
      const currentHour = now.getHours();
      const currentDay = now.getDay();
      
      // Verificar dias da semana
      if (conditions.timeRestriction.daysOfWeek && 
          !conditions.timeRestriction.daysOfWeek.includes(currentDay)) {
        return false;
      }

      // Verificar horários permitidos
      const isInAllowedTime = conditions.timeRestriction.allowedHours.some(range => {
        const startHour = parseInt(range.start.split(':')[0]);
        const endHour = parseInt(range.end.split(':')[0]);
        return currentHour >= startHour && currentHour <= endHour;
      });

      if (!isInAllowedTime) {
        return false;
      }
    }

    // Verificar restrições de IP (simulado)
    if (conditions.ipWhitelist && conditions.ipWhitelist.length > 0) {
      // Em um ambiente real, você verificaria o IP do usuário
      // Por agora, sempre permitimos
    }

    // Verificar restrições de dispositivo
    if (conditions.deviceRestriction && conditions.deviceRestriction !== 'any') {
      // Em um ambiente real, você verificaria o user agent
      const isMobile = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent);
      if (conditions.deviceRestriction === 'mobile' && !isMobile) {
        return false;
      }
      if (conditions.deviceRestriction === 'desktop' && isMobile) {
        return false;
      }
    }

    return true;
  }, [state.settings]);

  const value = {
    state,
    dispatch,
    checkPermission,
    getUserPermissions,
    createPermission,
    evaluateConditions
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

// Componente para gerenciar permissões
interface PermissionManagerProps {
  className?: string;
}

export const PermissionManager: React.FC<PermissionManagerProps> = ({ className }) => {
  const { state, checkPermission } = usePermissions();
  const [selectedTab, setSelectedTab] = React.useState<'permissions' | 'roles' | 'teams' | 'audit'>('permissions');

  const getActionIcon = (action: PermissionAction) => {
    switch (action) {
      case 'read': return <Eye className="h-4 w-4" />;
      case 'update': return <Edit className="h-4 w-4" />;
      case 'delete': return <Trash2 className="h-4 w-4" />;
      case 'share': return <Share className="h-4 w-4" />;
      case 'comment': return <MessageSquare className="h-4 w-4" />;
      case 'create': return <Plus className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn("permission-manager bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700", className)}>
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-blue-500" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Sistema de Permissões
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gerencie permissões granulares e controle de acesso
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mt-4">
          {[
            { id: 'permissions', label: 'Permissões', icon: Shield },
            { id: 'roles', label: 'Funções', icon: Users },
            { id: 'teams', label: 'Equipes', icon: UserCheck },
            { id: 'audit', label: 'Auditoria', icon: Clock }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                selectedTab === tab.id
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {selectedTab === 'permissions' && (
            <motion.div
              key="permissions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Permissões Ativas ({state.permissions.length})
                </h3>
                <button className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                  + Nova Permissão
                </button>
              </div>

              <div className="space-y-2">
                {state.permissions.slice(0, 5).map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-1">
                        {permission.actions.map((action) => (
                          <span key={action} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                            {getActionIcon(action)}
                            {action}
                          </span>
                        ))}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {permission.subject.name} → {permission.resource.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Prioridade: {permission.priority} | 
                          {permission.expiresAt ? ` Expira: ${permission.expiresAt.toLocaleDateString()}` : ' Permanente'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {permission.inheritance === 'block' ? (
                        <Lock className="h-4 w-4 text-red-500" />
                      ) : (
                        <Unlock className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {selectedTab === 'roles' && (
            <motion.div
              key="roles"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Funções ({state.roles.length})
                </h3>
                <button className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                  + Nova Função
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {state.roles.map((role) => (
                  <div
                    key={role.id}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {role.name}
                      </h4>
                      {role.isBuiltIn && (
                        <span className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                          Sistema
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {role.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{role.members.length} membros</span>
                      <span>{role.permissions.length} permissões</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {selectedTab === 'audit' && (
            <motion.div
              key="audit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Log de Auditoria ({state.auditLogs.length})
                </h3>
              </div>

              <div className="space-y-2">
                {state.auditLogs.slice(0, 10).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      log.action === 'granted' ? 'bg-green-500' :
                      log.action === 'denied' ? 'bg-red-500' :
                      log.action === 'revoked' ? 'bg-orange-500' :
                      'bg-blue-500'
                    )} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {log.details}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {log.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PermissionsProvider;