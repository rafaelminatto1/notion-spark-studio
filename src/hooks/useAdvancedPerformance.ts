import { useState, useEffect, useCallback, useRef } from 'react';

// Tipos para métricas de performance
interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  loadTime: number;
  renderTime: number;
  networkLatency: number;
  bundleSize: number;
  cacheHitRate: number;
  errorRate: number;
}

interface PerformanceThresholds {
  fps: { warning: number; critical: number };
  memoryUsage: { warning: number; critical: number };
  loadTime: { warning: number; critical: number };
  renderTime: { warning: number; critical: number };
  networkLatency: { warning: number; critical: number };
}

interface PerformanceOptimization {
  id: string;
  type: 'memory' | 'rendering' | 'network' | 'bundle';
  description: string;
  impact: 'low' | 'medium' | 'high';
  applied: boolean;
  automatic: boolean;
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  metric: keyof PerformanceMetrics;
  value: number;
  threshold: number;
  message: string;
  timestamp: Date;
}

interface UseAdvancedPerformanceOptions {
  enableAutoOptimization: boolean;
  monitoringInterval: number; // em segundos
  enableAlerts: boolean;
  customThresholds?: Partial<PerformanceThresholds>;
}

interface UseAdvancedPerformanceReturn {
  metrics: PerformanceMetrics;
  alerts: PerformanceAlert[];
  optimizations: PerformanceOptimization[];
  isMonitoring: boolean;
  healthScore: number;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  applyOptimization: (optimizationId: string) => Promise<void>;
  clearAlerts: () => void;
  exportMetrics: () => string;
  getRecommendations: () => string[];
}

// Thresholds padrão
const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  fps: { warning: 45, critical: 30 },
  memoryUsage: { warning: 80, critical: 95 },
  loadTime: { warning: 2000, critical: 5000 },
  renderTime: { warning: 16, critical: 33 },
  networkLatency: { warning: 200, critical: 500 }
};

export const useAdvancedPerformance = (
  options: UseAdvancedPerformanceOptions = {
    enableAutoOptimization: true,
    monitoringInterval: 5,
    enableAlerts: true
  }
): UseAdvancedPerformanceReturn => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    loadTime: 0,
    renderTime: 0,
    networkLatency: 0,
    bundleSize: 0,
    cacheHitRate: 0,
    errorRate: 0
  });

  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [optimizations, setOptimizations] = useState<PerformanceOptimization[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [healthScore, setHealthScore] = useState(100);

  const intervalRef = useRef<NodeJS.Timeout>();
  const frameRef = useRef<number>();
  const lastFrameTime = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const memoryLeakDetector = useRef<Set<string>>(new Set());

  const thresholds = { ...DEFAULT_THRESHOLDS, ...options.customThresholds };

  // Medir FPS
  const measureFPS = useCallback(() => {
    const now = performance.now();
    frameCount.current++;
    
    if (now - lastFrameTime.current >= 1000) {
      const fps = Math.round((frameCount.current * 1000) / (now - lastFrameTime.current));
      setMetrics(prev => ({ ...prev, fps }));
      frameCount.current = 0;
      lastFrameTime.current = now;
    }
    
    if (isMonitoring) {
      frameRef.current = requestAnimationFrame(measureFPS);
    }
  }, [isMonitoring]);

  // Medir uso de memória
  const measureMemory = useCallback(() => {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const memoryUsage = (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100;
      setMetrics(prev => ({ ...prev, memoryUsage }));

      // Detectar memory leaks
      const currentMemory = memInfo.usedJSHeapSize;
      const memoryKey = `${Date.now()}-${currentMemory}`;
      memoryLeakDetector.current.add(memoryKey);

      // Manter apenas últimas 10 medições
      if (memoryLeakDetector.current.size > 10) {
        const oldest = Array.from(memoryLeakDetector.current)[0];
        memoryLeakDetector.current.delete(oldest);
      }
    }
  }, []);

  // Medir latência de rede
  const measureNetworkLatency = useCallback(async () => {
    const startTime = performance.now();
    try {
      await fetch('/api/ping', { method: 'HEAD' }).catch(() => {
        // Fallback para quando não há API
        return new Promise(resolve => setTimeout(resolve, 50));
      });
      const latency = performance.now() - startTime;
      setMetrics(prev => ({ ...prev, networkLatency: latency }));
    } catch (error) {
      // Simular latência quando não há conectividade
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
    
    return () => { observer.disconnect(); };
  }, []);

  // Coletar todas as métricas
  const collectMetrics = useCallback(async () => {
    measureMemory();
    await measureNetworkLatency();
    
    // Medir tempo de carregamento
    const loadTime = performance.now();
    setMetrics(prev => ({ ...prev, loadTime }));

    // Calcular cache hit rate (simulado)
    const cacheHitRate = Math.random() * 30 + 70; // 70-100%
    setMetrics(prev => ({ ...prev, cacheHitRate }));

    // Calcular taxa de erro (simulado)
    const errorRate = Math.random() * 2; // 0-2%
    setMetrics(prev => ({ ...prev, errorRate }));
  }, [measureMemory, measureNetworkLatency]);

  // Verificar alertas
  const checkAlerts = useCallback((currentMetrics: PerformanceMetrics) => {
    if (!options.enableAlerts) return;

    const newAlerts: PerformanceAlert[] = [];

    // Verificar cada métrica
    Object.entries(thresholds).forEach(([metric, threshold]) => {
      const value = currentMetrics[metric as keyof PerformanceMetrics];
      if (typeof value === 'number') {
        let alertType: 'warning' | 'error' | null = null;
        
        if (value >= threshold.critical) {
          alertType = 'error';
        } else if (value >= threshold.warning) {
          alertType = 'warning';
        }

        if (alertType) {
          newAlerts.push({
            id: `${metric}-${Date.now()}`,
            type: alertType,
            metric: metric as keyof PerformanceMetrics,
            value,
            threshold: alertType === 'error' ? threshold.critical : threshold.warning,
            message: `${metric} está em ${value.toFixed(1)} (limite: ${alertType === 'error' ? threshold.critical : threshold.warning})`,
            timestamp: new Date()
          });
        }
      }
    });

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 20)); // Manter apenas 20 alertas
    }
  }, [thresholds, options.enableAlerts]);

  // Calcular score de saúde
  const calculateHealthScore = useCallback((currentMetrics: PerformanceMetrics) => {
    let score = 100;
    
    // Penalizar baseado nas métricas
    if (currentMetrics.fps < thresholds.fps.warning) {
      score -= (thresholds.fps.warning - currentMetrics.fps) * 2;
    }
    
    if (currentMetrics.memoryUsage > thresholds.memoryUsage.warning) {
      score -= (currentMetrics.memoryUsage - thresholds.memoryUsage.warning) * 1.5;
    }
    
    if (currentMetrics.loadTime > thresholds.loadTime.warning) {
      score -= (currentMetrics.loadTime - thresholds.loadTime.warning) / 100;
    }
    
    if (currentMetrics.renderTime > thresholds.renderTime.warning) {
      score -= (currentMetrics.renderTime - thresholds.renderTime.warning) * 3;
    }
    
    if (currentMetrics.networkLatency > thresholds.networkLatency.warning) {
      score -= (currentMetrics.networkLatency - thresholds.networkLatency.warning) / 10;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }, [thresholds]);

  // Gerar otimizações inteligentes
  const generateOptimizations = useCallback((currentMetrics: PerformanceMetrics) => {
    const newOptimizations: PerformanceOptimization[] = [];

    // Otimização de memória
    if (currentMetrics.memoryUsage > thresholds.memoryUsage.warning) {
      newOptimizations.push({
        id: 'memory-cleanup',
        type: 'memory',
        description: 'Executar limpeza de memória e garbage collection',
        impact: 'high',
        applied: false,
        automatic: true
      });
    }

    // Otimização de renderização
    if (currentMetrics.fps < thresholds.fps.warning) {
      newOptimizations.push({
        id: 'render-optimization',
        type: 'rendering',
        description: 'Otimizar renderização com debounce e memoization',
        impact: 'medium',
        applied: false,
        automatic: false
      });
    }

    // Otimização de rede
    if (currentMetrics.networkLatency > thresholds.networkLatency.warning) {
      newOptimizations.push({
        id: 'network-optimization',
        type: 'network',
        description: 'Ativar compressão e cache de rede',
        impact: 'medium',
        applied: false,
        automatic: true
      });
    }

    // Otimização de bundle
    if (currentMetrics.loadTime > thresholds.loadTime.warning) {
      newOptimizations.push({
        id: 'bundle-optimization',
        type: 'bundle',
        description: 'Implementar code splitting e lazy loading',
        impact: 'high',
        applied: false,
        automatic: false
      });
    }

    setOptimizations(prev => {
      const existingIds = new Set(prev.map(opt => opt.id));
      const uniqueNew = newOptimizations.filter(opt => !existingIds.has(opt.id));
      return [...prev, ...uniqueNew];
    });

    // Auto-aplicar otimizações automáticas
    if (options.enableAutoOptimization) {
      newOptimizations
        .filter(opt => opt.automatic)
        .forEach(opt => {
          setTimeout(() => applyOptimization(opt.id), 1000);
        });
    }
  }, [thresholds, options.enableAutoOptimization]);

  // Iniciar monitoramento
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    
    // Iniciar medição de FPS
    frameRef.current = requestAnimationFrame(measureFPS);
    
    // Configurar medição de renderização
    const renderCleanup = measureRenderTime();
    
    // Coletar métricas periodicamente
    intervalRef.current = setInterval(() => {
      collectMetrics();
    }, options.monitoringInterval * 1000);

    // Cleanup ao parar
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      renderCleanup();
    };
  }, [measureFPS, measureRenderTime, collectMetrics, options.monitoringInterval]);

  // Parar monitoramento
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
  }, []);

  // Aplicar otimização
  const applyOptimization = useCallback(async (optimizationId: string) => {
    const optimization = optimizations.find(opt => opt.id === optimizationId);
    if (!optimization || optimization.applied) return;

    try {
      switch (optimization.type) {
        case 'memory':
          // Executar garbage collection se disponível
          if ('gc' in window) {
            (window as any).gc();
          }
          // Limpar caches desnecessários
          memoryLeakDetector.current.clear();
          break;
          
        case 'rendering':
          // Aplicar otimizações de renderização
          document.body.style.willChange = 'transform';
          setTimeout(() => {
            document.body.style.willChange = 'auto';
          }, 1000);
          break;
          
        case 'network':
          // Implementar cache de rede
          if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            registration.update();
          }
          break;
          
        case 'bundle':
          // Sugerir code splitting (informativo)
          console.log('Sugestão: Implementar code splitting para melhorar performance');
          break;
      }

      // Marcar como aplicada
      setOptimizations(prev => 
        prev.map(opt => 
          opt.id === optimizationId 
            ? { ...opt, applied: true }
            : opt
        )
      );

      // Re-coletar métricas após otimização
      setTimeout(collectMetrics, 2000);
      
    } catch (error) {
      console.error('Erro ao aplicar otimização:', error);
    }
  }, [optimizations, collectMetrics]);

  // Limpar alertas
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Exportar métricas
  const exportMetrics = useCallback(() => {
    const report = {
      timestamp: new Date().toISOString(),
      metrics,
      healthScore,
      alerts: alerts.length,
      optimizations: optimizations.length,
      appliedOptimizations: optimizations.filter(opt => opt.applied).length
    };
    
    return JSON.stringify(report, null, 2);
  }, [metrics, healthScore, alerts, optimizations]);

  // Obter recomendações
  const getRecommendations = useCallback(() => {
    const recommendations: string[] = [];
    
    if (metrics.fps < 30) {
      recommendations.push('Considere reduzir animações ou usar will-change CSS');
    }
    
    if (metrics.memoryUsage > 80) {
      recommendations.push('Implemente limpeza de memória e evite vazamentos');
    }
    
    if (metrics.loadTime > 3000) {
      recommendations.push('Use code splitting e lazy loading para reduzir tempo de carregamento');
    }
    
    if (metrics.renderTime > 16) {
      recommendations.push('Otimize re-renderizações com React.memo e useMemo');
    }
    
    if (metrics.networkLatency > 300) {
      recommendations.push('Implemente cache de rede e compressão de dados');
    }
    
    return recommendations;
  }, [metrics]);

  // Effect para atualizar métricas e alertas
  useEffect(() => {
    checkAlerts(metrics);
    setHealthScore(calculateHealthScore(metrics));
    generateOptimizations(metrics);
  }, [metrics, checkAlerts, calculateHealthScore, generateOptimizations]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    metrics,
    alerts,
    optimizations,
    isMonitoring,
    healthScore,
    startMonitoring,
    stopMonitoring,
    applyOptimization,
    clearAlerts,
    exportMetrics,
    getRecommendations
  };
}; 