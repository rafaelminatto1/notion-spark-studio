// Sistema de configuração de ambiente - FASE 3: Produção & Deploy
// Suporta múltiplos ambientes: development, test, production

export type Environment = 'development' | 'test' | 'production';

export interface EnvironmentConfig {
  NODE_ENV: Environment;
  APP_NAME: string;
  APP_VERSION: string;
  API_BASE_URL: string;
  WS_URL: string;
  
  // Features flags
  ENABLE_PERFORMANCE_MONITOR: boolean;
  ENABLE_COLLABORATION: boolean;
  ENABLE_AI_TAGGING: boolean;
  ENABLE_OFFLINE_MODE: boolean;
  
  // Performance
  MAX_FILE_SIZE: number;
  MAX_CONNECTIONS: number;
  CACHE_TTL: number;
  
  // Debug
  DEBUG_MODE: boolean;
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
  
  // Analytics
  ENABLE_ANALYTICS: boolean;
  ANALYTICS_ID?: string;
  
  // Build info
  BUILD_TIME?: string;
  COMMIT_HASH?: string;
}

// 🚀 CORREÇÃO: Função para obter variáveis de ambiente de forma compatível
function getEnvVar(key: string, defaultValue: string = ''): string {
  // Tentar import.meta.env primeiro (Vite)
  if (typeof window !== 'undefined') {
    try {
      // @ts-ignore - Acesso dinâmico para evitar erro de compilação
      const importMeta = (globalThis as any).import?.meta;
      if (importMeta?.env?.[key]) {
        return importMeta.env[key];
      }
    } catch (error) {
      // Ignora erro se import.meta não estiver disponível
    }
  }
  
  // Fallback para process.env (Next.js)
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }
  
  return defaultValue;
}

// 🚀 CORREÇÃO: Detectar ambiente de forma compatível
function getCurrentEnvironment(): Environment {
  const nodeEnv = getEnvVar('NODE_ENV', 'development');
  const mode = getEnvVar('MODE', nodeEnv);
  
  // Priorizar NODE_ENV, depois MODE
  const env = nodeEnv || mode;
  return ['development', 'test', 'production'].includes(env) ? env as Environment : 'development';
}

// Configuração padrão
const defaultConfig: EnvironmentConfig = {
  NODE_ENV: 'development',
  APP_NAME: 'Notion Spark Studio',
  APP_VERSION: '2.0.0',
  API_BASE_URL: 'http://localhost:3001',
  WS_URL: 'ws://localhost:8080',
  
  ENABLE_PERFORMANCE_MONITOR: true,
  ENABLE_COLLABORATION: true,
  ENABLE_AI_TAGGING: true,
  ENABLE_OFFLINE_MODE: true,
  
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_CONNECTIONS: 100,
  CACHE_TTL: 300000, // 5 minutos
  
  DEBUG_MODE: true,
  LOG_LEVEL: 'debug',
  
  ENABLE_ANALYTICS: false,
};

// Configurações específicas por ambiente
const environments: Record<Environment, Partial<EnvironmentConfig>> = {
  development: {
    DEBUG_MODE: true,
    LOG_LEVEL: 'debug',
    ENABLE_ANALYTICS: false,
    API_BASE_URL: 'http://localhost:3001',
    WS_URL: 'ws://localhost:8080',
  },
  
  test: {
    DEBUG_MODE: false,
    LOG_LEVEL: 'error',
    ENABLE_ANALYTICS: false,
    ENABLE_PERFORMANCE_MONITOR: false,
    API_BASE_URL: 'http://localhost:3001',
    WS_URL: 'ws://localhost:8080',
    CACHE_TTL: 1000, // Cache mais curto para testes
  },
  
  production: {
    DEBUG_MODE: false,
    LOG_LEVEL: 'warn',
    ENABLE_ANALYTICS: true,
    API_BASE_URL: getEnvVar('VITE_API_BASE_URL', 'https://api.notion-spark.com'),
    WS_URL: getEnvVar('VITE_WS_URL', 'wss://ws.notion-spark.com'),
    ANALYTICS_ID: getEnvVar('VITE_ANALYTICS_ID'),
    MAX_CONNECTIONS: 1000,
    CACHE_TTL: 3600000, // 1 hora
  },
};

// Criar configuração final
function createConfig(): EnvironmentConfig {
  const currentEnv = getCurrentEnvironment();
  const envConfig = environments[currentEnv] || {};
  
  const config: EnvironmentConfig = {
    ...defaultConfig,
    ...envConfig,
    NODE_ENV: currentEnv,
    
    // Override com variáveis de ambiente
    APP_NAME: getEnvVar('VITE_APP_NAME', defaultConfig.APP_NAME),
    APP_VERSION: getEnvVar('VITE_APP_VERSION', defaultConfig.APP_VERSION),
    BUILD_TIME: getEnvVar('VITE_BUILD_TIME'),
    COMMIT_HASH: getEnvVar('VITE_COMMIT_HASH'),
  };
  
  return config;
}

// Exportar configuração
export const config = createConfig();

// Helpers para verificar ambiente
export const isDevelopment = config.NODE_ENV === 'development';
export const isTest = config.NODE_ENV === 'test';
export const isProduction = config.NODE_ENV === 'production';

// Logs de configuração (apenas em desenvolvimento)
if (isDevelopment && typeof console !== 'undefined') {
  console.log('🔧 Environment Configuration:', {
    environment: config.NODE_ENV,
    version: config.APP_VERSION,
    features: {
      performanceMonitor: config.ENABLE_PERFORMANCE_MONITOR,
      collaboration: config.ENABLE_COLLABORATION,
      aiTagging: config.ENABLE_AI_TAGGING,
      offlineMode: config.ENABLE_OFFLINE_MODE,
      analytics: config.ENABLE_ANALYTICS,
    },
    urls: {
      api: config.API_BASE_URL,
      websocket: config.WS_URL,
    },
    debug: config.DEBUG_MODE,
    logLevel: config.LOG_LEVEL,
  });
}

// Type guard para features
export function isFeatureEnabled(feature: keyof Pick<EnvironmentConfig, 
  'ENABLE_PERFORMANCE_MONITOR' | 
  'ENABLE_COLLABORATION' | 
  'ENABLE_AI_TAGGING' | 
  'ENABLE_OFFLINE_MODE' | 
  'ENABLE_ANALYTICS'>): boolean {
  return config[feature];
}

// Helper para logging condicionado ao ambiente
export function logConfig(level: EnvironmentConfig['LOG_LEVEL'], message: string, ...args: unknown[]): void {
  if (typeof console === 'undefined') return;
  
  const levels = ['error', 'warn', 'info', 'debug'];
  const currentLevelIndex = levels.indexOf(config.LOG_LEVEL);
  const messageLevel = levels.indexOf(level);
  
  if (messageLevel <= currentLevelIndex) {
    console[level](`[${config.APP_NAME}]`, message, ...args);
  }
}

export default config; 