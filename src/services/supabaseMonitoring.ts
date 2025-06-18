// Serviço de Monitoramento Integrado com Supabase
// FASE 3/4: Conecta monitoramento local com banco de dados

import { getSupabaseClient } from '@/lib/supabase-config';
import { config } from '@/config/environment';
import { safeGetEnv } from '@/utils/env';

// Proper type definitions
interface PerformanceMetric {
  user_id?: string | null;
  session_id: string;
  metric_name: 'fcp' | 'lcp' | 'fid' | 'cls' | 'ttfb' | 'tti';
  metric_value: number;
  metric_unit?: string;
  page_url?: string;
  user_agent?: string;
  device_type?: string;
  metadata?: Record<string, unknown>;
  environment?: string;
}

interface ErrorLog {
  user_id?: string | null;
  session_id: string;
  message: string;
  stack_trace?: string;
  error_type?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  page_url?: string;
  user_agent?: string;
  file_name?: string;
  line_number?: number;
  column_number?: number;
  environment?: string;
  version?: string;
  context?: Record<string, unknown>;
}

interface AnalyticsEvent {
  user_id?: string | null;
  session_id: string;
  event_name: string;
  event_category: string;
  event_action?: string;
  event_label?: string;
  event_value?: number;
  page_url?: string;
  page_title?: string;
  referrer?: string;
  user_agent?: string;
  device_type?: string;
  browser_name?: string;
  os_name?: string;
  properties?: Record<string, unknown>;
  environment?: string;
  version?: string;
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

// Type for performance entries
interface TypedPerformanceEntry extends PerformanceEntry {
  processingStart?: number;
  hadRecentInput?: boolean;
  value?: number;
}

interface QueueItem {
  type: 'metric' | 'error' | 'analytics';
  data: PerformanceMetric | ErrorLog | AnalyticsEvent;
}

class SupabaseMonitoringService {
  private sessionId: string;
  private userId: string | null = null;
  private isEnabled: boolean;
  private queue: QueueItem[] = [];
  private flushTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isEnabled = safeGetEnv('NODE_ENV', 'development') === 'production';
    this.setupUserTracking();
    this.setupWebVitals();
    this.setupErrorTracking();
    
    if (this.isEnabled) {
      void this.startBatchFlush();
      console.log('📊 Supabase Monitoring enabled');
    } else {
      console.log('📊 Supabase Monitoring disabled (development mode)');
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private async setupUserTracking(): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      this.userId = user?.id ?? null;
      
      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        this.userId = session?.user?.id ?? null;
      });
    } catch (error) {
      console.warn('Failed to setup user tracking:', error);
    }
  }

  private setupWebVitals(): void {
    if (!('PerformanceObserver' in window)) return;

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
          const typedEntry = entry as TypedPerformanceEntry;
          const fidValue = (typedEntry.processingStart ?? 0) - entry.startTime;
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
          const typedEntry = entry as TypedPerformanceEntry;
          if (!typedEntry.hadRecentInput) {
            clsValue += typedEntry.value ?? 0;
          }
        }
        
        if (clsValue > 0) {
          void this.recordWebVital({
            name: 'cls',
            value: clsValue,
            rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor',
            delta: clsValue,
            id: this.generateId()
          });
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Navigation Timing para FCP e TTI
      window.addEventListener('load', () => {
        const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navTiming?.domContentLoadedEventEnd) {
          // First Contentful Paint (aproximação)
          const fcpValue = navTiming.domContentLoadedEventEnd - navTiming.startTime;
          void this.recordWebVital({
            name: 'fcp',
            value: fcpValue,
            rating: fcpValue < 1800 ? 'good' : fcpValue < 3000 ? 'needs-improvement' : 'poor',
            delta: fcpValue,
            id: this.generateId()
          });

          // Time to Interactive (aproximação)
          const ttiValue = navTiming.loadEventEnd - navTiming.startTime;
          void this.recordWebVital({
            name: 'tti',
            value: ttiValue,
            rating: ttiValue < 3800 ? 'good' : ttiValue < 7300 ? 'needs-improvement' : 'poor',
            delta: ttiValue,
            id: this.generateId()
          });
        }
      });

    } catch (error) {
      console.warn('Failed to setup Web Vitals:', error);
    }
  }

  private setupErrorTracking(): void {
    window.addEventListener('error', (event) => {
      void this.recordError({
        message: event.message,
        stack: event.error?.stack as string,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        severity: 'high',
        context: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        }
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      void this.recordError({
        message: `Unhandled Promise Rejection: ${String(event.reason)}`,
        stack: (event.reason as Error)?.stack,
        severity: 'critical',
        context: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        }
      });
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private async recordWebVital(vital: WebVitalMetric): Promise<void> {
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
        delta: vital.delta,
        id: vital.id
      },
      environment: safeGetEnv('NODE_ENV', 'development')
    };

    this.queue.push({ type: 'metric', data: metric });
    this.scheduleFlush();
  }

  async recordError(error: ErrorData): Promise<void> {
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
      environment: safeGetEnv('NODE_ENV', 'development'),
      version: config.version ?? '1.0.0',
      context: error.context
    };

    this.queue.push({ type: 'error', data: errorLog });
    this.scheduleFlush();
  }

  async recordAnalytics(analytics: AnalyticsData): Promise<void> {
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
      properties: analytics.properties,
      environment: safeGetEnv('NODE_ENV', 'development'),
      version: config.version ?? '1.0.0'
    };

    this.queue.push({ type: 'analytics', data: event });
    this.scheduleFlush();
  }

  private getDeviceType(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
      return 'mobile';
    }
    if (/tablet|ipad/i.test(userAgent)) {
      return 'tablet';
    }
    return 'desktop';
  }

  private getBrowserName(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome')) return 'chrome';
    if (userAgent.includes('firefox')) return 'firefox';
    if (userAgent.includes('safari')) return 'safari';
    if (userAgent.includes('edge')) return 'edge';
    return 'unknown';
  }

  private getOSName(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('windows')) return 'windows';
    if (userAgent.includes('mac')) return 'macos';
    if (userAgent.includes('linux')) return 'linux';
    if (userAgent.includes('android')) return 'android';
    if (userAgent.includes('ios')) return 'ios';
    return 'unknown';
  }

  private scheduleFlush(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }
    this.flushTimeout = setTimeout(() => {
      void this.flush();
    }, 5000); // Flush after 5 seconds
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0 || !this.isEnabled) return;

    try {
      const metrics: PerformanceMetric[] = [];
      const errors: ErrorLog[] = [];
      const analytics: AnalyticsEvent[] = [];

      for (const item of this.queue) {
        switch (item.type) {
          case 'metric':
            metrics.push(item.data as PerformanceMetric);
            break;
          case 'error':
            errors.push(item.data as ErrorLog);
            break;
          case 'analytics':
            analytics.push(item.data as AnalyticsEvent);
            break;
        }
      }

      // Parallel batch inserts for better performance
      const promises: Promise<void>[] = [];
      
      if (metrics.length > 0) {
        promises.push(this.insertPerformanceMetrics(metrics));
      }
      if (errors.length > 0) {
        promises.push(this.insertErrorLogs(errors));
      }
      if (analytics.length > 0) {
        promises.push(this.insertAnalyticsEvents(analytics));
      }

      await Promise.all(promises);
      
      // Clear queue after successful flush
      this.queue = [];
      
    } catch (error) {
      console.warn('Failed to flush monitoring data:', error);
      // Keep queue for retry
    }
  }

  // Public API methods
  async trackPageView(page: string): Promise<void> {
    await this.recordAnalytics({
      event_name: 'page_view',
      event_category: 'navigation',
      event_action: 'view',
      event_label: page,
      properties: {
        page_path: page,
        referrer: document.referrer
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
      event_name: 'performance_metric',
      event_category: 'performance',
      event_action: operation,
      event_label: component,
      event_value: duration,
      properties: {
        component,
        operation,
        duration: duration.toString(),
        performance_score: duration < 100 ? 'good' : duration < 300 ? 'fair' : 'poor'
      }
    });
  }

  getSessionMetrics(): {
    sessionId: string;
    userId: string | null;
    queueSize: number;
    isEnabled: boolean;
  } {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      queueSize: this.queue.length,
      isEnabled: this.isEnabled
    };
  }

  destroy(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }
    void this.flush(); // Final flush
  }

  // Private batch insert methods
  private async startBatchFlush(): Promise<void> {
    // Start periodic flushing every 30 seconds
    const interval = setInterval(() => {
      void this.flush();
    }, 30000);

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      clearInterval(interval);
      void this.flush();
    });
  }

  private async insertPerformanceMetrics(metrics: PerformanceMetric[]): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        console.warn('Supabase client not available');
        return;
      }

      const { error } = await supabase
        .from('performance_metrics')
        .insert(metrics);

      if (error) {
        console.warn('Failed to insert performance metrics:', error);
      }
    } catch (error) {
      console.warn('Error inserting performance metrics:', error);
    }
  }

  private async insertErrorLogs(errors: ErrorLog[]): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        console.warn('Supabase client not available');
        return;
      }

      const { error } = await supabase
        .from('error_logs')
        .insert(errors);

      if (error) {
        console.warn('Failed to insert error logs:', error);
      }
    } catch (error) {
      console.warn('Error inserting error logs:', error);
    }
  }

  private async insertAnalyticsEvents(events: AnalyticsEvent[]): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        console.warn('Supabase client not available');
        return;
      }

      const { error } = await supabase
        .from('analytics_events')
        .insert(events);

      if (error) {
        console.warn('Failed to insert analytics events:', error);
      }
    } catch (error) {
      console.warn('Error inserting analytics events:', error);
    }
  }
}

// Export singleton instance
export const supabaseMonitoring = new SupabaseMonitoringService();

// Export for use in components
export { SupabaseMonitoringService };
export type { WebVitalMetric, ErrorData, AnalyticsData }; 