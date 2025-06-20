// Utilitário para variáveis de ambiente otimizado para Vercel
const getEnvVar = (key: string, defaultValue = ''): string => {
  // Prioridade para variáveis do Vercel
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  
  // Fallback para valores padrão de produção
  return defaultValue;
};

const isProduction = (): boolean => {
  const nodeEnv = getEnvVar('NODE_ENV');
  const vercelEnv = getEnvVar('VERCEL_ENV');
  return nodeEnv === 'production' || vercelEnv === 'production';
};

const isDevelopment = (): boolean => {
  const nodeEnv = getEnvVar('NODE_ENV');
  const vercelEnv = getEnvVar('VERCEL_ENV');
  return nodeEnv === 'development' || vercelEnv === 'development';
};

const isPreview = (): boolean => {
  return getEnvVar('VERCEL_ENV') === 'preview';
};

// Configuração robusta para produção Vercel
export const env = {
  // App Configuration
  APP_NAME: getEnvVar('VITE_APP_NAME', 'Notion Spark Studio'),
  APP_VERSION: getEnvVar('VITE_APP_VERSION', '2.0.0'),
  API_BASE_URL: getEnvVar('VITE_API_BASE_URL', 'https://api.notion-spark.com'),
  WS_URL: getEnvVar('VITE_WS_URL', 'wss://ws.notion-spark.com'),
  
  // Supabase Configuration com fallbacks robustos
  SUPABASE_URL: getEnvVar('VITE_SUPABASE_URL', getEnvVar('NEXT_PUBLIC_SUPABASE_URL', '')),
  SUPABASE_ANON_KEY: getEnvVar('VITE_SUPABASE_ANON_KEY', getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')),
  
  // Vercel Environment
  VERCEL_ENV: getEnvVar('VERCEL_ENV', 'production'),
  VERCEL_URL: getEnvVar('VERCEL_URL', ''),
  VERCEL_GIT_COMMIT_SHA: getEnvVar('VERCEL_GIT_COMMIT_SHA', ''),
  
  // Environment flags
  isDevelopment: isDevelopment(),
  isProduction: isProduction(),
  isPreview: isPreview(),
  isVercel: !!getEnvVar('VERCEL'),
  
  // Build info
  BUILD_TIME: new Date().toISOString(),
  NODE_VERSION: typeof process !== 'undefined' ? process.version : '',
};

// Função para validar configuração de produção
export const validateProductionEnv = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!env.SUPABASE_URL) {
    errors.push('SUPABASE_URL não configurada');
  }
  
  if (!env.SUPABASE_ANON_KEY) {
    errors.push('SUPABASE_ANON_KEY não configurada');
  }
  
  if (env.isProduction && !env.isVercel) {
    errors.push('Ambiente de produção deve ser executado na Vercel');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Log de configuração (apenas em desenvolvimento)
if (env.isDevelopment || env.isPreview) {
  console.log('🔧 Environment Configuration:', {
    environment: env.VERCEL_ENV,
    isProduction: env.isProduction,
    isVercel: env.isVercel,
    hasSupabase: !!(env.SUPABASE_URL && env.SUPABASE_ANON_KEY),
  });
} 