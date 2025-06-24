// Componente UI do sistema de backup (modularizado)
// Substitui o BackupSystem.tsx gigante por interface limpa

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

import { backupService } from '@/services/backup/BackupService';
import type { BackupEntry, BackupStats, BackupConfig } from '@/services/backup/BackupTypes';

// Context para compartilhar estado
interface BackupContextValue {
  stats: BackupStats;
  config: BackupConfig;
  backups: BackupEntry[];
  loading: boolean;
  error: string | null;
  updateConfig: (config: Partial<BackupConfig>) => void;
  createBackup: (name?: string) => Promise<void>;
  restoreBackup: (id: string) => Promise<void>;
  deleteBackup: (id: string) => Promise<void>;
  exportBackup: (id: string) => Promise<void>;
}

const BackupContext = createContext<BackupContextValue | null>(null);

export function useBackup() {
  const context = useContext(BackupContext);
  if (!context) {
    throw new Error('useBackup deve ser usado dentro de BackupProvider');
  }
  return context;
}

// Provider
export const BackupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<BackupStats>(backupService.getStats());
  const [config, setConfig] = useState<BackupConfig>(backupService.getConfig());
  const [backups, setBackups] = useState<BackupEntry[]>(backupService.getBackups());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = backupService.subscribe((newStats) => {
      setStats(newStats);
      setBackups(backupService.getBackups());
    });

    return unsubscribe;
  }, []);

  const updateConfig = useCallback((newConfig: Partial<BackupConfig>) => {
    try {
      backupService.updateConfig(newConfig);
      setConfig(backupService.getConfig());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar configuração');
    }
  }, []);

  const createBackup = useCallback(async (name?: string) => {
    setLoading(true);
    setError(null);
    try {
      await backupService.createBackup({ name });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar backup');
    } finally {
      setLoading(false);
    }
  }, []);

  const restoreBackup = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await backupService.restoreBackup(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao restaurar backup');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteBackup = useCallback(async (id: string) => {
    setError(null);
    try {
      await backupService.deleteBackup(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar backup');
    }
  }, []);

  const exportBackup = useCallback(async (id: string) => {
    setError(null);
    try {
      await backupService.exportBackup(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao exportar backup');
    }
  }, []);

  const value: BackupContextValue = {
    stats,
    config,
    backups,
    loading,
    error,
    updateConfig,
    createBackup,
    restoreBackup,
    deleteBackup,
    exportBackup
  };

  return (
    <BackupContext.Provider value={value}>
      {children}
    </BackupContext.Provider>
  );
};

// Componente principal
export const BackupManager: React.FC = () => {
  const { 
    stats, 
    config, 
    backups, 
    loading, 
    error,
    updateConfig, 
    createBackup, 
    restoreBackup, 
    deleteBackup, 
    exportBackup 
  } = useBackup();

  const [backupName, setBackupName] = useState('');

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`;
  };

  const getIntegrityIcon = (integrity: BackupEntry['integrity']) => {
    switch (integrity) {
      case 'verified': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const handleCreateBackup = async () => {
    await createBackup(backupName || undefined);
    setBackupName('');
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Backups</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBackups}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamanho Total</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSize(stats.totalSize)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último Backup</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {stats.lastBackup ? 
                new Date(stats.lastBackup).toLocaleString('pt-BR') : 
                'Nenhum'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Criar Backup */}
      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nome do backup (opcional)"
              value={backupName}
              onChange={(e) => setBackupName(e.target.value)}
              disabled={loading}
            />
            <Button 
              onClick={handleCreateBackup} 
              disabled={loading}
              className="shrink-0"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
              Criar Backup
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Backups */}
      <Card>
        <CardHeader>
          <CardTitle>Backups Existentes</CardTitle>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum backup encontrado
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div 
                  key={backup.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getIntegrityIcon(backup.integrity)}
                    <div>
                      <div className="font-medium">{backup.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(backup.timestamp).toLocaleString('pt-BR')} • {formatSize(backup.size)}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Badge variant={backup.type === 'manual' ? 'default' : 'secondary'}>
                        {backup.type}
                      </Badge>
                      {backup.compressed && (
                        <Badge variant="outline">Comprimido</Badge>
                      )}
                      {backup.encrypted && (
                        <Badge variant="outline">Criptografado</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => exportBackup(backup.id)}
                      disabled={loading}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => restoreBackup(backup.id)}
                      disabled={loading || backup.integrity === 'failed'}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteBackup(backup.id)}
                      disabled={loading}
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

      {/* Configurações */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Backup Automático</label>
            <Button
              size="sm"
              variant={config.autoBackup ? "default" : "outline"}
              onClick={() => updateConfig({ autoBackup: !config.autoBackup })}
            >
              {config.autoBackup ? 'Ativado' : 'Desativado'}
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Compressão</label>
            <Button
              size="sm"
              variant={config.compressionEnabled ? "default" : "outline"}
              onClick={() => updateConfig({ compressionEnabled: !config.compressionEnabled })}
            >
              {config.compressionEnabled ? 'Ativada' : 'Desativada'}
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Criptografia</label>
            <Button
              size="sm"
              variant={config.encryptionEnabled ? "default" : "outline"}
              onClick={() => updateConfig({ encryptionEnabled: !config.encryptionEnabled })}
            >
              {config.encryptionEnabled ? 'Ativada' : 'Desativada'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 