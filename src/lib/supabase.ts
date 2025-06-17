// Redirects to our unified Supabase configuration
import { getSupabaseClient, checkSupabaseConnection } from './supabase-config';

// Só usar cliente da configuração unificada
export const supabase = getSupabaseClient();

export const isSupabaseEnabled = Boolean(supabase); 