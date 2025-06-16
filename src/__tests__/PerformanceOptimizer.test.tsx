import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  IntelligentPreloader, 
  AdvancedCacheManager, 
  BundleAnalyzer,
  PerformanceAnalyzer 
} from '@/utils/PerformanceOptimizer';

// Mock do Service Worker
const mockServiceWorker = {
  register: jest.fn().mockResolvedValue({
    active: {
      postMessage: jest.fn()
    }
  }),
  getRegistration: jest.fn().mockResolvedValue(null)
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
    // Limpar estado antes de cada teste
    jest.clearAllMocks();
  });

  test('deve rastrear navegação do usuário', () => {
    IntelligentPreloader.trackUserNavigation('/dashboard');
    IntelligentPreloader.trackUserNavigation('/notion');
    IntelligentPreloader.trackUserNavigation('/dashboard');

    const predictions = IntelligentPreloader.predictNextRoutes('/dashboard');
    expect(predictions).toBeDefined();
    expect(Array.isArray(predictions)).toBe(true);
  });

  test('deve prever próximas rotas baseado no histórico', () => {
    // Simular padrão de navegação
    IntelligentPreloader.trackUserNavigation('/dashboard');
    IntelligentPreloader.trackUserNavigation('/notion');
    IntelligentPreloader.trackUserNavigation('/dashboard');
    IntelligentPreloader.trackUserNavigation('/notion');

    const predictions = IntelligentPreloader.predictNextRoutes('/dashboard');
    expect(predictions.length).toBeGreaterThan(0);
    // Deve predizer '/notion' como alta probabilidade
    expect(predictions).toContain('/notion');
  });

  test('deve gerenciar preload por hover corretamente', async () => {
    const mockImport = jest.fn().mockResolvedValue({ default: () => null });
    
    IntelligentPreloader.preloadOnHover('TestComponent', mockImport);
    
    // Aguardar o delay de hover (150ms)
    await waitFor(() => {
      expect(mockImport).toHaveBeenCalled();
    }, { timeout: 200 });
  });

  test('deve cancelar preload por hover', () => {
    const mockImport = jest.fn().mockResolvedValue({ default: () => null });
    
    IntelligentPreloader.preloadOnHover('TestComponent', mockImport);
    IntelligentPreloader.cancelHoverPreload('TestComponent');
    
    // Verificar que o import não foi chamado após cancelamento
    setTimeout(() => {
      expect(mockImport).not.toHaveBeenCalled();
    }, 200);
  });

  test('deve fazer preload durante idle time', () => {
    const mockImports = [
      { name: 'Component1', import: jest.fn().mockResolvedValue({}), priority: 10 },
      { name: 'Component2', import: jest.fn().mockResolvedValue({}), priority: 5 },
      { name: 'Component3', import: jest.fn().mockResolvedValue({}), priority: 8 }
    ];

    IntelligentPreloader.preloadOnIdle(mockImports);

    // Verificar que componentes de alta prioridade são carregados primeiro
    expect(mockImports[0].import).toHaveBeenCalled(); // priority 10
    expect(mockImports[2].import).toHaveBeenCalled(); // priority 8
  });
});

describe('AdvancedCacheManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve inicializar service worker corretamente', async () => {
    await AdvancedCacheManager.initialize();
    
    expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js');
  });

  test('deve enviar estratégias de cache para service worker', async () => {
    const mockRegistration = {
      active: {
        postMessage: jest.fn()
      }
    };
    
    mockServiceWorker.register.mockResolvedValue(mockRegistration);
    
    await AdvancedCacheManager.initialize();
    
    expect(mockRegistration.active.postMessage).toHaveBeenCalledWith({
      type: 'CACHE_STRATEGY',
      strategy: {
        images: 'cache-first',
        apis: 'network-first',
        chunks: 'stale-while-revalidate',
        fonts: 'cache-first'
      }
    });
  });

  test('deve fazer preload de recursos críticos', async () => {
    const mockRegistration = {
      active: {
        postMessage: jest.fn()
      }
    };
    
    mockServiceWorker.register.mockResolvedValue(mockRegistration);
    
    await AdvancedCacheManager.initialize();
    await AdvancedCacheManager.preloadCriticalResources();
    
    expect(mockRegistration.active.postMessage).toHaveBeenCalledWith({
      type: 'PRELOAD_RESOURCES',
      resources: [
        '/api/user/profile',
        '/api/templates/recent',
        '/fonts/inter-var.woff2'
      ]
    });
  });
});

describe('BundleAnalyzer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Limpar estado do BundleAnalyzer antes de cada teste
    (BundleAnalyzer as any).chunks = new Map();
  });

  test('deve rastrear carregamento de chunks', () => {
    BundleAnalyzer.trackChunkLoad('dashboard', 512000, 1500, ['react', 'lodash']);
    BundleAnalyzer.trackChunkLoad('settings', 256000, 800, ['react']);
    
    const report = BundleAnalyzer.getPerformanceReport();
    
    expect(report.totalChunks).toBe(2);
    expect(report.totalSize).toBe(768000); // 512k + 256k
    expect(report.avgLoadTime).toBe(1150); // (1500 + 800) / 2
  });

  test('deve detectar chunks problemáticos', () => {
    // Simular console.warn para capturar warnings
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    // Chunk muito lento (> 2000ms)
    BundleAnalyzer.trackChunkLoad('slow-chunk', 100000, 3000);
    
    // Chunk muito grande (> 500KB)
    BundleAnalyzer.trackChunkLoad('large-chunk', 600000, 1000);
    
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Performance issues detected:',
      expect.objectContaining({
        slowChunks: ['slow-chunk'],
        largeChunks: ['large-chunk']
      })
    );
    
    consoleWarnSpy.mockRestore();
  });

  test('deve gerar relatório de performance detalhado', () => {
    BundleAnalyzer.trackChunkLoad('efficient-chunk', 100000, 500);
    BundleAnalyzer.trackChunkLoad('inefficient-chunk', 500000, 3000);
    
    const report = BundleAnalyzer.getPerformanceReport();
    
    expect(report.mostEfficient[0].name).toBe('efficient-chunk');
    expect(report.leastEfficient[0].name).toBe('inefficient-chunk');
    
    // Verificar cálculo de eficiência (bytes per ms)
    expect(report.mostEfficient[0].efficiency).toBeGreaterThan(
      report.leastEfficient[0].efficiency
    );
  });

  test('deve enviar eventos de otimização', () => {
    const eventSpy = jest.spyOn(window, 'dispatchEvent');
    
    BundleAnalyzer.trackChunkLoad('large-slow-chunk', 600000, 3000);
    
    expect(eventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'bundle-optimization-suggestions',
        detail: expect.objectContaining({
          suggestions: expect.arrayContaining([
            expect.stringContaining('large chunks'),
            expect.stringContaining('slow-loading chunks')
          ])
        })
      })
    );
    
    eventSpy.mockRestore();
  });
});

describe('PerformanceAnalyzer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock do fetch para análise de bundle
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('.js')) {
        return Promise.resolve({
          headers: {
            get: (header: string) => header === 'content-length' ? '500000' : null
          }
        });
      }
      return Promise.resolve({
        headers: {
          get: () => null
        }
      });
    });
  });

  test('deve analisar métricas de performance', async () => {
    // Mock do performance.now()
    jest.spyOn(performance, 'now')
      .mockReturnValueOnce(0)   // start time
      .mockReturnValueOnce(1000); // end time
    
    const metrics = await PerformanceAnalyzer.analyzeBundle();
    
    expect(metrics).toHaveProperty('bundleSize');
    expect(metrics).toHaveProperty('loadTime');
    expect(metrics).toHaveProperty('renderTime');
    expect(metrics).toHaveProperty('memoryUsage');
    expect(metrics).toHaveProperty('cacheHitRate');
    
    expect(metrics.loadTime).toBe(1000);
  });

  test('deve gerar sugestões de otimização baseadas em métricas', async () => {
    // Simular métricas problemáticas
    await PerformanceAnalyzer.analyzeBundle();
    
    const suggestions = PerformanceAnalyzer.generateOptimizationSuggestions();
    
    expect(Array.isArray(suggestions)).toBe(true);
    
    suggestions.forEach(suggestion => {
      expect(suggestion).toHaveProperty('type');
      expect(suggestion).toHaveProperty('priority');
      expect(suggestion).toHaveProperty('description');
      expect(suggestion).toHaveProperty('impact');
      expect(suggestion).toHaveProperty('implementation');
      expect(typeof suggestion.implementation).toBe('function');
    });
  });

  test('deve categorizar sugestões por prioridade', async () => {
    await PerformanceAnalyzer.analyzeBundle();
    const suggestions = PerformanceAnalyzer.generateOptimizationSuggestions();
    
    const priorities = suggestions.map(s => s.priority);
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    
    priorities.forEach(priority => {
      expect(validPriorities).toContain(priority);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});

describe('Integração dos Sistemas de Performance', () => {
  test('deve integrar preloader, cache e analyzer corretamente', async () => {
    // Simular fluxo completo
    IntelligentPreloader.trackUserNavigation('/dashboard');
    
    await AdvancedCacheManager.initialize();
    
    BundleAnalyzer.trackChunkLoad('dashboard', 300000, 1200);
    
    const metrics = await PerformanceAnalyzer.analyzeBundle();
    const suggestions = PerformanceAnalyzer.generateOptimizationSuggestions();
    
    expect(metrics).toBeDefined();
    expect(suggestions).toBeDefined();
    
    // Verificar que sistemas estão trabalhando juntos
    const report = BundleAnalyzer.getPerformanceReport();
    expect(report.totalChunks).toBeGreaterThan(0);
  });

  test('deve manter consistência entre sistemas', () => {
    // Testar que mudanças em um sistema refletem nos outros
    BundleAnalyzer.trackChunkLoad('component-a', 100000, 500);
    BundleAnalyzer.trackChunkLoad('component-b', 200000, 1000);
    
    const report1 = BundleAnalyzer.getPerformanceReport();
    expect(report1.totalChunks).toBe(2);
    
    BundleAnalyzer.trackChunkLoad('component-c', 150000, 750);
    
    const report2 = BundleAnalyzer.getPerformanceReport();
    expect(report2.totalChunks).toBe(3);
    expect(report2.totalSize).toBeGreaterThan(report1.totalSize);
  });
});

// Testes de Error Handling
describe('Error Handling dos Sistemas de Performance', () => {
  test('deve lidar com falhas de Service Worker graciosamente', async () => {
    mockServiceWorker.register.mockRejectedValue(new Error('SW registration failed'));
    
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    await AdvancedCacheManager.initialize();
    
    expect(consoleWarnSpy).toHaveBeenCalledWith('SW registration failed:', expect.any(Error));
    
    consoleWarnSpy.mockRestore();
  });

  test('deve funcionar sem requestIdleCallback', () => {
    // Remover requestIdleCallback temporariamente
    const originalRequestIdleCallback = window.requestIdleCallback;
    delete (window as any).requestIdleCallback;
    
    const mockImports = [
      { name: 'Component1', import: jest.fn().mockResolvedValue({}), priority: 10 }
    ];
    
    // Não deve quebrar sem requestIdleCallback
    expect(() => {
      IntelligentPreloader.preloadOnIdle(mockImports);
    }).not.toThrow();
    
    // Restaurar
    window.requestIdleCallback = originalRequestIdleCallback;
  });

  test('deve lidar com falhas de fetch durante análise de bundle', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    const metrics = await PerformanceAnalyzer.analyzeBundle();
    
    expect(metrics.bundleSize).toBe(0); // Deve retornar 0 em caso de erro
    expect(consoleWarnSpy).toHaveBeenCalledWith('Could not analyze bundle size:', expect.any(Error));
    
    consoleWarnSpy.mockRestore();
  });
}); 