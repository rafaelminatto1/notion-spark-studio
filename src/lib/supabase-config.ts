import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Configurações do Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bvugljspidtqumysbegq.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dWdsanNwaWR0cXVteXNiZWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNjE4ODcsImV4cCI6MjA2NDczNzg4N30.YYZVpzyb7ZDyIV3uqaAkA5xBBzA2g7Udnt4uSqaeFAQ";

// Verificar se as variáveis de ambiente estão definidas
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[Supabase Config] Variáveis de ambiente não encontradas');
}

// Configurações do cliente
const supabaseConfig = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' as const,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  global: {
    headers: {
      'X-Client-Info': 'notion-spark-studio@1.0.0',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
};

// Criar cliente Supabase com configurações robustas
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  supabaseConfig
);

// Função para verificar se o Supabase está funcionando
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.warn('[Supabase Config] Erro na conexão:', error.message);
      return false;
    }
    
    console.log('[Supabase Config] Conexão estabelecida com sucesso');
    return true;
  } catch (error) {
    console.error('[Supabase Config] Erro inesperado na conexão:', error);
    return false;
  }
};

// Função para inicializar o Supabase de forma segura
export const initializeSupabase = async () => {
  try {
    console.log('[Supabase Config] Inicializando Supabase...');
    
    // Verificar conexão
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      console.warn('[Supabase Config] Supabase não está disponível, usando modo offline');
      return { success: false, offline: true };
    }
    
    // Verificar sessão atual
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.warn('[Supabase Config] Erro ao verificar sessão:', error.message);
      return { success: false, error };
    }
    
    console.log('[Supabase Config] Supabase inicializado com sucesso');
    return { success: true, session };
    
  } catch (error) {
    console.error('[Supabase Config] Erro na inicialização:', error);
    return { success: false, error };
  }
};

// Exportar configurações para uso em outros lugares
export const supabaseConfig_export = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
  isConfigured: !!(SUPABASE_URL && SUPABASE_ANON_KEY),
}; 