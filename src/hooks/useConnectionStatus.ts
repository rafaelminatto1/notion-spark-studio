
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Conexão restaurada",
        description: "Você está online novamente"
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Sem conexão",
        description: "Verifique sua conexão com a internet",
        variant: "destructive"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        
        if (error && !isSupabaseConnected) {
          setIsSupabaseConnected(false);
          toast({
            title: "Erro de conexão",
            description: "Problemas para conectar com o servidor",
            variant: "destructive"
          });
        } else if (!error && !isSupabaseConnected) {
          setIsSupabaseConnected(true);
          toast({
            title: "Conexão restaurada",
            description: "Conectado ao servidor novamente"
          });
        } else {
          setIsSupabaseConnected(!error);
        }
      } catch (error) {
        console.error('Erro ao verificar conexão:', error);
        setIsSupabaseConnected(false);
      }
    };

    if (isOnline) {
      checkSupabaseConnection();
      const interval = setInterval(checkSupabaseConnection, 30000); // Check every 30 seconds
      return () => { clearInterval(interval); };
    }
  }, [isOnline, isSupabaseConnected, toast]);

  return {
    isOnline,
    isSupabaseConnected,
    isConnected: isOnline && isSupabaseConnected
  };
};
