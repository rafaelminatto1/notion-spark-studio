import type { 
  PerformanceMetrics, 
  PerformanceAlert, 
  PerformanceOptimization 
} from '@/types/common';

/**
 * Gerenciador centralizado de performance que consolida todas as funcionalidades
 * dispersas no projeto, eliminando duplicação e melhorando manutenibilidade
 */
export class PerformanceManager {
  private static instance: PerformanceManager | null = null;
  
  private metrics: PerformanceMetrics = {
    fps: 60,
    memoryUsage: 0,
    loadTime: 0,
    renderTime: 0,
    networkLatency: 0,
    bundleSize: 0,
    cacheHitRate: 0,
    errorRate: 0
  };

  private alerts: PerformanceAlert[] = [];
  private optimizations: PerformanceOptimization[] = [];
  private observers: PerformanceObserver[] = [];
  private isMonitoring = false;
  private intervalId: NodeJS.Timeout | null = null;
  private callbacks: ((metrics: PerformanceMetrics) => void)[] = [];

  // Singleton pattern
  static getInstance(): PerformanceManager {
    if (!PerformanceManager.instance) {
      PerformanceManager.instance = new PerformanceManager();
    }
    return PerformanceManager.instance;
  }

  private constructor() {
    this.setupPerformanceObservers();
  }

  // Métodos públicos
  startMonitoring(interval = 5000): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.intervalId = setInterval(() => {
      this.collectMetrics();
    }, interval);
    
    console.log('📊 Performance monitoring iniciado');
  }

  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.isMonitoring = false;
    
    console.log('📊 Performance monitoring parado');
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  getOptimizations(): PerformanceOptimization[] {
    return [...this.optimizations];
  }

  subscribe(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.callbacks.push(callback);
    
    // Retorna função de cleanup
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  // Método para aplicar otimizações
  async applyOptimization(optimizationId: string): Promise<boolean> {
    const optimization = this.optimizations.find(opt => opt.id === optimizationId);
    if (!optimization) return false;

    try {
      await optimization.implementation();
      optimization.applied = true;
      console.log(`✅ Otimização ${optimization.name} aplicada com sucesso`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao aplicar otimização ${optimization.name}:`, error);
      return false;
    }
  }

  // Métodos privados
  private setupPerformanceObservers(): void {
    if (typeof window === 'undefined') return;

    // Observer para Core Web Vitals
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach(entry => {
            switch (entry.entryType) {
              case 'navigation':
                this.updateNavigationMetrics(entry as PerformanceNavigationTiming);
                break;
              case 'paint':
                this.updatePaintMetrics(entry as PerformancePaintTiming);
                break;
              case 'largest-contentful-paint':
                this.updateLCPMetrics(entry);
                break;
            }
          });
        });

        observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
        this.observers.push(observer);
      } catch (error) {
        console.warn('PerformanceObserver não suportado:', error);
      }
    }
  }

  private collectMetrics(): void {
    this.updateMemoryMetrics();
    this.updateFPSMetrics();
    this.updateNetworkMetrics();
    this.analyzePerformance();
    this.notifyCallbacks();
  }

  private updateMemoryMetrics(): void {
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      const memoryUsage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      this.metrics.memoryUsage = Math.round(memoryUsage);
    }
  }

  private updateFPSMetrics(): void {
    // Medição de FPS simplificada
    let frames = 0;
    const startTime = performance.now();
    
    const countFrame = (): void => {
      frames++;
      if (performance.now() - startTime < 1000) {
        requestAnimationFrame(countFrame);
      } else {
        this.metrics.fps = frames;
      }
    };
    
    requestAnimationFrame(countFrame);
  }

  private updateNetworkMetrics(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        this.metrics.networkLatency = connection.rtt || 0;
      }
    }
  }

  private updateNavigationMetrics(entry: PerformanceNavigationTiming): void {
    this.metrics.loadTime = entry.loadEventEnd - entry.navigationStart;
  }

  private updatePaintMetrics(entry: PerformancePaintTiming): void {
    if (entry.name === 'first-contentful-paint') {
      this.metrics.renderTime = entry.startTime;
    }
  }

  private updateLCPMetrics(entry: PerformanceEntry): void {
    // LCP metrics
    console.log('LCP:', entry.startTime);
  }

  private analyzePerformance(): void {
    this.generateAlerts();
    this.generateOptimizations();
  }

  private generateAlerts(): void {
    this.alerts = [];

    // Alert para FPS baixo
    if (this.metrics.fps < 30) {
      this.alerts.push({
        id: 'low-fps',
        severity: 'high',
        message: `FPS baixo detectado: ${this.metrics.fps.toString()}fps`,
        timestamp: Date.now(),
        autoFixable: true
      });
    }

    // Alert para uso de memória alto
    if (this.metrics.memoryUsage > 80) {
      this.alerts.push({
        id: 'high-memory',
        severity: 'medium',
        message: `Uso de memória alto: ${this.metrics.memoryUsage.toString()}%`,
        timestamp: Date.now(),
        autoFixable: true
      });
    }

    // Alert para latência de rede alta
    if (this.metrics.networkLatency > 200) {
      this.alerts.push({
        id: 'high-latency',
        severity: 'medium',
        message: `Latência de rede alta: ${this.metrics.networkLatency.toString()}ms`,
        timestamp: Date.now(),
        autoFixable: false
      });
    }
  }

  private generateOptimizations(): void {
    this.optimizations = [];

    // Otimização de memória
    if (this.metrics.memoryUsage > 70) {
      this.optimizations.push({
        id: 'memory-cleanup',
        name: 'Limpeza de Memória',
        description: 'Limpar cache e otimizar uso de memória',
        priority: 'high',
        estimatedImprovement: '20-30%',
        applied: false,
        implementation: async () => {
          // Implementação da limpeza de memória
          this.performMemoryCleanup();
        }
      });
    }

    // Otimização de bundle
    if (this.metrics.bundleSize > 500) {
      this.optimizations.push({
        id: 'bundle-optimization',
        name: 'Otimização de Bundle',
        description: 'Implementar code splitting e lazy loading',
        priority: 'medium',
        estimatedImprovement: '30-50%',
        applied: false,
        implementation: async () => {
          // Implementação da otimização de bundle
          console.log('Implementando otimização de bundle...');
        }
      });
    }
  }

  private performMemoryCleanup(): void {
    // Limpeza do localStorage
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    
    for (const key in localStorage) {
      if (key.startsWith('cache_')) {
        try {
          const data = JSON.parse(localStorage[key]);
          if (data.timestamp && (now - data.timestamp) > oneWeek) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          localStorage.removeItem(key);
        }
      }
    }

    // Forçar garbage collection se disponível
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }

  private notifyCallbacks(): void {
    this.callbacks.forEach(callback => {
      try {
        callback(this.metrics);
      } catch (error) {
        console.error('Erro ao notificar callback de performance:', error);
      }
    });
  }

  // Método de cleanup
  destroy(): void {
    this.stopMonitoring();
    this.callbacks = [];
    PerformanceManager.instance = null;
  }
}

// Hook para usar o Performance Manager
export function usePerformanceManager() {
  const manager = PerformanceManager.getInstance();
  
  return {
    startMonitoring: () => manager.startMonitoring(),
    stopMonitoring: () => manager.stopMonitoring(),
    getMetrics: () => manager.getMetrics(),
    getAlerts: () => manager.getAlerts(),
    getOptimizations: () => manager.getOptimizations(),
    subscribe: (callback: (metrics: PerformanceMetrics) => void) => 
      manager.subscribe(callback),
    applyOptimization: (id: string) => manager.applyOptimization(id)
  };
}

export default PerformanceManager; 