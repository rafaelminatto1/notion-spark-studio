import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Upload, 
  Shield, 
  Clock, 
  HardDrive, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Archive,
  Trash2,
  Database
} from 'lucide-react';
import type { BackupEntry, BackupConfig, BackupStats } from './BackupSystemCore';
import { BackupSystem } from './BackupSystemCore';

// Context React
const BackupContext = createContext<BackupSystem | null>(null);

// Provider
interface BackupProviderProps {
  children: React.ReactNode;
  config?: Partial<BackupConfig>;
}

export const BackupProvider: React.FC<BackupProviderProps> = ({ children, config }) => {
  const [backupSystem] = useState(() => {
    const system = BackupSystem.getInstance();
    if (config) {
      system.updateConfig(config);
    }
    return system;
  });

  useEffect(() => {
    return () => {
      backupSystem.destroy();
    };
  }, [backupSystem]);

  return (
    <BackupContext.Provider value={backupSystem}>
      {children}
    </BackupContext.Provider>
  );
};

// Hook
export function useBackupSystem() {
  const system = useContext(BackupContext);
  
  // Proteção SSR - retornar mock quando contexto não disponível
  if (!system) {
    if (typeof window === 'undefined') {
      // Durante SSR, retornar mock object
      return {
        createBackup: async () => ({
          id: 'mock-id',
          name: 'Mock Backup',
          type: 'manual',
          timestamp: Date.now(),
          size: 0,
          compressed: false,
          encrypted: false,
          integrity: 'verified',
          metadata: {
            version: '1.0.0',
            userAgent: 'Mock Browser',
            location: 'https://mock.com',
            notes: ''
          },
          data: {}
        }),
        restoreBackup: async () => false,
        getBackups: () => [],
        deleteBackup: async () => false,
        exportBackup: async () => {},
        importBackup: async () => ({
          id: 'mock-imported-id',
          name: 'Mock Imported Backup',
          type: 'manual',
          timestamp: Date.now(),
          size: 0,
          compressed: false,
          encrypted: false,
          integrity: 'verified',
          metadata: {
            version: '1.0.0',
            userAgent: 'Mock Browser',
            location: 'https://mock.com',
            notes: ''
          },
          data: {}
        }),
        getStats: () => ({
          totalBackups: 0,
          totalSize: 0,
          lastBackup: null,
          nextBackup: null,
          successRate: 0
        }),
        subscribe: () => () => {},
        updateConfig: () => {},
        getConfig: () => ({
          autoBackup: false,
          maxBackups: 5,
          compressionEnabled: false,
          encryptionEnabled: false,
          backupInterval: 60,
          includeUserPreferences: false,
          includeApplicationState: false
        }),
        destroy: () => {}
      };
    }
    
    throw new Error('useBackupSystem must be used within a BackupProvider');
  }

  return system;
}

// Componente de gerenciamento
export const BackupManager: React.FC = () => {
  const backupSystem = useBackupSystem();
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [stats, setStats] = useState<BackupStats>({
    totalBackups: 0,
    totalSize: 0,
    lastBackup: null,
    nextBackup: null,
    successRate: 0
  });
  const [config, setConfig] = useState<BackupConfig>(backupSystem.getConfig());
  const [isCreating, setIsCreating] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [newBackupName, setNewBackupName] = useState('');

  useEffect(() => {
    const updateData = () => {
      setBackups(backupSystem.getBackups());
      setStats(backupSystem.getStats());
      setConfig(backupSystem.getConfig());
    };

    updateData();
    const unsubscribe = backupSystem.subscribe(setStats);

    return unsubscribe;
  }, [backupSystem]);

  const handleCreateBackup = useCallback(async (): Promise<void> => {
    setIsCreating(true);
    try {
      await backupSystem.createBackup(newBackupName || undefined);
      setNewBackupName('');
      setBackups(backupSystem.getBackups());
    } catch (error) {
      console.error('Failed to create backup:', error);
    } finally {
      setIsCreating(false);
    }
  }, [newBackupName, setBackups, backupSystem]);

  const handleRestoreBackup = useCallback(async (id: string): Promise<void> => {
    try {
      const success = await backupSystem.restoreBackup(id);
      if (success) {
        // Show success message
      }
    } catch (error) {
      console.error('Failed to restore backup:', error);
    }
  }, [backupSystem]);

  const handleDeleteBackup = useCallback(async (id: string): Promise<void> => {
    try {
      await backupSystem.deleteBackup(id);
      setBackups(backupSystem.getBackups());
    } catch (error) {
      console.error('Failed to delete backup:', error);
    }
  }, [backupSystem]);

  const handleExportBackup = useCallback(async (id: string): Promise<void> => {
    try {
      await backupSystem.exportBackup(id);
    } catch (error) {
      console.error('Failed to export backup:', error);
    }
  }, [backupSystem]);

  const handleImportBackup = useCallback(async (file: File): Promise<void> => {
    try {
      await backupSystem.importBackup(file);
      setBackups(backupSystem.getBackups());
    } catch (error) {
      console.error('Failed to import backup:', error);
    }
  }, [backupSystem]);

  const formatSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getIntegrityIcon = (integrity: BackupEntry['integrity']) => {
    switch (integrity) {
      case 'verified': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-500" />
            Sistema de Backup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-500">Total Backups</p>
                    <p className="text-2xl font-bold">{stats.totalBackups}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-500">Total Size</p>
                    <p className="text-2xl font-bold">{formatSize(stats.totalSize)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-500">Success Rate</p>
                    <p className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-500">Last Backup</p>
                    <p className="text-lg font-semibold">
                      {stats.lastBackup ? new Date(stats.lastBackup).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <Card>
        <CardHeader>
          <CardTitle>Ações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={() => void handleCreateBackup()} disabled={isCreating}>
              {isCreating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Archive className="h-4 w-4 mr-2" />
              )}
              Criar Backup
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Backups */}
      <Card>
        <CardHeader>
          <CardTitle>Backups Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <Alert>
              <AlertDescription>
                No backups found. Create your first backup to get started.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {getIntegrityIcon(backup.integrity)}
                    <div>
                      <p className="font-medium">{backup.name}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Badge variant="outline">{backup.type}</Badge>
                        <span>{new Date(backup.timestamp).toLocaleString()}</span>
                        <span>•</span>
                        <span>{formatSize(backup.size)}</span>
                        {backup.compressed && (
                          <Badge variant="secondary">Compressed</Badge>
                        )}
                        {backup.encrypted && (
                          <Badge variant="secondary">Encrypted</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleRestoreBackup(backup.id)}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleExportBackup(backup.id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleDeleteBackup(backup.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default {
  BackupProvider,
  useBackupSystem,
  BackupManager
}; 