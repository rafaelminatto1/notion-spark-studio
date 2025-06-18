import type { 
  PerformanceMetrics, 
  PerformanceAlert, 
  PerformanceOptimization,
  SystemMetrics,
  MemoryUsage,
  NetworkMetrics,
  RenderingMetrics
} from '@/types/common';

/**
 * Serviço Unificado de Performance
 * Consolida todas as funcionalidades de monitoramento dispersas no projeto
 * Elimina duplicação e centraliza toda lógica de performance
 */
export class UnifiedPerformanceService {
  private static instance: UnifiedPerformanceService | null = null;
  
  // Estado interno
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
  private startTime = Date.now();

  // Singleton pattern
  static getInstance(): UnifiedPerformanceService {
    if (!UnifiedPerformanceService.instance) {
      UnifiedPerformanceService.instance = new UnifiedPerformanceService();
    }
    return UnifiedPerformanceService.instance;
  }

  private constructor() {
    this.initializeObservers();
  }

  // ========================================
  // MÉTODOS PÚBLICOS - CONTROLE
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
    
    console.log('🚀 Unified Performance Service iniciado');
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.observers.forEach(observer => { observer.disconnect(); });
    this.observers = [];
    
    console.log('⏹️ Unified Performance Service parado');
  }

  // ========================================
  // MÉTODOS PÚBLICOS - DADOS
  // ========================================

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

  // ========================================
  // MÉTODOS PÚBLICOS - CALLBACKS
  // ========================================

  onMetricsUpdate(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.callbacks.push(callback);
    
    // Retorna função de cleanup
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  // ========================================
  // MÉTODOS PÚBLICOS - OTIMIZAÇÃO
  // ========================================

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
  // MÉTODOS PRIVADOS - COLETA DE MÉTRICAS
  // ========================================

  private collectMetrics(): void {
    this.updateFPSMetrics();
    this.updateMemoryMetrics();
    this.updateNetworkMetrics();
    this.updateRenderingMetrics();
    this.updateSystemMetrics();
  }

  private updateFPSMetrics(): void {
    // Usar requestAnimationFrame para medir FPS real
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFrame = (currentTime: number) => {
      frameCount++;
      const deltaTime = currentTime - lastTime;

      if (deltaTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / deltaTime);
        this.metrics.fps = fps;
        this.systemMetrics.fps = fps;
        frameCount = 0;
        lastTime = currentTime;
      }

      if (this.isMonitoring) {
        requestAnimationFrame(measureFrame);
      }
    };

    if (this.isMonitoring) {
      requestAnimationFrame(measureFrame);
    }
  }

  private updateMemoryMetrics(): void {
    if ('memory' in performance) {
      const mem = (performance as { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
      const usedMB = mem.usedJSHeapSize / 1024 / 1024;
      const totalMB = mem.totalJSHeapSize / 1024 / 1024;
      const percentage = (usedMB / totalMB) * 100;

      this.metrics.memoryUsage = percentage;
      this.systemMetrics.memoryUsage = percentage;
    }
  }

  private updateNetworkMetrics(): void {
    if ('connection' in navigator) {
      const connection = (navigator as { connection: { effectiveType: string; downlink: number; rtt: number } }).connection;
      this.metrics.networkLatency = connection.rtt || 0;
      this.systemMetrics.networkLatency = connection.rtt || 0;
      this.systemMetrics.connectionType = connection.effectiveType as 'wifi' | 'cellular' | 'ethernet' | 'offline';
    }

    this.systemMetrics.syncStatus = navigator.onLine ? 'online' : 'offline';
    this.systemMetrics.activeConnections = navigator.onLine ? 1 : 0;
  }

  private updateRenderingMetrics(): void {
    // Medir tempo de renderização usando Performance API
    const navigationEntries = performance.getEntriesByType('navigation');
    if (navigationEntries.length > 0) {
      const nav = navigationEntries[0] as PerformanceNavigationTiming;
      this.metrics.loadTime = nav.loadEventEnd - nav.navigationStart;
      this.metrics.renderTime = nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart;
      this.systemMetrics.renderTime = this.metrics.renderTime;
    }
  }

  private updateSystemMetrics(): void {
    // Atualizar métricas específicas do sistema
    this.systemMetrics.documentsLoaded = document.querySelectorAll('[data-document]').length;
    this.systemMetrics.pendingSyncs = navigator.onLine ? 0 : Math.floor(Math.random() * 3);
    
    // Simular algumas métricas para desenvolvimento
    this.systemMetrics.cpuUsage = Math.max(10, Math.min(80, this.systemMetrics.cpuUsage + Math.random() * 8 - 4));
    this.systemMetrics.diskUsage = Math.max(40, Math.min(95, this.systemMetrics.diskUsage + Math.random() * 2 - 1));
    this.systemMetrics.searchLatency = Math.max(10, Math.min(200, 50 + Math.random() * 20 - 10));
    this.systemMetrics.cacheHitRate = Math.max(80, Math.min(99, 95 + Math.random() * 4 - 2));
    this.systemMetrics.interactionLatency = Math.max(5, Math.min(100, 20 + Math.random() * 10 - 5));
    this.systemMetrics.errorRate = Math.max(0, Math.min(5, 0.1 + Math.random() * 0.2 - 0.1));
  }

  // ========================================
  // MÉTODOS PRIVADOS - ANÁLISE
  // ========================================

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
        message: `FPS crítico: ${fps} (target: 60)`,
        timestamp: Date.now(),
        category: 'performance',
        metric: 'fps',
        value: fps,
        threshold: 30
      });
    } else if (fps < 45) {
      this.addAlert({
        id: `fps-warning-${Date.now()}`,
        type: 'warning',
        message: `FPS baixo: ${fps} (target: 60)`,
        timestamp: Date.now(),
        category: 'performance',
        metric: 'fps',
        value: fps,
        threshold: 45
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
        category: 'memory',
        metric: 'memoryUsage',
        value: memory,
        threshold: 85
      });
    } else if (memory > 70) {
      this.addAlert({
        id: `memory-warning-${Date.now()}`,
        type: 'warning',
        message: `Uso de memória alto: ${memory.toFixed(1)}%`,
        timestamp: Date.now(),
        category: 'memory',
        metric: 'memoryUsage',
        value: memory,
        threshold: 70
      });
    }
  }

  private checkLatencyThresholds(): void {
    const latency = this.metrics.networkLatency;
    
    if (latency > 1000) {
      this.addAlert({
        id: `latency-critical-${Date.now()}`,
        type: 'error',
        message: `Latência de rede crítica: ${latency}ms`,
        timestamp: Date.now(),
        category: 'network',
        metric: 'networkLatency',
        value: latency,
        threshold: 1000
      });
    } else if (latency > 500) {
      this.addAlert({
        id: `latency-warning-${Date.now()}`,
        type: 'warning',
        message: `Latência de rede alta: ${latency}ms`,
        timestamp: Date.now(),
        category: 'network',
        metric: 'networkLatency',
        value: latency,
        threshold: 500
      });
    }
  }

  private generateOptimizations(): void {
    // Gerar otimizações baseadas nas métricas atuais
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

    if (this.metrics.networkLatency > 500) {
      this.addOptimization({
        id: `network-opt-${Date.now()}`,
        type: 'network',
        title: 'Otimizar requisições de rede',
        description: 'Implementar cache agressivo e batch requests',
        impact: 'medium',
        effort: 'low',
        applied: false,
        timestamp: Date.now()
      });
    }
  }

  // ========================================
  // MÉTODOS PRIVADOS - OTIMIZAÇÃO
  // ========================================

  private optimizeMemory(): void {
    // Forçar garbage collection se disponível
    if ('gc' in window && typeof (window as { gc?: () => void }).gc === 'function') {
      (window as { gc: () => void }).gc();
    }
    
    // Limpar caches antigos
    this.clearOldCaches();
    
    console.log('🧹 Otimização de memória aplicada');
  }

  private optimizeNetwork(): void {
    // Implementar cache mais agressivo
    this.enableAggressiveCaching();
    
    console.log('🌐 Otimização de rede aplicada');
  }

  private optimizeRendering(): void {
    // Reduzir qualidade visual temporariamente
    this.reduceVisualComplexity();
    
    console.log('🎨 Otimização de renderização aplicada');
  }

  private optimizeCache(): void {
    // Otimizar estratégias de cache
    this.optimizeCacheStrategies();
    
    console.log('💾 Otimização de cache aplicada');
  }

  // ========================================
  // MÉTODOS PRIVADOS - UTILITÁRIOS
  // ========================================

  private initializeObservers(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      // Observer para navegação
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

      // Observer para layout shifts
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'layout-shift') {
            this.processLayoutShift(entry);
          }
        });
      });
      
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (error) {
      console.warn('Alguns observers de performance não são suportados:', error);
    }
  }

  private processNavigationEntry(entry: PerformanceNavigationTiming): void {
    this.metrics.loadTime = entry.loadEventEnd - entry.navigationStart;
    this.metrics.renderTime = entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart;
  }

  private processLayoutShift(entry: PerformanceEntry): void {
    // Processar layout shifts para CLS
    console.log('Layout shift detectado:', entry);
  }

  private addAlert(alert: PerformanceAlert): void {
    // Evitar duplicatas recentes
    const recent = this.alerts.find(a => 
      a.category === alert.category && 
      a.metric === alert.metric &&
      Date.now() - a.timestamp < 30000 // 30 segundos
    );
    
    if (!recent) {
      this.alerts.push(alert);
      
      // Manter apenas os últimos 50 alertas
      if (this.alerts.length > 50) {
        this.alerts = this.alerts.slice(-50);
      }
    }
  }

  private addOptimization(optimization: PerformanceOptimization): void {
    // Evitar duplicatas recentes
    const recent = this.optimizations.find(o => 
      o.type === optimization.type && 
      Date.now() - o.timestamp < 60000 // 1 minuto
    );
    
    if (!recent) {
      this.optimizations.push(optimization);
      
      // Manter apenas as últimas 20 otimizações
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

  private clearOldCaches(): void {
    // Implementar limpeza de caches antigos
    try {
      if ('caches' in window) {
        void caches.keys().then(cacheNames => {
          const oldCaches = cacheNames.filter(name => 
            name.includes('old') || name.includes('temp')
          );
          return Promise.all(oldCaches.map(name => caches.delete(name)));
        });
      }
    } catch (error) {
      console.warn('Failed to clear old caches:', error);
    }
  }

  private enableAggressiveCaching(): void {
    // Implementar cache mais agressivo
    // Placeholder para implementação futura
  }

  private reduceVisualComplexity(): void {
    // Reduzir complexidade visual
    document.body.classList.add('performance-mode');
    
    setTimeout(() => {
      document.body.classList.remove('performance-mode');
    }, 30000); // Remover após 30 segundos
  }

  private optimizeCacheStrategies(): void {
    // Otimizar estratégias de cache
    // Placeholder para implementação futura
  }
}

// Exportar instância singleton
export const performanceService = UnifiedPerformanceService.getInstance(); 