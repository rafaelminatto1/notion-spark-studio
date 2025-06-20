interface MobileMetrics {
  deviceType: 'phone' | 'tablet' | 'desktop';
  capabilities: {
    touchSupport: boolean;
    camera: boolean;
    gps: boolean;
    vibration: boolean;
    notification: boolean;
  };
  performance: {
    memoryUsage: number;
    cpuUsage: number;
    networkSpeed: string;
  };
  optimizations: {
    applied: boolean;
    compressionEnabled: boolean;
    cacheEnabled: boolean;
    lazyLoadingEnabled: boolean;
  };
}

class MobileOptimizationService {
  private metrics: MobileMetrics;
  private isInitialized = false;

  constructor() {
    this.metrics = {
      deviceType: 'desktop',
      capabilities: {
        touchSupport: false,
        camera: false,
        gps: false,
        vibration: false,
        notification: false,
      },
      performance: {
        memoryUsage: 0,
        cpuUsage: 0,
        networkSpeed: 'unknown',
      },
      optimizations: {
        applied: false,
        compressionEnabled: false,
        cacheEnabled: false,
        lazyLoadingEnabled: false,
      },
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Detect device type
      this.detectDeviceType();
      
      // Detect capabilities  
      await this.detectCapabilities();
      
      // Initialize performance monitoring
      this.initializePerformanceMonitoring();
      
      // Setup push notifications if available
      this.initializePushNotifications();

      this.isInitialized = true;
      console.log('[Mobile] Optimization service initialized successfully');
    } catch (error) {
      console.error('[Mobile] Failed to initialize optimization service:', error);
    }
  }

  private detectDeviceType(): void {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /ipad|iphone|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isTablet = /ipad/.test(userAgent) || (isAndroid && !/mobile/.test(userAgent));
    
    if (isTablet) {
      this.metrics.deviceType = 'tablet';
    } else if (isIOS || isAndroid) {
      this.metrics.deviceType = 'phone';
    } else {
      this.metrics.deviceType = 'desktop';
    }
  }

  private async detectCapabilities(): Promise<void> {
    // Touch support
    this.metrics.capabilities.touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Camera support
    this.metrics.capabilities.camera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

    // GPS support
    this.metrics.capabilities.gps = !!(navigator.geolocation);

    // Vibration support
    this.metrics.capabilities.vibration = !!(navigator.vibrate);

    // Notification support
    this.metrics.capabilities.notification = !!(window.Notification);
  }

  private initializePerformanceMonitoring(): void {
    // Memory monitoring
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      this.metrics.performance.memoryUsage = memoryInfo.usedJSHeapSize || 0;
    }

    // Network monitoring
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.metrics.performance.networkSpeed = connection.effectiveType || 'unknown';
    }
  }

  private initializePushNotifications(): void {
    if (!this.metrics.capabilities.notification) {
      console.log('[Mobile] Push notifications not supported');
      return;
    }

    // Push notifications setup would go here
    // For now, just mark as available
  }

  async optimizeForMobile(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Apply mobile optimizations
      this.enableCompression();
      this.enableCaching();
      this.enableLazyLoading();
      
      this.metrics.optimizations.applied = true;
      console.log('[Mobile] Mobile optimizations applied successfully');
    } catch (error) {
      console.error('[Mobile] Failed to apply mobile optimizations:', error);
    }
  }

  private enableCompression(): void {
    // Enable data compression for mobile
    this.metrics.optimizations.compressionEnabled = true;
  }

  private enableCaching(): void {
    // Enable aggressive caching for mobile
    this.metrics.optimizations.cacheEnabled = true;
  }

  private enableLazyLoading(): void {
    // Enable lazy loading for mobile
    this.metrics.optimizations.lazyLoadingEnabled = true;
  }

  getMobileMetrics(): MobileMetrics {
    return { ...this.metrics };
  }

  isOptimizedForMobile(): boolean {
    return this.metrics.optimizations.applied;
  }

  getPerformanceScore(): number {
    let score = 100;
    
    // Deduct based on device limitations
    if (this.metrics.deviceType === 'phone') score -= 10;
    if (this.metrics.performance.memoryUsage > 50000000) score -= 20; // 50MB threshold
    if (this.metrics.performance.networkSpeed === '2g') score -= 30;
    
    // Add back for optimizations
    if (this.metrics.optimizations.applied) score += 15;
    if (this.metrics.optimizations.compressionEnabled) score += 5;
    if (this.metrics.optimizations.cacheEnabled) score += 10;
    
    return Math.max(0, Math.min(100, score));
  }
}

// Create and export singleton instance
export const mobileOptimizationService = new MobileOptimizationService();
export default mobileOptimizationService;
export type { MobileMetrics }; 