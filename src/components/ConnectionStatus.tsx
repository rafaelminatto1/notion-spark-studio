
import React from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';

const ConnectionStatus = () => {
  const { isOnline, isSupabaseConnected } = useConnectionStatus();

  if (isOnline && isSupabaseConnected) {
    return null; // Don't show anything when everything is working
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 flex items-center gap-2 animate-fade-in">
        {!isOnline ? (
          <>
            <WifiOff className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive font-medium">Sem conexão</span>
          </>
        ) : !isSupabaseConnected ? (
          <>
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <span className="text-sm text-orange-600 font-medium">Problemas no servidor</span>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default ConnectionStatus;
