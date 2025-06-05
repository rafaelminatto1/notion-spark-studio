
import { useCallback } from 'react';
import { User } from './useUserSystem';
import { FileItem } from '@/types';

export type Permission = 'read' | 'write' | 'delete' | 'share' | 'admin';

export interface PermissionCheck {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canShare: boolean;
  canAdmin: boolean;
}

export const usePermissions = (currentUser: User | null) => {
  
  const getUserPermissions = useCallback((user: User | null): Permission[] => {
    if (!user) return ['read'];
    
    switch (user.role) {
      case 'admin':
        return ['read', 'write', 'delete', 'share', 'admin'];
      case 'editor':
        return ['read', 'write', 'share'];
      case 'viewer':
        return ['read'];
      default:
        return ['read'];
    }
  }, []);

  const checkFilePermissions = useCallback((file: FileItem, user: User | null = currentUser): PermissionCheck => {
    const userPermissions = getUserPermissions(user);
    
    // Verificar se arquivo está protegido
    const isProtected = file.isProtected || false;
    const isAdmin = userPermissions.includes('admin');
    
    return {
      canRead: userPermissions.includes('read'),
      canWrite: userPermissions.includes('write') && (!isProtected || isAdmin),
      canDelete: userPermissions.includes('delete') && (!isProtected || isAdmin),
      canShare: userPermissions.includes('share'),
      canAdmin: userPermissions.includes('admin')
    };
  }, [currentUser, getUserPermissions]);

  const hasPermission = useCallback((permission: Permission, user: User | null = currentUser): boolean => {
    const userPermissions = getUserPermissions(user);
    return userPermissions.includes(permission);
  }, [currentUser, getUserPermissions]);

  const canPerformAction = useCallback((action: string, file?: FileItem, user: User | null = currentUser): boolean => {
    const permissions = file ? checkFilePermissions(file, user) : null;
    
    switch (action) {
      case 'create_file':
      case 'create_folder':
        return hasPermission('write', user);
      
      case 'edit_file':
        return permissions ? permissions.canWrite : false;
      
      case 'delete_file':
      case 'delete_folder':
        return permissions ? permissions.canDelete : false;
      
      case 'rename_file':
        return permissions ? permissions.canWrite : false;
      
      case 'share_file':
        return permissions ? permissions.canShare : false;
      
      case 'import_files':
      case 'export_files':
        return hasPermission('write', user);
      
      case 'manage_backups':
        return hasPermission('admin', user);
      
      case 'system_settings':
        return hasPermission('admin', user);
      
      default:
        return false;
    }
  }, [hasPermission, checkFilePermissions]);

  const getRestrictedActions = useCallback((file?: FileItem, user: User | null = currentUser): string[] => {
    const actions = [
      'create_file', 'create_folder', 'edit_file', 'delete_file', 
      'delete_folder', 'rename_file', 'share_file', 'import_files', 
      'export_files', 'manage_backups', 'system_settings'
    ];
    
    return actions.filter(action => !canPerformAction(action, file, user));
  }, [canPerformAction]);

  return {
    getUserPermissions,
    checkFilePermissions,
    hasPermission,
    canPerformAction,
    getRestrictedActions
  };
};
