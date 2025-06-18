import type { 
  PerformanceMetrics, 
  PerformanceAlert, 
  PerformanceOptimization,
  OptimizationSuggestion,
  CacheStrategy
} from '@/types/common';

/**
 * Serviço centralizado de performance que consolida todas as funcionalidades
 * dispersas no projeto, eliminando duplicação e melhorando manutenibilidade
 */
class CorePerformanceService {
  private static instance: CorePerformanceService | null = null;
  
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

  // Singleton pattern corrigido
  static getInstance(): CorePerformanceService {
    if (!CorePerformanceService.instance) {
      CorePerformanceService.instance = new CorePerformanceService();
    }
    return CorePerformanceService.instance;
  }

  private constructor() {
    this.initializeObservers();
  }

  // Inicialização centralizada dos observers
  private initializeObservers(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      // Navigation timing observer
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            this.processNavigationEntry(entry);
          }
        });
      });
      
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);

      // Layout shift observer
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

      // Long task observer
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.duration > 50) { // Tasks longer than 50ms
            this.addAlert({
              id: `long-task-${Date.now()}`,
              type: 'warning',
              message: `Tarefa longa detectada: ${entry.duration.toFixed(1)}ms`,
              timestamp: new Date(),
              metric: 'renderTime',
              value: entry.duration,
              threshold: 50
            });
          }
        });
      });
      
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);

    } catch (error) {
      console.warn('Alguns observers de performance não são suportados:', error);
    }
  }

  // Processamento centralizado de métricas
  private processNavigationEntry(entry: PerformanceEntry): void {
    const navEntry = entry as PerformanceNavigationTiming;
    const loadTime = navEntry.loadEventEnd - navEntry.navigationStart;
    
    this.updateMetrics({
      loadTime,
      renderTime: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart
    });
  }

  private processLayoutShift(entry: PerformanceEntry): void {
    // Layout shift processing
    const shiftValue = (entry as any).value;
    if (shiftValue > 0.1) {
      this.addAlert({
        id: `cls-${Date.now()}`,
        type: 'warning',
        message: `Layout shift alto detectado: ${shiftValue.toFixed(3)}`,
        timestamp: new Date(),
        metric: 'renderTime',
        value: shiftValue,
        threshold: 0.1
      });
    }
  }

  // Sistema unificado de monitoramento
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.intervalId = setInterval(() => {
      this.collectMetrics();
      this.analyzePerformance();
    }, 5000);

    console.log('🚀 Core Performance Service iniciado');
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('⏹️ Core Performance Service parado');
  }

  // Coleta unificada de métricas
  private collectMetrics(): void {
    // FPS measurement
    this.measureFPS();
    
    // Memory measurement
    this.measureMemory();
    
    // Network latency measurement
    void this.measureNetworkLatency();
    
    // Bundle size estimation
    void this.estimateBundleSize();
  }

  private measureFPS(): void {
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFrame = (currentTime: number) => {
      frameCount++;
      const deltaTime = currentTime - lastTime;

      if (deltaTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / deltaTime);
        this.updateMetrics({ fps });
        frameCount = 0;
        lastTime = currentTime;
      }

      if (this.isMonitoring) {
        requestAnimationFrame(measureFrame);
      }
    };

    requestAnimationFrame(measureFrame);
  }

  private measureMemory(): void {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const memoryUsage = (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100;
      this.updateMetrics({ memoryUsage });
    }
  }

  private async measureNetworkLatency(): Promise<void> {
    const startTime = performance.now();
    try {
      await fetch('/api/ping', { method: 'HEAD' }).catch(() => {
        // Fallback para quando não há API
        return new Promise(resolve => setTimeout(resolve, 50));
      });
      const latency = performance.now() - startTime;
      this.updateMetrics({ networkLatency: latency });
    } catch {
      this.updateMetrics({ networkLatency: 999 });
    }
  }

  private async estimateBundleSize(): Promise<void> {
    try {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      let totalSize = 0;

      for (const script of scripts) {
        try {
          const response = await fetch(script.src, { method: 'HEAD' });
          const contentLength = response.headers.get('content-length');
          if (contentLength) {
            totalSize += parseInt(contentLength, 10);
          }
        } catch {
          // Ignorar erros de CORS
        }
      }

      this.updateMetrics({ bundleSize: totalSize });
    } catch (error) {
      console.warn('Não foi possível estimar o tamanho do bundle:', error);
    }
  }

  // Sistema inteligente de análise
  private analyzePerformance(): void {
    this.checkAlerts();
    this.generateOptimizations();
    this.updateCacheStrategy();
  }

  private checkAlerts(): void {
    const { fps, memoryUsage, networkLatency, renderTime } = this.metrics;

    // FPS baixo
    if (fps < 30) {
      this.addAlert({
        id: `fps-${Date.now()}`,
        type: fps < 20 ? 'error' : 'warning',
        message: `FPS baixo detectado: ${fps}`,
        timestamp: new Date(),
        metric: 'fps',
        value: fps,
        threshold: 30
      });
    }

    // Memória alta
    if (memoryUsage > 80) {
      this.addAlert({
        id: `memory-${Date.now()}`,
        type: memoryUsage > 90 ? 'error' : 'warning',
        message: `Uso de memória alto: ${Math.round(memoryUsage)}%`,
        timestamp: new Date(),
        metric: 'memoryUsage',
        value: memoryUsage,
        threshold: 80
      });
    }

    // Latência alta
    if (networkLatency > 200) {
      this.addAlert({
        id: `network-${Date.now()}`,
        type: networkLatency > 500 ? 'error' : 'warning',
        message: `Latência de rede alta: ${Math.round(networkLatency)}ms`,
        timestamp: new Date(),
        metric: 'networkLatency',
        value: networkLatency,
        threshold: 200
      });
    }

    // Renderização lenta
    if (renderTime > 16.67) { // 60fps = 16.67ms per frame
      this.addAlert({
        id: `render-${Date.now()}`,
        type: renderTime > 33 ? 'error' : 'warning',
        message: `Renderização lenta: ${renderTime.toFixed(1)}ms`,
        timestamp: new Date(),
        metric: 'renderTime',
        value: renderTime,
        threshold: 16.67
      });
    }
  }

  private generateOptimizations(): void {
    const newOptimizations: PerformanceOptimization[] = [];

    // Otimização de memória
    if (this.metrics.memoryUsage > 75) {
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
    if (this.metrics.fps < 45) {
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
    if (this.metrics.networkLatency > 150) {
      newOptimizations.push({
        id: 'network-optimization',
        type: 'network',
        description: 'Ativar compressão e cache de rede',
        impact: 'medium',
        applied: false,
        automatic: true
      });
    }

    // Adicionar apenas otimizações novas
    newOptimizations.forEach(opt => {
      if (!this.optimizations.some(existing => existing.id === opt.id)) {
        this.optimizations.push(opt);
      }
    });
  }

  private updateCacheStrategy(): void {
    const hitRate = this.metrics.cacheHitRate;
    
    if (hitRate < 50) {
      // Cache hit rate baixo - ajustar estratégia
      this.addAlert({
        id: `cache-${Date.now()}`,
        type: 'warning',
        message: `Taxa de cache baixa: ${Math.round(hitRate)}%`,
        timestamp: new Date(),
        metric: 'cacheHitRate',
        value: hitRate,
        threshold: 50
      });
    }
  }

  // API pública unificada
  updateMetrics(partial: Partial<PerformanceMetrics>): void {
    this.metrics = { ...this.metrics, ...partial };
  }

  addAlert(alert: PerformanceAlert): void {
    this.alerts.unshift(alert);
    // Manter apenas os últimos 50 alertas
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(0, 50);
    }
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

  clearAlerts(): void {
    this.alerts = [];
  }

  // Sistema de otimização automática
  async applyOptimization(optimizationId: string): Promise<boolean> {
    const optimization = this.optimizations.find(opt => opt.id === optimizationId);
    if (!optimization || optimization.applied) return false;

    try {
      switch (optimization.type) {
        case 'memory':
          await this.cleanMemory();
          break;
        case 'rendering':
          await this.optimizeRendering();
          break;
        case 'network':
          await this.optimizeNetwork();
          break;
        default:
          console.warn('Tipo de otimização desconhecido:', optimization.type);
          return false;
      }

      // Marcar como aplicada
      optimization.applied = true;
      console.log(`✅ Otimização aplicada: ${optimization.description}`);
      return true;

    } catch (error) {
      console.error('❌ Erro ao aplicar otimização:', error);
      return false;
    }
  }

  private async cleanMemory(): Promise<void> {
    // Force garbage collection se disponível
    if ('gc' in window) {
      (window as any).gc();
    }
    
    // Limpar caches desnecessários
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(name => {
          if (name.includes('old') || name.includes('temp')) {
            return caches.delete(name);
          }
          return Promise.resolve(false);
        })
      );
    }
  }

  private async optimizeRendering(): Promise<void> {
    // Aplicar will-change para otimização
    document.body.style.willChange = 'transform';
    setTimeout(() => {
      document.body.style.willChange = 'auto';
    }, 1000);
  }

  private async optimizeNetwork(): Promise<void> {
    // Implementar cache de rede se service worker estiver disponível
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
    }
  }

  // Cleanup ao destruir
  destroy(): void {
    this.stopMonitoring();
    this.observers.forEach(observer => { observer.disconnect(); });
    this.observers = [];
    CorePerformanceService.instance = null;
  }
}

// Export como singleton
export const corePerformanceService = CorePerformanceService.getInstance();
export default CorePerformanceService; 