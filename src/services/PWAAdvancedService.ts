// PWA Advanced Service for Enterprise-Grade Progressive Web App Features
export interface PWACapabilities {
  // Installation
  installation: {
    canInstall: boolean;
    isInstalled: boolean;
    isStandalone: boolean;
    hasBeforeInstallPrompt: boolean;
    installPromptEvent: BeforeInstallPromptEvent | null;
    lastInstallCheck: string;
  };

  // Platform Detection
  platform: {
    os: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';
    browser: 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera' | 'unknown';
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    supportsWebShare: boolean;
    supportsWebPush: boolean;
    supportsPersistentStorage: boolean;
  };

  // Service Worker
  serviceWorker: {
    isSupported: boolean;
    isRegistered: boolean;
    isControlling: boolean;
    hasUpdate: boolean;
    registration: ServiceWorkerRegistration | null;
    lastUpdateCheck: string;
    version: string;
  };

  // Storage
  storage: {
    persistent: boolean;
    quota: number;
    usage: number;
    available: number;
    estimate: StorageEstimate | null;
    indexedDBSupported: boolean;
    cacheAPISupported: boolean;
  };

  // Network
  network: {
    isOnline: boolean;
    connectionType: string;
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  };

  // Features
  features: {
    backgroundSync: boolean;
    webShare: boolean;
    webPush: boolean;
    badgeAPI: boolean;
    fullscreen: boolean;
    orientation: boolean;
    vibration: boolean;
    geolocation: boolean;
    camera: boolean;
    microphone: boolean;
    bluetooth: boolean;
    nfc: boolean;
    wakeLock: boolean;
    fileSystemAccess: boolean;
  };
}

export interface PWAMetrics {
  performanceScore: number;
  lighthouseScore: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
    pwa: number;
  };
  userEngagement: {
    installRate: number;
    retentionRate: number;
    sessionDuration: number;
    pageViews: number;
    bounceRate: number;
  };
  technicalMetrics: {
    serviceWorkerHitRate: number;
    cacheEfficiency: number;
    offlineCapability: number;
    loadTime: number;
    timeToInteractive: number;
  };
}

export interface PWAConfiguration {
  // App Identity
  identity: {
    name: string;
    shortName: string;
    description: string;
    version: string;
    author: string;
    categories: string[];
    lang: string;
    dir: 'ltr' | 'rtl' | 'auto';
  };

  // Visual Appearance
  appearance: {
    themeColor: string;
    backgroundColor: string;
    display: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser';
    orientation: 'any' | 'natural' | 'landscape' | 'portrait';
    startUrl: string;
    scope: string;
  };

  // Icons and Screenshots
  assets: {
    icons: Array<{
      src: string;
      sizes: string;
      type: string;
      purpose?: 'any' | 'maskable' | 'monochrome';
    }>;
    screenshots: Array<{
      src: string;
      sizes: string;
      type: string;
      platform?: 'wide' | 'narrow';
      label?: string;
    }>;
  };

  // Advanced Features
  features: {
    shortcuts: Array<{
      name: string;
      shortName?: string;
      description?: string;
      url: string;
      icons?: Array<{ src: string; sizes: string; }>;
    }>;
    shareTarget?: {
      action: string;
      method: 'GET' | 'POST';
      params: Record<string, string>;
    };
    fileHandlers?: Array<{
      action: string;
      accept: Record<string, string[]>;
    }>;
    protocolHandlers?: Array<{
      protocol: string;
      url: string;
    }>;
  };

  // Caching Strategy
  caching: {
    strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
    resources: string[];
    runtimeCaching: Array<{
      urlPattern: RegExp;
      handler: string;
      options?: Record<string, any>;
    }>;
    skipWaiting: boolean;
    clientsClaim: boolean;
  };
}

export class PWAAdvancedService {
  private capabilities: PWACapabilities;
  private metrics: PWAMetrics;
  private config: PWAConfiguration;
  private listeners: Map<string, Set<Function>> = new Map();
  private installPromptEvent: BeforeInstallPromptEvent | null = null;
  private isInitialized = false;

  constructor() {
    this.capabilities = this.initializeCapabilities();
    this.metrics = this.initializeMetrics();
    this.config = this.initializeConfiguration();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('[PWA Advanced] Initializing PWA service...');

    try {
      // Detect platform and capabilities
      await this.detectPlatformCapabilities();
      
      // Register service worker
      await this.registerServiceWorker();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Check installation status
      await this.checkInstallationStatus();
      
      // Initialize storage
      await this.initializeStorage();
      
      // Setup background sync
      await this.setupBackgroundSync();
      
      // Start metrics collection
      this.startMetricsCollection();

      this.isInitialized = true;
      console.log('[PWA Advanced] Service initialized successfully');
      
      this.emit('initialized', this.capabilities);
    } catch (error) {
      console.error('[PWA Advanced] Initialization failed:', error);
      throw error;
    }
  }

  private initializeCapabilities(): PWACapabilities {
    return {
      installation: {
        canInstall: false,
        isInstalled: false,
        isStandalone: false,
        hasBeforeInstallPrompt: false,
        installPromptEvent: null,
        lastInstallCheck: new Date().toISOString(),
      },
      platform: {
        os: 'unknown',
        browser: 'unknown',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        supportsWebShare: false,
        supportsWebPush: false,
        supportsPersistentStorage: false,
      },
      serviceWorker: {
        isSupported: 'serviceWorker' in navigator,
        isRegistered: false,
        isControlling: false,
        hasUpdate: false,
        registration: null,
        lastUpdateCheck: new Date().toISOString(),
        version: '1.0.0',
      },
      storage: {
        persistent: false,
        quota: 0,
        usage: 0,
        available: 0,
        estimate: null,
        indexedDBSupported: 'indexedDB' in window,
        cacheAPISupported: 'caches' in window,
      },
      network: {
        isOnline: navigator.onLine,
        connectionType: 'unknown',
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0,
        saveData: false,
      },
      features: {
        backgroundSync: false,
        webShare: 'share' in navigator,
        webPush: 'PushManager' in window,
        badgeAPI: 'setAppBadge' in navigator,
        fullscreen: 'requestFullscreen' in document.documentElement,
        orientation: 'screen' in window && 'orientation' in window.screen,
        vibration: 'vibrate' in navigator,
        geolocation: 'geolocation' in navigator,
        camera: false,
        microphone: false,
        bluetooth: 'bluetooth' in navigator,
        nfc: 'NDEFReader' in window,
        wakeLock: 'wakeLock' in navigator,
        fileSystemAccess: 'showOpenFilePicker' in window,
      },
    };
  }

  private initializeMetrics(): PWAMetrics {
    return {
      performanceScore: 0,
      lighthouseScore: {
        performance: 0,
        accessibility: 0,
        bestPractices: 0,
        seo: 0,
        pwa: 0,
      },
      userEngagement: {
        installRate: 0,
        retentionRate: 0,
        sessionDuration: 0,
        pageViews: 0,
        bounceRate: 0,
      },
      technicalMetrics: {
        serviceWorkerHitRate: 0,
        cacheEfficiency: 0,
        offlineCapability: 0,
        loadTime: 0,
        timeToInteractive: 0,
      },
    };
  }

  private initializeConfiguration(): PWAConfiguration {
    return {
      identity: {
        name: 'Notion Spark Studio',
        shortName: 'NotionSpark',
        description: 'Revolutionary note-taking and collaboration platform with AI',
        version: '2.0.0',
        author: 'Notion Spark Team',
        categories: ['productivity', 'business', 'collaboration'],
        lang: 'en',
        dir: 'ltr',
      },
      appearance: {
        themeColor: '#3b82f6',
        backgroundColor: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        startUrl: '/',
        scope: '/',
      },
      assets: {
        icons: [
          { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
        ],
        screenshots: [
          { src: '/screenshot-desktop.png', sizes: '1280x720', type: 'image/png', platform: 'wide' },
          { src: '/screenshot-mobile.png', sizes: '390x844', type: 'image/png', platform: 'narrow' },
        ],
      },
      features: {
        shortcuts: [
          { name: 'New Document', url: '/new', icons: [{ src: '/icon-new.png', sizes: '96x96' }] },
          { name: 'Dashboard', url: '/dashboard', icons: [{ src: '/icon-dashboard.png', sizes: '96x96' }] },
        ],
        shareTarget: {
          action: '/share',
          method: 'POST',
          params: { title: 'title', text: 'text', url: 'url' },
        },
        fileHandlers: [
          { action: '/open', accept: { 'text/plain': ['.txt'], 'text/markdown': ['.md'] } },
        ],
      },
      caching: {
        strategy: 'stale-while-revalidate',
        resources: ['/'],
        runtimeCaching: [],
        skipWaiting: true,
        clientsClaim: true,
      },
    };
  }

  private async detectPlatformCapabilities(): Promise<void> {
    // Detect OS
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      this.capabilities.platform.os = 'ios';
    } else if (/android/.test(userAgent)) {
      this.capabilities.platform.os = 'android';
    } else if (/windows/.test(userAgent)) {
      this.capabilities.platform.os = 'windows';
    } else if (/macintosh|mac os x/.test(userAgent)) {
      this.capabilities.platform.os = 'macos';
    } else if (/linux/.test(userAgent)) {
      this.capabilities.platform.os = 'linux';
    }

    // Detect browser
    if (/chrome/.test(userAgent) && !/edge/.test(userAgent)) {
      this.capabilities.platform.browser = 'chrome';
    } else if (/firefox/.test(userAgent)) {
      this.capabilities.platform.browser = 'firefox';
    } else if (/safari/.test(userAgent) && !/chrome/.test(userAgent)) {
      this.capabilities.platform.browser = 'safari';
    } else if (/edge/.test(userAgent)) {
      this.capabilities.platform.browser = 'edge';
    } else if (/opera/.test(userAgent)) {
      this.capabilities.platform.browser = 'opera';
    }

    // Detect device type
    const width = window.innerWidth;
    this.capabilities.platform.isMobile = width < 768;
    this.capabilities.platform.isTablet = width >= 768 && width < 1024;
    this.capabilities.platform.isDesktop = width >= 1024;

    // Check media devices for camera/microphone
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.capabilities.features.camera = devices.some(device => device.kind === 'videoinput');
      this.capabilities.features.microphone = devices.some(device => device.kind === 'audioinput');
    } catch (error) {
      console.warn('[PWA Advanced] Could not enumerate media devices:', error);
    }

    // Check network capabilities
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      this.capabilities.network.connectionType = connection.type || 'unknown';
      this.capabilities.network.effectiveType = connection.effectiveType || 'unknown';
      this.capabilities.network.downlink = connection.downlink || 0;
      this.capabilities.network.rtt = connection.rtt || 0;
      this.capabilities.network.saveData = connection.saveData || false;
    }

    // Check storage capabilities
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        this.capabilities.storage.estimate = estimate;
        this.capabilities.storage.quota = estimate.quota || 0;
        this.capabilities.storage.usage = estimate.usage || 0;
        this.capabilities.storage.available = (estimate.quota || 0) - (estimate.usage || 0);
      } catch (error) {
        console.warn('[PWA Advanced] Could not get storage estimate:', error);
      }

      try {
        this.capabilities.storage.persistent = await navigator.storage.persist();
      } catch (error) {
        console.warn('[PWA Advanced] Could not request persistent storage:', error);
      }
    }

    // Check additional web capabilities
    this.capabilities.platform.supportsWebShare = 'share' in navigator;
    this.capabilities.platform.supportsWebPush = 'PushManager' in window && 'serviceWorker' in navigator;
    this.capabilities.platform.supportsPersistentStorage = 'storage' in navigator && 'persist' in navigator.storage;

    // Check background sync capability
    this.capabilities.features.backgroundSync = 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype;
  }

  private async registerServiceWorker(): Promise<void> {
    if (!this.capabilities.serviceWorker.isSupported) {
      console.warn('[PWA Advanced] Service Workers not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });

      this.capabilities.serviceWorker.isRegistered = true;
      this.capabilities.serviceWorker.registration = registration;
      this.capabilities.serviceWorker.isControlling = !!navigator.serviceWorker.controller;

      // Check for updates
      registration.addEventListener('updatefound', () => {
        this.capabilities.serviceWorker.hasUpdate = true;
        this.emit('update-available', registration.installing);
      });

      // Listen for controlling service worker changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        this.capabilities.serviceWorker.isControlling = !!navigator.serviceWorker.controller;
        this.emit('controller-changed');
      });

      console.log('[PWA Advanced] Service Worker registered successfully');
    } catch (error) {
      console.error('[PWA Advanced] Service Worker registration failed:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    // Install prompt handling
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPromptEvent = e as BeforeInstallPromptEvent;
      this.capabilities.installation.hasBeforeInstallPrompt = true;
      this.capabilities.installation.canInstall = true;
      this.emit('install-prompt-available', e);
    });

    // App installed event
    window.addEventListener('appinstalled', () => {
      this.capabilities.installation.isInstalled = true;
      this.capabilities.installation.canInstall = false;
      this.installPromptEvent = null;
      this.emit('app-installed');
    });

    // Network status changes
    window.addEventListener('online', () => {
      this.capabilities.network.isOnline = true;
      this.emit('network-status-changed', { online: true });
    });

    window.addEventListener('offline', () => {
      this.capabilities.network.isOnline = false;
      this.emit('network-status-changed', { online: false });
    });

    // Visibility changes for metrics
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.emit('app-focus');
      } else {
        this.emit('app-blur');
      }
    });
  }

  private async checkInstallationStatus(): Promise<void> {
    // Check if running in standalone mode
    this.capabilities.installation.isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    // On mobile, check if already installed
    if (this.capabilities.platform.isMobile) {
      this.capabilities.installation.isInstalled = this.capabilities.installation.isStandalone;
    }

    this.capabilities.installation.lastInstallCheck = new Date().toISOString();
  }

  private async initializeStorage(): Promise<void> {
    // Request persistent storage
    if (this.capabilities.platform.supportsPersistentStorage) {
      try {
        const isPersistent = await navigator.storage.persist();
        this.capabilities.storage.persistent = isPersistent;
        console.log(`[PWA Advanced] Persistent storage: ${isPersistent}`);
      } catch (error) {
        console.warn('[PWA Advanced] Could not request persistent storage:', error);
      }
    }

    // Initialize IndexedDB if supported
    if (this.capabilities.storage.indexedDBSupported) {
      try {
        // Test IndexedDB connection
        const testDB = indexedDB.open('pwa-test', 1);
        testDB.onsuccess = () => {
          testDB.result.close();
          indexedDB.deleteDatabase('pwa-test');
        };
      } catch (error) {
        console.warn('[PWA Advanced] IndexedDB test failed:', error);
        this.capabilities.storage.indexedDBSupported = false;
      }
    }
  }

  private async setupBackgroundSync(): Promise<void> {
    if (!this.capabilities.features.backgroundSync || !this.capabilities.serviceWorker.registration) {
      return;
    }

    try {
      // Register background sync
      await this.capabilities.serviceWorker.registration.sync.register('background-sync');
      console.log('[PWA Advanced] Background sync registered');
    } catch (error) {
      console.warn('[PWA Advanced] Background sync registration failed:', error);
    }
  }

  private startMetricsCollection(): void {
    // Collect performance metrics
    if ('performance' in window) {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        this.metrics.technicalMetrics.loadTime = navigationEntry.loadEventEnd - navigationEntry.loadEventStart;
        this.metrics.technicalMetrics.timeToInteractive = navigationEntry.domInteractive - navigationEntry.navigationStart;
      }
    }

    // Start periodic metrics collection
    setInterval(() => {
      this.collectRuntimeMetrics();
    }, 60000); // Every minute
  }

  private async collectRuntimeMetrics(): Promise<void> {
    // Update storage usage
    if (this.capabilities.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        this.capabilities.storage.usage = estimate.usage || 0;
        this.capabilities.storage.available = (estimate.quota || 0) - (estimate.usage || 0);
      } catch (error) {
        console.warn('[PWA Advanced] Could not update storage estimate:', error);
      }
    }

    // Update network metrics
    const connection = (navigator as any).connection;
    if (connection) {
      this.capabilities.network.downlink = connection.downlink || 0;
      this.capabilities.network.rtt = connection.rtt || 0;
      this.capabilities.network.effectiveType = connection.effectiveType || 'unknown';
    }

    // Calculate cache efficiency
    if (this.capabilities.serviceWorker.registration) {
      // This would be implemented based on service worker message communication
      this.metrics.technicalMetrics.cacheEfficiency = await this.calculateCacheEfficiency();
    }
  }

  private async calculateCacheEfficiency(): Promise<number> {
    // Send message to service worker to get cache hit rate
    if (!navigator.serviceWorker.controller) return 0;

    return new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        resolve(event.data.cacheHitRate || 0);
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_CACHE_STATS' },
        [channel.port2]
      );

      // Timeout after 5 seconds
      setTimeout(() => resolve(0), 5000);
    });
  }

  // Public API Methods

  async installApp(): Promise<boolean> {
    if (!this.capabilities.installation.canInstall || !this.installPromptEvent) {
      return false;
    }

    try {
      this.installPromptEvent.prompt();
      const { outcome } = await this.installPromptEvent.userChoice;
      
      if (outcome === 'accepted') {
        this.capabilities.installation.isInstalled = true;
        this.capabilities.installation.canInstall = false;
        this.installPromptEvent = null;
        this.emit('app-installed');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[PWA Advanced] Install prompt failed:', error);
      return false;
    }
  }

  async shareContent(data: { title?: string; text?: string; url?: string }): Promise<boolean> {
    if (!this.capabilities.features.webShare) {
      return false;
    }

    try {
      await navigator.share(data);
      this.emit('content-shared', data);
      return true;
    } catch (error) {
      console.warn('[PWA Advanced] Share failed:', error);
      return false;
    }
  }

  async requestFullscreen(): Promise<boolean> {
    if (!this.capabilities.features.fullscreen) {
      return false;
    }

    try {
      await document.documentElement.requestFullscreen();
      this.emit('fullscreen-entered');
      return true;
    } catch (error) {
      console.warn('[PWA Advanced] Fullscreen request failed:', error);
      return false;
    }
  }

  async vibrate(pattern: number | number[]): Promise<boolean> {
    if (!this.capabilities.features.vibration) {
      return false;
    }

    try {
      navigator.vibrate(pattern);
      return true;
    } catch (error) {
      console.warn('[PWA Advanced] Vibration failed:', error);
      return false;
    }
  }

  async setBadge(count?: number): Promise<boolean> {
    if (!this.capabilities.features.badgeAPI) {
      return false;
    }

    try {
      if (count !== undefined) {
        await (navigator as any).setAppBadge(count);
      } else {
        await (navigator as any).clearAppBadge();
      }
      return true;
    } catch (error) {
      console.warn('[PWA Advanced] Badge API failed:', error);
      return false;
    }
  }

  async updateServiceWorker(): Promise<boolean> {
    const registration = this.capabilities.serviceWorker.registration;
    if (!registration || !this.capabilities.serviceWorker.hasUpdate) {
      return false;
    }

    try {
      await registration.update();
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      this.capabilities.serviceWorker.hasUpdate = false;
      this.emit('service-worker-updated');
      return true;
    } catch (error) {
      console.error('[PWA Advanced] Service worker update failed:', error);
      return false;
    }
  }

  getCapabilities(): PWACapabilities {
    return { ...this.capabilities };
  }

  getMetrics(): PWAMetrics {
    return { ...this.metrics };
  }

  getConfiguration(): PWAConfiguration {
    return { ...this.config };
  }

  updateConfiguration(newConfig: Partial<PWAConfiguration>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configuration-updated', this.config);
  }

  // Event System
  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
  }

  private emit(event: string, data?: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`[PWA Advanced] Event listener error for ${event}:`, error);
        }
      });
    }
  }

  // Cleanup
  destroy(): void {
    this.listeners.clear();
    this.installPromptEvent = null;
    this.isInitialized = false;
  }
}

// Singleton instance
export const pwaAdvancedService = new PWAAdvancedService(); 