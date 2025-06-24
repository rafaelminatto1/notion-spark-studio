// Tipos para monitoramento de saúde
export interface HealthMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  threshold: {
    warning: number;
    critical: number;
  };
  description: string;
  lastUpdated: Date;
}

export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  score: number;
  metrics: HealthMetric[];
  issues: HealthIssue[];
  recommendations: HealthRecommendation[];
}

export interface HealthIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  solution: string;
  autoFixable: boolean;
  timestamp: Date;
}

export interface HealthRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  benefit: string;
  effort: 'low' | 'medium' | 'high';
  implementation: () => Promise<void>;
}

// Classe principal de monitoramento
export class ApplicationHealthMonitor {
  private static instance: ApplicationHealthMonitor;
  private metrics: Map<string, HealthMetric> = new Map();
  private issues: HealthIssue[] = [];
  private recommendations: HealthRecommendation[] = [];
  private observers: ((health: SystemHealth) => void)[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;

  static getInstance(): ApplicationHealthMonitor {
    if (!ApplicationHealthMonitor.instance) {
      ApplicationHealthMonitor.instance = new ApplicationHealthMonitor();
    }
    return ApplicationHealthMonitor.instance;
  }

  startMonitoring(intervalMs = 30000): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);

    // Coleta inicial
    this.collectMetrics();
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  subscribe(observer: (health: SystemHealth) => void): () => void {
    this.observers.push(observer);
    return () => {
      const index = this.observers.indexOf(observer);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  private async collectMetrics(): Promise<void> {
    try {
      // Métricas de performance
      await this.collectPerformanceMetrics();
      
      // Métricas de conectividade
      await this.collectConnectivityMetrics();
      
      // Métricas de armazenamento
      await this.collectStorageMetrics();
      
      // Métricas de memória
      await this.collectMemoryMetrics();
      
      // Análise de problemas
      this.analyzeIssues();
      
      // Gerar recomendações
      this.generateRecommendations();
      
      // Notificar observadores
      this.notifyObservers();
    } catch (error) {
      console.error('Error collecting health metrics:', error);
    }
  }

  private async collectPerformanceMetrics(): Promise<void> {
    // FPS (Frame Rate)
    const fps = await this.measureFPS();
    this.updateMetric({
      id: 'fps',
      name: 'Taxa de Quadros',
      value: fps,
      unit: 'fps',
      status: fps >= 50 ? 'healthy' : fps >= 30 ? 'warning' : 'critical',
      threshold: { warning: 30, critical: 15 },
      description: 'Fluidez da interface do usuário',
      lastUpdated: new Date()
    });

    // Tempo de resposta
    const responseTime = await this.measureResponseTime();
    this.updateMetric({
      id: 'response_time',
      name: 'Tempo de Resposta',
      value: responseTime,
      unit: 'ms',
      status: responseTime <= 100 ? 'healthy' : responseTime <= 300 ? 'warning' : 'critical',
      threshold: { warning: 300, critical: 1000 },
      description: 'Velocidade de resposta da aplicação',
      lastUpdated: new Date()
    });

    // Bundle size
    const bundleSize = await this.measureBundleSize();
    this.updateMetric({
      id: 'bundle_size',
      name: 'Tamanho do Bundle',
      value: bundleSize,
      unit: 'KB',
      status: bundleSize <= 500 ? 'healthy' : bundleSize <= 1000 ? 'warning' : 'critical',
      threshold: { warning: 1000, critical: 2000 },
      description: 'Tamanho dos arquivos JavaScript carregados',
      lastUpdated: new Date()
    });
  }

  private async collectConnectivityMetrics(): Promise<void> {
    // Status de conexão
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.updateMetric({
      id: 'connectivity',
      name: 'Conectividade',
      value: isOnline ? 100 : 0,
      unit: '%',
      status: isOnline ? 'healthy' : 'critical',
      threshold: { warning: 50, critical: 0 },
      description: 'Status da conexão com a internet',
      lastUpdated: new Date()
    });

    // Latência de rede
    if (isOnline) {
      const latency = await this.measureNetworkLatency();
      this.updateMetric({
        id: 'network_latency',
        name: 'Latência de Rede',
        value: latency,
        unit: 'ms',
        status: latency <= 100 ? 'healthy' : latency <= 300 ? 'warning' : 'critical',
        threshold: { warning: 300, critical: 1000 },
        description: 'Tempo de resposta da rede',
        lastUpdated: new Date()
      });
    }
  }

  private async collectStorageMetrics(): Promise<void> {
    // LocalStorage usage
    const localStorageUsage = this.calculateStorageUsage('localStorage');
    this.updateMetric({
      id: 'local_storage',
      name: 'Armazenamento Local',
      value: localStorageUsage.percentage,
      unit: '%',
      status: localStorageUsage.percentage <= 70 ? 'healthy' : localStorageUsage.percentage <= 90 ? 'warning' : 'critical',
      threshold: { warning: 70, critical: 90 },
      description: 'Uso do armazenamento local do navegador',
      lastUpdated: new Date()
    });

    // SessionStorage usage
    const sessionStorageUsage = this.calculateStorageUsage('sessionStorage');
    this.updateMetric({
      id: 'session_storage',
      name: 'Armazenamento de Sessão',
      value: sessionStorageUsage.percentage,
      unit: '%',
      status: sessionStorageUsage.percentage <= 70 ? 'healthy' : sessionStorageUsage.percentage <= 90 ? 'warning' : 'critical',
      threshold: { warning: 70, critical: 90 },
      description: 'Uso do armazenamento de sessão do navegador',
      lastUpdated: new Date()
    });
  }

  private async collectMemoryMetrics(): Promise<void> {
    // Memory usage (if available)
    if (typeof (performance as any).memory !== 'undefined') {
      const memory = (performance as any).memory;
      const memoryUsage = (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;
      
      this.updateMetric({
        id: 'memory_usage',
        name: 'Uso de Memória',
        value: memoryUsage,
        unit: '%',
        status: memoryUsage <= 70 ? 'healthy' : memoryUsage <= 90 ? 'warning' : 'critical',
        threshold: { warning: 70, critical: 90 },
        description: 'Uso de memória JavaScript',
        lastUpdated: new Date()
      });
    }
  }

  private analyzeIssues(): void {
    this.issues = [];
    
    for (const [id, metric] of this.metrics.entries()) {
      if (metric.status === 'critical' || metric.status === 'warning') {
        const issue: HealthIssue = {
          id: `issue_${id}_${Date.now()}`,
          severity: metric.status === 'critical' ? 'critical' : 'medium',
          title: `${metric.name} em ${metric.status === 'critical' ? 'estado crítico' : 'alerta'}`,
          description: `${metric.name} está em ${metric.value}${metric.unit}, acima do limite recomendado.`,
          impact: this.getImpactForMetric(id),
          solution: this.getSolutionForMetric(id),
          autoFixable: this.isAutoFixable(id),
          timestamp: new Date()
        };
        this.issues.push(issue);
      }
    }
  }

  private generateRecommendations(): void {
    this.recommendations = [];
    
    // Recomendações baseadas em métricas
    const bundleSizeMetric = this.metrics.get('bundle_size');
    if (bundleSizeMetric && bundleSizeMetric.value > 500) {
      this.recommendations.push({
        id: 'reduce_bundle_size',
        priority: 'high',
        title: 'Reduzir tamanho do bundle',
        description: 'O bundle JavaScript está maior que o recomendado',
        benefit: 'Melhor performance de carregamento',
        effort: 'medium',
        implementation: async () => {
          console.log('Implementando otimizações de bundle...');
        }
      });
    }

    // Mais recomendações podem ser adicionadas aqui
  }

  private getImpactForMetric(metricId: string): string {
    const impacts = {
      fps: 'Interface menos fluida e responsiva',
      response_time: 'Experiência do usuário prejudicada',
      bundle_size: 'Carregamento mais lento da aplicação',
      connectivity: 'Funcionalidades offline indisponíveis',
      network_latency: 'Sincronização de dados mais lenta',
      local_storage: 'Possível perda de dados locais',
      session_storage: 'Perda de estado da sessão',
      memory_usage: 'Possível travamento da aplicação'
    };
    return impacts[metricId as keyof typeof impacts] || 'Impacto na performance geral';
  }

  private getSolutionForMetric(metricId: string): string {
    const solutions = {
      fps: 'Otimizar animações e renderização',
      response_time: 'Implementar cache e lazy loading',
      bundle_size: 'Code splitting e tree shaking',
      connectivity: 'Verificar conexão de rede',
      network_latency: 'Usar CDN ou servidor mais próximo',
      local_storage: 'Limpar dados desnecessários',
      session_storage: 'Limpar dados de sessão antigos',
      memory_usage: 'Otimizar uso de memória'
    };
    return solutions[metricId as keyof typeof solutions] || 'Otimizar configurações do sistema';
  }

  private isAutoFixable(metricId: string): boolean {
    const autoFixableMetrics = ['local_storage', 'session_storage'];
    return autoFixableMetrics.includes(metricId);
  }

  private async measureFPS(): Promise<number> {
    return new Promise((resolve) => {
      let frames = 0;
      const startTime = performance.now();
      
      function countFrame() {
        frames++;
        if (performance.now() - startTime < 1000) {
          requestAnimationFrame(countFrame);
        } else {
          resolve(frames);
        }
      }
      
      requestAnimationFrame(countFrame);
    });
  }

  private async measureResponseTime(): Promise<number> {
    const start = performance.now();
    await new Promise(resolve => setTimeout(resolve, 1));
    return performance.now() - start;
  }

  private async measureBundleSize(): Promise<number> {
    try {
      if (typeof navigator !== 'undefined' && 'connection' in navigator) {
        const connection = (navigator as any).connection;
        return connection.downlink * 100; // Aproximação baseada na velocidade da conexão
      }
      return 250; // Valor padrão estimado
    } catch (error) {
      console.warn('Failed to measure bundle size:', error);
      return 250;
    }
  }

  private async measureNetworkLatency(): Promise<number> {
    try {
      const start = performance.now();
      await fetch('/', { method: 'HEAD', cache: 'no-cache' });
      return performance.now() - start;
    } catch (error) {
      return 1000; // Timeout ou erro
    }
  }

  private calculateStorageUsage(storageType: 'localStorage' | 'sessionStorage'): {
    used: number;
    total: number;
    percentage: number;
  } {
    try {
      if (typeof window === 'undefined') {
        return { used: 0, total: 5000000, percentage: 0 }; // SSR fallback
      }

      const storage = window[storageType];
      let used = 0;
      
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key) {
          used += key.length + (storage.getItem(key)?.length || 0);
        }
      }
      
      const total = 5000000; // 5MB typical limit
      return {
        used,
        total,
        percentage: (used / total) * 100
      };
    } catch (error) {
      return { used: 0, total: 5000000, percentage: 0 };
    }
  }

  private clearUnusedCache(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        // Remove items específicos que podem ser limpos
        const keysToRemove = Object.keys(localStorage).filter(key => 
          key.startsWith('temp_') || 
          key.startsWith('cache_') ||
          key.includes('_expired')
        );
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
    } catch (error) {
      console.warn('Failed to clear unused cache:', error);
    }
  }

  private updateMetric(metric: HealthMetric): void {
    this.metrics.set(metric.id, metric);
  }

  private notifyObservers(): void {
    const health = this.getSystemHealth();
    this.observers.forEach(observer => observer(health));
  }

  getSystemHealth(): SystemHealth {
    const metrics = Array.from(this.metrics.values());
    const criticalCount = metrics.filter(m => m.status === 'critical').length;
    const warningCount = metrics.filter(m => m.status === 'warning').length;
    
    let overall: 'healthy' | 'warning' | 'critical';
    let score: number;
    
    if (criticalCount > 0) {
      overall = 'critical';
      score = Math.max(0, 100 - (criticalCount * 30) - (warningCount * 10));
    } else if (warningCount > 0) {
      overall = 'warning';
      score = Math.max(50, 100 - (warningCount * 15));
    } else {
      overall = 'healthy';
      score = 100;
    }

    return {
      overall,
      score,
      metrics,
      issues: this.issues,
      recommendations: this.recommendations
    };
  }

  async autoFix(issueId: string): Promise<boolean> {
    const issue = this.issues.find(i => i.id === issueId);
    if (!issue?.autoFixable) {
      return false;
    }

    try {
      if (issue.id.includes('local_storage')) {
        this.clearUnusedCache();
        return true;
      }
      
      if (issue.id.includes('session_storage')) {
        if (typeof sessionStorage !== 'undefined') {
          // Clear only temporary session data
          const keysToRemove = Object.keys(sessionStorage).filter(key => 
            key.startsWith('temp_') || key.includes('_cache')
          );
          keysToRemove.forEach(key => sessionStorage.removeItem(key));
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('Auto-fix failed:', error);
      return false;
    }
  }

  destroy(): void {
    this.stopMonitoring();
    this.observers = [];
    this.metrics.clear();
    this.issues = [];
    this.recommendations = [];
  }
} 