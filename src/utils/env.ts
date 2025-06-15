/**
 * Utilitário para acessar variáveis de ambiente de forma compatível
 * entre Vite (import.meta.env) e Next.js (process.env)
 */

interface EnvVars {
  MODE: string;
  VITE_WS_URL?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  DEV: boolean;
  PROD: boolean;
  SSR: boolean;
}

// Variável global para armazenar o ambiente detectado
let cachedEnv: EnvVars | null = null;

/**
 * Função segura para obter variável de ambiente
 * Funciona tanto em ambientes Next.js (process.env) quanto Vite (import.meta.env)
 */
function safeGetEnv(key: string, defaultValue: string = ''): string {
  // Tentar process.env primeiro (Next.js/Node.js)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  
  // Tentar import.meta.env (Vite) de forma segura
  if (typeof window !== 'undefined') {
    try {
      // @ts-expect-error - Acesso dinâmico para evitar erro de compilação
      const importMeta = (globalThis as any).import?.meta;
      if (importMeta && importMeta.env && importMeta.env[key]) {
        return importMeta.env[key] as string;
      }
    } catch (error) {
      // Silently ignore errors
    }
  }
  
  return defaultValue;
}

/**
 * Função interna para obter variável de ambiente (para uso interno do módulo)
 */
function getEnvVar(key: string, defaultValue: string = ''): string {
  // Tentar process.env primeiro (Next.js/Node.js)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  
  // Tentar import.meta.env (Vite) de forma segura
  if (typeof window !== 'undefined') {
    try {
      // @ts-expect-error - Acesso dinâmico para evitar erro de compilação
      const importMeta = (globalThis as any).import?.meta;
      if (importMeta && importMeta.env && importMeta.env[key]) {
        return importMeta.env[key] as string;
      }
    } catch (error) {
      // Silently ignore errors
    }
  }
  
  return defaultValue;
}

/**
 * Detecta se estamos no ambiente Vite usando uma função dinâmica
 */
function getViteEnv(): EnvVars | null {
  try {
    // Usa eval para evitar problemas de parsing no Jest
    const importMeta = eval('typeof import !== "undefined" ? import.meta : null');
    if (importMeta && importMeta.env) {
      return {
        MODE: importMeta.env.MODE || 'development',
        VITE_WS_URL: importMeta.env.VITE_WS_URL,
        VITE_SUPABASE_URL: importMeta.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: importMeta.env.VITE_SUPABASE_ANON_KEY,
        DEV: importMeta.env.DEV || false,
        PROD: importMeta.env.PROD || false,
        SSR: importMeta.env.SSR || false
      };
    }
  } catch (error) {
    // Ignora erro quando import.meta não está disponível
  }
  return null;
}

/**
 * Obtém as variáveis de ambiente de forma compatível
 */
function getEnv(): EnvVars {
  // Cache para evitar re-execução
  if (cachedEnv) {
    return cachedEnv;
  }

  // Se estamos no ambiente de teste (Jest)
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
    cachedEnv = {
      MODE: 'test',
      VITE_WS_URL: 'ws://localhost:3001/collaboration',
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: 'test-key',
      DEV: false,
      PROD: false,
      SSR: false
    };
    return cachedEnv;
  }

  // Tenta obter do Vite
  const viteEnv = getViteEnv();
  if (viteEnv) {
    cachedEnv = viteEnv;
    return cachedEnv;
  }

  // Fallback para Node.js/Next.js
  const nodeEnv = getEnvVar('NODE_ENV', 'development');
  cachedEnv = {
    MODE: nodeEnv,
    VITE_WS_URL: getEnvVar('VITE_WS_URL'),
    VITE_SUPABASE_URL: getEnvVar('VITE_SUPABASE_URL'),
    VITE_SUPABASE_ANON_KEY: getEnvVar('VITE_SUPABASE_ANON_KEY'),
    DEV: nodeEnv === 'development',
    PROD: nodeEnv === 'production',
    SSR: false
  };
  
  return cachedEnv;
}

/**
 * Verifica se estamos em modo de desenvolvimento
 */
function isDev(): boolean {
  const env = getEnv();
  return env.MODE === 'development' || env.DEV;
}

/**
 * Verifica se estamos em modo de produção
 */
function isProd(): boolean {
  const env = getEnv();
  return env.MODE === 'production' || env.PROD;
}

/**
 * Verifica se estamos em ambiente de teste
 */
function isTest(): boolean {
  const env = getEnv();
  return env.MODE === 'test';
}

// Exportações
export { safeGetEnv, getEnv, isDev, isProd, isTest }; 