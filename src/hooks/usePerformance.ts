import { useState, useCallback, useRef, useEffect } from 'react';
import { usePerformancePersistence } from './usePerformancePersistence';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  networkLatency: number;
  componentCounts: Record<string, number>;
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

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error';
  message: string;
  timestamp: number;
  metric: keyof PerformanceMetrics;
}

interface PerformanceOptimization {
  id: string;
  type: 'memory' | 'rendering' | 'network' | 'bundle';
  description: string;
  impact: 'low' | 'medium' | 'high';
  applied: boolean;
  automatic: boolean;
}

interface PerformanceHistoryEntry extends PerformanceMetrics {
  timestamp: number;
}

interface ComponentMetrics {
  name: string;
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  memoryUsage: number;
  isSlowComponent: boolean;
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

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  fps: { warning: 30, error: 20 },
  memoryUsage: { warning: 70, error: 85 },
  renderTime: { warning: 16, error: 32 },
  networkLatency: { warning: 100, error: 200 },
  componentRenderTime: { warning: 16, error: 32 }
};

export const usePerformance = () => {
  const { saveToStorage, loadFromStorage } = usePerformancePersistence();
  
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    renderTime: 0,
    networkLatency: 0,
    componentCounts: {}
  });

  const [networkMetrics, setNetworkMetrics] = useState<NetworkMetrics>({
    latency: 0,
    downloadSpeed: 0,
    uploadSpeed: 0,
    connectionType: 'unknown',
    requests: []
  });

  const [memoryMetrics, setMemoryMetrics] = useState<MemoryMetrics>({
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0,
    objects: []
  });

  const [renderingMetrics, setRenderingMetrics] = useState<RenderingMetrics>({
    renderTime: 0,
    renderCount: 0,
    layers: [],
    updates: []
  });

  const [fpsMetrics, setFPSMetrics] = useState<FPSMetrics>({
    current: 60,
    average: 60,
    min: 60,
    max: 60,
    history: []
  });

  const [latencyMetrics, setLatencyMetrics] = useState<LatencyMetrics>({
    current: 0,
    average: 0,
    min: 0,
    max: 0,
    history: []
  });

  const [componentMetrics, setComponentMetrics] = useState<ComponentMetrics[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [optimizations, setOptimizations] = useState<PerformanceOptimization[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [thresholds, setThresholds] = useState<PerformanceThresholds>(DEFAULT_THRESHOLDS);
  const [autoOptimization, setAutoOptimization] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  const lastFrameTime = useRef(performance.now());
  const fpsCounter = useRef(60);
  const renderTimes = useRef<number[]>([]);
  const componentRenderCounts = useRef<Map<string, ComponentMetrics>>(new Map());
  const performanceObserver = useRef<PerformanceObserver | null>(null);

  // Carregar configurações e histórico ao inicializar
  useEffect(() => {
    const savedThresholds = loadFromStorage('performance-thresholds');
    const savedHistory = loadFromStorage('performance-history');
    const savedSettings = loadFromStorage('performance-settings');

    if (savedThresholds) {
      setThresholds(savedThresholds);
    }

    if (savedHistory) {
      setHistory(savedHistory);
    }

    if (savedSettings) {
      setAutoOptimization(savedSettings.autoOptimization || false);
      setAlertsEnabled(savedSettings.alertsEnabled !== false);
    }
  }, [loadFromStorage]);

  // Salvar configurações quando mudarem
  useEffect(() => {
    saveToStorage('performance-thresholds', thresholds);
  }, [thresholds, saveToStorage]);

  useEffect(() => {
    saveToStorage('performance-settings', {
      autoOptimization,
      alertsEnabled
    });
  }, [autoOptimization, alertsEnabled, saveToStorage]);

  // Salvar histórico periodicamente
  useEffect(() => {
    if (history.length > 0) {
      const interval = setInterval(() => {
        saveToStorage('performance-history', history.slice(0, 1000)); // Limitar a 1000 entradas
      }, 30000); // Salvar a cada 30 segundos

      return () => clearInterval(interval);
    }
  }, [history, saveToStorage]);

  // Iniciar monitoramento
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    let frameCount = 0;
    let lastTime = performance.now();
    let lastMemoryCheck = performance.now();

    const measurePerformance = () => {
      if (!isMonitoring) return;

      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;

      // Calcular FPS
      frameCount++;
      if (deltaTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / deltaTime);
        setMetrics(prev => ({ ...prev, fps }));
        setFPSMetrics(prev => ({
          ...prev,
          current: fps,
          history: [
            { timestamp: currentTime, fps },
            ...prev.history.slice(0, 59)
          ]
        }));
        frameCount = 0;
        lastTime = currentTime;
      }

      // Verificar memória a cada 5 segundos
      if (currentTime - lastMemoryCheck >= 5000) {
        updateMemoryMetrics();
        lastMemoryCheck = currentTime;
      }

      // Medir latência de rede simulada
      const simulatedLatency = Math.random() * 100 + 50; // 50-150ms
      setMetrics(prev => ({ ...prev, networkLatency: simulatedLatency }));
      setLatencyMetrics(prev => ({
        ...prev,
        current: simulatedLatency,
        history: [
          { timestamp: currentTime, latency: simulatedLatency },
          ...prev.history.slice(0, 59)
        ]
      }));

      // Registrar histórico
      setHistory(prev => [
        {
          timestamp: currentTime,
          metrics: { ...metrics },
          networkMetrics: { ...networkMetrics },
          memoryMetrics: { ...memoryMetrics },
          renderingMetrics: { ...renderingMetrics },
          fpsMetrics: { ...fpsMetrics },
          latencyMetrics: { ...latencyMetrics }
        },
        ...prev.slice(0, 99)
      ]);

      requestAnimationFrame(measurePerformance);
    };

    requestAnimationFrame(measurePerformance);
  }, [isMonitoring, metrics, networkMetrics, memoryMetrics, renderingMetrics, fpsMetrics, latencyMetrics]);

  // Parar monitoramento
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  // Medir uso de memória
  const measureMemory = useCallback(() => {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const memoryUsage = (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100;
      setMetrics(prev => ({ ...prev, memoryUsage }));
    }
  }, []);

  // Medir latência de rede
  const measureNetworkLatency = useCallback(async () => {
    const startTime = performance.now();
    try {
      await fetch('/api/ping', { method: 'HEAD' }).catch(() => {
        return new Promise(resolve => setTimeout(resolve, 50));
      });
      const latency = performance.now() - startTime;
      setMetrics(prev => ({ ...prev, networkLatency: latency }));
    } catch (error) {
      setMetrics(prev => ({ ...prev, networkLatency: 999 }));
    }
  }, []);

  // Medir tempo de renderização
  const measureRenderTime = useCallback(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const renderEntries = entries.filter(entry => entry.entryType === 'measure');
      
      if (renderEntries.length > 0) {
        const avgRenderTime = renderEntries.reduce((sum, entry) => sum + entry.duration, 0) / renderEntries.length;
        setMetrics(prev => ({ ...prev, renderTime: avgRenderTime }));
      }
    });
    
    observer.observe({ entryTypes: ['measure'] });
    
    return () => observer.disconnect();
  }, []);

  // Verificar alertas de performance
  const checkAlerts = useCallback(() => {
    if (!alertsEnabled) return;

    const newAlerts: PerformanceAlert[] = [];

    if (metrics.fps < thresholds.fps.warning) {
      newAlerts.push({
        id: `fps-${Date.now()}`,
        type: metrics.fps < thresholds.fps.error ? 'error' : 'warning',
        message: `FPS baixo detectado: ${metrics.fps}`,
        timestamp: Date.now(),
        metric: 'fps'
      });
    }

    if (metrics.memoryUsage > thresholds.memoryUsage.warning) {
      newAlerts.push({
        id: `memory-${Date.now()}`,
        type: metrics.memoryUsage > thresholds.memoryUsage.error ? 'error' : 'warning',
        message: `Uso de memória alto: ${Math.round(metrics.memoryUsage)}%`,
        timestamp: Date.now(),
        metric: 'memoryUsage'
      });
    }

    if (metrics.renderTime > thresholds.renderTime.warning) {
      newAlerts.push({
        id: `render-${Date.now()}`,
        type: metrics.renderTime > thresholds.renderTime.error ? 'error' : 'warning',
        message: `Tempo de renderização alto: ${metrics.renderTime.toFixed(2)}ms`,
        timestamp: Date.now(),
        metric: 'renderTime'
      });
    }

    if (metrics.networkLatency > thresholds.networkLatency.warning) {
      newAlerts.push({
        id: `network-${Date.now()}`,
        type: metrics.networkLatency > thresholds.networkLatency.error ? 'error' : 'warning',
        message: `Latência de rede alta: ${metrics.networkLatency.toFixed(2)}ms`,
        timestamp: Date.now(),
        metric: 'networkLatency'
      });
    }

    // Verificar componentes lentos
    componentMetrics.forEach(component => {
      if (component.averageRenderTime > thresholds.componentRenderTime.warning) {
        newAlerts.push({
          id: `component-${component.name}-${Date.now()}`,
          type: component.averageRenderTime > thresholds.componentRenderTime.error ? 'error' : 'warning',
          message: `Componente lento detectado: ${component.name} (${component.averageRenderTime.toFixed(1)}ms)`,
          timestamp: Date.now(),
          metric: 'renderTime'
        });
      }
    });

    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev, ...newAlerts].slice(-50));
    }
  }, [metrics, componentMetrics, thresholds, alertsEnabled]);

  // Gerar otimizações
  const generateOptimizations = useCallback(() => {
    const newOptimizations: PerformanceOptimization[] = [];

    if (metrics.memoryUsage > thresholds.memoryUsage.warning) {
      newOptimizations.push({
        id: 'memory-cleanup',
        type: 'memory',
        description: 'Executar limpeza de memória e garbage collection',
        impact: 'high',
        applied: false,
        automatic: true
      });
    }

    if (metrics.fps < thresholds.fps.warning) {
      newOptimizations.push({
        id: 'render-optimization',
        type: 'rendering',
        description: 'Otimizar renderização com debounce e memoization',
        impact: 'medium',
        applied: false,
        automatic: false
      });
    }

    if (metrics.networkLatency > thresholds.networkLatency.warning) {
      newOptimizations.push({
        id: 'network-optimization',
        type: 'network',
        description: 'Ativar compressão e cache de rede',
        impact: 'medium',
        applied: false,
        automatic: true
      });
    }

    // Otimizações para componentes lentos
    componentMetrics
      .filter(comp => comp.averageRenderTime > thresholds.componentRenderTime.warning)
      .forEach(comp => {
        newOptimizations.push({
          id: `component-${comp.name}`,
          type: 'rendering',
          description: `Otimizar renderização do componente ${comp.name}`,
          impact: 'medium',
          applied: false,
          automatic: false
        });
      });

    setOptimizations(prev => {
      const existingIds = new Set(prev.map(opt => opt.id));
      const uniqueNew = newOptimizations.filter(opt => !existingIds.has(opt.id));
      return [...prev, ...uniqueNew];
    });
  }, [metrics, componentMetrics, thresholds]);

  // Aplicar otimização
  const applyOptimization = useCallback(async (optimizationId: string) => {
    const optimization = optimizations.find(opt => opt.id === optimizationId);
    if (!optimization || optimization.applied) return;

    try {
      switch (optimization.type) {
        case 'memory':
          if ('gc' in window) {
            (window as any).gc();
          }
          break;
          
        case 'rendering':
          if (optimizationId.startsWith('component-')) {
            const componentName = optimizationId.replace('component-', '');
            const component = componentMetrics.find(c => c.name === componentName);
            if (component) {
              // Implementar otimizações específicas para o componente
              console.log(`Otimizando componente: ${componentName}`);
            }
          } else {
            document.body.style.willChange = 'transform';
            setTimeout(() => {
              document.body.style.willChange = 'auto';
            }, 1000);
          }
          break;
          
        case 'network':
          if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            registration.update();
          }
          break;
      }

      setOptimizations(prev => 
        prev.map(opt => 
          opt.id === optimizationId 
            ? { ...opt, applied: true }
            : opt
        )
      );

      // Re-coletar métricas após otimização
      setTimeout(() => {
        measureMemory();
        measureNetworkLatency();
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao aplicar otimização:', error);
    }
  }, [optimizations, componentMetrics, measureMemory, measureNetworkLatency]);

  // Limpar histórico
  const clearHistory = useCallback(() => {
    setHistory([]);
    saveToStorage('performance-history', []);
  }, [saveToStorage]);

  // Exportar histórico
  const exportHistory = useCallback(() => {
    const data = JSON.stringify({
      history,
      thresholds,
      settings: { autoOptimization, alertsEnabled },
      exportDate: new Date().toISOString()
    }, null, 2);
    
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-history-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [history, thresholds, autoOptimization, alertsEnabled]);

  // Rastrear renderização de componente
  const trackComponentRender = useCallback((componentName: string, renderTime: number) => {
    const existing = componentRenderCounts.current.get(componentName) || {
      name: componentName,
      renderCount: 0,
      averageRenderTime: 0,
      lastRenderTime: 0,
      memoryUsage: 0,
      isSlowComponent: false
    };

    existing.renderCount++;
    existing.lastRenderTime = renderTime;
    existing.averageRenderTime = (existing.averageRenderTime + renderTime) / 2;
    existing.isSlowComponent = existing.averageRenderTime > thresholds.componentRenderTime.warning;

    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      existing.memoryUsage = memInfo.usedJSHeapSize / 1024 / 1024; // MB
    }

    componentRenderCounts.current.set(componentName, existing);
    setComponentMetrics(Array.from(componentRenderCounts.current.values()));
  }, []);

  // Atualizar métricas de memória
  const updateMemoryMetrics = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMemoryMetrics({
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        objects: []
      });

      const memoryUsage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      setMetrics(prev => ({ ...prev, memoryUsage }));
    }
  }, []);

  // Atualizar métricas de FPS
  const updateFPSMetrics = useCallback((fps: number) => {
    setFPSMetrics(prev => ({
      ...prev,
      current: fps,
      history: [
        { timestamp: Date.now(), fps },
        ...prev.history.slice(0, 59)
      ]
    }));
  }, []);

  // Atualizar métricas de latência
  const updateLatencyMetrics = useCallback((latency: number) => {
    setLatencyMetrics(prev => ({
      ...prev,
      current: latency,
      history: [
        { timestamp: Date.now(), latency },
        ...prev.history.slice(0, 59)
      ]
    }));
  }, []);

  // Executar verificações periodicamente
  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(() => {
        checkAlerts();
        generateOptimizations();
      }, 5000); // A cada 5 segundos

      return () => clearInterval(interval);
    }
  }, [isMonitoring, checkAlerts, generateOptimizations]);

  return {
    metrics,
    networkMetrics,
    memoryMetrics,
    renderingMetrics,
    fpsMetrics,
    latencyMetrics,
    componentMetrics,
    alerts,
    optimizations,
    history,
    isMonitoring,
    thresholds,
    autoOptimization,
    alertsEnabled,
    startMonitoring,
    stopMonitoring,
    applyOptimization,
    clearHistory,
    exportHistory,
    trackComponentRender,
    setThresholds,
    setAutoOptimization,
    setAlertsEnabled
  };
};
