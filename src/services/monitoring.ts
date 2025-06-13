// Sistema de Monitoramento Avançado - FASE 3: Produção & Deploy
// Monitora performance, erros, métricas de usuário e saúde do sistema

import { config, isProduction, logConfig } from '../config/environment';

export interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
  unit?: 'ms' | 'bytes' | 'count' | 'percent';
}

export interface ErrorData {
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  userAgent?: string;
  url?: string;
}

export interface PerformanceData {
  component: string;
  operation: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface UserAnalytics {
  event: string;
  properties?: Record<string, unknown>;
  userId?: string;
  timestamp: number;
}

class MonitoringService {
  private metrics: MetricData[] = [];
  private errors: ErrorData[] = [];
  private performance: PerformanceData[] = [];
  private analytics: UserAnalytics[] = [];
  private isInitialized = false;
  private flushInterval?: NodeJS.Timeout;

  constructor() {
    this.init();
  }

  private init(): void {
    if (this.isInitialized) return;

    // Configurar listeners de erro globais
    this.setupErrorHandlers();
    
    // Configurar monitoramento de performance
    this.setupPerformanceMonitoring();
    
    // Configurar flush automático em produção
    if (isProduction) {
      this.flushInterval = setInterval(() => {
        this.flush();
      }, 60000); // Flush a cada minuto
    }

    this.isInitialized = true;
    logConfig('info', 'Monitoring service initialized', { 
      environment: config.NODE_ENV,
      production: isProduction 
    });
  }

  private setupErrorHandlers(): void {
    // Errors não tratados
    window.addEventListener('error', (event) => {
      this.recordError({
        message: event.message,
        stack: event.error?.stack,
        severity: 'high',
        timestamp: Date.now(),
        url: event.filename,
        context: {
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Promise rejections não tratadas
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        severity: 'high',
        timestamp: Date.now(),
        context: {
          type: 'unhandledrejection',
          reason: event.reason,
        },
      });
    });
  }

  private setupPerformanceMonitoring(): void {
    // Observer para Web Vitals
    if ('PerformanceObserver' in window) {
      try {
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric({
              name: 'lcp',
              value: entry.startTime,
              timestamp: Date.now(),
              unit: 'ms',
              tags: { type: 'web_vital' },
            });
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric({
              name: 'fid',
              value: (entry as any).processingStart - entry.startTime,
              timestamp: Date.now(),
              unit: 'ms',
              tags: { type: 'web_vital' },
            });
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Layout shifts
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          if (clsValue > 0) {
            this.recordMetric({
              name: 'cls',
              value: clsValue,
              timestamp: Date.now(),
              unit: 'count',
              tags: { type: 'web_vital' },
            });
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

      } catch (error) {
        logConfig('warn', 'Performance monitoring setup failed', error);
      }
    }
  }

  // Métricas públicas
  recordMetric(metric: Omit<MetricData, 'timestamp'> & { timestamp?: number }): void {
    const data: MetricData = {
      ...metric,
      timestamp: metric.timestamp || Date.now(),
    };

    this.metrics.push(data);
    
    // Log em desenvolvimento
    if (!isProduction) {
      logConfig('debug', `Metric recorded: ${data.name}`, data);
    }

    // Limitar buffer
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }
  }

  recordError(error: Omit<ErrorData, 'timestamp'> & { timestamp?: number }): void {
    const data: ErrorData = {
      ...error,
      timestamp: error.timestamp || Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.errors.push(data);
    
    // Log sempre erros
    logConfig('error', `Error recorded: ${data.message}`, data);

    // Limitar buffer
    if (this.errors.length > 500) {
      this.errors = this.errors.slice(-250);
    }

    // Alertas críticos em produção
    if (isProduction && data.severity === 'critical') {
      this.sendCriticalAlert(data);
    }
  }

  recordPerformance(perf: Omit<PerformanceData, 'timestamp'> & { timestamp?: number }): void {
    const data: PerformanceData = {
      ...perf,
      timestamp: perf.timestamp || Date.now(),
    };

    this.performance.push(data);
    
    if (!isProduction) {
      logConfig('debug', `Performance recorded: ${data.component}.${data.operation}`, data);
    }

    // Limitar buffer
    if (this.performance.length > 1000) {
      this.performance = this.performance.slice(-500);
    }
  }

  recordAnalytics(analytics: Omit<UserAnalytics, 'timestamp'> & { timestamp?: number }): void {
    if (!config.ENABLE_ANALYTICS) return;

    const data: UserAnalytics = {
      ...analytics,
      timestamp: analytics.timestamp || Date.now(),
    };

    this.analytics.push(data);
    
    if (!isProduction) {
      logConfig('debug', `Analytics recorded: ${data.event}`, data);
    }

    // Limitar buffer
    if (this.analytics.length > 1000) {
      this.analytics = this.analytics.slice(-500);
    }
  }

  // Utilitários de timing
  startTimer(name: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name: `timer_${name}`,
        value: duration,
        unit: 'ms',
        tags: { type: 'timer' },
      });
    };
  }

  // Decorator para monitorar performance de funções
  withPerformanceMonitoring<T extends (...args: any[]) => any>(
    component: string,
    operation: string,
    fn: T
  ): T {
    return ((...args: Parameters<T>) => {
      const start = performance.now();
      
      try {
        const result = fn(...args);
        
        // Handle promises
        if (result && typeof result.then === 'function') {
          return result
            .then((value: any) => {
              this.recordPerformance({
                component,
                operation,
                duration: performance.now() - start,
                metadata: { success: true, argsCount: args.length },
              });
              return value;
            })
            .catch((error: any) => {
              this.recordPerformance({
                component,
                operation,
                duration: performance.now() - start,
                metadata: { success: false, error: error.message, argsCount: args.length },
              });
              this.recordError({
                message: `${component}.${operation} failed: ${error.message}`,
                stack: error.stack,
                severity: 'medium',
                context: { component, operation, args: args.length },
              });
              throw error;
            });
        }
        
        // Synchronous result
        this.recordPerformance({
          component,
          operation,
          duration: performance.now() - start,
          metadata: { success: true, argsCount: args.length },
        });
        
        return result;
      } catch (error: any) {
        this.recordPerformance({
          component,
          operation,
          duration: performance.now() - start,
          metadata: { success: false, error: error.message, argsCount: args.length },
        });
        
        this.recordError({
          message: `${component}.${operation} failed: ${error.message}`,
          stack: error.stack,
          severity: 'medium',
          context: { component, operation, args: args.length },
        });
        
        throw error;
      }
    }) as T;
  }

  // Sistema de alertas críticos
  private async sendCriticalAlert(error: ErrorData): Promise<void> {
    try {
      // Em produção, enviar para serviço de alertas
      if (config.API_BASE_URL) {
        await fetch(`${config.API_BASE_URL}/alerts/critical`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...error,
            environment: config.NODE_ENV,
            version: config.APP_VERSION,
            url: window.location.href,
          }),
        });
      }
    } catch (alertError) {
      logConfig('error', 'Failed to send critical alert', alertError);
    }
  }

  // Flush dados para backend
  async flush(): Promise<void> {
    if (!isProduction || !config.API_BASE_URL) return;

    const data = {
      metrics: [...this.metrics],
      errors: [...this.errors],
      performance: [...this.performance],
      analytics: [...this.analytics],
      metadata: {
        timestamp: Date.now(),
        environment: config.NODE_ENV,
        version: config.APP_VERSION,
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
    };

    try {
      await fetch(`${config.API_BASE_URL}/monitoring/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      // Limpar buffers após sucesso
      this.metrics = [];
      this.errors = [];
      this.performance = [];
      this.analytics = [];

      logConfig('debug', 'Monitoring data flushed successfully');
    } catch (error) {
      logConfig('error', 'Failed to flush monitoring data', error);
    }
  }

  // Relatórios
  getSystemHealth(): {
    errorRate: number;
    avgPerformance: number;
    criticalErrors: number;
    memoryUsage?: number;
  } {
    const now = Date.now();
    const oneHourAgo = now - 3600000;

    const recentErrors = this.errors.filter(e => e.timestamp > oneHourAgo);
    const recentPerf = this.performance.filter(p => p.timestamp > oneHourAgo);
    const criticalErrors = recentErrors.filter(e => e.severity === 'critical').length;

    return {
      errorRate: recentErrors.length,
      avgPerformance: recentPerf.length > 0 
        ? recentPerf.reduce((sum, p) => sum + p.duration, 0) / recentPerf.length 
        : 0,
      criticalErrors,
      memoryUsage: (performance as any).memory?.usedJSHeapSize,
    };
  }

  // Cleanup
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    // Flush final
    if (isProduction) {
      this.flush();
    }
    
    this.isInitialized = false;
  }
}

// Singleton instance
export const monitoring = new MonitoringService();

// Helper hooks para uso em componentes
export function useMonitoring() {
  return {
    recordMetric: monitoring.recordMetric.bind(monitoring),
    recordError: monitoring.recordError.bind(monitoring),
    recordPerformance: monitoring.recordPerformance.bind(monitoring),
    recordAnalytics: monitoring.recordAnalytics.bind(monitoring),
    startTimer: monitoring.startTimer.bind(monitoring),
    withPerformanceMonitoring: monitoring.withPerformanceMonitoring.bind(monitoring),
    getSystemHealth: monitoring.getSystemHealth.bind(monitoring),
  };
}

export default monitoring; 