// Hook redirecionado para configuração unificada
import { getSupabaseClient, checkSupabaseConnection } from '../lib/supabase-config';

export const useSupabase = () => {
  const supabase = getSupabaseClient();
  
  return {
    supabase,
    isEnabled: Boolean(supabase),
    checkConnection: checkSupabaseConnection
  };
}; 