// Tipos para o sistema de backup modularizado
// Resolve problemas de arquivos gigantes e melhora type safety

export interface BackupEntry {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'manual';
  timestamp: number;
  size: number;
  compressed: boolean;
  encrypted: boolean;
  integrity: 'verified' | 'pending' | 'failed';
  metadata: BackupMetadata;
  data: Record<string, unknown>;
}

export interface BackupMetadata {
  version: string;
  userAgent: string;
  location: string;
  notes?: string;
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

export interface BackupCreateOptions {
  name?: string;
  type?: 'full' | 'incremental' | 'manual';
  notes?: string;
}

export interface BackupCollectedData {
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  indexedDB: Record<string, unknown>;
  userPreferences: Record<string, unknown>;
  applicationState: Record<string, unknown>;
  timestamp: number;
}

export type BackupObserver = (stats: BackupStats) => void;

// Error types
export class BackupError extends Error {
  constructor(message: string, public code: string, public originalError?: unknown) {
    super(message);
    this.name = 'BackupError';
  }
}

export class BackupIntegrityError extends BackupError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'INTEGRITY_ERROR', originalError);
  }
}

export class BackupNotFoundError extends BackupError {
  constructor(id: string) {
    super(`Backup with id ${id} not found`, 'BACKUP_NOT_FOUND');
  }
}

export class BackupCorruptedError extends BackupError {
  constructor(id: string, originalError?: unknown) {
    super(`Backup ${id} is corrupted`, 'BACKUP_CORRUPTED', originalError);
  }
} 