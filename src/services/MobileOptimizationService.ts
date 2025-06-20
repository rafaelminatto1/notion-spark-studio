interface MobileMetrics {
  deviceType: 'phone' | 'tablet' | 'desktop';
  screenSize: {
    width: number;
    height: number;
    density: number;
  };
  performance: {
    touchLatency: number;
    scrollFps: number;
    renderTime: number;
    batteryLevel?: number;
    networkType: string;
  };
  capabilities: {
    touchSupport: boolean;
    orientationSupport: boolean;
    vibrationSupport: boolean;
    cameraSupport: boolean;
    gpsSupport: boolean;
    pushNotificationSupport: boolean;
  };
}

interface OfflineCapability {
  isOnline: boolean;
  lastSyncTime: string;
  pendingOperations: {
    id: string;
    type: 'create' | 'update' | 'delete';
    data: any;
    timestamp: string;
    retryCount: number;
  }[];
  offlineStorage: {
    documents: number;
    totalSize: number;
    cacheHitRate: number;
  };
}

interface PWAManifest {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  display: 'standalone' | 'fullscreen' | 'minimal-ui';
  orientation: 'portrait' | 'landscape' | 'any';
  theme_color: string;
  background_color: string;
  icons: {
    src: string;
    sizes: string;
    type: string;
    purpose?: string;
  }[];
  categories: string[];
  screenshots: {
    src: string;
    sizes: string;
    type: string;
    platform?: string;
  }[];
}

interface MobilePushNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  actions?: {
    action: string;
    title: string;
    icon?: string;
  }[];
  silent?: boolean;
  requireInteraction?: boolean;
  timestamp: string;
}

class MobileOptimizationService {
  private static instance: MobileOptimizationService;
  private mobileMetrics: MobileMetrics;
  private offlineCapability: OfflineCapability;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isInitialized = false;

  public static getInstance(): MobileOptimizationService {
    if (!MobileOptimizationService.instance) {
      MobileOptimizationService.instance = new MobileOptimizationService();
    }
    return MobileOptimizationService.instance;
  }

  constructor() {
    this.mobileMetrics = this.detectMobileCapabilities();
    this.offlineCapability = this.initializeOfflineCapability();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Register service worker for PWA
      await this.registerServiceWorker();
      
      // Setup offline sync
      this.setupOfflineSync();
      
      // Initialize push notifications
      await this.initializePushNotifications();
      
      // Setup mobile-specific optimizations
      this.setupMobileOptimizations();
      
      // Monitor mobile performance
      this.startMobilePerformanceMonitoring();
      
      this.isInitialized = true;
      console.log('[Mobile] Optimization service initialized successfully');
    } catch (error) {
      console.error('[Mobile] Initialization failed:', error);
    }
  }

  private detectMobileCapabilities(): MobileMetrics {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bTablet\b)|Tablet/i.test(navigator.userAgent);
    
    return {
      deviceType: isTablet ? 'tablet' : isMobile ? 'phone' : 'desktop',
      screenSize: {
        width: window.screen.width,
        height: window.screen.height,
        density: window.devicePixelRatio || 1
      },
      performance: {
        touchLatency: 0,
        scrollFps: 60,
        renderTime: 0,
        batteryLevel: (navigator as any).getBattery ? 0 : undefined,
        networkType: (navigator as any).connection?.effectiveType || 'unknown'
      },
      capabilities: {
        touchSupport: 'ontouchstart' in window,
        orientationSupport: 'orientation' in window,
        vibrationSupport: 'vibrate' in navigator,
        cameraSupport: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
        gpsSupport: 'geolocation' in navigator,
        pushNotificationSupport: 'serviceWorker' in navigator && 'PushManager' in window
      }
    };
  }

  private initializeOfflineCapability(): OfflineCapability {
    return {
      isOnline: navigator.onLine,
      lastSyncTime: new Date().toISOString(),
      pendingOperations: [],
      offlineStorage: {
        documents: 0,
        totalSize: 0,
        cacheHitRate: 0
      }
    };
  }

  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        this.swRegistration = registration;
        
        registration.addEventListener('updatefound', () => {
          console.log('[Mobile] Service Worker update found');
        });

        console.log('[Mobile] Service Worker registered successfully');
      } catch (error) {
        console.error('[Mobile] Service Worker registration failed:', error);
      }
    }
  }

  private setupOfflineSync(): void {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.offlineCapability.isOnline = true;
      this.syncPendingOperations();
      console.log('[Mobile] Back online - syncing pending operations');
    });

    window.addEventListener('offline', () => {
      this.offlineCapability.isOnline = false;
      console.log('[Mobile] Gone offline - operations will be queued');
    });

    // Periodic sync when online
    setInterval(() => {
      if (this.offlineCapability.isOnline && this.offlineCapability.pendingOperations.length > 0) {
        this.syncPendingOperations();
      }
    }, 30000); // Every 30 seconds
  }

  private async initializePushNotifications(): Promise<void> {
    if (!this.mobileMetrics.capabilities.pushNotificationSupport) {
      console.log('[Mobile] Push notifications not supported');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('[Mobile] Push notification permission granted');
        await this.subscribeToPush();
      }
    } catch (error) {
      console.error('[Mobile] Push notification setup failed:', error);
    }
  }

  private async subscribeToPush(): Promise<void> {
    if (!this.swRegistration) return;

    try {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_KEY || 'demo-key';
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      console.log('[Mobile] Push subscription successful');
    } catch (error) {
      console.error('[Mobile] Push subscription failed:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    // In a real app, send this to your backend
    console.log('[Mobile] Push subscription:', JSON.stringify(subscription));
  }

  private setupMobileOptimizations(): void {
    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);

    // Optimize scroll performance
    let ticking = false;
    const optimizeScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // Scroll optimizations
          ticking = false;
        });
        ticking = true;
      }
    };

    document.addEventListener('scroll', optimizeScroll, { passive: true });
    document.addEventListener('touchmove', optimizeScroll, { passive: true });

    // Handle orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        // Recalculate layout after orientation change
        window.dispatchEvent(new Event('resize'));
      }, 100);
    });

    // Optimize for mobile keyboards
    const viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    if (viewportMeta) {
      const originalContent = viewportMeta.content;
      
      window.addEventListener('focusin', (e) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          // Prevent zoom on input focus
          viewportMeta.content = originalContent + ', user-scalable=no';
        }
      });

      window.addEventListener('focusout', () => {
        viewportMeta.content = originalContent;
      });
    }
  }

  private startMobilePerformanceMonitoring(): void {
    // Monitor touch latency
    let touchStartTime = 0;
    document.addEventListener('touchstart', () => {
      touchStartTime = performance.now();
    }, { passive: true });

    document.addEventListener('touchend', () => {
      if (touchStartTime > 0) {
        this.mobileMetrics.performance.touchLatency = performance.now() - touchStartTime;
        touchStartTime = 0;
      }
    }, { passive: true });

    // Monitor scroll FPS
    let lastScrollTime = 0;
    let scrollFrames = 0;
    document.addEventListener('scroll', () => {
      const now = performance.now();
      if (lastScrollTime > 0) {
        scrollFrames++;
        if (now - lastScrollTime >= 1000) {
          this.mobileMetrics.performance.scrollFps = scrollFrames;
          scrollFrames = 0;
          lastScrollTime = now;
        }
      } else {
        lastScrollTime = now;
      }
    }, { passive: true });

    // Monitor battery if available
    if ((navigator as any).getBattery) {
      (navigator as any).getBattery().then((battery: any) => {
        this.mobileMetrics.performance.batteryLevel = battery.level * 100;
        
        battery.addEventListener('levelchange', () => {
          this.mobileMetrics.performance.batteryLevel = battery.level * 100;
        });
      });
    }
  }

  // Offline Operations Management
  public async performOperation(operation: {
    type: 'create' | 'update' | 'delete';
    data: any;
    endpoint?: string;
  }): Promise<{ success: boolean; data?: any; queued?: boolean }> {
    if (this.offlineCapability.isOnline) {
      try {
        // Perform operation immediately
        const result = await this.executeOperation(operation);
        this.offlineCapability.lastSyncTime = new Date().toISOString();
        return { success: true, data: result };
      } catch (error) {
        // Queue for later if network fails
        this.queueOperation(operation);
        return { success: false, queued: true };
      }
    } else {
      // Queue operation for when online
      this.queueOperation(operation);
      return { success: false, queued: true };
    }
  }

  private queueOperation(operation: any): void {
    const queuedOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...operation,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };

    this.offlineCapability.pendingOperations.push(queuedOperation);
    
    // Store in localStorage for persistence
    try {
      localStorage.setItem('pendingOperations', JSON.stringify(this.offlineCapability.pendingOperations));
    } catch (error) {
      console.error('[Mobile] Failed to persist pending operations:', error);
    }
  }

  private async syncPendingOperations(): Promise<void> {
    const operations = [...this.offlineCapability.pendingOperations];
    
    for (const operation of operations) {
      try {
        await this.executeOperation(operation);
        
        // Remove from pending list
        this.offlineCapability.pendingOperations = this.offlineCapability.pendingOperations
          .filter(op => op.id !== operation.id);
        
        console.log(`[Mobile] Synced operation: ${operation.type}`);
      } catch (error) {
        operation.retryCount++;
        if (operation.retryCount >= 3) {
          // Remove failed operations after 3 retries
          this.offlineCapability.pendingOperations = this.offlineCapability.pendingOperations
            .filter(op => op.id !== operation.id);
          console.error(`[Mobile] Operation failed permanently: ${operation.id}`);
        }
      }
    }

    // Update localStorage
    try {
      localStorage.setItem('pendingOperations', JSON.stringify(this.offlineCapability.pendingOperations));
      this.offlineCapability.lastSyncTime = new Date().toISOString();
    } catch (error) {
      console.error('[Mobile] Failed to update pending operations:', error);
    }
  }

  private async executeOperation(operation: any): Promise<any> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    
    switch (operation.type) {
      case 'create':
        return { id: Date.now(), ...operation.data };
      case 'update':
        return { ...operation.data, updated_at: new Date().toISOString() };
      case 'delete':
        return { deleted: true };
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  // Push Notifications
  public async sendPushNotification(notification: Omit<MobilePushNotification, 'id' | 'timestamp'>): Promise<void> {
    if (!this.swRegistration) {
      console.error('[Mobile] Service Worker not available for push notifications');
      return;
    }

    const fullNotification: MobilePushNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    try {
      // Send to service worker
      await this.swRegistration.showNotification(fullNotification.title, {
        body: fullNotification.body,
        icon: fullNotification.icon || '/icon-192x192.png',
        badge: fullNotification.badge || '/badge-72x72.png',
        image: fullNotification.image,
        data: fullNotification.data,
        actions: fullNotification.actions,
        silent: fullNotification.silent,
        requireInteraction: fullNotification.requireInteraction
      });

      console.log('[Mobile] Push notification sent:', fullNotification.title);
    } catch (error) {
      console.error('[Mobile] Failed to send push notification:', error);
    }
  }

  // PWA Manifest Management
  public generatePWAManifest(): PWAManifest {
    return {
      name: 'Notion Spark Studio',
      short_name: 'NotionSpark',
      description: 'Enterprise productivity platform with AI-powered collaboration',
      start_url: '/',
      display: 'standalone',
      orientation: 'portrait',
      theme_color: '#3b82f6',
      background_color: '#ffffff',
      icons: [
        {
          src: '/icon-72x72.png',
          sizes: '72x72',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: '/icon-96x96.png',
          sizes: '96x96',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: '/icon-128x128.png',
          sizes: '128x128',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: '/icon-144x144.png',
          sizes: '144x144',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: '/icon-152x152.png',
          sizes: '152x152',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: '/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: '/icon-384x384.png',
          sizes: '384x384',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: '/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable any'
        }
      ],
      categories: ['productivity', 'business', 'collaboration'],
      screenshots: [
        {
          src: '/screenshot-mobile-1.png',
          sizes: '375x812',
          type: 'image/png',
          platform: 'mobile'
        },
        {
          src: '/screenshot-mobile-2.png',
          sizes: '375x812',
          type: 'image/png',
          platform: 'mobile'
        },
        {
          src: '/screenshot-desktop-1.png',
          sizes: '1920x1080',
          type: 'image/png',
          platform: 'desktop'
        }
      ]
    };
  }

  // Device-specific optimizations
  public optimizeForDevice(): void {
    const { deviceType, capabilities } = this.mobileMetrics;

    if (deviceType === 'phone') {
      // Phone-specific optimizations
      document.body.classList.add('mobile-phone');
      
      // Reduce animations on low-end devices
      if (this.mobileMetrics.performance.batteryLevel !== undefined && 
          this.mobileMetrics.performance.batteryLevel < 20) {
        document.body.classList.add('low-battery-mode');
      }
    } else if (deviceType === 'tablet') {
      document.body.classList.add('mobile-tablet');
    }

    // Enable features based on capabilities
    if (capabilities.vibrationSupport) {
      document.body.classList.add('has-vibration');
    }
    
    if (capabilities.cameraSupport) {
      document.body.classList.add('has-camera');
    }
    
    if (capabilities.gpsSupport) {
      document.body.classList.add('has-gps');
    }
  }

  // Analytics
  public getMobileMetrics(): MobileMetrics {
    return { ...this.mobileMetrics };
  }

  public getOfflineStatus(): OfflineCapability {
    return { ...this.offlineCapability };
  }

  public async generatePerformanceReport(): Promise<{
    mobile_optimization_score: number;
    offline_readiness: number;
    pwa_compliance: number;
    recommendations: string[];
  }> {
    const score = {
      mobile_optimization_score: 0,
      offline_readiness: 0,
      pwa_compliance: 0,
      recommendations: [] as string[]
    };

    // Mobile optimization score
    let mobileScore = 0;
    if (this.mobileMetrics.capabilities.touchSupport) mobileScore += 20;
    if (this.mobileMetrics.performance.touchLatency < 100) mobileScore += 20;
    if (this.mobileMetrics.performance.scrollFps >= 50) mobileScore += 20;
    if (this.swRegistration) mobileScore += 20;
    if (this.mobileMetrics.capabilities.pushNotificationSupport) mobileScore += 20;
    
    score.mobile_optimization_score = mobileScore;

    // Offline readiness
    let offlineScore = 0;
    if (this.swRegistration) offlineScore += 30;
    if (this.offlineCapability.pendingOperations.length < 10) offlineScore += 25;
    if (this.offlineCapability.offlineStorage.cacheHitRate > 80) offlineScore += 25;
    if ('localStorage' in window) offlineScore += 20;
    
    score.offline_readiness = offlineScore;

    // PWA compliance
    let pwaScore = 0;
    if (this.swRegistration) pwaScore += 25;
    if (this.mobileMetrics.capabilities.pushNotificationSupport) pwaScore += 25;
    const manifest = this.generatePWAManifest();
    if (manifest.icons.length >= 8) pwaScore += 25;
    if (manifest.screenshots.length >= 2) pwaScore += 25;
    
    score.pwa_compliance = pwaScore;

    // Recommendations
    if (mobileScore < 80) {
      score.recommendations.push('Improve mobile touch responsiveness and scroll performance');
    }
    if (offlineScore < 70) {
      score.recommendations.push('Enhance offline capabilities and data synchronization');
    }
    if (pwaScore < 80) {
      score.recommendations.push('Complete PWA implementation with proper manifest and icons');
    }

    return score;
  }

  // Cleanup
  public destroy(): void {
    if (this.swRegistration) {
      this.swRegistration.unregister();
    }
    this.isInitialized = false;
  }
}

export const mobileOptimizationService = MobileOptimizationService.getInstance();
export default MobileOptimizationService;
export type { MobileMetrics, OfflineCapability, PWAManifest, MobilePushNotification }; 