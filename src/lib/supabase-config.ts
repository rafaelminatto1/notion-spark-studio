import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { safeGetEnv } from '@/utils/env';

// Singleton para evitar múltiplas instâncias
let supabaseInstance: SupabaseClient | null = null;

// Configuração do Supabase com logs detalhados e fallbacks
const getSupabaseUrl = (): string => {
  // Múltiplos fallbacks para garantir que encontramos a URL
  const url = safeGetEnv('NEXT_PUBLIC_SUPABASE_URL', '') || 
             safeGetEnv('VITE_SUPABASE_URL', '') ||
             process.env.NEXT_PUBLIC_SUPABASE_URL ||
             process.env.SUPABASE_URL ||
             'https://bvugljspidtqumysbegq.supabase.co';
  
  return url;
};

const getSupabaseAnonKey = (): string => {
  // Múltiplos fallbacks para garantir que encontramos a ANON_KEY
  const key = safeGetEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '') || 
             safeGetEnv('VITE_SUPABASE_ANON_KEY', '') ||
             process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
             process.env.SUPABASE_ANON_KEY ||
             'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dWdsanNwaWR0cXVteXNiZWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNjE4ODcsImV4cCI6MjA2NDczNzg4N30.YYZVpzyb7ZDyIV3uqaAkA5xBBzA2g7Udnt4uSqaeFAQ';
  
  return key;
};

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();

// Configuração robusta com múltiplos fallbacks implementada

// Função para criar/obter instância única do Supabase
export const getSupabaseClient = (): SupabaseClient | null => {
  // Se já existe uma instância, retorna ela
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Verifica se as variáveis de ambiente estão configuradas
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Variáveis de ambiente não configuradas. Modo offline ativado.');
    return null;
  }

  try {
    // Cria nova instância com configurações otimizadas
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'notion-spark-auth', // Chave única para evitar conflitos
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
      global: {
        headers: {
          'X-Client-Info': 'notion-spark-studio',
        },
      },
    });

    console.log('[Supabase] Cliente inicializado com sucesso');
    return supabaseInstance;
  } catch (error) {
    console.error('[Supabase] Erro ao inicializar cliente:', error);
    return null;
  }
};

// Função para verificar conexão com Supabase
export const checkSupabaseConnection = async (): Promise<boolean> => {
  const client = getSupabaseClient();
  
  if (!client) {
    return false;
  }

  try {
    const { error } = await client.from('_health_check').select('*').limit(1);
    
    // Se não há erro ou é erro de tabela não encontrada (esperado), conexão está OK
    if (!error || error.code === 'PGRST116') {
      console.log('[Supabase] Conexão verificada com sucesso');
      return true;
    }
    
    console.warn('[Supabase] Erro na verificação de conexão:', error);
    return false;
  } catch (error) {
    console.warn('[Supabase] Erro ao verificar conexão:', error);
    return false;
  }
};

// Função para inicializar Supabase de forma segura
export const initializeSupabase = async (): Promise<{
  client: SupabaseClient | null;
  isConnected: boolean;
  isOfflineMode: boolean;
}> => {
  console.log('[Supabase] Inicializando...');
  
  const client = getSupabaseClient();
  
  if (!client) {
    console.log('[Supabase] Modo offline ativado - variáveis de ambiente não configuradas');
    return {
      client: null,
      isConnected: false,
      isOfflineMode: true,
    };
  }

  const isConnected = await checkSupabaseConnection();
  
  if (!isConnected) {
    console.log('[Supabase] Modo offline ativado - sem conexão com servidor');
  }

  return {
    client,
    isConnected,
    isOfflineMode: !isConnected,
  };
};

// Função para resetar instância (útil para testes)
export const resetSupabaseInstance = () => {
  supabaseInstance = null;
};

// Export da instância para compatibilidade (deprecated - use getSupabaseClient)
export const supabase = getSupabaseClient(); 