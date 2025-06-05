
export interface IDataProvider {
  // File operations
  getFile<T>(id: string): Promise<T | null>;
  getAllFiles<T>(): Promise<T[]>;
  createFile<T>(data: T): Promise<string>;
  updateFile<T>(id: string, updates: Partial<T>): Promise<void>;
  deleteFile(id: string): Promise<void>;
  searchFiles<T>(query: string): Promise<T[]>;
  
  // Query operations
  query<T>(collection: string, filters?: Record<string, any>): Promise<T[]>;
  
  // Workspace operations
  saveWorkspace(data: any): Promise<void>;
  loadWorkspace(): Promise<any>;
  
  // Connection status
  isConnected(): boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export interface ICacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, data: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

export interface IBackupProvider {
  createBackup(data: any): Promise<string>;
  restoreBackup(backupId: string): Promise<any>;
  listBackups(): Promise<Array<{ id: string; timestamp: Date; size: number }>>;
}
