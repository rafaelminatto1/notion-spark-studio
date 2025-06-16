import { useEffect, useCallback, useRef } from 'react';
import { useSSRSafeValue } from './useSSRSafe';

interface AnalyticsEvent {
  type: string;
  category: 'navigation' | 'interaction' | 'performance' | 'error' | 'feature';
  action: string;
  label?: string;
  value?: number;
  userId?: string;
  sessionId: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface PerformanceMetrics {
  pageLoadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
}

interface UserBehaviorMetrics {
  sessionDuration: number;
  pageViews: number;
  clicksPerSession: number;
  scrollDepth: number;
  bounceRate: number;
  conversionEvents: number;
}

interface FeatureUsageMetrics {
  featureName: string;
  usageCount: number;
  lastUsed: number;
  averageTimeSpent: number;
  successRate: number;
  errorRate: number;
}

class ProductionAnalytics {
  private static instance: ProductionAnalytics;
  private eventQueue: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId?: string;
  private sessionStartTime: number;
  private isProductionMode: boolean;
  private performanceObserver?: PerformanceObserver;
  private intersectionObserver?: IntersectionObserver;
  private featureUsage: Map<string, FeatureUsageMetrics> = new Map();

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.isProductionMode = process.env.NODE_ENV === 'production';
    
    if (typeof window !== 'undefined') {
      this.initializeObservers();
      this.trackPageLoad();
      this.trackUserInteractions();
      this.trackVisibilityChanges();
    }
  }

  static getInstance(): ProductionAnalytics {
    if (!ProductionAnalytics.instance) {
      ProductionAnalytics.instance = new ProductionAnalytics();
    }
    return ProductionAnalytics.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeObservers() {
    // Performance Observer para métricas Core Web Vitals
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.trackPerformanceMetric(entry);
        });
      });

      try {
        this.performanceObserver.observe({ entryTypes: ['navigation', 'paint', 'layout-shift', 'first-input'] });
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }
    }

    // Intersection Observer para scroll depth
    if ('IntersectionObserver' in window) {
      const scrollMarkers = [25, 50, 75, 90, 100];
      const observed = new Set<number>();

      this.intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const scrollPercent = parseInt(entry.target.getAttribute('data-scroll-marker') || '0');
            if (!observed.has(scrollPercent)) {
              observed.add(scrollPercent);
              this.trackEvent({
                type: 'scroll_depth',
                category: 'interaction',
                action: 'scroll',
                label: `${scrollPercent}%`,
                value: scrollPercent
              });
            }
          }
        });
      });

      // Criar marcadores de scroll
      scrollMarkers.forEach((percent) => {
        const marker = document.createElement('div');
        marker.setAttribute('data-scroll-marker', percent.toString());
        marker.style.position = 'absolute';
        marker.style.top = `${percent}%`;
        marker.style.height = '1px';
        marker.style.width = '1px';
        marker.style.opacity = '0';
        marker.style.pointerEvents = 'none';
        document.body.appendChild(marker);
        this.intersectionObserver?.observe(marker);
      });
    }
  }

  private trackPageLoad() {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      const metrics: PerformanceMetrics = {
        pageLoadTime: navigation.loadEventEnd - navigation.navigationStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        cumulativeLayoutShift: 0,
        firstInputDelay: 0,
        timeToInteractive: 0
      };

      // FCP
      const fcpEntry = performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) metrics.firstContentfulPaint = fcpEntry.startTime;

      this.trackEvent({
        type: 'page_performance',
        category: 'performance',
        action: 'page_load',
        metadata: metrics
      });
    });
  }

  private trackUserInteractions() {
    if (typeof window === 'undefined') return;

    // Cliques
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const elementType = target.tagName.toLowerCase();
      const elementId = target.id;
      const elementClass = target.className;
      
      this.trackEvent({
        type: 'click',
        category: 'interaction',
        action: 'click',
        label: elementType,
        metadata: {
          elementId,
          elementClass,
          x: event.clientX,
          y: event.clientY
        }
      });
    });

    // Teclas pressionadas
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === 'Space' || event.key === 'Tab') {
        this.trackEvent({
          type: 'keyboard',
          category: 'interaction',
          action: 'keydown',
          label: event.key
        });
      }
    });

    // Foco em elementos
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        this.trackEvent({
          type: 'focus',
          category: 'interaction',
          action: 'focus',
          label: target.tagName.toLowerCase()
        });
      }
    });
  }

  private trackVisibilityChanges() {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      this.trackEvent({
        type: 'visibility',
        category: 'interaction',
        action: document.hidden ? 'page_hidden' : 'page_visible'
      });
    });

    // Track session duration on page unload
    window.addEventListener('beforeunload', () => {
      const sessionDuration = Date.now() - this.sessionStartTime;
      this.trackEvent({
        type: 'session_end',
        category: 'navigation',
        action: 'session_duration',
        value: sessionDuration
      });
      this.flushEvents();
    });
  }

  private trackPerformanceMetric(entry: PerformanceEntry) {
    if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
      this.trackEvent({
        type: 'layout_shift',
        category: 'performance',
        action: 'cls',
        value: (entry as any).value
      });
    }

    if (entry.entryType === 'first-input') {
      this.trackEvent({
        type: 'first_input_delay',
        category: 'performance',
        action: 'fid',
        value: (entry as any).processingStart - entry.startTime
      });
    }

    if (entry.entryType === 'largest-contentful-paint') {
      this.trackEvent({
        type: 'largest_contentful_paint',
        category: 'performance',
        action: 'lcp',
        value: entry.startTime
      });
    }
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  trackEvent(event: Omit<AnalyticsEvent, 'sessionId' | 'timestamp' | 'userId'>) {
    const analyticsEvent: AnalyticsEvent = {
      ...event,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: Date.now()
    };

    this.eventQueue.push(analyticsEvent);

    // Auto-flush em produção a cada 10 eventos ou 30 segundos
    if (this.isProductionMode && (this.eventQueue.length >= 10)) {
      this.flushEvents();
    }
  }

  trackFeatureUsage(featureName: string, timeSpent?: number, success: boolean = true) {
    const existing = this.featureUsage.get(featureName) || {
      featureName,
      usageCount: 0,
      lastUsed: 0,
      averageTimeSpent: 0,
      successRate: 100,
      errorRate: 0
    };

    existing.usageCount++;
    existing.lastUsed = Date.now();
    
    if (timeSpent) {
      existing.averageTimeSpent = (existing.averageTimeSpent + timeSpent) / 2;
    }

    // Calculate success/error rates
    const totalAttempts = existing.usageCount;
    const successCount = success ? 1 : 0;
    existing.successRate = ((existing.successRate * (totalAttempts - 1)) + (successCount * 100)) / totalAttempts;
    existing.errorRate = 100 - existing.successRate;

    this.featureUsage.set(featureName, existing);

    this.trackEvent({
      type: 'feature_usage',
      category: 'feature',
      action: 'use',
      label: featureName,
      value: timeSpent,
      metadata: { success }
    });
  }

  trackError(error: Error, context?: string) {
    this.trackEvent({
      type: 'error',
      category: 'error',
      action: 'javascript_error',
      label: error.name,
      metadata: {
        message: error.message,
        stack: error.stack,
        context
      }
    });
  }

  trackConversion(eventName: string, value?: number) {
    this.trackEvent({
      type: 'conversion',
      category: 'feature',
      action: 'convert',
      label: eventName,
      value
    });
  }

  private async flushEvents() {
    if (!this.isProductionMode || this.eventQueue.length === 0) {
      this.eventQueue = []; // Clear queue in dev mode
      return;
    }

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Send to analytics service
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events })
      });
    } catch (error) {
      console.warn('Failed to send analytics events:', error);
      // Re-add events to queue for retry
      this.eventQueue.unshift(...events);
    }
  }

  getSessionMetrics(): UserBehaviorMetrics {
    const sessionDuration = Date.now() - this.sessionStartTime;
    const clickEvents = this.eventQueue.filter(e => e.type === 'click').length;
    const pageViews = this.eventQueue.filter(e => e.type === 'page_view').length;
    const scrollEvents = this.eventQueue.filter(e => e.type === 'scroll_depth');
    const maxScrollDepth = Math.max(...scrollEvents.map(e => e.value || 0), 0);
    const conversionEvents = this.eventQueue.filter(e => e.type === 'conversion').length;

    return {
      sessionDuration,
      pageViews: Math.max(pageViews, 1),
      clicksPerSession: clickEvents,
      scrollDepth: maxScrollDepth,
      bounceRate: pageViews <= 1 && sessionDuration < 30000 ? 100 : 0,
      conversionEvents
    };
  }

  getFeatureUsageMetrics(): FeatureUsageMetrics[] {
    return Array.from(this.featureUsage.values());
  }

  // Public interface
  pageView(pageName: string, additionalData?: Record<string, unknown>) {
    this.trackEvent({
      type: 'page_view',
      category: 'navigation',
      action: 'view',
      label: pageName,
      metadata: additionalData
    });
  }

  destroy() {
    this.performanceObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.flushEvents();
  }
}

export function useProductionAnalytics() {
  const analyticsRef = useRef<ProductionAnalytics>();
  const isClient = useSSRSafeValue(true, false);

  useEffect(() => {
    if (!isClient) return;
    
    analyticsRef.current = ProductionAnalytics.getInstance();
    
    return () => {
      analyticsRef.current?.destroy();
    };
  }, [isClient]);

  const trackEvent = useCallback((event: Omit<AnalyticsEvent, 'sessionId' | 'timestamp' | 'userId'>) => {
    analyticsRef.current?.trackEvent(event);
  }, []);

  const trackFeatureUsage = useCallback((featureName: string, timeSpent?: number, success?: boolean) => {
    analyticsRef.current?.trackFeatureUsage(featureName, timeSpent, success);
  }, []);

  const trackError = useCallback((error: Error, context?: string) => {
    analyticsRef.current?.trackError(error, context);
  }, []);

  const trackConversion = useCallback((eventName: string, value?: number) => {
    analyticsRef.current?.trackConversion(eventName, value);
  }, []);

  const pageView = useCallback((pageName: string, additionalData?: Record<string, unknown>) => {
    analyticsRef.current?.pageView(pageName, additionalData);
  }, []);

  const setUserId = useCallback((userId: string) => {
    analyticsRef.current?.setUserId(userId);
  }, []);

  const getSessionMetrics = useCallback(() => {
    return analyticsRef.current?.getSessionMetrics();
  }, []);

  const getFeatureUsageMetrics = useCallback(() => {
    return analyticsRef.current?.getFeatureUsageMetrics() || [];
  }, []);

  return {
    trackEvent,
    trackFeatureUsage,
    trackError,
    trackConversion,
    pageView,
    setUserId,
    getSessionMetrics,
    getFeatureUsageMetrics,
    isEnabled: isClient && process.env.NODE_ENV === 'production'
  };
} 