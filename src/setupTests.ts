import '@testing-library/jest-dom';

// Mock do localStorage para todos os testes
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  configurable: true,
  writable: true
});

// Mock do sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    }
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  configurable: true,
  writable: true
});

// Mock do ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock do IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Mock do matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock do navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockImplementation(() => Promise.resolve()),
    readText: jest.fn().mockImplementation(() => Promise.resolve('')),
  },
  configurable: true,
});

// Mock do console para evitar logs desnecessários durante os testes
const originalConsole = { ...console };

beforeEach(() => {
  // Silenciar console.error e console.warn por padrão
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  // Restaurar console original
  jest.restoreAllMocks();
});

// Mock do fetch global
global.fetch = jest.fn();

// Mock do WebSocket
(global as any).WebSocket = class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = 1; // OPEN
  close = jest.fn();
  send = jest.fn();
  addEventListener = jest.fn();
  removeEventListener = jest.fn();

  constructor(url: string, protocols?: string | string[]) {
    // Mock constructor
  }
};

// Mock das Web APIs que podem não estar disponíveis no ambiente de teste
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: (arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    randomUUID: () => '00000000-0000-4000-8000-000000000000',
  },
});

// Mock do URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  value: jest.fn(() => 'mock-url'),
});

Object.defineProperty(URL, 'revokeObjectURL', {
  value: jest.fn(),
});

// Mock do performance
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    timing: {
      navigationStart: Date.now() - 1000,
      loadEventEnd: Date.now(),
      domContentLoadedEventEnd: Date.now() - 500,
      responseStart: Date.now() - 800,
      requestStart: Date.now() - 900,
    },
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000,
    },
  },
});

// Mock do navigator.userAgent
Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  configurable: true,
});

// Mock do navigator.platform
Object.defineProperty(navigator, 'platform', {
  value: 'Win32',
  configurable: true,
});

// Mock do navigator.language
Object.defineProperty(navigator, 'language', {
  value: 'pt-BR',
  configurable: true,
});

// Mock do import.meta.env para Jest
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        MODE: 'test',
        VITE_WS_URL: 'ws://localhost:3001/collaboration',
        VITE_SUPABASE_URL: 'http://localhost:54321',
        VITE_SUPABASE_ANON_KEY: 'test-key',
        DEV: false,
        PROD: false,
        SSR: false
      }
    }
  },
  configurable: true,
});

// Mock do navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  value: true,
  configurable: true,
});

// Mock do window.screen
Object.defineProperty(window, 'screen', {
  value: {
    width: 1920,
    height: 1080,
    availWidth: 1920,
    availHeight: 1040,
  },
});

// Mock do caches (Service Worker API)
Object.defineProperty(window, 'caches', {
  value: {
    open: jest.fn(() => Promise.resolve({
      match: jest.fn(),
      add: jest.fn(),
      addAll: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      keys: jest.fn(() => Promise.resolve([])),
    })),
    has: jest.fn(() => Promise.resolve(false)),
    delete: jest.fn(() => Promise.resolve(true)),
    keys: jest.fn(() => Promise.resolve([])),
  },
});

// Mock do Intl.DateTimeFormat
global.Intl = {
  ...global.Intl,
  DateTimeFormat: jest.fn().mockImplementation(() => ({
    resolvedOptions: () => ({ timeZone: 'America/Sao_Paulo' }),
    format: (date: Date) => date.toLocaleDateString(),
  })),
} as any;

// Configuração global para timeouts de teste
jest.setTimeout(10000); // 10 segundos

// Função helper para aguardar próximo tick
export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0));

// Função helper para aguardar um tempo específico
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Função helper para criar eventos customizados
export const createCustomEvent = (type: string, detail?: any) => {
  return new CustomEvent(type, { detail });
};

// Função helper para simular delay de rede
export const mockNetworkDelay = (ms = 100) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Mock de dados para testes
export const mockFileData = {
  id: 'test-file-123',
  name: 'test-file.md',
  content: '# Test File\n\nThis is a test file for unit testing.',
  tags: ['test', 'mock'],
  lastModified: new Date().toISOString(),
  size: 1024,
  type: 'text/markdown'
};

export const mockUserData = {
  id: 'test-user-123',
  name: 'Test User',
  email: 'test@example.com',
  avatar: null,
  color: '#ff0000',
  role: 'editor' as const,
  permissions: ['read:all', 'write:own'],
  preferences: {
    theme: 'light' as const,
    language: 'pt-BR' as const,
    autoSave: true,
    collaborationMode: true
  },
  lastActivity: new Date(),
  isOnline: true
};

// Limpar todos os mocks antes de cada teste
beforeEach(() => {
  // Limpar localStorage e sessionStorage
  localStorageMock.clear();
  sessionStorageMock.clear();
  
  // Resetar todos os mocks do Jest
  jest.clearAllMocks();
  
  // Resetar fetch mock
  (global.fetch as jest.Mock).mockClear();
});

// Log de configuração (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'test') {
  console.log('🧪 Test environment configured successfully');
}

// Mock para performance API em ambiente de teste
if (typeof global.performance === 'undefined') {
  global.performance = {
    now: jest.fn(() => Date.now()),
    getEntriesByType: jest.fn(() => [
      { name: 'first-contentful-paint', startTime: 100 }
    ]),
    mark: jest.fn(),
    measure: jest.fn(),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    getEntriesByName: jest.fn(() => []),
    navigation: {
      type: 'navigate'
    }
  } as any;
}