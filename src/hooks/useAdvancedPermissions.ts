import { useState, useCallback, useEffect } from 'react';
import { useSupabaseAuth } from '@/integrations/supabase/auth';
import { useToast } from '@/hooks/use-toast';
import { FileItem } from '@/types';

export interface AdvancedPermission {
  id: string;
  subject: {
    type: 'user' | 'role' | 'team';
    id: string;
    name?: string;
  };
  resource: {
    type: 'file' | 'folder' | 'workspace' | 'database' | 'field';
    id: string;
    path?: string; // para permissões hierárquicas
    name?: string;
  };
  actions: ('create' | 'read' | 'update' | 'delete' | 'share' | 'comment')[];
  conditions: {
    timeRestriction?: {
      allowedHours: { start: string; end: string }[];
      timezone: string;
    };
    ipWhitelist?: string[];
    deviceRestriction?: 'mobile' | 'desktop' | 'any';
    expiresAt?: Date;
    locationRestriction?: {
      countries?: string[];
      regions?: string[];
    };
  };
  inheritance: 'block' | 'allow' | 'inherit';
  priority: number; // Para resolver conflitos
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
}

export interface PermissionContext {
  userAgent?: string;
  ipAddress?: string;
  currentTime?: Date;
  deviceType?: 'mobile' | 'desktop';
  location?: {
    country?: string;
    region?: string;
  };
}

export interface PermissionAuditLog {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  userId: string;
  userName?: string;
  permission: string;
  result: 'granted' | 'denied';
  reason?: string;
  context: PermissionContext;
  timestamp: Date;
}

export const useAdvancedPermissions = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  
  const [permissions, setPermissions] = useState<AdvancedPermission[]>([]);
  const [auditLogs, setAuditLogs] = useState<PermissionAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar permissões do usuário/workspace
  const loadPermissions = useCallback(async (workspaceId?: string) => {
    setIsLoading(true);
    try {
      // Simular carregamento das permissões
      const mockPermissions: AdvancedPermission[] = [
        {
          id: 'perm-1',
          subject: { type: 'user', id: user?.id || '', name: user?.email },
          resource: { type: 'workspace', id: workspaceId || 'default', name: 'Workspace Principal' },
          actions: ['create', 'read', 'update', 'delete', 'share'],
          conditions: {},
          inheritance: 'allow',
          priority: 100,
          createdAt: new Date(),
          createdBy: user?.id || '',
          isActive: true
        }
      ];
      
      setPermissions(mockPermissions);
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
      toast({
        title: "Erro ao carregar permissões",
        description: "Não foi possível carregar as permissões do usuário",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Verificar se uma ação é permitida
  const checkPermission = useCallback((
    action: string,
    resource: { type: string; id: string; path?: string },
    context: PermissionContext = {}
  ) => {
    
    // Contexto padrão
    const currentContext: PermissionContext = {
      currentTime: new Date(),
      deviceType: /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      userAgent: navigator.userAgent,
      ...context
    };

    // Encontrar permissões aplicáveis
    const applicablePermissions = permissions
      .filter(perm => perm.isActive)
      .filter(perm => {
        if (perm.resource.type === resource.type && perm.resource.id === resource.id) {
          return true;
        }
        
        if (perm.resource.type === 'folder' && resource.path) {
          return resource.path.startsWith(perm.resource.path || '');
        }
        
        return false;
      })
      .sort((a, b) => b.priority - a.priority);

    for (const permission of applicablePermissions) {
      if (!permission.actions.includes(action as any)) {
        continue;
      }

      const conditionResult = checkConditions(permission.conditions, currentContext);
      if (!conditionResult.valid) {
        logPermissionCheck(action, resource, permission, 'denied', conditionResult.reason, currentContext);
        return { 
          allowed: false, 
          reason: conditionResult.reason, 
          appliedPermission: permission 
        };
      }

      if (permission.inheritance === 'block') {
        logPermissionCheck(action, resource, permission, 'denied', 'Permissão bloqueada', currentContext);
        return { 
          allowed: false, 
          reason: 'Permissão bloqueada explicitamente', 
          appliedPermission: permission 
        };
      }

      if (permission.inheritance === 'allow') {
        logPermissionCheck(action, resource, permission, 'granted', undefined, currentContext);
        return { 
          allowed: true, 
          appliedPermission: permission 
        };
      }
    }

    logPermissionCheck(action, resource, undefined, 'denied', 'Nenhuma permissão encontrada', currentContext);
    return { 
      allowed: false, 
      reason: 'Nenhuma permissão explícita encontrada' 
    };
  }, [permissions]);

  // Verificar condições específicas
  const checkConditions = useCallback((
    conditions: AdvancedPermission['conditions'],
    context: PermissionContext
  ) => {
    
    if (conditions.timeRestriction) {
      const currentTime = context.currentTime || new Date();
      const currentHour = currentTime.getHours();
      const currentMinute = currentTime.getMinutes();
      const currentTimeNumber = currentHour * 60 + currentMinute;

      const isAllowedTime = conditions.timeRestriction.allowedHours.some(({ start, end }) => {
        const [startHour, startMinute] = start.split(':').map(Number);
        const [endHour, endMinute] = end.split(':').map(Number);
        const startTimeNumber = startHour * 60 + startMinute;
        const endTimeNumber = endHour * 60 + endMinute;

        return currentTimeNumber >= startTimeNumber && currentTimeNumber <= endTimeNumber;
      });

      if (!isAllowedTime) {
        return { valid: false, reason: 'Fora do horário permitido' };
      }
    }

    if (conditions.expiresAt) {
      const currentTime = context.currentTime || new Date();
      if (currentTime > conditions.expiresAt) {
        return { valid: false, reason: 'Permissão expirada' };
      }
    }

    if (conditions.ipWhitelist && context.ipAddress) {
      if (!conditions.ipWhitelist.includes(context.ipAddress)) {
        return { valid: false, reason: 'IP não autorizado' };
      }
    }

    if (conditions.deviceRestriction && conditions.deviceRestriction !== 'any') {
      if (context.deviceType !== conditions.deviceRestriction) {
        return { valid: false, reason: `Dispositivo ${context.deviceType} não autorizado` };
      }
    }

    if (conditions.locationRestriction && context.location) {
      if (conditions.locationRestriction.countries) {
        if (!conditions.locationRestriction.countries.includes(context.location.country || '')) {
          return { valid: false, reason: 'País não autorizado' };
        }
      }
      
      if (conditions.locationRestriction.regions) {
        if (!conditions.locationRestriction.regions.includes(context.location.region || '')) {
          return { valid: false, reason: 'Região não autorizada' };
        }
      }
    }

    return { valid: true };
  }, []);

  // Log de verificação de permissão
  const logPermissionCheck = useCallback((
    action: string,
    resource: { type: string; id: string },
    permission: AdvancedPermission | undefined,
    result: 'granted' | 'denied',
    reason: string | undefined,
    context: PermissionContext
  ) => {
    const log: PermissionAuditLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      action,
      resourceType: resource.type,
      resourceId: resource.id,
      userId: user?.id || 'anonymous',
      userName: user?.email || 'Anonymous',
      permission: permission?.id || 'none',
      result,
      reason,
      context,
      timestamp: new Date()
    };

    setAuditLogs(prev => [log, ...prev.slice(0, 999)]);
  }, [user]);

  const createPermission = useCallback(async (permission: Omit<AdvancedPermission, 'id' | 'createdAt' | 'createdBy'>) => {
    try {
      const newPermission: AdvancedPermission = {
        ...permission,
        id: `perm-${Date.now()}-${Math.random()}`,
        createdAt: new Date(),
        createdBy: user?.id || 'system'
      };

      setPermissions(prev => [...prev, newPermission]);
      
      toast({
        title: "✅ Permissão criada",
        description: "Nova permissão foi criada com sucesso"
      });

      return newPermission;
    } catch (error) {
      console.error('Erro ao criar permissão:', error);
      toast({
        title: "Erro ao criar permissão",
        description: "Não foi possível criar a permissão",
        variant: "destructive"
      });
      return null;
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      loadPermissions();
    }
  }, [user, loadPermissions]);

  return {
    permissions,
    auditLogs,
    isLoading,
    checkPermission,
    createPermission,
    loadPermissions
  };
}; 