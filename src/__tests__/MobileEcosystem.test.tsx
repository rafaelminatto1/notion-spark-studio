
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMobileEcosystem } from '../hooks/useMobileEcosystem';
import { mobileOptimizationService } from '../services/MobileOptimizationService';

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn().mockReturnValue(Date.now()),
    memory: {
      usedJSHeapSize: 10000000,
      totalJSHeapSize: 20000000,
      jsHeapSizeLimit: 100000000
    }
  },
  writable: true,
  configurable: true
});

// Mock navigator
const mockNavigator = {
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
  onLine: true,
  language: 'en-US',
  mediaDevices: {
    enumerateDevices: vi.fn().mockResolvedValue([
      { kind: 'videoinput', label: 'Camera' },
      { kind: 'audioinput', label: 'Microphone' }
    ])
  },
  serviceWorker: {
    register: vi.fn().mockResolvedValue({
      showNotification: vi.fn().mockResolvedValue(true)
    })
  },
  geolocation: {
    getCurrentPosition: vi.fn()
  },
  vibrate: vi.fn()
};

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true,
  configurable: true
});

Object.defineProperty(global, 'window', {
  value: {
    screen: { width: 375, height: 812 },
    matchMedia: vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    Notification: {
      requestPermission: vi.fn().mockResolvedValue('granted')
    }
  },
  writable: true,
  configurable: true
});

global.fetch = vi.fn();

describe('Mobile Ecosystem Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigator.onLine = true;
    
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true })
    });
  });

  describe('useMobileEcosystem Hook', () => {
    it('should initialize with device info', async () => {
      const { result } = renderHook(() => useMobileEcosystem());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.deviceInfo).toBeDefined();
      expect(typeof result.current.deviceInfo.type).toBe('string');
      expect(typeof result.current.deviceInfo.os).toBe('string');
    });

    it('should detect network status', async () => {
      const { result } = renderHook(() => useMobileEcosystem());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.network.isOnline).toBe(true);
    });
  });

  describe('Mobile Optimization Service', () => {
    it('should detect mobile capabilities', () => {
      const service = mobileOptimizationService;
      const metrics = service.getMobileMetrics();

      expect(metrics).toBeDefined();
      expect(typeof metrics.deviceType).toBe('string');
      expect(typeof metrics.capabilities.touchSupport).toBe('boolean');
    });
  });
});
