import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Wifi, 
  Database, 
  Cpu, 
  MemoryStick,
  HardDrive,
  Zap,
  RefreshCw
} from 'lucide-react';

// Tipos para monitoramento de saúde
interface HealthMetric {
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

interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  score: number;
  metrics: HealthMetric[];
  issues: HealthIssue[];
  recommendations: HealthRecommendation[];
}

interface HealthIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  solution: string;
  autoFixable: boolean;
  timestamp: Date;
}

interface HealthRecommendation {
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

  startMonitoring(intervalMs: number = 30000): void {
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
    const isOnline = navigator.onLine;
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
      description: `${localStorageUsage.used}KB de ${localStorageUsage.total}KB usados`,
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
      description: `${sessionStorageUsage.used}KB de ${sessionStorageUsage.total}KB usados`,
      lastUpdated: new Date()
    });
  }

  private async collectMemoryMetrics(): Promise<void> {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const memoryUsage = (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100;
      
      this.updateMetric({
        id: 'memory_usage',
        name: 'Uso de Memória',
        value: memoryUsage,
        unit: '%',
        status: memoryUsage <= 70 ? 'healthy' : memoryUsage <= 85 ? 'warning' : 'critical',
        threshold: { warning: 70, critical: 85 },
        description: `${Math.round(memInfo.usedJSHeapSize / 1024 / 1024)}MB de ${Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024)}MB`,
        lastUpdated: new Date()
      });
    }
  }

  private analyzeIssues(): void {
    this.issues = [];

    this.metrics.forEach(metric => {
      if (metric.status === 'critical') {
        this.issues.push({
          id: `critical_${metric.id}`,
          severity: 'critical',
          title: `${metric.name} Crítico`,
          description: `${metric.name} está em ${metric.value}${metric.unit}, acima do limite crítico de ${metric.threshold.critical}${metric.unit}`,
          impact: 'Pode causar travamentos ou lentidão severa',
          solution: this.getSolutionForMetric(metric.id),
          autoFixable: this.isAutoFixable(metric.id),
          timestamp: new Date()
        });
      } else if (metric.status === 'warning') {
        this.issues.push({
          id: `warning_${metric.id}`,
          severity: 'medium',
          title: `${metric.name} em Alerta`,
          description: `${metric.name} está em ${metric.value}${metric.unit}, próximo do limite`,
          impact: 'Pode afetar a performance da aplicação',
          solution: this.getSolutionForMetric(metric.id),
          autoFixable: this.isAutoFixable(metric.id),
          timestamp: new Date()
        });
      }
    });
  }

  private generateRecommendations(): void {
    this.recommendations = [];

    // Recomendações baseadas em métricas
    const bundleMetric = this.metrics.get('bundle_size');
    if (bundleMetric && bundleMetric.value > 500) {
      this.recommendations.push({
        id: 'optimize_bundle',
        priority: 'high',
        title: 'Otimizar Bundle JavaScript',
        description: 'Implementar code splitting e lazy loading para reduzir o tamanho inicial',
        benefit: 'Redução de 30-50% no tempo de carregamento',
        effort: 'medium',
        implementation: async () => {
          console.log('Implementando otimização de bundle...');
          // Lógica de otimização
        }
      });
    }

    const memoryMetric = this.metrics.get('memory_usage');
    if (memoryMetric && memoryMetric.value > 60) {
      this.recommendations.push({
        id: 'optimize_memory',
        priority: 'medium',
        title: 'Otimizar Uso de Memória',
        description: 'Implementar limpeza de cache e otimização de componentes',
        benefit: 'Redução de 20-30% no uso de memória',
        effort: 'low',
        implementation: async () => {
          console.log('Implementando otimização de memória...');
          this.clearUnusedCache();
        }
      });
    }
  }

  private getSolutionForMetric(metricId: string): string {
    const solutions: Record<string, string> = {
      fps: 'Reduzir animações complexas, otimizar renderização',
      response_time: 'Implementar cache, otimizar consultas',
      bundle_size: 'Implementar code splitting, remover dependências não utilizadas',
      connectivity: 'Verificar conexão de internet',
      network_latency: 'Otimizar requisições, implementar cache',
      local_storage: 'Limpar dados antigos, implementar rotação de cache',
      session_storage: 'Limpar dados de sessão desnecessários',
      memory_usage: 'Limpar cache, otimizar componentes React'
    };
    return solutions[metricId] || 'Consultar documentação técnica';
  }

  private isAutoFixable(metricId: string): boolean {
    const autoFixable = ['local_storage', 'session_storage', 'memory_usage'];
    return autoFixable.includes(metricId);
  }

  private async measureFPS(): Promise<number> {
    return new Promise(resolve => {
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
    await new Promise(resolve => setTimeout(resolve, 0));
    return performance.now() - start;
  }

  private async measureBundleSize(): Promise<number> {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    let totalSize = 0;
    
    for (const script of scripts) {
      try {
        const response = await fetch(script.src, { method: 'HEAD' });
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
          totalSize += parseInt(contentLength, 10);
        }
      } catch (error) {
        // Ignorar erros de CORS
      }
    }
    
    return Math.round(totalSize / 1024); // KB
  }

  private async measureNetworkLatency(): Promise<number> {
    const start = performance.now();
    try {
      await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-cache' });
      return performance.now() - start;
    } catch (error) {
      return 9999; // Timeout/erro
    }
  }

  private calculateStorageUsage(storageType: 'localStorage' | 'sessionStorage'): {
    used: number;
    total: number;
    percentage: number;
  } {
    const storage = window[storageType];
    let used = 0;
    
    for (let key in storage) {
      if (storage.hasOwnProperty(key)) {
        used += storage[key].length + key.length;
      }
    }
    
    const usedKB = Math.round(used / 1024);
    const totalKB = 5120; // 5MB típico
    const percentage = Math.round((usedKB / totalKB) * 100);
    
    return { used: usedKB, total: totalKB, percentage };
  }

  private clearUnusedCache(): void {
    // Limpar cache antigo do localStorage
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    
    for (let key in localStorage) {
      if (key.startsWith('cache_')) {
        try {
          const data = JSON.parse(localStorage[key]);
          if (data.timestamp && (now - data.timestamp) > oneWeek) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          // Remover dados corrompidos
          localStorage.removeItem(key);
        }
      }
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
    if (!issue || !issue.autoFixable) return false;
    
    try {
      if (issueId.includes('local_storage') || issueId.includes('session_storage')) {
        this.clearUnusedCache();
        return true;
      }
      
      if (issueId.includes('memory_usage')) {
        this.clearUnusedCache();
        // Forçar garbage collection se disponível
        if ('gc' in window) {
          (window as any).gc();
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Auto-fix failed:', error);
      return false;
    }
  }
}

// Hook React para usar o monitor de saúde
export function useHealthMonitor() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    const monitor = ApplicationHealthMonitor.getInstance();
    
    const unsubscribe = monitor.subscribe(setHealth);
    
    return unsubscribe;
  }, []);

  const startMonitoring = useCallback(() => {
    const monitor = ApplicationHealthMonitor.getInstance();
    monitor.startMonitoring();
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    const monitor = ApplicationHealthMonitor.getInstance();
    monitor.stopMonitoring();
    setIsMonitoring(false);
  }, []);

  const autoFixIssue = useCallback(async (issueId: string) => {
    const monitor = ApplicationHealthMonitor.getInstance();
    return await monitor.autoFix(issueId);
  }, []);

  const applyRecommendation = useCallback(async (recommendationId: string) => {
    if (!health) return false;
    
    const recommendation = health.recommendations.find(r => r.id === recommendationId);
    if (!recommendation) return false;
    
    try {
      await recommendation.implementation();
      return true;
    } catch (error) {
      console.error('Failed to apply recommendation:', error);
      return false;
    }
  }, [health]);

  return {
    health,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    autoFixIssue,
    applyRecommendation
  };
}

// Componente de dashboard de saúde
interface HealthDashboardProps {
  compact?: boolean;
  autoStart?: boolean;
}

export const HealthDashboard: React.FC<HealthDashboardProps> = ({ 
  compact = false, 
  autoStart = true 
}) => {
  const { health, isMonitoring, startMonitoring, stopMonitoring, autoFixIssue, applyRecommendation } = useHealthMonitor();

  useEffect(() => {
    if (autoStart && !isMonitoring) {
      startMonitoring();
    }
  }, [autoStart, isMonitoring, startMonitoring]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (!health) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Iniciando monitoramento...</p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-background rounded-lg border">
        {getStatusIcon(health.overall)}
        <span className="text-sm font-medium">
          Saúde: {health.score}%
        </span>
        {health.issues.length > 0 && (
          <Badge variant="destructive" className="text-xs">
            {health.issues.length} problemas
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(health.overall)}
              <CardTitle className="text-lg">Saúde do Sistema</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(health.overall)}>
                {health.score}% Saudável
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={isMonitoring ? stopMonitoring : startMonitoring}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isMonitoring ? 'animate-spin' : ''}`} />
                {isMonitoring ? 'Pausar' : 'Iniciar'}
              </Button>
            </div>
          </div>
          <Progress value={health.score} className="mt-2" />
        </CardHeader>
      </Card>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {health.metrics.map(metric => (
          <Card key={metric.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{metric.name}</span>
                {getStatusIcon(metric.status)}
              </div>
              <div className="text-2xl font-bold">
                {metric.value}{metric.unit}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Problemas */}
      {health.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Problemas Detectados ({health.issues.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {health.issues.map(issue => (
              <div key={issue.id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{issue.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {issue.description}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Solução: {issue.solution}
                    </p>
                  </div>
                  {issue.autoFixable && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => autoFixIssue(issue.id)}
                    >
                      Corrigir
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recomendações */}
      {health.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              Recomendações de Otimização ({health.recommendations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {health.recommendations.map(rec => (
              <div key={rec.id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{rec.title}</h4>
                      <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {rec.description}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Benefício: {rec.benefit}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => applyRecommendation(rec.id)}
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default {
  ApplicationHealthMonitor,
  useHealthMonitor,
  HealthDashboard
}; 