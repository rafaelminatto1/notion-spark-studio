// This file redirects to our unified Supabase configuration
import { getSupabaseClient } from '@/lib/supabase-config';
import type { Database } from './types';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = getSupabaseClient() as any; // Cast para compatibilidade com tipos antigos