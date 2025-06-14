import { useState, useEffect, useCallback, useRef } from 'react';
import { FileItem } from '@/types';
import AITaggingService, { TagSuggestion } from '@/services/AITaggingService';
import { WebSocketService, createWebSocketService } from '@/services/WebSocketService';
import { useServiceWorker } from './useServiceWorker';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';

// Tipos para integração do sistema
export interface SystemStatus {
  ai: {
    isEnabled: boolean;
    isProcessing: boolean;
    lastUpdate: Date | null;
    suggestionsCount: number;
  };
  collaboration: {
    isConnected: boolean;
    collaborators: number;
    latency: number;
  };
  performance: {
    memory: number;
    fps: number;
    networkStatus: 'online' | 'offline' | 'slow';
  };
  offline: {
    isSupported: boolean;
    syncPending: number;
    lastSync: Date | null;
  };
}

export interface SmartFeatures {
  autoTagging: boolean;
  contentSuggestions: boolean;
  collaborativeEditing: boolean;
  offlineSync: boolean;
  performanceMonitoring: boolean;
  adaptiveUI: boolean;
}

export interface SystemIntegrationAPI {
  // Status do sistema
  status: SystemStatus;
  features: SmartFeatures;
  
  // Controles principais
  initializeSystem: () => Promise<void>;
  toggleFeature: (feature: keyof SmartFeatures) => void;
  
  // AI & Tagging
  suggestTagsForFile: (file: FileItem) => Promise<TagSuggestion[]>;
  applySuggestedTags: (fileId: string, tags: string[]) => void;
  analyzeContentSimilarity: (files: FileItem[]) => Promise<Array<{
    file1: FileItem;
    file2: FileItem;
    similarity: number;
  }>>;
  
  // Colaboração
  startCollaboration: (documentId: string) => Promise<void>;
  stopCollaboration: (documentId: string) => void;
  sendCollaborationUpdate: (documentId: string, operation: any) => void;
  
  // Offline & Sync
  enableOfflineMode: () => Promise<void>;
  syncOfflineData: () => Promise<void>;
  cacheImportantFiles: (files: FileItem[]) => Promise<void>;
  
  // Performance
  getSystemMetrics: () => Promise<any>;
  optimizePerformance: () => Promise<void>;
  
  // Notificações e feedback
  showNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  
  // Configurações
  updateConfiguration: (config: Partial<SmartFeatures>) => void;
  exportConfiguration: () => string;
  importConfiguration: (config: string) => void;
}

export const useSystemIntegration = (): SystemIntegrationAPI => {
  const [status, setStatus] = useState<SystemStatus>({
    ai: {
      isEnabled: false,
      isProcessing: false,
      lastUpdate: null,
      suggestionsCount: 0
    },
    collaboration: {
      isConnected: false,
      collaborators: 0,
      latency: 0
    },
    performance: {
      memory: 0,
      fps: 60,
      networkStatus: 'online'
    },
    offline: {
      isSupported: false,
      syncPending: 0,
      lastSync: null
    }
  });

  const [features, setFeatures] = useState<SmartFeatures>({
    autoTagging: true,
    contentSuggestions: true,
    collaborativeEditing: false,
    offlineSync: true,
    performanceMonitoring: false,
    adaptiveUI: true
  });

  const aiService = useRef<AITaggingService>();
  const wsService = useRef<WebSocketService | null>(null);
  const serviceWorker = useServiceWorker();
  const auth = useAuth();
  const { toast } = useToast();

  // Inicializar serviços
  const initializeSystem = useCallback(async () => {
    try {
      console.log('[System Integration] Initializing system...');

      // 1. Inicializar AI Service
      if (features.autoTagging || features.contentSuggestions) {
        aiService.current = new AITaggingService({
          enableSemanticAnalysis: true,
          enableEntityExtraction: true,
          enableTopicModeling: true,
          enableSentimentAnalysis: true,
          minConfidence: 0.6,
          maxSuggestionsPerFile: 8
        });

        setStatus(prev => ({
          ...prev,
          ai: { ...prev.ai, isEnabled: true }
        }));
      }

      // 2. Inicializar WebSocket para colaboração
      if (features.collaborativeEditing) {
        try {
          const websocketUrl = import.meta.env.MODE === 'development'
            ? 'ws://localhost:3001/collaboration'
            : import.meta.env.VITE_WS_URL || 'wss://ws.notion-spark.com/collaboration';

          wsService.current = createWebSocketService({
            url: websocketUrl,
            userId: auth.getCurrentUserId(),
            userName: auth.getCurrentUser()?.name || 'Usuário Atual',
            autoReconnect: true,
            maxReconnectAttempts: 5
          });

          // Listeners para colaboração
          wsService.current.on('connected', () => {
            setStatus(prev => ({
              ...prev,
              collaboration: { ...prev.collaboration, isConnected: true }
            }));
            showNotification('Colaboração ativada', 'success');
          });

          wsService.current.on('latency-update', (latency: number) => {
            setStatus(prev => ({
              ...prev,
              collaboration: { ...prev.collaboration, latency }
            }));
          });

          await wsService.current.connect();
        } catch (error) {
          console.warn('[System Integration] WebSocket connection failed, using mock');
          showNotification('Colaboração em modo offline', 'warning');
        }
      }

      // 3. Verificar suporte offline
      if (features.offlineSync) {
        setStatus(prev => ({
          ...prev,
          offline: {
            ...prev.offline,
            isSupported: serviceWorker.isOfflineCapable()
          }
        }));
      }

      // 4. Inicializar monitoramento de performance
      if (features.performanceMonitoring) {
        startPerformanceMonitoring();
      }

      console.log('[System Integration] System initialized successfully');
      showNotification('Sistema inicializado com sucesso', 'success');

    } catch (error) {
      console.error('[System Integration] Initialization failed:', error);
      showNotification('Erro na inicialização do sistema', 'error');
    }
  }, [features, serviceWorker]);

  // Monitoramento de performance
  const startPerformanceMonitoring = useCallback(() => {
    const updatePerformanceStatus = () => {
      // Métricas básicas de performance
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        const memoryUsage = (memInfo.usedJSHeapSize / memInfo.totalJSHeapSize) * 100;
        
        setStatus(prev => ({
          ...prev,
          performance: {
            ...prev.performance,
            memory: memoryUsage,
            networkStatus: navigator.onLine ? 'online' : 'offline'
          }
        }));
      }
    };

    // Atualizar a cada 5 segundos
    const interval = setInterval(updatePerformanceStatus, 5000);
    updatePerformanceStatus(); // Primeira execução

    return () => clearInterval(interval);
  }, []);

  // Toggle de features
  const toggleFeature = useCallback((feature: keyof SmartFeatures) => {
    setFeatures(prev => {
      const newFeatures = { ...prev, [feature]: !prev[feature] };
      
      // Salvar no localStorage
      localStorage.setItem('notion-spark-features', JSON.stringify(newFeatures));
      
      // Re-inicializar se necessário
      if (feature === 'collaborativeEditing' || feature === 'autoTagging') {
        // Re-init will be triggered by useEffect
      }
      
      return newFeatures;
    });
  }, []);

  // Sugerir tags para arquivo
  const suggestTagsForFile = useCallback(async (file: FileItem): Promise<TagSuggestion[]> => {
    if (!aiService.current || !features.autoTagging) {
      return [];
    }

    try {
      setStatus(prev => ({
        ...prev,
        ai: { ...prev.ai, isProcessing: true }
      }));

      const suggestions = await aiService.current.suggestTags(
        file.content || '',
        file.name,
        file.tags || []
      );

      setStatus(prev => ({
        ...prev,
        ai: {
          ...prev.ai,
          isProcessing: false,
          lastUpdate: new Date(),
          suggestionsCount: suggestions.length
        }
      }));

      return suggestions;
    } catch (error) {
      console.error('[AI Tagging] Error suggesting tags:', error);
      setStatus(prev => ({
        ...prev,
        ai: { ...prev.ai, isProcessing: false }
      }));
      return [];
    }
  }, [features.autoTagging]);

  // Aplicar tags sugeridas
  const applySuggestedTags = useCallback((fileId: string, tags: string[]) => {
    try {
      // Buscar arquivo no sistema
      const files = JSON.parse(localStorage.getItem('notion-spark-files') || '[]');
      const fileIndex = files.findIndex((f: FileItem) => f.id === fileId);
      
      if (fileIndex === -1) {
        showNotification('Arquivo não encontrado', 'error');
        return;
      }

      // Atualizar tags do arquivo
      const updatedFile = {
        ...files[fileIndex],
        tags: [...(files[fileIndex].tags || []), ...tags].filter((tag, index, arr) => 
          arr.indexOf(tag) === index // Remove duplicatas
        ),
        lastModified: new Date().toISOString()
      };

      files[fileIndex] = updatedFile;
      localStorage.setItem('notion-spark-files', JSON.stringify(files));

      console.log(`[AI Tagging] Applied ${tags.length} tags to ${fileId}:`, tags);
      showNotification(`${tags.length} tags aplicadas com sucesso`, 'success');

      // Disparar evento para atualizar UI
      window.dispatchEvent(new CustomEvent('file-updated', { detail: updatedFile }));
      
    } catch (error) {
      console.error('[AI Tagging] Error applying tags:', error);
      showNotification('Erro ao aplicar tags', 'error');
    }
  }, []);

  // Analisar similaridade de conteúdo
  const analyzeContentSimilarity = useCallback(async (files: FileItem[]) => {
    if (!aiService.current) return [];

    const similarities = [];
    
    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        const similarity = aiService.current.calculateContentSimilarity(files[i], files[j]);
        if (similarity > 0.3) {
          similarities.push({
            file1: files[i],
            file2: files[j],
            similarity
          });
        }
      }
    }

    return similarities.sort((a, b) => b.similarity - a.similarity);
  }, []);

  // Colaboração
  const startCollaboration = useCallback(async (documentId: string) => {
    if (!wsService.current || !features.collaborativeEditing) return;

    try {
      wsService.current.joinDocument(documentId);
      showNotification('Colaboração iniciada', 'success');
    } catch (error) {
      console.error('[Collaboration] Error starting collaboration:', error);
      showNotification('Erro ao iniciar colaboração', 'error');
    }
  }, [features.collaborativeEditing]);

  const stopCollaboration = useCallback((documentId: string) => {
    if (!wsService.current) return;
    
    wsService.current.leaveDocument(documentId);
    showNotification('Colaboração encerrada', 'info');
  }, []);

  const sendCollaborationUpdate = useCallback((documentId: string, operation: any) => {
    if (!wsService.current) return;
    
    wsService.current.sendContentChange(documentId, operation);
  }, []);

  // Offline & Sync
  const enableOfflineMode = useCallback(async () => {
    if (!features.offlineSync) return;

    try {
      await serviceWorker.syncDocuments();
      setStatus(prev => ({
        ...prev,
        offline: { ...prev.offline, lastSync: new Date() }
      }));
      showNotification('Modo offline ativado', 'success');
    } catch (error) {
      console.error('[Offline] Error enabling offline mode:', error);
      showNotification('Erro ao ativar modo offline', 'error');
    }
  }, [features.offlineSync, serviceWorker]);

  const syncOfflineData = useCallback(async () => {
    try {
      await serviceWorker.syncDocuments();
      setStatus(prev => ({
        ...prev,
        offline: { ...prev.offline, lastSync: new Date(), syncPending: 0 }
      }));
      showNotification('Sincronização concluída', 'success');
    } catch (error) {
      console.error('[Offline] Sync failed:', error);
      showNotification('Erro na sincronização', 'error');
    }
  }, [serviceWorker]);

  const cacheImportantFiles = useCallback(async (files: FileItem[]) => {
    try {
      await Promise.all(
        files.map(file => serviceWorker.cacheDocument(file))
      );
      showNotification(`${files.length} arquivos armazenados offline`, 'success');
    } catch (error) {
      console.error('[Offline] Cache failed:', error);
      showNotification('Erro ao armazenar arquivos', 'error');
    }
  }, [serviceWorker]);

  // Performance
  const getSystemMetrics = useCallback(async () => {
    try {
      // Função helper para calcular tamanho do cache
      const getCacheSize = async (): Promise<number> => {
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          let totalSize = 0;
          for (const name of cacheNames) {
            const cache = await caches.open(name);
            const requests = await cache.keys();
            totalSize += requests.length;
          }
          return totalSize;
        }
        return 0;
      };

      // Função helper para calcular uso de storage
      const getStorageUsage = (): { used: number; available: number } => {
        let used = 0;
        for (const key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            used += localStorage[key].length;
          }
        }
        return {
          used: Math.round(used / 1024), // KB
          available: 5120 // Assumindo 5MB limite para localStorage
        };
      };

      const metrics = {
        // Métricas de AI
        ai: {
          ...status.ai,
          totalTagsSuggested: parseInt(localStorage.getItem('ai-tags-suggested') || '0'),
          tagsApplied: parseInt(localStorage.getItem('ai-tags-applied') || '0'),
          averageProcessingTime: parseFloat(localStorage.getItem('ai-avg-processing') || '0'),
          contentAnalyzed: parseInt(localStorage.getItem('ai-content-analyzed') || '0')
        },
        
        // Métricas de colaboração
        collaboration: {
          ...status.collaboration,
          messagesExchanged: parseInt(localStorage.getItem('collab-messages') || '0'),
          documentsShared: parseInt(localStorage.getItem('collab-shared-docs') || '0'),
          averageLatency: parseFloat(localStorage.getItem('collab-avg-latency') || '0'),
          conflictsResolved: parseInt(localStorage.getItem('collab-conflicts') || '0'),
          onlineTime: parseFloat(localStorage.getItem('collab-online-time') || '0')
        },
        
        // Métricas de performance detalhadas
        performance: {
          ...status.performance,
          pageLoadTime: performance.timing ? 
            performance.timing.loadEventEnd - performance.timing.navigationStart : 0,
          domContentLoaded: performance.timing ? 
            performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart : 0,
          timeToFirstByte: performance.timing ? 
            performance.timing.responseStart - performance.timing.requestStart : 0,
          renderTime: performance.now(),
          memoryUsage: (performance as any).memory ? {
            used: Math.round(((performance as any).memory.usedJSHeapSize / 1024 / 1024) * 100) / 100,
            total: Math.round(((performance as any).memory.totalJSHeapSize / 1024 / 1024) * 100) / 100,
            limit: Math.round(((performance as any).memory.jsHeapSizeLimit / 1024 / 1024) * 100) / 100
          } : null,
          connectionType: (navigator as any).connection?.effectiveType || 'unknown',
          downlink: (navigator as any).connection?.downlink || 0
        },
        
        // Métricas offline
        offline: {
          ...status.offline,
          cacheSize: await getCacheSize(),
          dataSync: {
            pending: parseInt(localStorage.getItem('sync-pending') || '0'),
            completed: parseInt(localStorage.getItem('sync-completed') || '0'),
            failed: parseInt(localStorage.getItem('sync-failed') || '0'),
            lastSuccessful: localStorage.getItem('sync-last-success')
          },
          offlineTime: parseFloat(localStorage.getItem('offline-time') || '0')
        },
        
        // Métricas do sistema
        system: {
          uptime: Date.now() - parseInt(localStorage.getItem('app-start-time') || Date.now().toString()),
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          screenResolution: `${screen.width}x${screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          storageUsed: getStorageUsage(),
          timestamp: new Date().toISOString(),
          currentUser: auth.getCurrentUser()?.name || 'Anônimo'
        }
      };

      // Salvar timestamp da última coleta
      localStorage.setItem('metrics-last-collected', Date.now().toString());
      
      return metrics;
    } catch (error) {
      console.error('[System Metrics] Error collecting metrics:', error);
      return {
        memory: status.performance.memory,
        fps: status.performance.fps,
        network: status.performance.networkStatus,
        collaboration: status.collaboration,
        error: 'Failed to collect detailed metrics'
      };
    }
  }, [status, auth]);

  const optimizePerformance = useCallback(async () => {
    try {
      // Limpeza básica de performance
      if ('gc' in window) {
        (window as any).gc();
      }

      // Limpeza de cache antigo
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter(name => name.includes('old') || name.includes('v0'))
            .map(name => caches.delete(name))
        );
      }

      showNotification('Otimização de performance concluída', 'success');
    } catch (error) {
      console.error('[Performance] Optimization failed:', error);
      showNotification('Erro na otimização', 'error');
    }
  }, []);

  // Notificações
  const showNotification = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    toast({
      title: message,
      variant: type === 'error' ? 'destructive' : 'default'
    });
  }, [toast]);

  // Configurações
  const updateConfiguration = useCallback((config: Partial<SmartFeatures>) => {
    setFeatures(prev => {
      const newFeatures = { ...prev, ...config };
      localStorage.setItem('notion-spark-features', JSON.stringify(newFeatures));
      return newFeatures;
    });
  }, []);

  const exportConfiguration = useCallback(() => {
    const config = {
      features,
      status,
      timestamp: new Date().toISOString()
    };
    return JSON.stringify(config, null, 2);
  }, [features, status]);

  const importConfiguration = useCallback((configString: string) => {
    try {
      const config = JSON.parse(configString);
      if (config.features) {
        setFeatures(config.features);
        localStorage.setItem('notion-spark-features', JSON.stringify(config.features));
        showNotification('Configuração importada com sucesso', 'success');
      }
    } catch (error) {
      console.error('[Config] Import failed:', error);
      showNotification('Erro ao importar configuração', 'error');
    }
  }, [showNotification]);

  // Carregar configuração salva
  useEffect(() => {
    const savedFeatures = localStorage.getItem('notion-spark-features');
    if (savedFeatures) {
      try {
        const parsedFeatures = JSON.parse(savedFeatures);
        setFeatures(parsedFeatures);
      } catch (error) {
        console.warn('[System Integration] Invalid saved configuration');
      }
    }
  }, []);

  // Re-inicializar quando features mudarem
  useEffect(() => {
    if (status.ai.isEnabled || status.collaboration.isConnected) {
      // Já inicializado, apenas ajustar
      return;
    }
    
    // Inicializar pela primeira vez ou após mudança de configuração
    const timer = setTimeout(() => {
      initializeSystem();
    }, 100);

    return () => clearTimeout(timer);
  }, [features, initializeSystem]);

  // Monitoramento de performance
  useEffect(() => {
    if (features.performanceMonitoring) {
      return startPerformanceMonitoring();
    }
  }, [features.performanceMonitoring, startPerformanceMonitoring]);

  // Cleanup
  useEffect(() => {
    return () => {
      wsService.current?.disconnect();
    };
  }, []);

  return {
    status,
    features,
    initializeSystem,
    toggleFeature,
    suggestTagsForFile,
    applySuggestedTags,
    analyzeContentSimilarity,
    startCollaboration,
    stopCollaboration,
    sendCollaborationUpdate,
    enableOfflineMode,
    syncOfflineData,
    cacheImportantFiles,
    getSystemMetrics,
    optimizePerformance,
    showNotification,
    updateConfiguration,
    exportConfiguration,
    importConfiguration
  };
};

export default useSystemIntegration; 