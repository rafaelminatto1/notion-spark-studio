// Advanced APM (Application Performance Monitoring) Service
// Production-ready monitoring with real-time analytics and alerting

export interface APMMetrics {
  // Core Web Vitals
  vitals: {
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
    fcp: number; // First Contentful Paint
    ttfb: number; // Time to First Byte
  };
  
  // Performance metrics
  performance: {
    loadTime: number;
    renderTime: number;
    apiResponseTime: number;
    memoryUsage: number;
    cpuUsage: number;
    bundleSize: number;
  };
  
  // User interaction metrics
  interactions: {
    clickLatency: number;
    scrollPerformance: number;
    formResponseTime: number;
    navigationTime: number;
  };
  
  // Error tracking
  errors: {
    jsErrors: ErrorEntry[];
    networkErrors: NetworkError[];
    renderErrors: RenderError[];
    performanceErrors: PerformanceError[];
  };
  
  // Business metrics
  business: {
    userEngagement: number;
    featureUsage: Record<string, number>;
    conversionMetrics: Record<string, number>;
    retentionScore: number;
  };
}

export interface ErrorEntry {
  message: string;
  stack: string;
  filename: string;
  lineno: number;
  colno: number;
  timestamp: number;
  userId?: string;
  sessionId: string;
  buildVersion: string;
  userAgent: string;
  url: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
}

export interface NetworkError {
  url: string;
  method: string;
  status: number;
  responseTime: number;
  timestamp: number;
  errorType: 'timeout' | 'network' | 'server' | 'client';
  retryCount: number;
}

export interface RenderError {
  component: string;
  error: string;
  props: Record<string, unknown>;
  timestamp: number;
  recoverable: boolean;
}

export interface PerformanceError {
  type: 'memory-leak' | 'slow-render' | 'large-bundle' | 'poor-lcp' | 'high-cls';
  threshold: number;
  actualValue: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  timestamp: number;
}

export interface APMAlert {
  id: string;
  type: 'performance' | 'error' | 'business' | 'security';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  details: Record<string, unknown>;
  timestamp: number;
  resolved: boolean;
  actions: AlertAction[];
}

export interface AlertAction {
  type: 'notify' | 'scale' | 'restart' | 'rollback';
  target: string;
  parameters: Record<string, unknown>;
}

export class APMMonitoringService {
  private metrics: APMMetrics;
  private alerts: APMAlert[] = [];
  private thresholds: Record<string, number>;
  private sessionId: string;
  private userId?: string;
  private buildVersion: string;
  private observers: Map<string, PerformanceObserver> = new Map();
  private isMonitoring = false;
  private reportingInterval?: NodeJS.Timeout;
  private errorBuffer: ErrorEntry[] = [];
  private performanceBuffer: PerformanceEntry[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.buildVersion = process.env.BUILD_ID || 'unknown';
    
    this.thresholds = {
      // Core Web Vitals thresholds (Google standards)
      lcp: 2500, // ms
      fid: 100,  // ms
      cls: 0.1,  // score
      fcp: 1800, // ms
      ttfb: 600, // ms
      
      // Performance thresholds
      loadTime: 3000,      // ms
      renderTime: 16,      // ms (60fps)
      apiResponseTime: 500, // ms
      memoryUsage: 0.8,    // 80% of available
      cpuUsage: 0.7,       // 70%
      bundleSize: 500000,  // 500KB
      
      // Interaction thresholds
      clickLatency: 100,     // ms
      scrollPerformance: 16, // ms per frame
      formResponseTime: 200, // ms
      navigationTime: 1000,  // ms
      
      // Business thresholds
      userEngagement: 0.3,  // 30% minimum
      retentionScore: 0.6,  // 60% minimum
    };

    this.initializeMetrics();
    this.setupErrorHandling();
    this.setupPerformanceObservers();
  }

  private initializeMetrics(): void {
    this.metrics = {
      vitals: {
        lcp: 0,
        fid: 0,
        cls: 0,
        fcp: 0,
        ttfb: 0,
      },
      performance: {
        loadTime: 0,
        renderTime: 0,
        apiResponseTime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        bundleSize: 0,
      },
      interactions: {
        clickLatency: 0,
        scrollPerformance: 0,
        formResponseTime: 0,
        navigationTime: 0,
      },
      errors: {
        jsErrors: [],
        networkErrors: [],
        renderErrors: [],
        performanceErrors: [],
      },
      business: {
        userEngagement: 0,
        featureUsage: {},
        conversionMetrics: {},
        retentionScore: 0,
      },
    };
  }

  // Start comprehensive monitoring
  public startMonitoring(userId?: string): void {
    console.log('🔍 Iniciando APM Monitoring Service...');
    
    this.userId = userId;
    this.isMonitoring = true;
    
    // Start Core Web Vitals monitoring
    this.monitorCoreWebVitals();
    
    // Start performance monitoring
    this.monitorPerformance();
    
    // Start interaction monitoring
    this.monitorInteractions();
    
    // Start business metrics monitoring
    this.monitorBusinessMetrics();
    
    // Start real-time reporting
    this.startRealTimeReporting();
    
    console.log('✅ APM Monitoring ativo - Sessão:', this.sessionId);
  }

  // Stop monitoring
  public stopMonitoring(): void {
    this.isMonitoring = false;
    
    // Clear observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    // Clear intervals
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
    }
    
    // Send final report
    this.sendReport();
    
    console.log('🛑 APM Monitoring parado');
  }

  // Monitor Core Web Vitals
  private monitorCoreWebVitals(): void {
    // LCP (Largest Contentful Paint)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry;
      this.metrics.vitals.lcp = lastEntry.startTime;
      this.checkThreshold('lcp', lastEntry.startTime);
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.set('lcp', lcpObserver);

    // FID (First Input Delay)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        this.metrics.vitals.fid = entry.processingStart - entry.startTime;
        this.checkThreshold('fid', this.metrics.vitals.fid);
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
    this.observers.set('fid', fidObserver);

    // CLS (Cumulative Layout Shift)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          this.metrics.vitals.cls = clsValue;
          this.checkThreshold('cls', clsValue);
        }
      });
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
    this.observers.set('cls', clsObserver);

    // FCP (First Contentful Paint)
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.metrics.vitals.fcp = fcpEntry.startTime;
        this.checkThreshold('fcp', fcpEntry.startTime);
      }
    });
    fcpObserver.observe({ entryTypes: ['paint'] });
    this.observers.set('fcp', fcpObserver);

    // TTFB (Time to First Byte)
    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navigationEntries.length > 0) {
      this.metrics.vitals.ttfb = navigationEntries[0].responseStart;
      this.checkThreshold('ttfb', this.metrics.vitals.ttfb);
    }
  }

  // Monitor general performance
  private monitorPerformance(): void {
    // Monitor memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.performance.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      this.checkThreshold('memoryUsage', this.metrics.performance.memoryUsage);
    }

    // Monitor render performance
    let frameCount = 0;
    let lastTimestamp = performance.now();
    
    const measureRenderPerformance = (timestamp: number) => {
      if (this.isMonitoring) {
        frameCount++;
        const elapsed = timestamp - lastTimestamp;
        
        if (frameCount % 60 === 0) { // Check every 60 frames
          const avgFrameTime = elapsed / 60;
          this.metrics.performance.renderTime = avgFrameTime;
          this.checkThreshold('renderTime', avgFrameTime);
          frameCount = 0;
          lastTimestamp = timestamp;
        }
        
        requestAnimationFrame(measureRenderPerformance);
      }
    };
    
    requestAnimationFrame(measureRenderPerformance);

    // Monitor API response times
    this.interceptNetworkRequests();

    // Monitor bundle size
    const resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      let totalSize = 0;
      
      entries.forEach((entry: any) => {
        if (entry.transferSize) {
          totalSize += entry.transferSize;
        }
      });
      
      this.metrics.performance.bundleSize = totalSize;
      this.checkThreshold('bundleSize', totalSize);
    });
    
    try {
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', resourceObserver);
    } catch (e) {
      console.warn('Resource observer not supported');
    }
  }

  // Monitor user interactions
  private monitorInteractions(): void {
    // Click latency monitoring
    document.addEventListener('click', (event) => {
      const startTime = performance.now();
      
      requestAnimationFrame(() => {
        const latency = performance.now() - startTime;
        this.metrics.interactions.clickLatency = latency;
        this.checkThreshold('clickLatency', latency);
        
        // Track feature usage
        const target = event.target as HTMLElement;
        const feature = target.dataset.feature || target.tagName.toLowerCase();
        this.trackFeatureUsage(feature);
      });
    });

    // Scroll performance monitoring
    let scrollTimes: number[] = [];
    document.addEventListener('scroll', () => {
      const scrollTime = performance.now();
      scrollTimes.push(scrollTime);
      
      if (scrollTimes.length > 10) {
        const avgScrollPerformance = scrollTimes.slice(-10).reduce((acc, time, index, arr) => {
          return index > 0 ? acc + (time - arr[index - 1]) : acc;
        }, 0) / 9;
        
        this.metrics.interactions.scrollPerformance = avgScrollPerformance;
        this.checkThreshold('scrollPerformance', avgScrollPerformance);
        scrollTimes = scrollTimes.slice(-5); // Keep last 5
      }
    });

    // Form response monitoring
    document.addEventListener('input', (event) => {
      const startTime = performance.now();
      
      requestAnimationFrame(() => {
        const responseTime = performance.now() - startTime;
        this.metrics.interactions.formResponseTime = responseTime;
        this.checkThreshold('formResponseTime', responseTime);
      });
    });

    // Navigation monitoring
    this.monitorNavigation();
  }

  // Monitor business metrics
  private monitorBusinessMetrics(): void {
    // User engagement tracking
    let engagementScore = 0;
    let interactionCount = 0;
    const startTime = Date.now();

    const updateEngagement = () => {
      const timeSpent = (Date.now() - startTime) / 1000; // seconds
      const engagementRate = interactionCount / Math.max(timeSpent / 60, 1); // interactions per minute
      this.metrics.business.userEngagement = Math.min(engagementRate / 10, 1); // normalize to 0-1
      this.checkThreshold('userEngagement', this.metrics.business.userEngagement);
    };

    // Track various interactions for engagement
    ['click', 'scroll', 'keydown', 'touchstart'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        interactionCount++;
        updateEngagement();
      });
    });

    // Track page visibility for accurate engagement
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        updateEngagement();
      }
    });
  }

  // Setup error handling
  private setupErrorHandling(): void {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      const errorEntry: ErrorEntry = {
        message: event.message,
        stack: event.error?.stack || '',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: Date.now(),
        userId: this.userId,
        sessionId: this.sessionId,
        buildVersion: this.buildVersion,
        userAgent: navigator.userAgent,
        url: window.location.href,
        severity: this.determineSeverity(event.message),
        tags: this.generateErrorTags(event),
      };

      this.metrics.errors.jsErrors.push(errorEntry);
      this.createAlert('error', errorEntry.severity, `JavaScript Error: ${errorEntry.message}`, errorEntry);
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const errorEntry: ErrorEntry = {
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack || '',
        filename: '',
        lineno: 0,
        colno: 0,
        timestamp: Date.now(),
        userId: this.userId,
        sessionId: this.sessionId,
        buildVersion: this.buildVersion,
        userAgent: navigator.userAgent,
        url: window.location.href,
        severity: 'high',
        tags: ['promise', 'async'],
      };

      this.metrics.errors.jsErrors.push(errorEntry);
      this.createAlert('error', 'error', `Promise Rejection: ${event.reason}`, errorEntry);
    });
  }

  // Setup performance observers
  private setupPerformanceObservers(): void {
    // Long task observer
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.duration > 50) { // Tasks longer than 50ms
            const performanceError: PerformanceError = {
              type: 'slow-render',
              threshold: 50,
              actualValue: entry.duration,
              impact: entry.duration > 100 ? 'high' : 'medium',
              recommendation: 'Consider breaking up long-running tasks',
              timestamp: Date.now(),
            };

            this.metrics.errors.performanceErrors.push(performanceError);
            this.createAlert('performance', 'warning', `Long task detected: ${entry.duration}ms`, performanceError);
          }
        });
      });

      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', longTaskObserver);
    } catch (e) {
      console.warn('Long task observer not supported');
    }
  }

  // Intercept network requests for monitoring
  private interceptNetworkRequests(): void {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      const method = args[1]?.method || 'GET';

      try {
        const response = await originalFetch(...args);
        const responseTime = performance.now() - startTime;
        
        this.metrics.performance.apiResponseTime = responseTime;
        this.checkThreshold('apiResponseTime', responseTime);

        if (!response.ok) {
          const networkError: NetworkError = {
            url,
            method,
            status: response.status,
            responseTime,
            timestamp: Date.now(),
            errorType: response.status >= 500 ? 'server' : 'client',
            retryCount: 0,
          };

          this.metrics.errors.networkErrors.push(networkError);
          this.createAlert('error', 'warning', `Network error: ${response.status} for ${url}`, networkError);
        }

        return response;
      } catch (error) {
        const responseTime = performance.now() - startTime;
        const networkError: NetworkError = {
          url,
          method,
          status: 0,
          responseTime,
          timestamp: Date.now(),
          errorType: 'network',
          retryCount: 0,
        };

        this.metrics.errors.networkErrors.push(networkError);
        this.createAlert('error', 'error', `Network failure for ${url}`, networkError);
        
        throw error;
      }
    };
  }

  // Monitor navigation performance
  private monitorNavigation(): void {
    // Use Navigation API if available
    if ('navigation' in window) {
      (window as any).navigation.addEventListener('navigate', (event: any) => {
        const startTime = performance.now();
        
        requestAnimationFrame(() => {
          const navigationTime = performance.now() - startTime;
          this.metrics.interactions.navigationTime = navigationTime;
          this.checkThreshold('navigationTime', navigationTime);
        });
      });
    }

    // Fallback to page visibility for SPA navigation
    const observer = new MutationObserver(() => {
      if (document.title !== this.lastTitle) {
        const navigationTime = performance.now() - this.lastNavigationTime;
        this.metrics.interactions.navigationTime = navigationTime;
        this.checkThreshold('navigationTime', navigationTime);
        this.lastTitle = document.title;
        this.lastNavigationTime = performance.now();
      }
    });

    observer.observe(document.head, { childList: true, subtree: true });
  }

  private lastTitle = document.title;
  private lastNavigationTime = performance.now();

  // Track feature usage
  private trackFeatureUsage(feature: string): void {
    this.metrics.business.featureUsage[feature] = (this.metrics.business.featureUsage[feature] || 0) + 1;
  }

  // Check if metric exceeds threshold
  private checkThreshold(metric: string, value: number): void {
    const threshold = this.thresholds[metric];
    if (threshold && value > threshold) {
      const performanceError: PerformanceError = {
        type: this.getPerformanceErrorType(metric),
        threshold,
        actualValue: value,
        impact: this.getImpactLevel(metric, value, threshold),
        recommendation: this.getRecommendation(metric),
        timestamp: Date.now(),
      };

      this.metrics.errors.performanceErrors.push(performanceError);
      this.createAlert('performance', 'warning', `${metric} threshold exceeded: ${value} > ${threshold}`, performanceError);
    }
  }

  // Create alert
  private createAlert(type: APMAlert['type'], severity: APMAlert['severity'], message: string, details: Record<string, unknown>): void {
    const alert: APMAlert = {
      id: this.generateAlertId(),
      type,
      severity,
      message,
      details,
      timestamp: Date.now(),
      resolved: false,
      actions: this.getRecommendedActions(type, severity),
    };

    this.alerts.push(alert);
    
    // Auto-resolve low severity alerts after 5 minutes
    if (severity === 'info' || severity === 'warning') {
      setTimeout(() => {
        alert.resolved = true;
      }, 5 * 60 * 1000);
    }
  }

  // Start real-time reporting
  private startRealTimeReporting(): void {
    this.reportingInterval = setInterval(() => {
      this.sendReport();
    }, 30000); // Report every 30 seconds
  }

  // Send report to monitoring service
  private async sendReport(): Promise<void> {
    const report = {
      sessionId: this.sessionId,
      userId: this.userId,
      buildVersion: this.buildVersion,
      timestamp: Date.now(),
      metrics: this.metrics,
      alerts: this.alerts.filter(alert => !alert.resolved),
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      connection: this.getConnectionInfo(),
    };

    try {
      // Send to your monitoring endpoint
      await fetch('/api/monitoring/apm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      });
    } catch (error) {
      console.warn('Failed to send APM report:', error);
    }
  }

  // Get current metrics
  public getMetrics(): APMMetrics {
    return { ...this.metrics };
  }

  // Get current alerts
  public getAlerts(): APMAlert[] {
    return [...this.alerts];
  }

  // Generate comprehensive report
  public generateReport(): Record<string, unknown> {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      buildVersion: this.buildVersion,
      monitoringDuration: Date.now() - this.startTime,
      metrics: this.metrics,
      alerts: this.alerts,
      summary: {
        totalErrors: this.metrics.errors.jsErrors.length + this.metrics.errors.networkErrors.length,
        averagePerformance: this.calculateAveragePerformance(),
        userEngagement: this.metrics.business.userEngagement,
        criticalIssues: this.alerts.filter(alert => alert.severity === 'critical').length,
      },
      recommendations: this.generateRecommendations(),
    };
  }

  // Helper methods
  private generateSessionId(): string {
    return `apm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineSeverity(message: string): ErrorEntry['severity'] {
    if (message.includes('ChunkLoadError') || message.includes('Loading chunk')) return 'critical';
    if (message.includes('TypeError') || message.includes('ReferenceError')) return 'high';
    if (message.includes('Warning') || message.includes('Deprecated')) return 'low';
    return 'medium';
  }

  private generateErrorTags(event: ErrorEvent): string[] {
    const tags = [];
    if (event.filename.includes('chunk')) tags.push('chunk-loading');
    if (event.message.includes('network')) tags.push('network');
    if (event.message.includes('async')) tags.push('async');
    return tags;
  }

  private getPerformanceErrorType(metric: string): PerformanceError['type'] {
    switch (metric) {
      case 'memoryUsage': return 'memory-leak';
      case 'renderTime': return 'slow-render';
      case 'bundleSize': return 'large-bundle';
      case 'lcp': return 'poor-lcp';
      case 'cls': return 'high-cls';
      default: return 'slow-render';
    }
  }

  private getImpactLevel(metric: string, value: number, threshold: number): PerformanceError['impact'] {
    const ratio = value / threshold;
    if (ratio > 2) return 'critical';
    if (ratio > 1.5) return 'high';
    if (ratio > 1.2) return 'medium';
    return 'low';
  }

  private getRecommendation(metric: string): string {
    const recommendations = {
      lcp: 'Optimize largest content element, consider lazy loading',
      fid: 'Reduce JavaScript execution time, use web workers',
      cls: 'Set explicit dimensions for images and ads',
      memoryUsage: 'Check for memory leaks, optimize large objects',
      renderTime: 'Optimize render cycles, use React.memo',
      bundleSize: 'Enable code splitting, remove unused dependencies',
    };

    return recommendations[metric as keyof typeof recommendations] || 'Monitor and optimize';
  }

  private getRecommendedActions(type: APMAlert['type'], severity: APMAlert['severity']): AlertAction[] {
    const actions: AlertAction[] = [];

    if (type === 'performance' && severity === 'critical') {
      actions.push({
        type: 'notify',
        target: 'dev-team',
        parameters: { channel: 'alerts', urgency: 'high' },
      });
    }

    if (type === 'error' && severity === 'critical') {
      actions.push({
        type: 'notify',
        target: 'on-call',
        parameters: { escalation: true },
      });
    }

    return actions;
  }

  private getConnectionInfo(): Record<string, unknown> {
    const connection = (navigator as any).connection;
    if (!connection) return {};

    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };
  }

  private calculateAveragePerformance(): number {
    const scores = [
      this.metrics.vitals.lcp < this.thresholds.lcp ? 1 : 0,
      this.metrics.vitals.fid < this.thresholds.fid ? 1 : 0,
      this.metrics.vitals.cls < this.thresholds.cls ? 1 : 0,
      this.metrics.performance.loadTime < this.thresholds.loadTime ? 1 : 0,
      this.metrics.performance.renderTime < this.thresholds.renderTime ? 1 : 0,
    ];

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private generateRecommendations(): string[] {
    const recommendations = [];
    
    if (this.metrics.vitals.lcp > this.thresholds.lcp) {
      recommendations.push('Optimize Largest Contentful Paint');
    }
    
    if (this.metrics.performance.memoryUsage > this.thresholds.memoryUsage) {
      recommendations.push('Investigate memory usage');
    }
    
    if (this.metrics.errors.jsErrors.length > 5) {
      recommendations.push('Review and fix JavaScript errors');
    }

    if (this.metrics.business.userEngagement < this.thresholds.userEngagement) {
      recommendations.push('Improve user engagement features');
    }

    return recommendations;
  }

  private startTime = Date.now();
}

// Export singleton instance
export const apmMonitoringService = new APMMonitoringService();

// React hook for APM monitoring
export const useAPMMonitoring = (userId?: string) => {
  const [isMonitoring, setIsMonitoring] = React.useState(false);
  const [metrics, setMetrics] = React.useState<APMMetrics | null>(null);
  const [alerts, setAlerts] = React.useState<APMAlert[]>([]);

  React.useEffect(() => {
    apmMonitoringService.startMonitoring(userId);
    setIsMonitoring(true);

    const interval = setInterval(() => {
      setMetrics(apmMonitoringService.getMetrics());
      setAlerts(apmMonitoringService.getAlerts());
    }, 1000);

    return () => {
      apmMonitoringService.stopMonitoring();
      setIsMonitoring(false);
      clearInterval(interval);
    };
  }, [userId]);

  return {
    isMonitoring,
    metrics,
    alerts,
    generateReport: () => apmMonitoringService.generateReport(),
  };
}; 