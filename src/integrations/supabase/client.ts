// This file redirects to our unified Supabase configuration
import { getSupabaseClient } from '@/lib/supabase-config';
import type { Database } from './types';
import type { SupabaseClient } from '@supabase/supabase-js';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

const client = getSupabaseClient();
if (!client) {
  throw new Error('Supabase client não pôde ser inicializado');
}

export const supabase: SupabaseClient<Database> = client;