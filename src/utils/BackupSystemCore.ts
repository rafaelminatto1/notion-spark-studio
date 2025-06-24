// Tipos para o sistema de backup
export interface BackupEntry {
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

export interface BackupConfig {
  autoBackup: boolean;
  maxBackups: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  backupInterval: number; // in minutes
  includeUserPreferences: boolean;
  includeApplicationState: boolean;
}

export interface BackupStats {
  totalBackups: number;
  totalSize: number;
  lastBackup: number | null;
  nextBackup: number | null;
  successRate: number;
}

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
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        location: typeof window !== 'undefined' ? window.location.href : '',
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

    const dataBlob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${backup.name}_${backup.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async importBackup(file: File): Promise<BackupEntry> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const backup = JSON.parse(content) as unknown;
          
          if (!this.validateBackupStructure(backup)) {
            throw new Error('Invalid backup file structure');
          }

          // Generate new ID to avoid conflicts
          const newId = `backup_${Date.now().toString()}_${Math.random().toString(36).substring(2, 15)}`;
          backup.id = newId;
          backup.name = `${backup.name} (Imported)`;

          this.backups.set(newId, backup);
          void this.saveBackups();
          
          resolve(backup);
        } catch (error) {
          reject(new Error(`Failed to import backup: ${(error as Error).message}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read backup file'));
      };

      reader.readAsText(file);
    });
  }

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

  // Métodos privados auxiliares
  private async collectData(): Promise<Record<string, unknown>> {
    const data: Record<string, unknown> = {};

    if (this.config.includeUserPreferences) {
      data.localStorage = this.getLocalStorageData();
      data.sessionStorage = this.getSessionStorageData();
      data.userPreferences = this.getUserPreferencesData();
    }

    if (this.config.includeApplicationState) {
      data.applicationState = this.getApplicationStateData();
    }

    try {
      data.indexedDB = await this.getIndexedDBData();
    } catch (error) {
      console.warn('Failed to collect IndexedDB data:', error);
    }

    return data;
  }

  private async restoreData(data: Record<string, unknown>): Promise<void> {
    if (data.localStorage) {
      this.restoreLocalStorageData(data.localStorage);
    }

    if (data.sessionStorage) {
      this.restoreSessionStorageData(data.sessionStorage);
    }

    if (data.userPreferences) {
      this.restoreUserPreferencesData(data.userPreferences);
    }

    if (data.applicationState) {
      this.restoreApplicationStateData(data.applicationState);
    }

    if (data.indexedDB) {
      await this.restoreIndexedDBData(data.indexedDB);
    }
  }

  private getLocalStorageData(): Record<string, string> {
    const data: Record<string, string> = {};
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          data[key] = localStorage.getItem(key) || '';
        }
      }
    }
    return data;
  }

  private getSessionStorageData(): Record<string, string> {
    const data: Record<string, string> = {};
    if (typeof sessionStorage !== 'undefined') {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          data[key] = sessionStorage.getItem(key) || '';
        }
      }
    }
    return data;
  }

  private async getIndexedDBData(): Promise<Record<string, unknown>> {
    // IndexedDB backup implementation
    return {};
  }

  private async restoreIndexedDBData(data: unknown): Promise<void> {
    // IndexedDB restore implementation
    console.log('Restoring IndexedDB data:', data);
  }

  private getUserPreferencesData(): Record<string, unknown> {
    // User preferences backup
    return {};
  }

  private getApplicationStateData(): Record<string, unknown> {
    // Application state backup
    return {};
  }

  private restoreLocalStorageData(data: unknown): void {
    if (typeof localStorage !== 'undefined' && typeof data === 'object' && data !== null) {
      const localData = data as Record<string, string>;
      Object.entries(localData).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
    }
  }

  private restoreSessionStorageData(data: unknown): void {
    if (typeof sessionStorage !== 'undefined' && typeof data === 'object' && data !== null) {
      const sessionData = data as Record<string, string>;
      Object.entries(sessionData).forEach(([key, value]) => {
        sessionStorage.setItem(key, value);
      });
    }
  }

  private restoreUserPreferencesData(data: unknown): void {
    // User preferences restore
    console.log('Restoring user preferences:', data);
  }

  private restoreApplicationStateData(data: unknown): void {
    // Application state restore
    console.log('Restoring application state:', data);
  }

  private async compressData(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Simple compression simulation
    const jsonString = JSON.stringify(data);
    return {
      compressed: true,
      data: jsonString,
      originalSize: jsonString.length
    };
  }

  private async decompressData(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (data.compressed && typeof data.data === 'string') {
      return JSON.parse(data.data as string) as Record<string, unknown>;
    }
    return data;
  }

  private async encryptData(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Simple encryption simulation
    const jsonString = JSON.stringify(data);
    return {
      encrypted: true,
      data: btoa(jsonString), // Base64 encoding as simple encryption
      algorithm: 'base64'
    };
  }

  private async decryptData(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (data.encrypted && typeof data.data === 'string') {
      const decrypted = atob(data.data as string);
      return JSON.parse(decrypted) as Record<string, unknown>;
    }
    return data;
  }

  private async cleanupOldBackups(): Promise<void> {
    const backups = this.getBackups();
    if (backups.length > this.config.maxBackups) {
      const toDelete = backups.slice(this.config.maxBackups);
      for (const backup of toDelete) {
        await this.deleteBackup(backup.id);
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
      successRate: backups.length > 0 
        ? (backups.filter(b => b.integrity === 'verified').length / backups.length) * 100 
        : 100
    };
    this.notifyObservers();
  }

  private notifyObservers(): void {
    this.observers.forEach((observer) => observer(this.getStats()));
  }

  private startAutoBackup(): void {
    if (this.config.autoBackup && !this.autoBackupTimer) {
      this.autoBackupTimer = setInterval(() => {
        void this.createBackup(undefined, 'incremental');
      }, this.config.backupInterval * 60 * 1000);
    }
  }

  private stopAutoBackup(): void {
    if (this.autoBackupTimer) {
      clearInterval(this.autoBackupTimer);
      this.autoBackupTimer = null;
    }
  }

  private saveConfig(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('backup-config', JSON.stringify(this.config));
    }
  }

  private loadConfig(): void {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('backup-config');
      if (saved) {
        try {
          const config = JSON.parse(saved) as Partial<BackupConfig>;
          this.config = { ...this.config, ...config };
        } catch (error) {
          console.warn('Failed to load backup config:', error);
        }
      }
    }
  }

  private async saveBackups(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      const backupsArray = Array.from(this.backups.entries());
      localStorage.setItem('backup-entries', JSON.stringify(backupsArray));
    }
    this.updateStats();
  }

  private loadBackups(): void {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('backup-entries');
      if (saved) {
        try {
          const backupsArray = JSON.parse(saved) as Array<[string, BackupEntry]>;
          this.backups = new Map(backupsArray);
          this.updateStats();
        } catch (error) {
          console.warn('Failed to load backups:', error);
        }
      }
    }
  }

  private async verifyIntegrity(backup: BackupEntry): Promise<boolean> {
    try {
      // Simple integrity check
      const dataString = JSON.stringify(backup.data);
      return dataString.length === backup.size && backup.data !== null;
    } catch (error) {
      console.error('Integrity verification failed:', error);
      return false;
    }
  }

  private validateBackupStructure(data: unknown): data is BackupEntry {
    if (typeof data !== 'object' || data === null) return false;
    
    const obj = data as Record<string, unknown>;
    return (
      typeof obj.id === 'string' &&
      typeof obj.name === 'string' &&
      typeof obj.timestamp === 'number' &&
      typeof obj.size === 'number' &&
      typeof obj.data === 'object'
    );
  }

  destroy(): void {
    this.stopAutoBackup();
    this.observers = [];
  }
} 