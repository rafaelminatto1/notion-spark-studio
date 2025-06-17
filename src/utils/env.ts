/**
 * Configuração de ambiente centralizada
 * Compatível com Vite, Next.js e Jest
 */

// Interface para tipagem das variáveis de ambiente
interface EnvVars {
  MODE: string;
  VITE_WS_URL?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  DEV: boolean;
  PROD: boolean;
  SSR: boolean;
}

// Interface para window com env
interface WindowWithEnv extends Window {
  env?: Record<string, string>;
}

// Variável global para armazenar o ambiente detectado
let cachedEnv: EnvVars | null = null;

/**
 * Função segura para obter variável de ambiente
 * Funciona tanto em ambientes Next.js (process.env) quanto Vite (import.meta.env)
 */
export function safeGetEnv(key: string, defaultValue = ''): string {
  try {
    // Verificar se estamos no cliente ou servidor
    if (typeof window !== 'undefined') {
      // Cliente - Next.js expõe variáveis NEXT_PUBLIC_ no cliente
      // Primeiro tenta process.env, depois window.env
      const envValue = process?.env?.[key] ?? (window as WindowWithEnv).env?.[key];
      
      return envValue ?? defaultValue;
    } else {
      // Servidor
      return process.env[key] ?? defaultValue;
    }
  } catch {
    return defaultValue;
  }
}

export function safeGetClientEnv(key: string, defaultValue = ''): string {
  try {
    // Verificar se estamos no cliente ou servidor
    if (typeof window !== 'undefined') {
      // Cliente
      const windowWithEnv = window as WindowWithEnv;
      return windowWithEnv.env?.[key] ?? process.env[key] ?? defaultValue;
    } else {
      // Servidor
      return process.env[key] ?? defaultValue;
    }
  } catch {
    return defaultValue;
  }
}

/**
 * Função interna para obter variável de ambiente (para uso interno do módulo)
 */
function getEnvVar(key: string, defaultValue = ''): string {
  if (typeof window !== 'undefined') {
    // Cliente - usar window.env se disponível
    const windowWithEnv = window as WindowWithEnv;
    return windowWithEnv.env?.[key] ?? defaultValue;
  }
  
  // Servidor - usar process.env
  return process.env[key] ?? defaultValue;
}

/**
 * Detecta se estamos no ambiente Vite usando uma função dinâmica
 */
function getViteEnv(): EnvVars | null {
  try {
    // Verificar se import.meta está disponível
    if (typeof globalThis !== 'undefined' && 'importMeta' in globalThis) {
      const importMeta = (globalThis as unknown as { importMeta?: { env?: Record<string, string | boolean> } }).importMeta;
      if (importMeta?.env) {
        return {
          MODE: String(importMeta.env.MODE ?? 'development'),
          VITE_WS_URL: String(importMeta.env.VITE_WS_URL ?? ''),
          VITE_SUPABASE_URL: String(importMeta.env.VITE_SUPABASE_URL ?? ''),
          VITE_SUPABASE_ANON_KEY: String(importMeta.env.VITE_SUPABASE_ANON_KEY ?? ''),
          DEV: Boolean(importMeta.env.DEV),
          PROD: Boolean(importMeta.env.PROD),
          SSR: Boolean(importMeta.env.SSR)
        };
      }
    }
  } catch {
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
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
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

// Função para configurar variáveis de ambiente no cliente
export function configureClientEnv(): Record<string, string> {
  try {
    // Configurar variáveis de ambiente do cliente
    const env = process.env;
    const clientEnv: Record<string, string> = {};
    
    // Filtrar apenas variáveis que começam com NEXT_PUBLIC_
    Object.keys(env).forEach(key => {
      if (key.startsWith('NEXT_PUBLIC_')) {
        const value = env[key];
        if (value !== undefined) {
          clientEnv[key] = value;
        }
      }
    });

    // Adicionar variáveis específicas necessárias
    clientEnv.SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    clientEnv.SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
    clientEnv.VERCEL_URL = env.VERCEL_URL ?? '';
    clientEnv.NODE_ENV = env.NODE_ENV ?? 'development';
    clientEnv.DATABASE_URL = env.DATABASE_URL ?? '';
    clientEnv.WEBSOCKET_URL = env.WEBSOCKET_URL ?? '';
    clientEnv.API_URL = env.API_URL ?? '';
    clientEnv.APP_ENV = env.APP_ENV ?? 'development';

    return clientEnv;
  } catch {
    // Fallback seguro
    return {
      SUPABASE_URL: '',
      SUPABASE_ANON_KEY: '',
      VERCEL_URL: '',
      NODE_ENV: 'development',
      DATABASE_URL: '',
      WEBSOCKET_URL: '',
      API_URL: '',
      APP_ENV: 'development'
    };
  }
}

// Verificar se uma variável de ambiente obrigatória está definida
export function ensureEnvVar(key: string): string {
  const value = safeGetEnv(key);
  if (!value) {
    throw new Error(`Environment variable ${key} is required but not defined`);
  }
  return value;
}

// Exportações
export { getEnv, isDev, isProd, isTest }; 