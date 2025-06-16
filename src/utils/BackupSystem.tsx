import React, { createContext, useContext, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Upload, 
  Shield, 
  Clock, 
  HardDrive, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Archive
} from 'lucide-react';

// Tipos para o sistema de backup
interface BackupEntry {
  id: string;
  timestamp: number;
  type: 'auto' | 'manual' | 'emergency';
  size: number;
  checksum: string;
  metadata: {
    version: string;
    userAgent: string;
    url: string;
    dataTypes: string[];
  };
  data: {
    localStorage: Record<string, string>;
    sessionStorage: Record<string, string>;
    indexedDB?: unknown[];
    userPreferences: unknown;
    applicationState: unknown;
  };
  compressed: boolean;
  encrypted: boolean;
}

interface BackupConfig {
  autoBackupEnabled: boolean;
  autoBackupInterval: number; // minutos
  maxBackups: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  includeSessionStorage: boolean;
  includeIndexedDB: boolean;
  backupOnCriticalActions: boolean;
  cloudSyncEnabled: boolean;
}

interface BackupStats {
  totalBackups: number;
  totalSize: number;
  lastBackup: number | null;
  successRate: number;
  averageSize: number;
  compressionRatio: number;
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
    successRate: 100,
    averageSize: 0,
    compressionRatio: 0
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
      autoBackupEnabled: true,
      autoBackupInterval: 30, // 30 minutos
      maxBackups: 10,
      compressionEnabled: true,
      encryptionEnabled: false,
      includeSessionStorage: false,
      includeIndexedDB: true,
      backupOnCriticalActions: true,
      cloudSyncEnabled: false
    };

    this.loadConfig();
    this.loadBackups();
    this.startAutoBackup();
  }

  // Configuração
  updateConfig(newConfig: Partial<BackupConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
    
    if (newConfig.autoBackupEnabled !== undefined) {
      if (newConfig.autoBackupEnabled) {
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
  async createBackup(type: 'manual' | 'emergency' = 'manual'): Promise<string> {
    try {
      const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Coletar dados
      const data = await this.collectData();
      
      // Calcular checksum
      const checksum = await this.calculateChecksum(data);
      
      // Comprimir se habilitado
      const processedData = this.config.compressionEnabled 
        ? await this.compressData(data) 
        : data;
      
      // Criptografar se habilitado
      const finalData = this.config.encryptionEnabled 
        ? await this.encryptData(processedData) 
        : processedData;

      const backup: BackupEntry = {
        id: backupId,
        timestamp: Date.now(),
        type,
        size: this.calculateSize(finalData),
        checksum,
        metadata: {
          version: '1.0.0',
          userAgent: navigator.userAgent,
          url: window.location.href,
          dataTypes: this.getDataTypes(data)
        },
        data: finalData,
        compressed: this.config.compressionEnabled,
        encrypted: this.config.encryptionEnabled
      };

      // Salvar backup
      this.backups.set(backupId, backup);
      
      // Limpar backups antigos
      await this.cleanupOldBackups();
      
      // Salvar no storage
      await this.saveBackups();
      
      // Atualizar estatísticas
      this.updateStats();
      
      // Sync para cloud se habilitado
      if (this.config.cloudSyncEnabled) {
        await this.syncToCloud(backup);
      }

      console.log(`✅ Backup criado: ${backupId}`);
      return backupId;
    } catch (error) {
      console.error('❌ Erro ao criar backup:', error);
      throw error;
    }
  }

  // Restauração
  async restoreBackup(backupId: string): Promise<boolean> {
    try {
      const backup = this.backups.get(backupId);
      if (!backup) {
        throw new Error(`Backup ${backupId} não encontrado`);
      }

      // Verificar integridade
      const isValid = await this.verifyBackup(backup);
      if (!isValid) {
        throw new Error('Backup corrompido ou inválido');
      }

      // Descriptografar se necessário
      let data = backup.data;
      if (backup.encrypted) {
        data = await this.decryptData(data);
      }

      // Descomprimir se necessário
      if (backup.compressed) {
        data = await this.decompressData(data);
      }

      // Restaurar dados
      await this.restoreData(data);

      console.log(`✅ Backup restaurado: ${backupId}`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao restaurar backup:', error);
      return false;
    }
  }

  // Listagem e gerenciamento
  getBackups(): BackupEntry[] {
    return Array.from(this.backups.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  async deleteBackup(backupId: string): Promise<boolean> {
    const deleted = this.backups.delete(backupId);
    if (deleted) {
      await this.saveBackups();
      this.updateStats();
    }
    return deleted;
  }

  async exportBackup(backupId: string): Promise<Blob> {
    const backup = this.backups.get(backupId);
    if (!backup) {
      throw new Error(`Backup ${backupId} não encontrado`);
    }

    const exportData = {
      version: '1.0.0',
      timestamp: Date.now(),
      backup
    };

    return new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
  }

  async importBackup(file: File): Promise<string> {
    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      if (!importData.backup || !importData.version) {
        throw new Error('Formato de backup inválido');
      }

      const backup = importData.backup as BackupEntry;
      
      // Verificar se já existe
      if (this.backups.has(backup.id)) {
        backup.id = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      // Verificar integridade
      const isValid = await this.verifyBackup(backup);
      if (!isValid) {
        throw new Error('Backup importado está corrompido');
      }

      this.backups.set(backup.id, backup);
      await this.saveBackups();
      this.updateStats();

      return backup.id;
    } catch (error) {
      console.error('❌ Erro ao importar backup:', error);
      throw error;
    }
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
  private async collectData(): Promise<unknown> {
    const data = {
      localStorage: { ...localStorage },
      sessionStorage: this.config.includeSessionStorage ? { ...sessionStorage } : {},
      userPreferences: this.getUserPreferences(),
      applicationState: this.getApplicationState(),
      indexedDB: this.config.includeIndexedDB ? await this.getIndexedDBData() : undefined
    };

    return data;
  }

  private async restoreData(data: unknown): Promise<void> {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid backup data');
    }

    const backupData = data as {
      localStorage?: Record<string, string>;
      sessionStorage?: Record<string, string>;
      userPreferences?: unknown;
      applicationState?: unknown;
      indexedDB?: unknown[];
    };

    try {
      // Restaurar localStorage
      if (backupData.localStorage) {
        localStorage.clear();
        Object.entries(backupData.localStorage).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });
      }

      // Restaurar sessionStorage
      if (backupData.sessionStorage && this.config.includeSessionStorage) {
        sessionStorage.clear();
        Object.entries(backupData.sessionStorage).forEach(([key, value]) => {
          sessionStorage.setItem(key, value);
        });
      }

      // Restaurar IndexedDB
      if (backupData.indexedDB && this.config.includeIndexedDB) {
        await this.restoreIndexedDBData(backupData.indexedDB);
      }

      // Recarregar página para aplicar mudanças
      window.location.reload();
    } catch (error) {
      throw new Error(`Failed to restore data: ${error}`);
    }
  }

  private getUserPreferences(): unknown {
    try {
      return JSON.parse(localStorage.getItem('user-preferences') || '{}');
    } catch {
      return {};
    }
  }

  private getApplicationState(): unknown {
    try {
      const state = {
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        screen: {
          width: screen.width,
          height: screen.height
        }
      };
      return state;
    } catch {
      return {};
    }
  }

  private async getIndexedDBData(): Promise<any[]> {
    // Implementação simplificada - em produção usar biblioteca específica
    return [];
  }

  private async restoreIndexedDBData(data: any[]): Promise<void> {
    // Implementação simplificada
    console.log('IndexedDB restore not implemented');
  }

  private getDataTypes(data: any): string[] {
    const types: string[] = [];
    
    if (data.localStorage && Object.keys(data.localStorage).length > 0) {
      types.push('localStorage');
    }
    if (data.sessionStorage && Object.keys(data.sessionStorage).length > 0) {
      types.push('sessionStorage');
    }
    if (data.indexedDB && data.indexedDB.length > 0) {
      types.push('indexedDB');
    }
    if (data.userPreferences && Object.keys(data.userPreferences).length > 0) {
      types.push('preferences');
    }
    if (data.applicationState) {
      types.push('appState');
    }

    return types;
  }

  private async calculateChecksum(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async verifyBackup(backup: BackupEntry): Promise<boolean> {
    try {
      let data = backup.data;
      
      if (backup.encrypted) {
        data = await this.decryptData(data);
      }
      
      if (backup.compressed) {
        data = await this.decompressData(data);
      }

      const checksum = await this.calculateChecksum(data);
      return checksum === backup.checksum;
    } catch {
      return false;
    }
  }

  private calculateSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size;
  }

  private async compressData(data: any): Promise<any> {
    // Implementação simplificada - em produção usar biblioteca de compressão
    const jsonString = JSON.stringify(data);
    return {
      __compressed: true,
      data: jsonString,
      originalSize: jsonString.length
    };
  }

  private async decompressData(data: any): Promise<any> {
    if (data.__compressed) {
      return JSON.parse(data.data);
    }
    return data;
  }

  private async encryptData(data: any): Promise<any> {
    // Implementação simplificada - em produção usar criptografia real
    return {
      __encrypted: true,
      data: btoa(JSON.stringify(data))
    };
  }

  private async decryptData(data: any): Promise<any> {
    if (data.__encrypted) {
      return JSON.parse(atob(data.data));
    }
    return data;
  }

  private async cleanupOldBackups(): Promise<void> {
    const backups = this.getBackups();
    
    if (backups.length > this.config.maxBackups) {
      const toDelete = backups.slice(this.config.maxBackups);
      
      for (const backup of toDelete) {
        this.backups.delete(backup.id);
      }
    }
  }

  private updateStats(): void {
    const backups = Array.from(this.backups.values());
    
    this.stats.totalBackups = backups.length;
    this.stats.totalSize = backups.reduce((sum, b) => sum + b.size, 0);
    this.stats.lastBackup = backups.length > 0 
      ? Math.max(...backups.map(b => b.timestamp)) 
      : null;
    this.stats.averageSize = backups.length > 0 
      ? this.stats.totalSize / backups.length 
      : 0;

    // Calcular taxa de compressão
    const compressedBackups = backups.filter(b => b.compressed);
    if (compressedBackups.length > 0) {
      // Implementação simplificada
      this.stats.compressionRatio = 0.3; // 30% de redução média
    }

    this.notifyObservers();
  }

  private notifyObservers(): void {
    this.observers.forEach(observer => observer(this.stats));
  }

  private startAutoBackup(): void {
    if (!this.config.autoBackupEnabled) return;

    this.stopAutoBackup();
    
    this.autoBackupTimer = setInterval(async () => {
      try {
        await this.createBackup('auto');
      } catch (error) {
        console.error('Auto backup failed:', error);
      }
    }, this.config.autoBackupInterval * 60 * 1000);
  }

  private stopAutoBackup(): void {
    if (this.autoBackupTimer) {
      clearInterval(this.autoBackupTimer);
      this.autoBackupTimer = null;
    }
  }

  private saveConfig(): void {
    localStorage.setItem('backup-config', JSON.stringify(this.config));
  }

  private loadConfig(): void {
    try {
      const stored = localStorage.getItem('backup-config');
      if (stored) {
        this.config = { ...this.config, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load backup config:', error);
    }
  }

  private async saveBackups(): Promise<void> {
    try {
      const backupsArray = Array.from(this.backups.entries());
      localStorage.setItem('backup-entries', JSON.stringify(backupsArray));
    } catch (error) {
      console.error('Failed to save backups:', error);
    }
  }

  private loadBackups(): void {
    try {
      const stored = localStorage.getItem('backup-entries');
      if (stored) {
        const backupsArray = JSON.parse(stored);
        this.backups = new Map(backupsArray);
        this.updateStats();
      }
    } catch (error) {
      console.warn('Failed to load backups:', error);
    }
  }

  private async syncToCloud(backup: BackupEntry): Promise<void> {
    // Implementação de sync para cloud (Firebase, AWS, etc.)
    console.log('Cloud sync not implemented');
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
        createBackup: async () => 'mock-backup-id',
        restoreBackup: async () => false,
        getBackups: () => [],
        deleteBackup: async () => false,
        exportBackup: async () => new Blob(),
        importBackup: async () => 'mock-id',
        getStats: () => ({
          totalBackups: 0,
          totalSize: 0,
          lastBackup: null,
          successRate: 0,
          averageSize: 0,
          compressionRatio: 0
        }),
        subscribe: () => () => {},
        updateConfig: () => {},
        getConfig: () => ({
          autoBackupEnabled: false,
          autoBackupInterval: 60,
          maxBackups: 5,
          compressionEnabled: false,
          encryptionEnabled: false,
          includeSessionStorage: false,
          includeIndexedDB: false,
          backupOnCriticalActions: false,
          cloudSyncEnabled: false
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
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const updateData = () => {
      setBackups(backupSystem.getBackups());
      setStats(backupSystem.getStats());
    };

    updateData();
    const unsubscribe = backupSystem.subscribe(setStats);

    return unsubscribe;
  }, [backupSystem]);

  const handleCreateBackup = async () => {
    setLoading(true);
    try {
      await backupSystem.createBackup('manual');
      setBackups(backupSystem.getBackups());
    } catch (error) {
      console.error('Failed to create backup:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    if (confirm('Tem certeza que deseja restaurar este backup? A página será recarregada.')) {
      setLoading(true);
      try {
        await backupSystem.restoreBackup(backupId);
      } catch (error) {
        console.error('Failed to restore backup:', error);
        alert('Erro ao restaurar backup');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExportBackup = async (backupId: string) => {
    try {
      const blob = await backupSystem.exportBackup(backupId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${backupId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export backup:', error);
    }
  };

  const formatSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sistema de Backup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalBackups}</div>
              <div className="text-sm text-muted-foreground">Total de Backups</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatSize(stats.totalSize)}</div>
              <div className="text-sm text-muted-foreground">Tamanho Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.successRate}%</div>
              <div className="text-sm text-muted-foreground">Taxa de Sucesso</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {stats.lastBackup ? formatDate(stats.lastBackup) : 'Nunca'}
              </div>
              <div className="text-sm text-muted-foreground">Último Backup</div>
            </div>
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
            <Button onClick={handleCreateBackup} disabled={loading}>
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
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
          <div className="space-y-3">
            {backups.map(backup => (
              <div key={backup.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{backup.id}</span>
                      <Badge variant={
                        backup.type === 'manual' ? 'default' :
                        backup.type === 'auto' ? 'secondary' : 'destructive'
                      }>
                        {backup.type}
                      </Badge>
                      {backup.compressed && (
                        <Badge variant="outline">Comprimido</Badge>
                      )}
                      {backup.encrypted && (
                        <Badge variant="outline">Criptografado</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(backup.timestamp)} • {formatSize(backup.size)} • {backup.metadata.dataTypes.join(', ')}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestoreBackup(backup.id)}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Restaurar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExportBackup(backup.id)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Exportar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {backups.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum backup encontrado
              </div>
            )}
          </div>
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