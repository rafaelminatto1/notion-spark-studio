
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

export const useTokenCleanup = () => {
  const { user } = useSupabaseAuth();

  useEffect(() => {
    // Executar limpeza de tokens expirados apenas para usuários autenticados
    if (!user) return;

    const runCleanup = async () => {
      try {
        await supabase.rpc('cleanup_expired_tokens');
        console.log('Token cleanup executado com sucesso');
      } catch (error) {
        console.error('Erro ao executar limpeza de tokens:', error);
      }
    };

    // Executar imediatamente
    runCleanup();

    // Executar a cada 30 minutos
    const interval = setInterval(runCleanup, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);
};
