import { createClient } from '@supabase/supabase-js';
import { env } from '../lib/env';

// Só criar cliente se as variáveis estiverem definidas
const supabase = env.SUPABASE_URL && env.SUPABASE_ANON_KEY 
  ? createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
  : null;

export const useSupabase = () => {
  return {
    supabase,
    isEnabled: Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY)
  };
}; 