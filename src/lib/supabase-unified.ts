/**
 * 🔧 Configuração Unificada do Supabase para Next.js
 * Utilizando variáveis de ambiente NEXT_PUBLIC_* para compatibilidade total
 */

import { 
  getSupabaseClient, 
  checkSupabaseConnection, 
  initializeSupabase 
} from './supabase-config';
import type { Database } from '@/integrations/supabase/types';

// Configuração usando variáveis de ambiente do Next.js
export const SUPABASE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bvugljspidtqumysbegq.supabase.co',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dWdsanNwaWR0cXVteXNiZWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNjE4ODcsImV4cCI6MjA2NDczNzg4N30.YYZVpzyb7ZDyIV3uqaAkA5xBBzA2g7Udnt4uSqaeFAQ'
};

// Validação das variáveis de ambiente
const validateEnvironment = () => {
  const missing = [];
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL');
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  
  if (missing.length > 0) {
    console.warn('⚠️ Variáveis de ambiente ausentes:', missing.join(', '));
    console.warn('🔧 Usando valores fallback para desenvolvimento');
  } else {
    console.log('✅ [Supabase] Variáveis de ambiente carregadas com sucesso');
  }
  
  return missing.length === 0;
};

// Validar ambiente na inicialização
const isEnvValid = validateEnvironment();

// Cliente principal
export const supabase = getSupabaseClient();

export const isSupabaseConfigured = Boolean(supabase) && isEnvValid;

// Redirecionamentos para compatibilidade
export { getSupabaseClient };
export const testSupabaseConnection = checkSupabaseConnection;

// Utilitários de status
export const supabaseStatus = {
  isConfigured: isSupabaseConfigured,
  isConnected: Boolean(supabase),
  environmentValid: isEnvValid,
  config: {
    url: SUPABASE_CONFIG.url,
    hasKey: Boolean(SUPABASE_CONFIG.anonKey),
    usingEnvVars: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  }
}; 

// Log de inicialização
if (typeof window === 'undefined') {
  // Server-side
  console.log('🔧 [Supabase] Configuração do servidor inicializada');
} else {
  // Client-side
  console.log('🌐 [Supabase] Configuração do cliente inicializada');
}

console.log('📊 [Supabase] Status:', {
  configured: isSupabaseConfigured,
  url: SUPABASE_CONFIG.url,
  envValid: isEnvValid
}); 