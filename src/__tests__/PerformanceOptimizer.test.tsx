
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  IntelligentPreloader, 
  AdvancedCacheManager, 
  BundleAnalyzer,
  PerformanceAnalyzer 
} from '@/utils/PerformanceOptimizer';

// Mock do Service Worker
const mockServiceWorker = {
  register: vi.fn().mockResolvedValue({
    active: {
      postMessage: vi.fn()
    }
  })
};

Object.defineProperty(navigator, 'serviceWorker', {
  value: mockServiceWorker,
  writable: true
});

// Mock do requestIdleCallback
Object.defineProperty(window, 'requestIdleCallback', {
  value: (callback: Function) => {
    callback({ timeRemaining: () => 50 });
  },
  writable: true
});

describe('IntelligentPreloader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve rastrear navegação do usuário', () => {
    IntelligentPreloader.trackUserNavigation('/dashboard');
    IntelligentPreloader.trackUserNavigation('/notion');
    
    const predictions = IntelligentPreloader.predictNextRoutes('/dashboard');
    expect(predictions).toBeDefined();
    expect(Array.isArray(predictions)).toBe(true);
  });

  it('deve gerenciar preload por hover corretamente', async () => {
    const mockImport = vi.fn().mockResolvedValue({ default: () => null });
    
    IntelligentPreloader.preloadOnHover('TestComponent', mockImport);
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    expect(mockImport).toHaveBeenCalled();
  });
});

describe('AdvancedCacheManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve inicializar service worker corretamente', async () => {
    await AdvancedCacheManager.initialize();
    
    expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js');
  });
});

describe('BundleAnalyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if ((BundleAnalyzer as any).chunks) {
      (BundleAnalyzer as any).chunks.clear();
    }
  });

  it('deve rastrear carregamento de chunks', () => {
    BundleAnalyzer.trackChunkLoad('dashboard', 512000, 1500, ['react']);
    
    const report = BundleAnalyzer.getPerformanceReport();
    
    expect(report.totalChunks).toBe(1);
    expect(report.totalSize).toBe(512000);
  });
});

describe('PerformanceAnalyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: (header: string) => header === 'content-length' ? '500000' : null
      }
    });
  });

  it('deve analisar métricas de performance', async () => {
    vi.spyOn(performance, 'now')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(1000);
    
    const metrics = await PerformanceAnalyzer.analyzeBundle();
    
    expect(metrics).toHaveProperty('bundleSize');
    expect(metrics).toHaveProperty('loadTime');
    expect(metrics.loadTime).toBe(1000);
  });
});
