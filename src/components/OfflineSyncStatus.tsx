
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Wifi, WifiOff, Sync, AlertTriangle, CheckCircle } from 'lucide-react';

export const OfflineSyncStatus: React.FC = () => {
  const {
    isOnline,
    isSyncing,
    pendingOperations,
    conflicts,
    forceSync,
    clearPendingOperations
  } = useOfflineSync();

  const totalOperations = pendingOperations.length;
  const conflictCount = conflicts.length;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {isOnline ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          Status de Sincronização
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Conexão:</span>
          <Badge variant={isOnline ? "default" : "destructive"}>
            {isOnline ? "Online" : "Offline"}
          </Badge>
        </div>

        {/* Sync Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Sincronização:</span>
          <div className="flex items-center gap-2">
            {isSyncing && <Sync className="w-3 h-3 animate-spin" />}
            <Badge variant={isSyncing ? "secondary" : "outline"}>
              {isSyncing ? "Sincronizando..." : "Inativo"}
            </Badge>
          </div>
        </div>

        {/* Pending Operations */}
        {totalOperations > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Operações pendentes:</span>
              <Badge variant="secondary">{totalOperations}</Badge>
            </div>
            
            {isSyncing && (
              <Progress value={0} className="h-2" />
            )}
          </div>
        )}

        {/* Conflicts */}
        {conflictCount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Conflitos:</span>
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {conflictCount}
            </Badge>
          </div>
        )}

        {/* Status Message */}
        <div className="text-xs text-muted-foreground">
          {!isOnline && totalOperations > 0 && (
            "As alterações serão sincronizadas quando a conexão for restaurada."
          )}
          {isOnline && totalOperations === 0 && conflictCount === 0 && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-3 h-3" />
              Tudo sincronizado
            </div>
          )}
          {isOnline && totalOperations > 0 && (
            "Sincronizando alterações..."
          )}
        </div>

        {/* Actions */}
        {(totalOperations > 0 || conflictCount > 0) && (
          <div className="flex gap-2 pt-2">
            {isOnline && totalOperations > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={forceSync}
                disabled={isSyncing}
                className="flex-1"
              >
                <Sync className="w-3 h-3 mr-1" />
                Forçar Sync
              </Button>
            )}
            
            {totalOperations > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearPendingOperations}
                className="flex-1"
              >
                Limpar Fila
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
