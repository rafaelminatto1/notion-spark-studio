/**
 * 🔧 Redirecionamento para Configuração Unificada do Supabase
 * Este arquivo agora redireciona para supabase-config.ts para evitar múltiplas instâncias
 */

import { 
  getSupabaseClient, 
  checkSupabaseConnection, 
  initializeSupabase 
} from './supabase-config';
import type { Database } from '@/integrations/supabase/types';

// Cliente principal (compatibilidade com código existente)
export const supabase = getSupabaseClient();

// Configuração para compatibilidade
export const SUPABASE_CONFIG = {
  url: 'https://bvugljspidtqumysbegq.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dWdsanNwaWR0cXVteXNiZWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNjE4ODcsImV4cCI6MjA2NDczNzg4N30.YYZVpzyb7ZDyIV3uqaAkA5xBBzA2g7Udnt4uSqaeFAQ'
};

export const isSupabaseConfigured = Boolean(supabase);

// Redirecionamentos para compatibilidade
export { getSupabaseClient };
export const testSupabaseConnection = checkSupabaseConnection;

// Utilitários de status
export const supabaseStatus = {
  isConfigured: Boolean(supabase),
  isConnected: Boolean(supabase),
  config: {
    url: SUPABASE_CONFIG.url,
    hasKey: Boolean(SUPABASE_CONFIG.anonKey)
  }
}; 