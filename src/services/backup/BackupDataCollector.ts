// Serviço de coleta de dados para backup
// Modulariza a lógica de coleta em arquivo separado

import type { BackupCollectedData, BackupConfig } from './BackupTypes';

export class BackupDataCollector {
  constructor(private config: BackupConfig) {}

  /**
   * Coleta todos os dados necessários para o backup
   */
  async collectData(): Promise<BackupCollectedData> {
    const data: BackupCollectedData = {
      localStorage: this.getLocalStorageData(),
      sessionStorage: this.getSessionStorageData(),
      indexedDB: await this.getIndexedDBData(),
      userPreferences: {},
      applicationState: {},
      timestamp: Date.now()
    };

    if (this.config.includeUserPreferences) {
      data.userPreferences = this.getUserPreferencesData();
    }

    if (this.config.includeApplicationState) {
      data.applicationState = this.getApplicationStateData();
    }

    return data;
  }

  /**
   * Obtém dados do localStorage
   */
  private getLocalStorageData(): Record<string, string> {
    const data: Record<string, string> = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value !== null) {
          data[key] = value;
        }
      }
    }
    
    return data;
  }

  /**
   * Obtém dados do sessionStorage
   */
  private getSessionStorageData(): Record<string, string> {
    const data: Record<string, string> = {};
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        const value = sessionStorage.getItem(key);
        if (value !== null) {
          data[key] = value;
        }
      }
    }
    
    return data;
  }

  /**
   * Obtém dados do IndexedDB (simulado)
   */
  private async getIndexedDBData(): Promise<Record<string, unknown>> {
    // Simulação de acesso ao IndexedDB
    // Em implementação real, seria uma operação assíncrona real
    return {
      placeholder: 'IndexedDB data would be here',
      timestamp: Date.now()
    };
  }

  /**
   * Obtém preferências do usuário
   */
  private getUserPreferencesData(): Record<string, unknown> {
    // Simulação de dados de preferências
    return {
      theme: 'dark',
      language: 'pt-BR',
      notifications: true,
      autoSave: true
    };
  }

  /**
   * Obtém estado da aplicação
   */
  private getApplicationStateData(): Record<string, unknown> {
    // Simulação de estado da aplicação
    return {
      currentView: window.location.pathname,
      user: 'current_user_id',
      lastActivity: Date.now(),
      preferences: this.getUserPreferencesData()
    };
  }
}

export class BackupDataRestorer {
  /**
   * Restaura todos os dados do backup
   */
  async restoreData(data: BackupCollectedData): Promise<void> {
    if (data.localStorage) {
      this.restoreLocalStorageData(data.localStorage);
    }

    if (data.sessionStorage) {
      this.restoreSessionStorageData(data.sessionStorage);
    }

    if (data.indexedDB) {
      await this.restoreIndexedDBData(data.indexedDB);
    }

    if (data.userPreferences) {
      this.restoreUserPreferencesData(data.userPreferences);
    }

    if (data.applicationState) {
      this.restoreApplicationStateData(data.applicationState);
    }
  }

  /**
   * Restaura dados do localStorage
   */
  private restoreLocalStorageData(data: Record<string, string>): void {
    try {
      Object.entries(data).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
    } catch (error) {
      console.error('Erro ao restaurar localStorage:', error);
    }
  }

  /**
   * Restaura dados do sessionStorage
   */
  private restoreSessionStorageData(data: Record<string, string>): void {
    try {
      Object.entries(data).forEach(([key, value]) => {
        sessionStorage.setItem(key, value);
      });
    } catch (error) {
      console.error('Erro ao restaurar sessionStorage:', error);
    }
  }

  /**
   * Restaura dados do IndexedDB (simulado)
   */
  private async restoreIndexedDBData(data: Record<string, unknown>): Promise<void> {
    // Simulação de restauração do IndexedDB
    console.log('Restaurando IndexedDB:', data);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Restaura preferências do usuário
   */
  private restoreUserPreferencesData(data: Record<string, unknown>): void {
    // Simulação de restauração de preferências
    console.log('Restaurando preferências do usuário:', data);
  }

  /**
   * Restaura estado da aplicação
   */
  private restoreApplicationStateData(data: Record<string, unknown>): void {
    // Simulação de restauração do estado da aplicação
    console.log('Restaurando estado da aplicação:', data);
  }
} 