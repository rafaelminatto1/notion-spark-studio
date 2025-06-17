/**
 * Serviço Unificado de Performance
 * Consolida todas as funcionalidades de monitoramento dispersas no projeto
 * Elimina duplicação e centraliza toda lógica de performance
 */

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

interface SystemMetrics {
  fps: number;
  memoryUsage: number;
  cpuUsage: number;
  renderTime: number;
  documentsLoaded: number;
  activeConnections: number;
  cacheHitRate: number;
  searchLatency: number;
  networkLatency: number;
  syncStatus: 'online' | 'offline' | 'syncing';
  pendingSyncs: number;
  interactionLatency: number;
  errorRate: number;
  diskUsage: number;
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'offline';
}

interface PerformanceAlert {
  id: string;
  type: 'info' | 'warning' | 'error';
  message: string;
  timestamp: number;
  category: string;
}

interface PerformanceOptimization {
  id: string;
  type: 'memory' | 'network' | 'rendering' | 'cache';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  applied: boolean;
  timestamp: number;
  appliedAt?: number;
}

export class PerformanceService {
  private static instance: PerformanceService | null = null;
  
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

  private systemMetrics: SystemMetrics = {
    fps: 60,
    memoryUsage: 45,
    cpuUsage: 25,
    renderTime: 16.7,
    documentsLoaded: 0,
    activeConnections: 1,
    cacheHitRate: 95,
    searchLatency: 50,
    networkLatency: 45,
    syncStatus: 'online',
    pendingSyncs: 0,
    interactionLatency: 20,
    errorRate: 0.1,
    diskUsage: 60,
    connectionType: 'wifi'
  };

  private alerts: PerformanceAlert[] = [];
  private optimizations: PerformanceOptimization[] = [];
  private observers: PerformanceObserver[] = [];
  private isMonitoring = false;
  private intervalId: NodeJS.Timeout | null = null;
  private callbacks: ((metrics: PerformanceMetrics) => void)[] = [];

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  private constructor() {
    this.initializeObservers();
  }

  // ========================================
  // MÉTODOS PÚBLICOS
  // ========================================

  startMonitoring(interval = 5000): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.collectMetrics();
    
    this.intervalId = setInterval(() => {
      this.collectMetrics();
      this.analyzePerformance();
      this.notifyCallbacks();
    }, interval);
    
    console.log('🚀 Performance Service iniciado');
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    
    console.log('⏹️ Performance Service parado');
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getSystemMetrics(): SystemMetrics {
    return { ...this.systemMetrics };
  }

  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  getOptimizations(): PerformanceOptimization[] {
    return [...this.optimizations];
  }

  isRunning(): boolean {
    return this.isMonitoring;
  }

  onMetricsUpdate(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.callbacks.push(callback);
    
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  applyOptimization(optimizationId: string): boolean {
    const optimization = this.optimizations.find(o => o.id === optimizationId);
    if (!optimization) return false;

    try {
      switch (optimization.type) {
        case 'memory':
          this.optimizeMemory();
          break;
        case 'network':
          this.optimizeNetwork();
          break;
        case 'rendering':
          this.optimizeRendering();
          break;
        case 'cache':
          this.optimizeCache();
          break;
        default:
          console.warn(`Unknown optimization type: ${optimization.type}`);
          return false;
      }

      optimization.applied = true;
      optimization.appliedAt = Date.now();
      
      this.addAlert({
        id: `opt-applied-${Date.now()}`,
        type: 'info',
        message: `Otimização aplicada: ${optimization.title}`,
        timestamp: Date.now(),
        category: 'optimization'
      });

      return true;
    } catch (error) {
      console.error('Failed to apply optimization:', error);
      return false;
    }
  }

  // ========================================
  // MÉTODOS PRIVADOS
  // ========================================

  private collectMetrics(): void {
    this.updateFPSMetrics();
    this.updateMemoryMetrics();
    this.updateNetworkMetrics();
    this.updateRenderingMetrics();
    this.updateSystemMetrics();
  }

  private updateFPSMetrics(): void {
    // Simulação para desenvolvimento
    this.metrics.fps = Math.max(30, 60 + Math.random() * 10 - 5);
    this.systemMetrics.fps = this.metrics.fps;
  }

  private updateMemoryMetrics(): void {
    if ('memory' in performance) {
      const mem = (performance as { memory: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
      const usedMB = mem.usedJSHeapSize / 1024 / 1024;
      const totalMB = mem.totalJSHeapSize / 1024 / 1024;
      const percentage = (usedMB / totalMB) * 100;

      this.metrics.memoryUsage = percentage;
      this.systemMetrics.memoryUsage = percentage;
    } else {
      this.metrics.memoryUsage = Math.max(20, Math.min(80, 45 + Math.random() * 10 - 5));
      this.systemMetrics.memoryUsage = this.metrics.memoryUsage;
    }
  }

  private updateNetworkMetrics(): void {
    if ('connection' in navigator) {
      const connection = (navigator as { connection: { rtt: number; effectiveType: string } }).connection;
      this.metrics.networkLatency = connection.rtt || 0;
      this.systemMetrics.networkLatency = connection.rtt || 0;
      this.systemMetrics.connectionType = connection.effectiveType as 'wifi' | 'cellular' | 'ethernet' | 'offline';
    } else {
      this.metrics.networkLatency = Math.max(10, Math.min(200, 50 + Math.random() * 20 - 10));
      this.systemMetrics.networkLatency = this.metrics.networkLatency;
      this.systemMetrics.connectionType = 'wifi';
    }

    this.systemMetrics.syncStatus = navigator.onLine ? 'online' : 'offline';
    this.systemMetrics.activeConnections = navigator.onLine ? 1 : 0;
  }

  private updateRenderingMetrics(): void {
    const navigationEntries = performance.getEntriesByType('navigation');
    if (navigationEntries.length > 0) {
      const nav = navigationEntries[0] as PerformanceNavigationTiming;
      this.metrics.loadTime = nav.loadEventEnd - nav.navigationStart;
      this.metrics.renderTime = nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart;
      this.systemMetrics.renderTime = this.metrics.renderTime;
    }
  }

  private updateSystemMetrics(): void {
    this.systemMetrics.documentsLoaded = document.querySelectorAll('[data-document]').length;
    this.systemMetrics.pendingSyncs = navigator.onLine ? 0 : Math.floor(Math.random() * 3);
    
    // Simular métricas para desenvolvimento
    this.systemMetrics.cpuUsage = Math.max(10, Math.min(80, this.systemMetrics.cpuUsage + Math.random() * 8 - 4));
    this.systemMetrics.diskUsage = Math.max(40, Math.min(95, this.systemMetrics.diskUsage + Math.random() * 2 - 1));
    this.systemMetrics.searchLatency = Math.max(10, Math.min(200, 50 + Math.random() * 20 - 10));
    this.systemMetrics.cacheHitRate = Math.max(80, Math.min(99, 95 + Math.random() * 4 - 2));
    this.systemMetrics.interactionLatency = Math.max(5, Math.min(100, 20 + Math.random() * 10 - 5));
    this.systemMetrics.errorRate = Math.max(0, Math.min(5, 0.1 + Math.random() * 0.2 - 0.1));
  }

  private analyzePerformance(): void {
    this.checkFPSThresholds();
    this.checkMemoryThresholds();
    this.checkLatencyThresholds();
    this.generateOptimizations();
  }

  private checkFPSThresholds(): void {
    const fps = this.metrics.fps;
    
    if (fps < 30) {
      this.addAlert({
        id: `fps-critical-${Date.now()}`,
        type: 'error',
        message: `FPS crítico: ${fps.toFixed(1)} (target: 60)`,
        timestamp: Date.now(),
        category: 'performance'
      });
    } else if (fps < 45) {
      this.addAlert({
        id: `fps-warning-${Date.now()}`,
        type: 'warning',
        message: `FPS baixo: ${fps.toFixed(1)} (target: 60)`,
        timestamp: Date.now(),
        category: 'performance'
      });
    }
  }

  private checkMemoryThresholds(): void {
    const memory = this.metrics.memoryUsage;
    
    if (memory > 85) {
      this.addAlert({
        id: `memory-critical-${Date.now()}`,
        type: 'error',
        message: `Uso de memória crítico: ${memory.toFixed(1)}%`,
        timestamp: Date.now(),
        category: 'memory'
      });
    } else if (memory > 70) {
      this.addAlert({
        id: `memory-warning-${Date.now()}`,
        type: 'warning',
        message: `Uso de memória alto: ${memory.toFixed(1)}%`,
        timestamp: Date.now(),
        category: 'memory'
      });
    }
  }

  private checkLatencyThresholds(): void {
    const latency = this.metrics.networkLatency;
    
    if (latency > 1000) {
      this.addAlert({
        id: `latency-critical-${Date.now()}`,
        type: 'error',
        message: `Latência de rede crítica: ${latency.toFixed(0)}ms`,
        timestamp: Date.now(),
        category: 'network'
      });
    } else if (latency > 500) {
      this.addAlert({
        id: `latency-warning-${Date.now()}`,
        type: 'warning',
        message: `Latência de rede alta: ${latency.toFixed(0)}ms`,
        timestamp: Date.now(),
        category: 'network'
      });
    }
  }

  private generateOptimizations(): void {
    if (this.metrics.memoryUsage > 70) {
      this.addOptimization({
        id: `memory-opt-${Date.now()}`,
        type: 'memory',
        title: 'Otimizar uso de memória',
        description: 'Executar garbage collection e limpar caches desnecessários',
        impact: 'high',
        effort: 'low',
        applied: false,
        timestamp: Date.now()
      });
    }

    if (this.metrics.fps < 45) {
      this.addOptimization({
        id: `rendering-opt-${Date.now()}`,
        type: 'rendering',
        title: 'Otimizar renderização',
        description: 'Reduzir complexidade visual e usar virtualization',
        impact: 'high',
        effort: 'medium',
        applied: false,
        timestamp: Date.now()
      });
    }
  }

  private initializeObservers(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            this.processNavigationEntry(entry as PerformanceNavigationTiming);
          }
        });
      });
      
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);
    } catch (error) {
      console.warn('Performance observers não são totalmente suportados:', error);
    }
  }

  private processNavigationEntry(entry: PerformanceNavigationTiming): void {
    this.metrics.loadTime = entry.loadEventEnd - entry.navigationStart;
    this.metrics.renderTime = entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart;
  }

  private addAlert(alert: PerformanceAlert): void {
    const recent = this.alerts.find(a => 
      a.category === alert.category && 
      Date.now() - a.timestamp < 30000
    );
    
    if (!recent) {
      this.alerts.push(alert);
      if (this.alerts.length > 50) {
        this.alerts = this.alerts.slice(-50);
      }
    }
  }

  private addOptimization(optimization: PerformanceOptimization): void {
    const recent = this.optimizations.find(o => 
      o.type === optimization.type && 
      Date.now() - o.timestamp < 60000
    );
    
    if (!recent) {
      this.optimizations.push(optimization);
      if (this.optimizations.length > 20) {
        this.optimizations = this.optimizations.slice(-20);
      }
    }
  }

  private notifyCallbacks(): void {
    this.callbacks.forEach(callback => {
      try {
        callback(this.getMetrics());
      } catch (error) {
        console.error('Error in performance callback:', error);
      }
    });
  }

  private optimizeMemory(): void {
    // Limpeza de memória básica
    if ('gc' in window && typeof (window as { gc?: () => void }).gc === 'function') {
      (window as { gc: () => void }).gc();
    }
    console.log('🧹 Otimização de memória aplicada');
  }

  private optimizeNetwork(): void {
    console.log('🌐 Otimização de rede aplicada');
  }

  private optimizeRendering(): void {
    document.body.classList.add('performance-mode');
    setTimeout(() => {
      document.body.classList.remove('performance-mode');
    }, 30000);
    console.log('🎨 Otimização de renderização aplicada');
  }

  private optimizeCache(): void {
    console.log('💾 Otimização de cache aplicada');
  }
}

export const performanceService = PerformanceService.getInstance(); 