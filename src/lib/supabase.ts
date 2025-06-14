import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Só criar cliente se as variáveis estiverem definidas
export const supabase = env.SUPABASE_URL && env.SUPABASE_ANON_KEY 
  ? createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
  : null;

export const isSupabaseEnabled = Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY); 