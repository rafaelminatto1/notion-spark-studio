/**
 * Utilitário para acessar variáveis de ambiente de forma compatível
 * entre Vite (import.meta.env) e Jest (process.env)
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
 * Detecta se estamos no ambiente Vite usando uma função dinâmica
 */
const getViteEnv = (): EnvVars | null => {
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
};

/**
 * Obtém as variáveis de ambiente de forma compatível
 */
export const getEnv = (): EnvVars => {
  // Cache para evitar re-execução
  if (cachedEnv) {
    return cachedEnv;
  }

  // Se estamos no ambiente de teste (Jest)
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
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

  // Fallback para Node.js/outros ambientes
  cachedEnv = {
    MODE: process.env.NODE_ENV || 'development',
    VITE_WS_URL: process.env.VITE_WS_URL,
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
    DEV: process.env.NODE_ENV === 'development',
    PROD: process.env.NODE_ENV === 'production',
    SSR: false
  };
  
  return cachedEnv;
};

/**
 * Verifica se estamos em modo de desenvolvimento
 */
export const isDev = (): boolean => {
  const env = getEnv();
  return env.MODE === 'development' || env.DEV;
};

/**
 * Verifica se estamos em modo de produção
 */
export const isProd = (): boolean => {
  const env = getEnv();
  return env.MODE === 'production' || env.PROD;
};

/**
 * Verifica se estamos em ambiente de teste
 */
export const isTest = (): boolean => {
  const env = getEnv();
  return env.MODE === 'test';
}; 