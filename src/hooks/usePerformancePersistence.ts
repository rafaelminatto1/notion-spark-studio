import { useState, useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  networkLatency: number;
}

interface NetworkMetrics {
  latency: number;
  downloadSpeed: number;
  uploadSpeed: number;
  connectionType: string;
  requests: {
    url: string;
    method: string;
    status: number;
    duration: number;
    timestamp: number;
  }[];
}

interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  objects: {
    name: string;
    size: number;
    count: number;
  }[];
}

interface RenderingMetrics {
  renderTime: number;
  renderCount: number;
  layers: {
    name: string;
    renderTime: number;
    paintTime: number;
    compositeTime: number;
  }[];
  updates: {
    component: string;
    timestamp: number;
    duration: number;
    reason: string;
  }[];
}

interface FPSMetrics {
  current: number;
  average: number;
  min: number;
  max: number;
  history: {
    timestamp: number;
    fps: number;
  }[];
}

interface LatencyMetrics {
  current: number;
  average: number;
  min: number;
  max: number;
  history: {
    timestamp: number;
    latency: number;
  }[];
}

interface HistoryEntry {
  timestamp: number;
  metrics: PerformanceMetrics;
  networkMetrics: NetworkMetrics;
  memoryMetrics: MemoryMetrics;
  renderingMetrics: RenderingMetrics;
  fpsMetrics: FPSMetrics;
  latencyMetrics: LatencyMetrics;
}

interface PerformanceThresholds {
  fps: { warning: number; error: number };
  memoryUsage: { warning: number; error: number };
  renderTime: { warning: number; error: number };
  networkLatency: { warning: number; error: number };
  componentRenderTime: { warning: number; error: number };
}

interface PerformanceSettings {
  thresholds: PerformanceThresholds;
  autoOptimization: boolean;
  alertsEnabled: boolean;
  maxHistoryEntries: number;
  saveInterval: number; // em minutos
}

const STORAGE_KEYS = {
  HISTORY: 'performance-history',
  SETTINGS: 'performance-settings',
  LAST_SAVE: 'performance-last-save'
};

const DEFAULT_SETTINGS: PerformanceSettings = {
  thresholds: {
    fps: { warning: 30, error: 20 },
    memoryUsage: { warning: 70, error: 85 },
    renderTime: { warning: 16, error: 32 },
    networkLatency: { warning: 100, error: 200 },
    componentRenderTime: { warning: 16, error: 32 }
  },
  autoOptimization: false,
  alertsEnabled: true,
  maxHistoryEntries: 1000,
  saveInterval: 5 // 5 minutos
};

export const usePerformancePersistence = () => {
  const [settings, setSettings] = useState<PerformanceSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar configurações do localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.warn('Erro ao carregar configurações de performance:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Salvar configurações no localStorage
  const saveSettings = useCallback((newSettings: Partial<PerformanceSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
      return true;
    } catch (error) {
      console.error('Erro ao salvar configurações de performance:', error);
      return false;
    }
  }, [settings]);

  // Salvar histórico no localStorage
  const saveHistory = useCallback((history: HistoryEntry[]) => {
    try {
      // Limitar o número de entradas baseado na configuração
      const limitedHistory = history.slice(0, settings.maxHistoryEntries);
      
      const historyData = {
        entries: limitedHistory,
        lastSave: Date.now(),
        version: '1.0'
      };

      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(historyData));
      localStorage.setItem(STORAGE_KEYS.LAST_SAVE, Date.now().toString());
      return true;
    } catch (error) {
      console.error('Erro ao salvar histórico de performance:', error);
      
      // Se o erro for por falta de espaço, tentar limpar dados antigos
      if (error instanceof DOMException && error.code === 22) {
        try {
          const reducedHistory = history.slice(0, Math.floor(settings.maxHistoryEntries / 2));
          const historyData = {
            entries: reducedHistory,
            lastSave: Date.now(),
            version: '1.0'
          };
          localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(historyData));
          console.warn('Histórico reduzido devido a limitações de armazenamento');
          return true;
        } catch (secondError) {
          console.error('Erro crítico ao salvar histórico reduzido:', secondError);
          return false;
        }
      }
      return false;
    }
  }, [settings.maxHistoryEntries]);

  // Carregar histórico do localStorage
  const loadHistory = useCallback((): HistoryEntry[] => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        
        // Verificar se é o formato novo com metadados
        if (parsed.entries && Array.isArray(parsed.entries)) {
          return parsed.entries;
        }
        
        // Formato antigo - array direto
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      return [];
    } catch (error) {
      console.warn('Erro ao carregar histórico de performance:', error);
      return [];
    }
  }, []);

  // Limpar histórico
  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
      localStorage.removeItem(STORAGE_KEYS.LAST_SAVE);
      return true;
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
      return false;
    }
  }, []);

  // Exportar dados para arquivo
  const exportData = useCallback((history: HistoryEntry[]) => {
    try {
      const exportData = {
        history,
        settings,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `performance-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      return false;
    }
  }, [settings]);

  // Importar dados de arquivo
  const importData = useCallback((file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          
          // Validar estrutura dos dados
          if (data.history && data.settings) {
            // Salvar configurações importadas
            saveSettings(data.settings);
            
            // Salvar histórico importado
            saveHistory(data.history);
            
            resolve(true);
          } else {
            console.error('Formato de arquivo inválido');
            resolve(false);
          }
        } catch (error) {
          console.error('Erro ao processar arquivo importado:', error);
          resolve(false);
        }
      };
      
      reader.onerror = () => {
        console.error('Erro ao ler arquivo');
        resolve(false);
      };
      
      reader.readAsText(file);
    });
  }, [saveSettings, saveHistory]);

  // Verificar se precisa fazer backup automático
  const shouldAutoSave = useCallback((): boolean => {
    try {
      const lastSave = localStorage.getItem(STORAGE_KEYS.LAST_SAVE);
      if (!lastSave) return true;
      
      const lastSaveTime = parseInt(lastSave);
      const now = Date.now();
      const intervalMs = settings.saveInterval * 60 * 1000; // converter para ms
      
      return (now - lastSaveTime) >= intervalMs;
    } catch (error) {
      return true; // Em caso de erro, fazer backup
    }
  }, [settings.saveInterval]);

  // Obter estatísticas de armazenamento
  const getStorageStats = useCallback(() => {
    try {
      const historyData = localStorage.getItem(STORAGE_KEYS.HISTORY);
      const settingsData = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      
      const historySize = historyData ? new Blob([historyData]).size : 0;
      const settingsSize = settingsData ? new Blob([settingsData]).size : 0;
      const totalSize = historySize + settingsSize;
      
      // Estimar limite do localStorage (geralmente 5-10MB)
      const estimatedLimit = 5 * 1024 * 1024; // 5MB
      const usagePercentage = (totalSize / estimatedLimit) * 100;
      
      return {
        historySize,
        settingsSize,
        totalSize,
        usagePercentage: Math.min(usagePercentage, 100),
        entriesCount: historyData ? JSON.parse(historyData).entries?.length ?? 0 : 0
      };
    } catch (error) {
      return {
        historySize: 0,
        settingsSize: 0,
        totalSize: 0,
        usagePercentage: 0,
        entriesCount: 0
      };
    }
  }, []);

  const saveToStorage = useCallback((key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
      return false;
    }
  }, []);

  const loadFromStorage = useCallback((key: string) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Erro ao carregar do localStorage:', error);
      return null;
    }
  }, []);

  const clearStorage = useCallback((key: string) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Erro ao limpar localStorage:', error);
      return false;
    }
  }, []);

  return {
    settings,
    isLoading,
    saveSettings,
    saveHistory,
    loadHistory,
    clearHistory,
    exportData,
    importData,
    shouldAutoSave,
    getStorageStats,
    saveToStorage,
    loadFromStorage,
    clearStorage
  };
}; 