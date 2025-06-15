import { useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase-config';

export const useTokenCleanup = () => {
  useEffect(() => {
    const cleanupExpiredTokens = () => {
      try {
        const supabase = getSupabaseClient();
        
        if (!supabase) {
          console.warn('[TokenCleanup] Supabase não disponível');
          return;
        }

        // Verificar se o token atual ainda é válido
        supabase.auth.getSession().then(({ data: { session }, error }) => {
          if (error) {
            console.warn('[TokenCleanup] Erro ao verificar sessão:', error);
            return;
          }

          if (!session) {
            // Limpar dados locais se não há sessão válida
            localStorage.removeItem('supabase.auth.token');
            localStorage.removeItem('notion-spark-auth');
            console.log('[TokenCleanup] Tokens expirados removidos');
          }
        });
      } catch (error) {
        console.error('[TokenCleanup] Erro na limpeza de tokens:', error);
      }
    };

    // Executar limpeza imediatamente
    cleanupExpiredTokens();

    // Configurar limpeza periódica (a cada 5 minutos)
    const interval = setInterval(cleanupExpiredTokens, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);
};
