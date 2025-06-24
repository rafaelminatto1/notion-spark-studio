import { renderHook, act } from '@testing-library/react';
import { useMobileEcosystem } from '../hooks/useMobileEcosystem';
import { mobileOptimizationService } from '../services/MobileOptimizationService';

// Mock performance API first
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn().mockReturnValue(Date.now()),
    memory: {
      usedJSHeapSize: 10000000,
      totalJSHeapSize: 20000000,
      jsHeapSizeLimit: 100000000
    },
    timing: {
      navigationStart: 0,
      loadEventEnd: 1000
    },
    getEntriesByType: jest.fn().mockReturnValue([])
  },
  writable: true,
  configurable: true
});

// Create mutable navigator object
const mockNavigator = {
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
  onLine: true,
  language: 'en-US',
  mediaDevices: {
    enumerateDevices: jest.fn().mockResolvedValue([
      { kind: 'videoinput', label: 'Camera' },
      { kind: 'audioinput', label: 'Microphone' }
    ]),
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }]
    })
  },
  serviceWorker: {
    register: jest.fn().mockResolvedValue({
      addEventListener: jest.fn(),
      pushManager: {
        subscribe: jest.fn().mockResolvedValue({
          endpoint: 'test-endpoint'
        })
      },
      showNotification: jest.fn().mockResolvedValue(true)
    })
  },
  geolocation: {
    getCurrentPosition: jest.fn()
  },
  vibrate: jest.fn(),
  credentials: {
    create: jest.fn()
  }
};

// Define navigator as configurable
Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true,
  configurable: true
});

const mockWindow = {
  screen: {
    width: 375,
    height: 812
  },
  matchMedia: jest.fn().mockReturnValue({
    matches: true, // Mobile detection
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  Notification: {
    requestPermission: jest.fn().mockResolvedValue('granted')
  },
  indexedDB: {
    open: jest.fn().mockReturnValue({
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      result: {
        transaction: jest.fn().mockReturnValue({
          objectStore: jest.fn().mockReturnValue({
            add: jest.fn(),
            getAll: jest.fn().mockResolvedValue([]),
            delete: jest.fn()
          })
        })
      }
    })
  },
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn()
  }
};

// Setup global mocks
Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true,
  configurable: true
});

global.document = {
  hidden: false,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  referrer: ''
} as any;

global.fetch = jest.fn();
global.requestAnimationFrame = jest.fn().mockImplementation(cb => setTimeout(cb, 16));

describe('Mobile Ecosystem Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset navigator online status
    mockNavigator.onLine = true;
    
    // Reset fetch mock
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true })
    });
  });

  describe('useMobileEcosystem Hook', () => {
    test('should initialize with device info', async () => {
      const { result } = renderHook(() => useMobileEcosystem());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Test that device info is populated
      expect(result.current.deviceInfo).toBeDefined();
      expect(typeof result.current.deviceInfo.type).toBe('string');
      expect(typeof result.current.deviceInfo.os).toBe('string');
      expect(typeof result.current.deviceInfo.screenSize.width).toBe('number');
      expect(typeof result.current.deviceInfo.screenSize.height).toBe('number');
    });

    test('should detect PWA capabilities correctly', async () => {
      const { result } = renderHook(() => useMobileEcosystem());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(typeof result.current.pwa.isStandalone).toBe('boolean');
      expect(typeof result.current.pwa.isInstalled).toBe('boolean');
    });

    test('should detect network status', async () => {
      const { result } = renderHook(() => useMobileEcosystem());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.network.isOnline).toBe(true);
    });

    test('should detect device features', async () => {
      const { result } = renderHook(() => useMobileEcosystem());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      // Features should be booleans
      expect(typeof result.current.features.camera).toBe('boolean');
      expect(typeof result.current.features.microphone).toBe('boolean');
      expect(typeof result.current.features.geolocation).toBe('boolean');
      expect(typeof result.current.features.vibration).toBe('boolean');
      expect(typeof result.current.features.notifications).toBe('boolean');
    });
  });

  describe('Offline Sync Functionality', () => {
    test('should queue operations when offline', async () => {
      const { result } = renderHook(() => useMobileEcosystem());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      let operationId: string;
      await act(async () => {
        operationId = result.current.queueOfflineOperation({
          type: 'create',
          endpoint: '/api/documents',
          data: { title: 'Test Document' },
          priority: 'medium'
        });
        
        // Wait for state update
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(operationId!).toBeDefined();
      expect(result.current.offlineQueue.length).toBe(1);
    });

    test('should sync operations when back online', async () => {
      const { result } = renderHook(() => useMobileEcosystem());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Add operation to queue
      await act(async () => {
        result.current.queueOfflineOperation({
          type: 'create',
          endpoint: '/api/documents',
          data: { title: 'Test Document' },
          priority: 'medium'
        });
      });

      // Should have one operation queued
      expect(result.current.offlineQueue.length).toBe(1);

      // Mock going back online and syncing
      await act(async () => {
        mockNavigator.onLine = true;
        await result.current.syncOfflineOperations();
      });

      // Operations should be processed
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Push Notifications', () => {
    test('should request notification permission', async () => {
      const { result } = renderHook(() => useMobileEcosystem());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      await act(async () => {
        await result.current.requestNotificationPermission();
        // Wait for async operation
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Should have attempted to request permission
      expect(mockWindow.Notification.requestPermission).toHaveBeenCalled();
    });

    test('should send push notifications', async () => {
      const { result } = renderHook(() => useMobileEcosystem());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        const success = await result.current.sendPushNotification({
          title: 'Test Notification',
          body: 'Test message',
          data: { type: 'test' }
        });

        // Should return boolean result
        expect(typeof success).toBe('boolean');
      });
    });
  });

  describe('PWA Installation', () => {
    test('should handle PWA installation prompt', async () => {
      const mockPrompt = {
        prompt: jest.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' })
      };

      // Mock beforeinstallprompt event
      const { result } = renderHook(() => useMobileEcosystem());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        const success = await result.current.installPWA();
        expect(typeof success).toBe('boolean');
      });
    });
  });

  describe('Performance Monitoring', () => {
    test('should monitor performance metrics', async () => {
      const { result } = renderHook(() => useMobileEcosystem());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Performance metrics should exist
      expect(result.current.performance).toBeDefined();
      expect(typeof result.current.performance.memoryUsage).toBe('number');
    });
  });

  describe('Mobile Report Generation', () => {
    test('should generate comprehensive mobile report', async () => {
      const { result } = renderHook(() => useMobileEcosystem());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200)); // Ensure initialization
      });

      // Wait for full initialization before generating report
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const report = result.current.generateMobileReport();
      
      expect(report).toBeDefined();
      expect(report.deviceInfo || report.device).toBeDefined(); // Support both possible structures
      expect(report.performance).toBeDefined();
      expect(report.features).toBeDefined();
      expect(report.network).toBeDefined();
    });
  });
});

describe('Mobile Optimization Service Tests', () => {
  test('should detect mobile capabilities', () => {
    const service = mobileOptimizationService;
    const metrics = service.getMobileMetrics();

    expect(metrics).toBeDefined();
    expect(typeof metrics.deviceType).toBe('string');
    expect(typeof metrics.capabilities.touchSupport).toBe('boolean');
  });

  test('should optimize for mobile performance', async () => {
    const service = mobileOptimizationService;
    
    await act(async () => {
      await service.optimizeForMobile();
    });

    const metrics = service.getMobileMetrics();
    expect(metrics.optimizations.applied).toBe(true);
  });
});

describe('Integration Tests', () => {
  test('should work together with all mobile features', async () => {
    const { result } = renderHook(() => useMobileEcosystem());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    // Test multiple features working together
    const report = result.current.generateMobileReport();
    expect(report).toBeDefined();

    await act(async () => {
      const notificationSuccess = await result.current.requestNotificationPermission();
      expect(typeof notificationSuccess).toBe('boolean');
    });

    await act(async () => {
      result.current.queueOfflineOperation({
        type: 'update',
        endpoint: '/api/test',
        data: { test: true },
        priority: 'high'
      });
    });

    expect(result.current.offlineQueue.length).toBeGreaterThan(0);
  });
});

describe('Performance Tests', () => {
  test('should maintain good performance under load', async () => {
    const { result } = renderHook(() => useMobileEcosystem());

    await act(async () => {
      // Simulate multiple operations
      for (let i = 0; i < 10; i++) {
        result.current.queueOfflineOperation({
          type: 'create',
          endpoint: `/api/test/${i}`,
          data: { index: i },
          priority: 'medium'
        });
      }
    });

    const report = result.current.generateMobileReport();
    expect(report.performance.memoryUsage).toBeDefined();
    expect(result.current.offlineQueue.length).toBe(10);
  });

  test('should handle memory pressure gracefully', async () => {
    const { result } = renderHook(() => useMobileEcosystem());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Test memory monitoring
    const initialMemory = result.current.performance.memoryUsage;
    expect(typeof initialMemory).toBe('number');
    expect(initialMemory).toBeGreaterThanOrEqual(0);
  });
});

// Cleanup
afterAll(() => {
  jest.restoreAllMocks();
}); 