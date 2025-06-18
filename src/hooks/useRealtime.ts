import { useCallback, useEffect, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface RealtimeSubscription {
  channel: RealtimeChannel;
  callback: (payload: any) => void;
}

export const useRealtime = () => {
  const [subscriptions, setSubscriptions] = useState<RealtimeSubscription[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const channel = supabase.channel('system');
    
    channel
      .on('system', { event: 'connected' }, () => {
        setIsConnected(true);
      })
      .on('system', { event: 'disconnected' }, () => {
        setIsConnected(false);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const subscribe = useCallback((
    channelName: string,
    config: {
      event: string;
      schema: string;
      table: string;
      filter?: string;
    },
    callback: (payload: any) => void
  ) => {
    const channel = supabase.channel(channelName);

    channel
      .on(
        'postgres_changes',
        {
          event: config.event,
          schema: config.schema,
          table: config.table,
          filter: config.filter,
        },
        callback
      )
      .subscribe();

    const subscription: RealtimeSubscription = {
      channel,
      callback,
    };

    setSubscriptions(prev => [...prev, subscription]);

    return channel;
  }, []);

  const unsubscribe = useCallback((channel: RealtimeChannel) => {
    channel.unsubscribe();
    setSubscriptions(prev => prev.filter(sub => sub.channel !== channel));
  }, []);

  const unsubscribeAll = useCallback(() => {
    subscriptions.forEach(sub => {
      sub.channel.unsubscribe();
    });
    setSubscriptions([]);
  }, [subscriptions]);

  return {
    isConnected,
    subscribe,
    unsubscribe,
    unsubscribeAll,
  };
}; 