// Serviço principal do sistema de backup (simplificado e modularizado)
// Resolve problemas de arquivos gigantes e melhora manutenibilidade

import type { 
  BackupEntry, 
  BackupConfig, 
  BackupStats, 
  BackupCreateOptions,
  BackupObserver,
  BackupCollectedData
} from './BackupTypes';
import { 
  BackupError, 
  BackupNotFoundError, 
  BackupCorruptedError 
} from './BackupTypes';
import { BackupDataCollector, BackupDataRestorer } from './BackupDataCollector';
import { BackupCryptoService } from './BackupCryptoService';

export class BackupService {
  private static instance: BackupService;
  private config: BackupConfig;
  private backups = new Map<string, BackupEntry>();
  private stats: BackupStats;
  private autoBackupTimer: NodeJS.Timeout | null = null;
  private observers: BackupObserver[] = [];
  
  // Serviços modularizados
  private dataCollector: BackupDataCollector;
  private dataRestorer: BackupDataRestorer;
  private cryptoService: BackupCryptoService;

  static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
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

    this.stats = {
      totalBackups: 0,
      totalSize: 0,
      lastBackup: null,
      nextBackup: null,
      successRate: 100
    };

    // Inicializar serviços
    this.dataCollector = new BackupDataCollector(this.config);
    this.dataRestorer = new BackupDataRestorer();
    this.cryptoService = new BackupCryptoService();

    this.loadConfig();
    this.loadBackups();
    this.startAutoBackup();
  }

  /**
   * Configuração
   */
  updateConfig(newConfig: Partial<BackupConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.dataCollector = new BackupDataCollector(this.config);
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

  /**
   * Criar backup
   */
  async createBackup(options: BackupCreateOptions = {}): Promise<BackupEntry> {
    try {
      const id = this.generateBackupId();
      const timestamp = Date.now();
      const type = options.type || 'manual';
      
      // Coletar dados
      const collectedData = await this.dataCollector.collectData();
      
      // Processar dados (compressão e criptografia)
      let processedData = collectedData as Record<string, unknown>;
      let compressed = false;
      let encrypted = false;

      if (this.config.compressionEnabled) {
        const compressionResult = await this.cryptoService.compressData(processedData);
        processedData = compressionResult.data;
        compressed = compressionResult.compressed;
      }

      if (this.config.encryptionEnabled) {
        const encryptionResult = await this.cryptoService.encryptData(processedData);
        processedData = encryptionResult.data;
        encrypted = encryptionResult.encrypted;
      }

      // Criar entrada do backup
      const backup: BackupEntry = {
        id,
        name: options.name || `Backup ${new Date(timestamp).toLocaleString('pt-BR')}`,
        type,
        timestamp,
        size: JSON.stringify(processedData).length,
        compressed,
        encrypted,
        integrity: 'pending',
        metadata: {
          version: '1.0.0',
          userAgent: navigator.userAgent,
          location: window.location.href,
          notes: options.notes
        },
        data: processedData
      };

      // Verificar integridade
      backup.integrity = await this.cryptoService.verifyIntegrity(backup) ? 'verified' : 'failed';
      
      // Salvar backup
      this.backups.set(id, backup);
      await this.saveBackups();
      await this.cleanupOldBackups();
      this.updateStats();

      return backup;
    } catch (error) {
      throw new BackupError('Falha ao criar backup', 'CREATE_FAILED', error);
    }
  }

  /**
   * Restaurar backup
   */
  async restoreBackup(id: string): Promise<void> {
    const backup = this.backups.get(id);
    if (!backup) {
      throw new BackupNotFoundError(id);
    }

    if (backup.integrity === 'failed') {
      throw new BackupCorruptedError(id);
    }

    try {
      let data = backup.data;
      
      // Descriptografar se necessário
      if (backup.encrypted) {
        data = await this.cryptoService.decryptData(data);
      }
      
      // Descomprimir se necessário
      if (backup.compressed) {
        data = await this.cryptoService.decompressData(data);
      }

      // Restaurar dados
      await this.dataRestorer.restoreData(data as BackupCollectedData);
    } catch (error) {
      throw new BackupError(`Falha ao restaurar backup ${id}`, 'RESTORE_FAILED', error);
    }
  }

  /**
   * Gerenciamento de backups
   */
  getBackups(): BackupEntry[] {
    return Array.from(this.backups.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  async deleteBackup(id: string): Promise<void> {
    if (!this.backups.has(id)) {
      throw new BackupNotFoundError(id);
    }

    this.backups.delete(id);
    await this.saveBackups();
    this.updateStats();
  }

  getStats(): BackupStats {
    return { ...this.stats };
  }

  /**
   * Exportar/Importar
   */
  async exportBackup(id: string): Promise<void> {
    const backup = this.backups.get(id);
    if (!backup) {
      throw new BackupNotFoundError(id);
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${backup.name}_${backup.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async importBackup(file: File): Promise<BackupEntry> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!this.validateBackupStructure(data)) {
        throw new BackupError('Estrutura de backup inválida', 'INVALID_STRUCTURE');
      }

      const backup = data as BackupEntry;
      backup.id = this.generateBackupId(); // Novo ID para evitar conflitos
      
      this.backups.set(backup.id, backup);
      await this.saveBackups();
      this.updateStats();

      return backup;
    } catch (error) {
      if (error instanceof BackupError) throw error;
      throw new BackupError('Falha ao importar backup', 'IMPORT_FAILED', error);
    }
  }

  /**
   * Observadores
   */
  subscribe(observer: BackupObserver): () => void {
    this.observers.push(observer);
    return () => {
      const index = this.observers.indexOf(observer);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  /**
   * Métodos privados
   */
  private generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
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
    
    this.stats = {
      totalBackups: backups.length,
      totalSize: backups.reduce((sum, backup) => sum + backup.size, 0),
      lastBackup: backups.length > 0 ? Math.max(...backups.map(b => b.timestamp)) : null,
      nextBackup: this.config.autoBackup ? Date.now() + (this.config.backupInterval * 60 * 1000) : null,
      successRate: backups.length > 0 ? 
        (backups.filter(b => b.integrity === 'verified').length / backups.length) * 100 : 100
    };

    this.notifyObservers();
  }

  private notifyObservers(): void {
    this.observers.forEach(observer => observer(this.stats));
  }

  private startAutoBackup(): void {
    if (!this.config.autoBackup) return;
    
    this.stopAutoBackup();
    
    const intervalMs = this.config.backupInterval * 60 * 1000;
    this.autoBackupTimer = setInterval(async () => {
      try {
        await this.createBackup({ type: 'incremental' });
      } catch (error) {
        console.error('Erro no backup automático:', error);
      }
    }, intervalMs);
  }

  private stopAutoBackup(): void {
    if (this.autoBackupTimer) {
      clearInterval(this.autoBackupTimer);
      this.autoBackupTimer = null;
    }
  }

  private saveConfig(): void {
    try {
      localStorage.setItem('backup_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
    }
  }

  private loadConfig(): void {
    try {
      const saved = localStorage.getItem('backup_config');
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    }
  }

  private async saveBackups(): Promise<void> {
    try {
      const backupsArray = Array.from(this.backups.entries());
      localStorage.setItem('backup_data', JSON.stringify(backupsArray));
    } catch (error) {
      console.error('Erro ao salvar backups:', error);
    }
  }

  private loadBackups(): void {
    try {
      const saved = localStorage.getItem('backup_data');
      if (saved) {
        const backupsArray = JSON.parse(saved);
        this.backups = new Map(backupsArray);
        this.updateStats();
      }
    } catch (error) {
      console.error('Erro ao carregar backups:', error);
    }
  }

  private validateBackupStructure(data: unknown): data is BackupEntry {
    if (typeof data !== 'object' || data === null) return false;
    
    const backup = data as Record<string, unknown>;
    return (
      typeof backup.id === 'string' &&
      typeof backup.name === 'string' &&
      typeof backup.timestamp === 'number' &&
      typeof backup.data === 'object' &&
      backup.data !== null
    );
  }

  destroy(): void {
    this.stopAutoBackup();
    this.observers.length = 0;
    this.backups.clear();
  }
}

// Export singleton
export const backupService = BackupService.getInstance(); 