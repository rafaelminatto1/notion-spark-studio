import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

/**
 * 🔧 Configuração Unificada do Supabase
 * Resolve conflitos entre múltiplas configurações
 */

// Função para obter variáveis de ambiente de forma segura
function getEnvVar(key: string, fallback: string = ''): string {
  // Next.js runtime
  if (typeof window !== 'undefined') {
    return (window as any).__NEXT_DATA__?.env?.[key] || 
           process.env[key] || 
           fallback;
  }
  
  // Server-side Next.js
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || fallback;
  }
  
  return fallback;
}

// Configuração do Supabase
export const SUPABASE_CONFIG = {
  url: getEnvVar('NEXT_PUBLIC_SUPABASE_URL', 'https://bvugljspidtqumysbegq.supabase.co'),
  anonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dWdsanNwaWR0cXVteXNiZWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNjE4ODcsImV4cCI6MjA2NDczNzg4N30.YYZVpzyb7ZDyIV3uqaAkA5xBBzA2g7Udnt4uSqaeFAQ')
};

// Verificar se as configurações estão disponíveis
export const isSupabaseConfigured = Boolean(
  SUPABASE_CONFIG.url && 
  SUPABASE_CONFIG.anonKey &&
  SUPABASE_CONFIG.url !== 'undefined' &&
  SUPABASE_CONFIG.anonKey !== 'undefined'
);

// Cliente Supabase unificado
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseClient() {
  if (!isSupabaseConfigured) {
    console.warn('⚠️ Supabase não configurado. Verifique as variáveis de ambiente.');
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient<Database>(
        SUPABASE_CONFIG.url,
        SUPABASE_CONFIG.anonKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          },
          realtime: {
            params: {
              eventsPerSecond: 10
            }
          }
        }
      );
      
      console.log('✅ Cliente Supabase configurado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao configurar cliente Supabase:', error);
      return null;
    }
  }

  return supabaseInstance;
}

// Cliente principal (compatibilidade com código existente)
export const supabase = getSupabaseClient();

// Utilitários de status
export const supabaseStatus = {
  isConfigured: isSupabaseConfigured,
  isConnected: Boolean(supabaseInstance),
  config: isSupabaseConfigured ? {
    url: SUPABASE_CONFIG.url,
    hasKey: Boolean(SUPABASE_CONFIG.anonKey)
  } : null
};

// Função para testar conexão
export async function testSupabaseConnection(): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('profiles').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
} 