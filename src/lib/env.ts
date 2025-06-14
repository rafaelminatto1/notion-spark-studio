// Utilitário para variáveis de ambiente compatível com Next.js e Vite
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // No Next.js, usar process.env
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  
  // Fallback para valores padrão
  return defaultValue;
};

const isDevelopment = (): boolean => {
  const mode = getEnvVar('NODE_ENV') || getEnvVar('MODE');
  return mode === 'development';
};

export const env = {
  // App Configuration
  APP_NAME: getEnvVar('VITE_APP_NAME', 'Notion Spark Studio'),
  APP_VERSION: getEnvVar('VITE_APP_VERSION', '2.0.0'),
  API_BASE_URL: getEnvVar('VITE_API_BASE_URL', 'https://api.notion-spark.com'),
  WS_URL: getEnvVar('VITE_WS_URL', 'wss://ws.notion-spark.com'),
  
  // Supabase Configuration
  SUPABASE_URL: getEnvVar('VITE_SUPABASE_URL'),
  SUPABASE_ANON_KEY: getEnvVar('VITE_SUPABASE_ANON_KEY'),
  
  // Environment
  isDevelopment: isDevelopment(),
  isProduction: !isDevelopment(),
}; 