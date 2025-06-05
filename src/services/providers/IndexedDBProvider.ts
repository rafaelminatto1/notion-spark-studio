
import { IDataProvider } from '../interfaces/IDataProvider';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { FileItem } from '@/types';

export class IndexedDBProvider implements IDataProvider {
  private dbHook: ReturnType<typeof useIndexedDB>;
  private isReady = false;

  constructor() {
    this.dbHook = useIndexedDB();
  }

  async connect(): Promise<void> {
    // Wait for IndexedDB to be ready
    while (!this.dbHook.isReady) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    this.isReady = true;
  }

  async disconnect(): Promise<void> {
    this.isReady = false;
  }

  isConnected(): boolean {
    return this.isReady;
  }

  async getFile<T>(id: string): Promise<T | null> {
    return await this.dbHook.get<T>('files', id);
  }

  async getAllFiles<T>(): Promise<T[]> {
    return await this.dbHook.getAll<T>('files');
  }

  async createFile<T>(data: T): Promise<string> {
    await this.dbHook.set('files', data);
    return (data as any).id;
  }

  async updateFile<T>(id: string, updates: Partial<T>): Promise<void> {
    const existing = await this.getFile<T>(id);
    if (existing) {
      const updated = { ...existing, ...updates };
      await this.dbHook.set('files', updated);
    }
  }

  async deleteFile(id: string): Promise<void> {
    await this.dbHook.remove('files', id);
  }

  async searchFiles<T>(query: string): Promise<T[]> {
    const allFiles = await this.getAllFiles<FileItem>();
    return allFiles.filter(file => 
      file.name.toLowerCase().includes(query.toLowerCase()) ||
      file.content?.toLowerCase().includes(query.toLowerCase())
    ) as T[];
  }

  async query<T>(collection: string, filters?: Record<string, any>): Promise<T[]> {
    if (filters) {
      // Simple filtering implementation
      const allData = await this.dbHook.getAll<T>(collection);
      return allData.filter(item => {
        return Object.entries(filters).every(([key, value]) => 
          (item as any)[key] === value
        );
      });
    }
    return await this.dbHook.getAll<T>(collection);
  }

  async saveWorkspace(data: any): Promise<void> {
    await this.dbHook.set('workspace', { ...data, id: 'current' });
  }

  async loadWorkspace(): Promise<any> {
    return await this.dbHook.get('workspace', 'current');
  }
}
