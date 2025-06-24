import { useState, useEffect, useCallback, useRef } from 'react';

interface MobileEcosystemState {
  // Device info
  deviceInfo: {
    type: 'phone' | 'tablet' | 'desktop';
    os: 'ios' | 'android' | 'web';
    screenSize: { width: number; height: number };
    orientation: 'portrait' | 'landscape';
    hasNotch: boolean;
    safeAreaInsets: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
  };
  
  // PWA capabilities
  pwa: {
    isInstalled: boolean;
    isInstallable: boolean;
    isStandalone: boolean;
    canInstall: boolean;
    installPrompt: Event | null;
  };
  
  // Network & sync
  network: {
    isOnline: boolean;
    connectionType: string;
    effectiveType: string;
    saveData: boolean;
  };
  
  // Performance metrics
  performance: {
    frameRate: number;
    memoryUsage: number;
    batteryLevel: number | null;
    isLowPowerMode: boolean;
  };
  
  // Features availability
  features: {
    camera: boolean;
    microphone: boolean;
    geolocation: boolean;
    notifications: boolean;
    vibration: boolean;
    biometrics: boolean;
    nfc: boolean;
    bluetooth: boolean;
  };
  
  // App state
  appState: {
    isActive: boolean;
    isBackground: boolean;
    visibility: 'visible' | 'hidden';
    lifecycle: 'active' | 'passive' | 'frozen' | 'discarded';
  };
}

interface MobileOptimizationSettings {
  enableOfflineSync: boolean;
  enablePushNotifications: boolean;
  enableAnalytics: boolean;
  enablePerformanceMonitoring: boolean;
  adaptiveQuality: boolean;
  batteryOptimization: boolean;
  reducedMotion: boolean;
  dataCompression: boolean;
}

interface OfflineOperation {
  id: string;
  type: 'create' | 'update' | 'delete' | 'sync';
  endpoint: string;
  data: any;
  timestamp: number;
  retries: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'syncing' | 'completed' | 'failed';
}

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, any>;
  actions?: {
    action: string;
    title: string;
    icon?: string;
  }[];
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
}

export const useMobileEcosystem = (settings: Partial<MobileOptimizationSettings> = {}) => {
  // Default settings
  const defaultSettings: MobileOptimizationSettings = {
    enableOfflineSync: true,
    enablePushNotifications: true,
    enableAnalytics: true,
    enablePerformanceMonitoring: true,
    adaptiveQuality: true,
    batteryOptimization: true,
    reducedMotion: false,
    dataCompression: true,
    ...settings,
  };

  // State
  const [state, setState] = useState<MobileEcosystemState>({
    deviceInfo: {
      type: 'desktop',
      os: 'web',
      screenSize: { width: 0, height: 0 },
      orientation: 'portrait',
      hasNotch: false,
      safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
    },
    pwa: {
      isInstalled: false,
      isInstallable: false,
      isStandalone: false,
      canInstall: false,
      installPrompt: null,
    },
    network: {
      isOnline: true,
      connectionType: 'unknown',
      effectiveType: 'unknown',
      saveData: false,
    },
    performance: {
      frameRate: 60,
      memoryUsage: 0,
      batteryLevel: null,
      isLowPowerMode: false,
    },
    features: {
      camera: false,
      microphone: false,
      geolocation: false,
      notifications: false,
      vibration: false,
      biometrics: false,
      nfc: false,
      bluetooth: false,
    },
    appState: {
      isActive: true,
      isBackground: false,
      visibility: 'visible',
      lifecycle: 'active',
    },
  });

  // Offline operations queue
  const [offlineQueue, setOfflineQueue] = useState<OfflineOperation[]>([]);
  const [syncInProgress, setSyncInProgress] = useState(false);

  // Service worker registration
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Refs for cleanup
  const intervalRefs = useRef<NodeJS.Timeout[]>([]);
  const observerRefs = useRef<any[]>([]);

  // Initialize device detection
  const detectDevice = useCallback(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /ipad|iphone|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isTablet = /ipad/.test(userAgent) || (isAndroid && !/mobile/.test(userAgent));
    const isPhone = /iphone|ipod/.test(userAgent) || (isAndroid && /mobile/.test(userAgent));

    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const orientation = screenWidth > screenHeight ? 'landscape' : 'portrait';

    // Detect notch (simplified detection)
    const hasNotch = isIOS && window.screen.height >= 812;

    // Calculate safe area insets
    const safeAreaInsets = {
      top: hasNotch ? 44 : 0,
      bottom: hasNotch ? 34 : 0,
      left: 0,
      right: 0,
    };

    return {
      type: isTablet ? 'tablet' : isPhone ? 'phone' : 'desktop',
      os: isIOS ? 'ios' : isAndroid ? 'android' : 'web',
      screenSize: { width: screenWidth, height: screenHeight },
      orientation,
      hasNotch,
      safeAreaInsets,
    };
  }, []);

  // Detect PWA capabilities
  const detectPWA = useCallback(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;
    
    const isInstalled = isStandalone || 
                       document.referrer.includes('android-app://') ||
                       window.location.search.includes('utm_source=homescreen');

    return {
      isInstalled,
      isInstallable: false, // Will be updated by beforeinstallprompt
      isStandalone,
      canInstall: false,
      installPrompt: null,
    };
  }, []);

  // Detect network capabilities
  const detectNetwork = useCallback(() => {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    return {
      isOnline: navigator.onLine,
      connectionType: connection?.type ?? 'unknown',
      effectiveType: connection?.effectiveType ?? 'unknown',
      saveData: connection?.saveData || false,
    };
  }, []);

  // Detect feature availability
  const detectFeatures = useCallback(async () => {
    const features = {
      camera: false,
      microphone: false,
      geolocation: false,
      notifications: false,
      vibration: false,
      biometrics: false,
      nfc: false,
      bluetooth: false,
    };

    // Camera and microphone
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      features.camera = devices.some(device => device.kind === 'videoinput');
      features.microphone = devices.some(device => device.kind === 'audioinput');
    } catch {}

    // Geolocation
    features.geolocation = 'geolocation' in navigator;

    // Notifications
    features.notifications = 'Notification' in window && 'serviceWorker' in navigator;

    // Vibration
    features.vibration = 'vibrate' in navigator;

    // Biometrics (simplified detection)
    features.biometrics = 'credentials' in navigator && 
                         'create' in navigator.credentials;

    // NFC
    features.nfc = 'NDEFReader' in window;

    // Bluetooth
    features.bluetooth = 'bluetooth' in navigator;

    return features;
  }, []);

  // Performance monitoring
  const monitorPerformance = useCallback(() => {
    let frameRate = 60;
    let lastTime = performance.now();
    let frames = 0;

    const measureFrameRate = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        frameRate = Math.round((frames * 1000) / (currentTime - lastTime));
        frames = 0;
        lastTime = currentTime;
        
        setState(prev => ({
          ...prev,
          performance: {
            ...prev.performance,
            frameRate,
          },
        }));
      }
      
      requestAnimationFrame(measureFrameRate);
    };

    measureFrameRate();

    // Memory usage (if available)
    if ('memory' in performance) {
      const updateMemory = () => {
        const memory = (performance as any).memory;
        setState(prev => ({
          ...prev,
          performance: {
            ...prev.performance,
            memoryUsage: memory.usedJSHeapSize / memory.jsHeapSizeLimit,
          },
        }));
      };

      const memoryInterval = setInterval(updateMemory, 5000);
      intervalRefs.current.push(memoryInterval);
    }

    // Battery API (if available)
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          setState(prev => ({
            ...prev,
            performance: {
              ...prev.performance,
              batteryLevel: Math.round(battery.level * 100),
              isLowPowerMode: battery.level < 0.2,
            },
          }));
        };

        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      });
    }
  }, []);

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        setSwRegistration(registration);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          console.log('[Mobile] Service Worker update found');
        });

        console.log('[Mobile] Service Worker registered successfully');
        return registration;
      } catch (error) {
        console.error('[Mobile] Service Worker registration failed:', error);
        return null;
      }
    }
    return null;
  }, []);

  // Setup offline sync
  const setupOfflineSync = useCallback(() => {
    if (!defaultSettings.enableOfflineSync) return;

    // Load queued operations from storage
    const loadQueuedOperations = () => {
      try {
        const stored = localStorage.getItem('mobileOfflineQueue');
        if (stored) {
          const operations = JSON.parse(stored);
          setOfflineQueue(operations);
        }
      } catch (error) {
        console.error('[Mobile] Failed to load offline queue:', error);
      }
    };

    loadQueuedOperations();

    // Listen for online/offline events
    const handleOnline = () => {
      setState(prev => ({
        ...prev,
        network: { ...prev.network, isOnline: true },
      }));
      
      if (offlineQueue.length > 0) {
        syncOfflineOperations();
      }
    };

    const handleOffline = () => {
      setState(prev => ({
        ...prev,
        network: { ...prev.network, isOnline: false },
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [defaultSettings.enableOfflineSync, offlineQueue.length]);

  // Queue offline operation
  const queueOfflineOperation = useCallback((operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retries' | 'status'>) => {
    const newOperation: OfflineOperation = {
      ...operation,
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
      status: 'pending',
    };

    setOfflineQueue(prev => {
      const updated = [...prev, newOperation];
      
      // Persist to storage
      try {
        localStorage.setItem('mobileOfflineQueue', JSON.stringify(updated));
      } catch (error) {
        console.error('[Mobile] Failed to persist offline queue:', error);
      }
      
      return updated;
    });

    return newOperation.id;
  }, []);

  // Sync offline operations
  const syncOfflineOperations = useCallback(async () => {
    if (syncInProgress || !state.network.isOnline || offlineQueue.length === 0) {
      return;
    }

    setSyncInProgress(true);

    try {
      const pendingOps = offlineQueue.filter(op => op.status === 'pending');
      
      for (const operation of pendingOps) {
        try {
          // Update status to syncing
          setOfflineQueue(prev => 
            prev.map(op => 
              op.id === operation.id 
                ? { ...op, status: 'syncing' as const }
                : op
            )
          );

          // Execute the operation
          await executeOfflineOperation(operation);

          // Mark as completed and remove from queue
          setOfflineQueue(prev => {
            const updated = prev.filter(op => op.id !== operation.id);
            
            // Update storage
            try {
              localStorage.setItem('mobileOfflineQueue', JSON.stringify(updated));
            } catch (error) {
              console.error('[Mobile] Failed to update offline queue:', error);
            }
            
            return updated;
          });

          console.log(`[Mobile] Synced operation: ${operation.type} ${operation.endpoint}`);
        } catch (error) {
          // Handle retry logic
          setOfflineQueue(prev =>
            prev.map(op => {
              if (op.id === operation.id) {
                const retries = op.retries + 1;
                return {
                  ...op,
                  retries,
                  status: retries >= 3 ? 'failed' as const : 'pending' as const,
                };
              }
              return op;
            })
          );

          console.error(`[Mobile] Operation failed: ${operation.id}`, error);
        }
      }
    } finally {
      setSyncInProgress(false);
    }
  }, [syncInProgress, state.network.isOnline, offlineQueue]);

  // Execute offline operation
  const executeOfflineOperation = useCallback(async (operation: OfflineOperation) => {
    const { endpoint, data, type } = operation;

    const requestOptions: RequestInit = {
      method: type === 'create' ? 'POST' : type === 'update' ? 'PUT' : 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: type !== 'delete' ? JSON.stringify(data) : undefined,
    };

    const response = await fetch(endpoint, requestOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }, []);

  // Setup push notifications
  const setupPushNotifications = useCallback(async () => {
    if (!defaultSettings.enablePushNotifications || !swRegistration) return;

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Subscribe to push notifications
        const subscription = await swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        });

        console.log('[Mobile] Push notification subscription:', subscription);
        
        setState(prev => ({
          ...prev,
          features: {
            ...prev.features,
            notifications: true,
          },
        }));

        return subscription;
      }
    } catch (error) {
      console.error('[Mobile] Push notification setup failed:', error);
    }

    return null;
  }, [defaultSettings.enablePushNotifications, swRegistration]);

  // Send push notification
  const sendPushNotification = useCallback(async (payload: PushNotificationPayload) => {
    if (!swRegistration || !state.features.notifications) {
      console.warn('[Mobile] Push notifications not available');
      return false;
    }

    try {
      await swRegistration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icon-192x192.png',
        badge: payload.badge || '/badge-72x72.png',
        image: payload.image,
        data: payload.data,
        actions: payload.actions,
        tag: payload.tag,
        requireInteraction: payload.requireInteraction,
        silent: payload.silent,
        vibrate: payload.vibrate,
      });

      return true;
    } catch (error) {
      console.error('[Mobile] Failed to send push notification:', error);
      return false;
    }
  }, [swRegistration, state.features.notifications]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('[Mobile] This browser does not support notifications');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      
      setState(prev => ({
        ...prev,
        features: {
          ...prev.features,
          notifications: granted,
        },
      }));

      return granted;
    } catch (error) {
      console.error('[Mobile] Failed to request notification permission:', error);
      return false;
    }
  }, []);

  // Install PWA
  const installPWA = useCallback(async () => {
    if (!state.pwa.installPrompt) {
      console.warn('[Mobile] No install prompt available');
      return false;
    }

    try {
      (state.pwa.installPrompt as any).prompt();
      const { outcome } = await (state.pwa.installPrompt as any).userChoice;
      
      if (outcome === 'accepted') {
        setState(prev => ({
          ...prev,
          pwa: {
            ...prev.pwa,
            isInstalled: true,
            installPrompt: null,
          },
        }));
        return true;
      }
    } catch (error) {
      console.error('[Mobile] PWA installation failed:', error);
    }

    return false;
  }, [state.pwa.installPrompt]);

  // Adaptive quality based on performance
  const getAdaptiveQuality = useCallback(() => {
    if (!defaultSettings.adaptiveQuality) return 'high';

    const { frameRate, batteryLevel, isLowPowerMode } = state.performance;
    const { saveData } = state.network;

    if (isLowPowerMode || batteryLevel !== null && batteryLevel < 20) {
      return 'low';
    }

    if (saveData || frameRate < 30) {
      return 'medium';
    }

    return 'high';
  }, [defaultSettings.adaptiveQuality, state.performance, state.network]);

  // Initialize everything
  useEffect(() => {
    const initialize = async () => {
      // Detect device capabilities
      const deviceInfo = detectDevice();
      const pwa = detectPWA();
      const network = detectNetwork();
      const features = await detectFeatures();

      setState(prev => ({
        ...prev,
        deviceInfo,
        pwa,
        network,
        features,
      }));

      // Setup service worker
      const registration = await registerServiceWorker();
      
      if (registration) {
        // Setup push notifications
        await setupPushNotifications();
      }

      // Setup offline sync
      setupOfflineSync();

      // Start performance monitoring
      if (defaultSettings.enablePerformanceMonitoring) {
        monitorPerformance();
      }
    };

    initialize();

    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setState(prev => ({
        ...prev,
        pwa: {
          ...prev.pwa,
          isInstallable: true,
          canInstall: true,
          installPrompt: e,
        },
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for orientation changes
    const handleOrientationChange = () => {
      setTimeout(() => {
        const deviceInfo = detectDevice();
        setState(prev => ({
          ...prev,
          deviceInfo,
        }));
      }, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    // Listen for visibility changes
    const handleVisibilityChange = () => {
      setState(prev => ({
        ...prev,
        appState: {
          ...prev.appState,
          visibility: document.hidden ? 'hidden' : 'visible',
          isActive: !document.hidden,
          isBackground: document.hidden,
        },
      }));
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Clear intervals
      intervalRefs.current.forEach(interval => clearInterval(interval));
      intervalRefs.current = [];
      
      // Clear observers
      observerRefs.current.forEach(observer => observer.disconnect?.());
      observerRefs.current = [];
    };
  }, []);

  // Auto-sync offline operations periodically
  useEffect(() => {
    if (!defaultSettings.enableOfflineSync) return;

    const syncInterval = setInterval(() => {
      if (state.network.isOnline && offlineQueue.length > 0) {
        syncOfflineOperations();
      }
    }, 30000); // Every 30 seconds

    intervalRefs.current.push(syncInterval);

    return () => clearInterval(syncInterval);
  }, [defaultSettings.enableOfflineSync, state.network.isOnline, offlineQueue.length, syncOfflineOperations]);

  // Generate mobile report
  const generateMobileReport = useCallback(() => {
    const { deviceInfo, pwa, network, performance, features, appState } = state;
    
    return {
      timestamp: new Date().toISOString(),
      device: {
        ...deviceInfo,
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      pwa: {
        ...pwa,
        serviceWorkerReady: !!swRegistration,
      },
      network: {
        ...network,
        downlink: (navigator as any).connection?.downlink,
        rtt: (navigator as any).connection?.rtt,
      },
      performance: {
        ...performance,
        loadTime: typeof window !== 'undefined' && 'performance' in window ? performance.now() : 0,
        memoryInfo: typeof window !== 'undefined' && (performance as any).memory ? {
          used: (performance as any).memory.usedJSHeapSize,
          total: (performance as any).memory.totalJSHeapSize,
          limit: (performance as any).memory.jsHeapSizeLimit,
        } : null,
      },
      features,
      appState,
      offlineQueue: {
        totalOperations: offlineQueue.length,
        pendingOperations: offlineQueue.filter(op => op.status === 'pending').length,
        failedOperations: offlineQueue.filter(op => op.status === 'failed').length,
        syncInProgress,
      },
      settings: defaultSettings,
      adaptiveQuality: getAdaptiveQuality(),
    };
  }, [state, swRegistration, offlineQueue, syncInProgress, defaultSettings, getAdaptiveQuality]);

  return {
    // State
    ...state,
    
    // Offline operations
    offlineQueue,
    syncInProgress,
    queueOfflineOperation,
    syncOfflineOperations,
    
    // PWA functions
    installPWA,
    
    // Push notifications
    sendPushNotification,
    requestNotificationPermission,
    
    // Utilities
    getAdaptiveQuality,
    generateMobileReport,
    
    // Service worker
    swRegistration,
    
    // Settings
    settings: defaultSettings,
  };
};

export default useMobileEcosystem;
export type { 
  MobileEcosystemState, 
  MobileOptimizationSettings, 
  OfflineOperation, 
  PushNotificationPayload 
}; 