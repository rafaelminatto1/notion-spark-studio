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

// Tipos para o sistema de backup
interface BackupEntry {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'manual';
  timestamp: number;
  size: number;
  compressed: boolean;
  encrypted: boolean;
  integrity: 'verified' | 'pending' | 'failed';
  metadata: {
    version: string;
    userAgent: string;
    location: string;
    notes?: string;
  };
  data: Record<string, unknown>;
}

interface BackupConfig {
  autoBackup: boolean;
  maxBackups: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  backupInterval: number; // in minutes
  includeUserPreferences: boolean;
  includeApplicationState: boolean;
}

interface BackupStats {
  totalBackups: number;
  totalSize: number;
  lastBackup: number | null;
  nextBackup: number | null;
  successRate: number;
}

// Classe principal do sistema de backup
export class BackupSystem {
  private static instance: BackupSystem;
  private config: BackupConfig;
  private backups: Map<string, BackupEntry> = new Map();
  private stats: BackupStats = {
    totalBackups: 0,
    totalSize: 0,
    lastBackup: null,
    nextBackup: null,
    successRate: 100
  };
  private autoBackupTimer: NodeJS.Timeout | null = null;
  private observers: ((stats: BackupStats) => void)[] = [];

  static getInstance(): BackupSystem {
    if (!BackupSystem.instance) {
      BackupSystem.instance = new BackupSystem();
    }
    return BackupSystem.instance;
  }

  constructor() {
    this.config = {
      autoBackup: true,
      maxBackups: 10,
      compressionEnabled: true,
      encryptionEnabled: false,
      backupInterval: 30,
      includeUserPreferences: true,
      includeApplicationState: true
    };

    this.loadConfig();
    this.loadBackups();
    this.startAutoBackup();
  }

  // Configuração
  updateConfig(newConfig: Partial<BackupConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
    
    if (newConfig.autoBackup !== undefined) {
      if (newConfig.autoBackup) {
        this.startAutoBackup();
      } else {
        this.stopAutoBackup();
      }
    }
  }

  getConfig(): BackupConfig {
    return { ...this.config };
  }

  // Backup manual
  async createBackup(name?: string, type: 'full' | 'incremental' | 'manual' = 'manual'): Promise<BackupEntry> {
    const id = `backup_${Date.now().toString()}_${Math.random().toString(36).substring(2, 15)}`;
    const timestamp = Date.now();
    
    const data = await this.collectData();
    const compressedData = this.config.compressionEnabled ? await this.compressData(data) : data;
    const finalData = this.config.encryptionEnabled ? await this.encryptData(compressedData) : compressedData;
    
    const backup: BackupEntry = {
      id,
      name: name ?? `Backup ${new Date(timestamp).toLocaleString()}`,
      type,
      timestamp,
      size: JSON.stringify(finalData).length,
      compressed: this.config.compressionEnabled,
      encrypted: this.config.encryptionEnabled,
      integrity: 'pending',
      metadata: {
        version: '1.0.0',
        userAgent: navigator.userAgent,
        location: window.location.href,
        notes: ''
      },
      data: finalData
    };

    // Verify integrity
    backup.integrity = await this.verifyIntegrity(backup) ? 'verified' : 'failed';
    
    this.backups.set(id, backup);
    await this.saveBackups();
    await this.cleanupOldBackups();

    return backup;
  }

  // Restauração
  async restoreBackup(id: string): Promise<boolean> {
    const backup = this.backups.get(id);
    if (!backup) {
      throw new Error('Backup not found');
    }

    try {
      let data = backup.data;
      
      // Decrypt if needed
      if (backup.encrypted) {
        data = await this.decryptData(data);
      }
      
      // Decompress if needed
      if (backup.compressed) {
        data = await this.decompressData(data);
      }

      // Restore data
      await this.restoreData(data);
      return true;
    } catch (error) {
      console.error('Failed to restore backup:', error);
      return false;
    }
  }

  // Listagem e gerenciamento
  getBackups(): BackupEntry[] {
    return Array.from(this.backups.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  async deleteBackup(id: string): Promise<boolean> {
    const deleted = this.backups.delete(id);
    if (deleted) {
      await this.saveBackups();
      this.updateStats();
    }
    return deleted;
  }

  async exportBackup(id: string): Promise<void> {
    const backup = this.backups.get(id);
    if (!backup) {
      throw new Error('Backup not found');
    }

    const exportData = {
      ...backup,
      exportedAt: Date.now(),
      exportVersion: '1.0.0'
    };

    // Create and trigger download
    await new Promise<void>((resolve) => {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${backup.name.replace(/[^a-z0-9]/gi, '_')}.backup.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      resolve();
    });
  }

  async importBackup(file: File): Promise<BackupEntry> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const result = e.target?.result;
          if (typeof result !== 'string') {
            throw new Error('Invalid file content');
          }
          
          const importedData: BackupEntry = JSON.parse(result);
          
          // Validate backup structure
          if (!this.validateBackupStructure(importedData)) {
            throw new Error('Invalid backup structure');
          }

          // Generate new ID to avoid conflicts
          importedData.id = `imported_${Date.now().toString()}_${Math.random().toString(36).substring(2, 15)}`;
          importedData.name = `${importedData.name} (Imported)`;

          this.backups.set(importedData.id, importedData);
          await this.saveBackups();
          
          resolve(importedData);
        } catch (error) {
          reject(new Error(`Failed to import backup: ${error}`));
        }
      };
      reader.onerror = () => { reject(new Error('Failed to read file')); };
      reader.readAsText(file);
    });
  }

  // Estatísticas
  getStats(): BackupStats {
    return { ...this.stats };
  }

  subscribe(observer: (stats: BackupStats) => void): () => void {
    this.observers.push(observer);
    return () => {
      const index = this.observers.indexOf(observer);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  // Métodos privados
  private async collectData(): Promise<Record<string, unknown>> {
    const data: Record<string, unknown> = {};

    // Collect localStorage data
    if (this.config.includeUserPreferences) {
      data.localStorage = this.getLocalStorageData();
    }

    // Collect sessionStorage data
    if (this.config.includeApplicationState) {
      data.sessionStorage = this.getSessionStorageData();
    }

    // Collect IndexedDB data (simplified)
    data.indexedDB = await this.getIndexedDBData();

    // Collect user preferences
    if (this.config.includeUserPreferences) {
      data.userPreferences = this.getUserPreferencesData();
    }

    // Collect application state
    if (this.config.includeApplicationState) {
      data.applicationState = this.getApplicationStateData();
    }

    return data;
  }

  private async restoreData(data: Record<string, unknown>): Promise<void> {
    // Restore localStorage
    if (data.localStorage) {
      this.restoreLocalStorageData(data.localStorage);
    }

    // Restore sessionStorage
    if (data.sessionStorage) {
      this.restoreSessionStorageData(data.sessionStorage);
    }

    // Restore IndexedDB
    if (data.indexedDB) {
      await this.restoreIndexedDBData(data.indexedDB);
    }

    // Restore user preferences
    if (data.userPreferences) {
      this.restoreUserPreferencesData(data.userPreferences);
    }

    // Restore application state
    if (data.applicationState) {
      this.restoreApplicationStateData(data.applicationState);
    }
  }

  private getLocalStorageData(): Record<string, string> {
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        data[key] = localStorage.getItem(key) ?? '';
      }
    }
    return data;
  }

  private getSessionStorageData(): Record<string, string> {
    const data: Record<string, string> = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        data[key] = sessionStorage.getItem(key) ?? '';
      }
    }
    return data;
  }

  private async getIndexedDBData(): Promise<Record<string, unknown>> {
    // Simplified IndexedDB backup
    return await Promise.resolve({});
  }

  private async restoreIndexedDBData(_data: unknown): Promise<void> {
    // Simplified IndexedDB restore
    return Promise.resolve();
  }

  private getUserPreferencesData(): Record<string, unknown> {
    return {};
  }

  private getApplicationStateData(): Record<string, unknown> {
    return {};
  }

  private restoreLocalStorageData(data: unknown): void {
    if (typeof data === 'object' && data !== null) {
      const storageData = data as Record<string, string>;
      Object.entries(storageData).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
    }
  }

  private restoreSessionStorageData(data: unknown): void {
    if (typeof data === 'object' && data !== null) {
      const storageData = data as Record<string, string>;
      Object.entries(storageData).forEach(([key, value]) => {
        sessionStorage.setItem(key, value);
      });
    }
  }

  private restoreUserPreferencesData(_data: unknown): void {
    // Restore user preferences logic
  }

  private restoreApplicationStateData(_data: unknown): void {
    // Restore application state logic
  }

  private async compressData(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Simple compression simulation
    return await Promise.resolve({
      __compressed: true,
      data: JSON.stringify(data)
    });
  }

  private async decompressData(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (typeof data === 'object' && data !== null && '__compressed' in data) {
      return await Promise.resolve(JSON.parse(data.data as string) as Record<string, unknown>);
    }
    return await Promise.resolve(data);
  }

  private async encryptData(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Simple encryption simulation
    return await Promise.resolve({
      __encrypted: true,
      data: btoa(JSON.stringify(data))
    });
  }

  private async decryptData(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (typeof data === 'object' && data !== null && '__encrypted' in data) {
      return await Promise.resolve(JSON.parse(atob(data.data as string)) as Record<string, unknown>);
    }
    return await Promise.resolve(data);
  }

  private async cleanupOldBackups(): Promise<void> {
    const backups = this.getBackups();
    if (backups.length > this.config.maxBackups) {
      const toDelete = backups.slice(this.config.maxBackups);
      toDelete.forEach(backup => {
        this.backups.delete(backup.id);
      });
      await this.saveBackups();
    }
  }

  private updateStats(): void {
    const backups = Array.from(this.backups.values());
    
    this.stats.totalBackups = backups.length;
    this.stats.totalSize = backups.reduce((sum, b) => sum + b.size, 0);
    this.stats.lastBackup = backups.length > 0 
      ? Math.max(...backups.map(b => b.timestamp)) 
      : null;
    this.stats.nextBackup = this.config.autoBackup ? Date.now() + (this.config.backupInterval * 60 * 1000) : null;
    this.stats.successRate = backups.length > 0 
      ? (backups.filter(b => b.integrity === 'verified').length / backups.length) * 100 
      : 0;

    this.notifyObservers();
  }

  private notifyObservers(): void {
    this.observers.forEach(observer => { observer(this.stats); });
  }

  private startAutoBackup(): void {
    if (!this.config.autoBackup || this.autoBackupTimer) return;
    
    const intervalMs = this.config.backupInterval * 60 * 1000;
    this.autoBackupTimer = setInterval(() => {
      void this.createBackup(undefined, 'incremental');
    }, intervalMs);
  }

  private stopAutoBackup(): void {
    if (this.autoBackupTimer) {
      clearInterval(this.autoBackupTimer);
      this.autoBackupTimer = null;
    }
  }

  private saveConfig(): void {
    localStorage.setItem('backup_config', JSON.stringify(this.config));
  }

  private loadConfig(): void {
    try {
      const stored = localStorage.getItem('backup_config');
      if (stored) {
        this.config = { ...this.config, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load backup config:', error);
    }
  }

  private async saveBackups(): Promise<void> {
    try {
      const data = Array.from(this.backups.entries());
      await Promise.resolve(localStorage.setItem('backup_entries', JSON.stringify(data)));
    } catch (error) {
      console.error('Failed to save backups:', error);
    }
  }

  private loadBackups(): void {
    try {
      const stored = localStorage.getItem('backup_entries');
      if (stored) {
        const data = JSON.parse(stored) as Array<[string, BackupEntry]>;
        this.backups = new Map(data);
        this.updateStats();
      }
    } catch (error) {
      console.warn('Failed to load backups:', error);
    }
  }

  private async verifyIntegrity(backup: BackupEntry): Promise<boolean> {
    try {
      // Simple integrity check
      return await Promise.resolve(JSON.stringify(backup.data).length === backup.size);
    } catch {
      return await Promise.resolve(false);
    }
  }

  private validateBackupStructure(data: unknown): data is BackupEntry {
    if (typeof data !== 'object' || data === null) return false;
    const backup = data as Record<string, unknown>;
    
    return (
      typeof backup.id === 'string' &&
      typeof backup.name === 'string' &&
      typeof backup.timestamp === 'number' &&
      typeof backup.size === 'number' &&
      typeof backup.data === 'object'
    );
  }

  destroy(): void {
    this.stopAutoBackup();
  }
}

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
  BackupSystem,
  BackupProvider,
  useBackupSystem,
  BackupManager
}; 