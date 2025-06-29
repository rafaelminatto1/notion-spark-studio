
import { useState, useEffect } from 'react';

interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  os: string;
  screenSize: {
    width: number;
    height: number;
  };
}

interface PWAInfo {
  isStandalone: boolean;
  isInstalled: boolean;
}

interface NetworkInfo {
  isOnline: boolean;
  connectionType?: string;
}

interface DeviceFeatures {
  camera: boolean;
  microphone: boolean;
  geolocation: boolean;
  vibration: boolean;
  notifications: boolean;
}

interface OfflineOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data: any;
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
}

interface PerformanceInfo {
  memoryUsage: number;
  loadTime: number;
}

export const useMobileEcosystem = () => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    type: 'desktop',
    os: 'unknown',
    screenSize: { width: 0, height: 0 }
  });
  
  const [pwa, setPwa] = useState<PWAInfo>({
    isStandalone: false,
    isInstalled: false
  });
  
  const [network, setNetwork] = useState<NetworkInfo>({
    isOnline: navigator.onLine
  });
  
  const [features, setFeatures] = useState<DeviceFeatures>({
    camera: false,
    microphone: false,
    geolocation: false,
    vibration: false,
    notifications: false
  });
  
  const [offlineQueue, setOfflineQueue] = useState<OfflineOperation[]>([]);
  
  const [performance, setPerformance] = useState<PerformanceInfo>({
    memoryUsage: 0,
    loadTime: 0
  });

  useEffect(() => {
    // Detect device info
    const detectDevice = () => {
      const ua = navigator.userAgent;
      let type: DeviceInfo['type'] = 'desktop';
      let os = 'unknown';

      if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
        type = 'mobile';
      } else if (/iPad|Android/i.test(ua)) {
        type = 'tablet';
      }

      if (/Android/i.test(ua)) os = 'Android';
      else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
      else if (/Windows/i.test(ua)) os = 'Windows';
      else if (/Mac/i.test(ua)) os = 'macOS';
      else if (/Linux/i.test(ua)) os = 'Linux';

      setDeviceInfo({
        type,
        os,
        screenSize: {
          width: window.screen.width,
          height: window.screen.height
        }
      });
    };

    // Detect PWA status
    const detectPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      setPwa({
        isStandalone,
        isInstalled: isStandalone
      });
    };

    // Detect features
    const detectFeatures = async () => {
      const newFeatures: DeviceFeatures = {
        camera: false,
        microphone: false,
        geolocation: !!navigator.geolocation,
        vibration: !!navigator.vibrate,
        notifications: 'Notification' in window
      };

      // Check camera and microphone
      if (navigator.mediaDevices?.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          newFeatures.camera = devices.some(device => device.kind === 'videoinput');
          newFeatures.microphone = devices.some(device => device.kind === 'audioinput');
        } catch (error) {
          // Permissions denied or not available
        }
      }

      setFeatures(newFeatures);
    };

    // Monitor performance
    const monitorPerformance = () => {
      const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
      const loadTime = performance.now();
      
      setPerformance({
        memoryUsage,
        loadTime
      });
    };

    detectDevice();
    detectPWA();
    detectFeatures();
    monitorPerformance();

    // Network status listeners
    const handleOnline = () => setNetwork(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setNetwork(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const queueOfflineOperation = (operation: Omit<OfflineOperation, 'id' | 'timestamp'>): string => {
    const id = Math.random().toString(36).substr(2, 9);
    const newOperation: OfflineOperation = {
      ...operation,
      id,
      timestamp: new Date()
    };
    
    setOfflineQueue(prev => [...prev, newOperation]);
    return id;
  };

  const syncOfflineOperations = async (): Promise<void> => {
    if (!network.isOnline || offlineQueue.length === 0) return;

    const operations = [...offlineQueue];
    setOfflineQueue([]);

    for (const operation of operations) {
      try {
        await fetch(operation.endpoint, {
          method: operation.type === 'create' ? 'POST' : 
                  operation.type === 'update' ? 'PUT' : 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(operation.data)
        });
      } catch (error) {
        // Re-queue failed operations
        setOfflineQueue(prev => [...prev, operation]);
      }
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!features.notifications) return false;
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  };

  const sendPushNotification = async (notification: {
    title: string;
    body: string;
    data?: any;
  }): Promise<boolean> => {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.register('/sw.js');
        await registration.showNotification(notification.title, {
          body: notification.body,
          data: notification.data
        });
        return true;
      }
    } catch (error) {
      console.error('Push notification failed:', error);
    }
    return false;
  };

  const installPWA = async (): Promise<boolean> => {
    // PWA installation logic would go here
    return false;
  };

  const generateMobileReport = () => {
    return {
      deviceInfo,
      pwa,
      network,
      features,
      performance,
      offlineQueue: offlineQueue.length,
      timestamp: new Date()
    };
  };

  return {
    deviceInfo,
    pwa,
    network,
    features,
    offlineQueue,
    performance,
    queueOfflineOperation,
    syncOfflineOperations,
    requestNotificationPermission,
    sendPushNotification,
    installPWA,
    generateMobileReport
  };
};
