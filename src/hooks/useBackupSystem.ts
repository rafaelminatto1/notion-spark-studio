
import { useState, useCallback, useEffect } from 'react';
import type { FileItem } from '@/types';
import { useIndexedDB } from './useIndexedDB';
import { useToast } from '@/hooks/use-toast';

interface BackupData {
  id: string;
  timestamp: Date;
  filesCount: number;
  size: number;
  files: FileItem[];
  workspace: any;
  version: string;
}

export const useBackupSystem = (files: FileItem[]) => {
  const { isReady, set, get, getAll, remove } = useIndexedDB();
  const { toast } = useToast();
  const [backups, setBackups] = useState<BackupData[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);

  // Carregar backups existentes
  useEffect(() => {
    const loadBackups = async () => {
      if (!isReady) return;
      
      try {
        const savedBackups = await getAll<BackupData>('backups');
        setBackups(savedBackups.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
      } catch (error) {
        console.error('Erro ao carregar backups:', error);
      }
    };

    loadBackups();
  }, [isReady, getAll]);

  // Backup automático a cada 30 minutos
  useEffect(() => {
    if (!autoBackupEnabled || !isReady) return;

    const interval = setInterval(() => {
      createBackup(true);
    }, 30 * 60 * 1000); // 30 minutos

    return () => { clearInterval(interval); };
  }, [autoBackupEnabled, isReady, files]);

  const createBackup = useCallback(async (isAutomatic = false) => {
    if (!isReady || isCreatingBackup) return null;

    setIsCreatingBackup(true);
    
    try {
      const workspace = await get<any>('workspace', 'current');
      
      const backup: BackupData = {
        id: `backup_${Date.now()}`,
        timestamp: new Date(),
        filesCount: files.length,
        size: JSON.stringify(files).length,
        files: files.map(file => ({
          ...file,
          createdAt: new Date(file.createdAt),
          updatedAt: new Date(file.updatedAt)
        })),
        workspace,
        version: '1.0'
      };

      await set('backups', backup);
      setBackups(prev => [backup, ...prev].slice(0, 20)); // Manter apenas 20 backups

      if (!isAutomatic) {
        toast({
          title: "Backup criado",
          description: `Backup com ${files.length} arquivos criado com sucesso`
        });
      }

      return backup.id;
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      if (!isAutomatic) {
        toast({
          title: "Erro no backup",
          description: "Falha ao criar backup",
          variant: "destructive"
        });
      }
      return null;
    } finally {
      setIsCreatingBackup(false);
    }
  }, [files, isReady, isCreatingBackup, set, get, toast]);

  const restoreBackup = useCallback(async (backupId: string) => {
    try {
      const backup = backups.find(b => b.id === backupId);
      if (!backup) throw new Error('Backup não encontrado');

      // Limpar dados atuais
      await Promise.all([
        set('workspace', backup.workspace),
        // Restaurar arquivos
        ...backup.files.map(file => set('files', file))
      ]);

      toast({
        title: "Backup restaurado",
        description: `${backup.filesCount} arquivo(s) restaurado(s)`
      });

      // Reload da página para aplicar mudanças
      window.location.reload();
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      toast({
        title: "Erro na restauração",
        description: "Falha ao restaurar backup",
        variant: "destructive"
      });
    }
  }, [backups, set, toast]);

  const deleteBackup = useCallback(async (backupId: string) => {
    try {
      await remove('backups', backupId);
      setBackups(prev => prev.filter(b => b.id !== backupId));
      
      toast({
        title: "Backup removido",
        description: "Backup removido com sucesso"
      });
    } catch (error) {
      console.error('Erro ao remover backup:', error);
      toast({
        title: "Erro ao remover",
        description: "Falha ao remover backup",
        variant: "destructive"
      });
    }
  }, [remove, toast]);

  const exportBackup = useCallback((backupId: string) => {
    const backup = backups.find(b => b.id === backupId);
    if (!backup) return;

    const dataStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${backup.timestamp.toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [backups]);

  const getBackupStats = useCallback(() => {
    const totalSize = backups.reduce((acc, b) => acc + b.size, 0);
    const avgSize = backups.length > 0 ? totalSize / backups.length : 0;
    
    return {
      totalBackups: backups.length,
      totalSize: Math.round(totalSize / 1024), // KB
      avgSize: Math.round(avgSize / 1024), // KB
      oldestBackup: backups.length > 0 ? backups[backups.length - 1] : null,
      newestBackup: backups.length > 0 ? backups[0] : null
    };
  }, [backups]);

  return {
    backups,
    isCreatingBackup,
    autoBackupEnabled,
    setAutoBackupEnabled,
    createBackup,
    restoreBackup,
    deleteBackup,
    exportBackup,
    getBackupStats
  };
};
