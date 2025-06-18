
import { useState, useCallback, useEffect } from 'react';
import { useIndexedDB } from './useIndexedDB';
import type { FileItem } from '@/types';

export interface ActivityItem {
  id: string;
  type: 'create' | 'update' | 'delete' | 'rename' | 'move' | 'import' | 'export' | 'backup';
  targetId: string;
  targetName: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export const useActivityHistory = () => {
  const { isReady, set, getAll, query } = useIndexedDB();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar histórico
  useEffect(() => {
    const loadActivities = async () => {
      if (!isReady) return;
      
      try {
        const savedActivities = await getAll<ActivityItem>('activities');
        const sortedActivities = savedActivities
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 100); // Manter apenas as 100 mais recentes
        
        setActivities(sortedActivities);
      } catch (error) {
        console.error('Erro ao carregar atividades:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadActivities();
  }, [isReady, getAll]);

  const addActivity = useCallback(async (activity: Omit<ActivityItem, 'id' | 'timestamp'>) => {
    if (!isReady) return;

    const newActivity: ActivityItem = {
      ...activity,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    try {
      await set('activities', newActivity);
      setActivities(prev => [newActivity, ...prev].slice(0, 100));
    } catch (error) {
      console.error('Erro ao salvar atividade:', error);
    }
  }, [isReady, set]);

  // Funções de conveniência para ações específicas
  const logFileCreate = useCallback((file: FileItem) => {
    addActivity({
      type: 'create',
      targetId: file.id,
      targetName: file.name,
      description: `Criou ${file.type === 'folder' ? 'pasta' : 'arquivo'} "${file.name}"`
    });
  }, [addActivity]);

  const logFileUpdate = useCallback((file: FileItem) => {
    addActivity({
      type: 'update',
      targetId: file.id,
      targetName: file.name,
      description: `Editou "${file.name}"`
    });
  }, [addActivity]);

  const logFileDelete = useCallback((fileName: string, fileId: string) => {
    addActivity({
      type: 'delete',
      targetId: fileId,
      targetName: fileName,
      description: `Removeu "${fileName}"`
    });
  }, [addActivity]);

  const logFileRename = useCallback((oldName: string, newName: string, fileId: string) => {
    addActivity({
      type: 'rename',
      targetId: fileId,
      targetName: newName,
      description: `Renomeou "${oldName}" para "${newName}"`
    });
  }, [addActivity]);

  const logImport = useCallback((count: number) => {
    addActivity({
      type: 'import',
      targetId: 'import',
      targetName: 'Importação',
      description: `Importou ${count} arquivo(s)`
    });
  }, [addActivity]);

  const logExport = useCallback((count: number) => {
    addActivity({
      type: 'export',
      targetId: 'export',
      targetName: 'Exportação',
      description: `Exportou ${count} arquivo(s)`
    });
  }, [addActivity]);

  const logBackup = useCallback((filesCount: number) => {
    addActivity({
      type: 'backup',
      targetId: 'backup',
      targetName: 'Backup',
      description: `Criou backup com ${filesCount} arquivo(s)`
    });
  }, [addActivity]);

  const getRecentActivities = useCallback((limit = 10) => {
    return activities.slice(0, limit);
  }, [activities]);

  const getActivitiesByType = useCallback((type: ActivityItem['type']) => {
    return activities.filter(activity => activity.type === type);
  }, [activities]);

  const getActivitiesForFile = useCallback((fileId: string) => {
    return activities.filter(activity => activity.targetId === fileId);
  }, [activities]);

  return {
    activities,
    isLoading,
    addActivity,
    logFileCreate,
    logFileUpdate,
    logFileDelete,
    logFileRename,
    logImport,
    logExport,
    logBackup,
    getRecentActivities,
    getActivitiesByType,
    getActivitiesForFile
  };
};
