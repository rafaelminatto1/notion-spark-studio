// Serviço de Monitoramento Integrado com Supabase
// FASE 3/4: Conecta monitoramento local com banco de dados

import { getSupabaseClient } from '@/lib/supabase-config';
import { safeGetEnv } from '@/utils/env';

// Types simplificados para quando as tabelas não existem
interface PerformanceMetric {
  metric_name: string;
  metric_value: number;
  timestamp: string;
  user_id?: string;
  session_id: string;
  context?: Record<string, unknown>;
}

interface ErrorLog {
  error_message: string;
  error_stack?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  user_id?: string;
  session_id: string;
  context?: Record<string, unknown>;
}

interface AnalyticsEvent {
  event_name: string;
  event_category: string;
  event_action?: string;
  event_label?: string;
  event_value?: number;
  timestamp: string;
  user_id?: string;
  session_id: string;
  properties?: Record<string, unknown>;
}

interface WebVitalMetric {
  name: 'fcp' | 'lcp' | 'fid' | 'cls' | 'ttfb' | 'tti';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

interface ErrorData {
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, unknown>;
}

interface AnalyticsData {
  event_name: string;
  event_category: string;
  event_action?: string;
  event_label?: string;
  event_value?: number;
  properties?: Record<string, unknown>;
}

class SupabaseMonitoringService {
  private sessionId: string;
  private userId: string | null = null;
  private isEnabled: boolean;
  private queue: Array<{ type: 'metric' | 'error' | 'analytics'; data: any }> = [];
  private flushTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isEnabled = safeGetEnv('NODE_ENV', 'development') === 'production';
    
    // Só configurar monitoramento no cliente
    if (typeof window !== 'undefined') {
      this.setupUserTracking();
      this.setupWebVitals();
      this.setupErrorTracking();
      
      if (this.isEnabled) {
        console.log('🔍 Supabase Monitoring enabled');
      } else {
        console.log('🔍 Supabase Monitoring disabled (development mode)');
      }
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async setupUserTracking(): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        console.warn('[Monitoring] Supabase não disponível');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      this.userId = user?.id || null;
      
      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        this.userId = session?.user?.id || null;
      });
    } catch (error) {
      console.warn('Failed to setup user tracking:', error);
    }
  }

  private setupWebVitals(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordWebVital({
            name: 'lcp',
            value: entry.startTime,
            rating: entry.startTime < 2500 ? 'good' : entry.startTime < 4000 ? 'needs-improvement' : 'poor',
            delta: entry.startTime,
            id: this.generateId()
          });
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidValue = (entry as any).processingStart - entry.startTime;
          this.recordWebVital({
            name: 'fid',
            value: fidValue,
            rating: fidValue < 100 ? 'good' : fidValue < 300 ? 'needs-improvement' : 'poor',
            delta: fidValue,
            id: this.generateId()
          });
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        
        if (clsValue > 0) {
          this.recordWebVital({
            name: 'cls',
            value: clsValue,
            rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor',
            delta: clsValue,
            id: this.generateId()
          });
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // First Contentful Paint
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const navEntry = entry as PerformanceNavigationTiming;
          
          // First Contentful Paint (via Performance API)
          if ('domContentLoadedEventEnd' in navEntry) {
            const fcpValue = navEntry.domContentLoadedEventEnd - navEntry.navigationStart;
            this.recordWebVital({
              name: 'fcp',
              value: fcpValue,
              rating: fcpValue < 1800 ? 'good' : fcpValue < 3000 ? 'needs-improvement' : 'poor',
              delta: fcpValue,
              id: this.generateId()
            });
          }

          // Time to Interactive (approximation)
          const ttiValue = navEntry.loadEventEnd - navEntry.navigationStart;
          this.recordWebVital({
            name: 'tti',
            value: ttiValue,
            rating: ttiValue < 3800 ? 'good' : ttiValue < 7300 ? 'needs-improvement' : 'poor',
            delta: ttiValue,
            id: this.generateId()
          });
        }
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });

    } catch (error) {
      console.warn('Failed to setup Web Vitals monitoring:', error);
    }
  }

  private setupErrorTracking(): void {
    if (typeof window === 'undefined') return;
    
    // Global error handler
    window.addEventListener('error', (event) => {
      this.recordError({
        message: event.message || 'Unknown error',
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        severity: 'high',
        context: {
          type: 'javascript_error',
          url: window.location.href,
          userAgent: navigator.userAgent
        }
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        severity: 'high',
        context: {
          type: 'unhandled_promise_rejection',
          reason: String(event.reason),
          url: window.location.href
        }
      });
    });
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private async recordWebVital(vital: WebVitalMetric): Promise<void> {
    if (!this.isEnabled) {
      console.debug('Web Vital recorded (dev):', vital);
      return;
    }

    const metric: PerformanceMetric = {
      user_id: this.userId,
      session_id: this.sessionId,
      metric_name: vital.name,
      metric_value: vital.value,
      metric_unit: 'ms',
      page_url: window.location.href,
      user_agent: navigator.userAgent,
      device_type: this.getDeviceType(),
      metadata: {
        rating: vital.rating,
        id: vital.id,
        delta: vital.delta
      },
      environment: config.NODE_ENV
    };

    this.queue.push({ type: 'metric', data: metric });
    this.scheduleFlush();
  }

  async recordError(error: ErrorData): Promise<void> {
    if (!this.isEnabled) {
      console.error('Error recorded (dev):', error);
      return;
    }

    const errorLog: ErrorLog = {
      user_id: this.userId,
      session_id: this.sessionId,
      message: error.message,
      stack_trace: error.stack,
      error_type: 'javascript',
      severity: error.severity,
      page_url: window.location.href,
      user_agent: navigator.userAgent,
      file_name: error.filename,
      line_number: error.lineno,
      column_number: error.colno,
      environment: config.NODE_ENV,
      version: config.APP_VERSION,
      context: error.context || {}
    };

    this.queue.push({ type: 'error', data: errorLog });
    this.scheduleFlush();

    // Send critical errors immediately
    if (error.severity === 'critical') {
      await this.flush();
    }
  }

  async recordAnalytics(analytics: AnalyticsData): Promise<void> {
    if (!this.isEnabled || !config.ENABLE_ANALYTICS) {
      console.debug('Analytics recorded (dev):', analytics);
      return;
    }

    const event: AnalyticsEvent = {
      user_id: this.userId,
      session_id: this.sessionId,
      event_name: analytics.event_name,
      event_category: analytics.event_category,
      event_action: analytics.event_action,
      event_label: analytics.event_label,
      event_value: analytics.event_value,
      page_url: window.location.href,
      page_title: document.title,
      referrer: document.referrer,
      user_agent: navigator.userAgent,
      device_type: this.getDeviceType(),
      browser_name: this.getBrowserName(),
      os_name: this.getOSName(),
      properties: analytics.properties || {},
      environment: config.NODE_ENV,
      version: config.APP_VERSION
    };

    this.queue.push({ type: 'analytics', data: event });
    this.scheduleFlush();
  }

  private getDeviceType(): string {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile';
    return 'desktop';
  }

  private getBrowserName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getOSName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private scheduleFlush(): void {
    if (this.flushTimeout) return;

    this.flushTimeout = setTimeout(() => {
      this.flush();
    }, 5000); // Flush every 5 seconds
  }

  private async flush(): Promise<void> {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    if (this.queue.length === 0) return;

    const toFlush = [...this.queue];
    this.queue = [];

    try {
      // Group by type for batch operations
      const metrics = toFlush.filter(item => item.type === 'metric').map(item => item.data);
      const errors = toFlush.filter(item => item.type === 'error').map(item => item.data);
      const analytics = toFlush.filter(item => item.type === 'analytics').map(item => item.data);

      // Batch insert performance metrics
      if (metrics.length > 0) {
        const { error: metricsError } = await supabase
          .from('performance_metrics')
          .insert(metrics);
        
        if (metricsError) {
          console.error('Failed to insert performance metrics:', metricsError);
        } else {
          console.debug(`✅ Inserted ${metrics.length} performance metrics`);
        }
      }

      // Batch insert error logs
      if (errors.length > 0) {
        const { error: errorsError } = await supabase
          .from('error_logs')
          .insert(errors);
        
        if (errorsError) {
          console.error('Failed to insert error logs:', errorsError);
        } else {
          console.debug(`✅ Inserted ${errors.length} error logs`);
        }
      }

      // Batch insert analytics events
      if (analytics.length > 0) {
        const { error: analyticsError } = await supabase
          .from('analytics_events')
          .insert(analytics);
        
        if (analyticsError) {
          console.error('Failed to insert analytics events:', analyticsError);
        } else {
          console.debug(`✅ Inserted ${analytics.length} analytics events`);
        }
      }

    } catch (error) {
      console.error('Failed to flush monitoring data:', error);
      // Re-queue the failed items
      this.queue.unshift(...toFlush);
    }
  }

  // Public methods for components
  async trackPageView(page: string): Promise<void> {
    await this.recordAnalytics({
      event_name: 'page_view',
      event_category: 'navigation',
      event_label: page,
      properties: {
        page_path: window.location.pathname,
        page_search: window.location.search
      }
    });
  }

  async trackUserAction(action: string, category: string, label?: string, value?: number): Promise<void> {
    await this.recordAnalytics({
      event_name: action,
      event_category: category,
      event_action: action,
      event_label: label,
      event_value: value
    });
  }

  async trackPerformance(component: string, operation: string, duration: number): Promise<void> {
    await this.recordAnalytics({
      event_name: 'performance',
      event_category: 'timing',
      event_action: `${component}_${operation}`,
      event_value: duration,
      properties: {
        component,
        operation,
        duration_ms: duration
      }
    });
  }

  // Get system health from database
  async getSystemHealth(): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_system_health_metrics');
      
      if (error) {
        console.error('Failed to get system health:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to get system health:', error);
      return null;
    }
  }

  // Cleanup on destroy
  destroy(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }
    
    // Final flush
    this.flush();
  }
}

// Singleton instance
export const supabaseMonitoring = new SupabaseMonitoringService();

// Export for use in components
export { SupabaseMonitoringService };
export type { WebVitalMetric, ErrorData, AnalyticsData }; 