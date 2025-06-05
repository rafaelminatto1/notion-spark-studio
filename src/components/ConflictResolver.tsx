
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, FileText, Clock } from 'lucide-react';
import { useOfflineSync, ConflictResolution } from '@/hooks/useOfflineSync';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const ConflictResolver: React.FC = () => {
  const { conflicts, resolveConflict } = useOfflineSync();
  const [selectedConflict, setSelectedConflict] = useState<string | null>(null);
  const [mergedContent, setMergedContent] = useState('');

  if (conflicts.length === 0) {
    return null;
  }

  const handleResolve = async (conflictId: string, resolution: 'local' | 'remote' | 'merge') => {
    const resolutionData: ConflictResolution = {
      operationId: conflictId,
      resolution,
      mergedData: resolution === 'merge' ? { content: mergedContent } : undefined
    };

    await resolveConflict(resolutionData);
    setSelectedConflict(null);
    setMergedContent('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-semibold">Conflitos de Sincronização</h3>
        <Badge variant="destructive">{conflicts.length}</Badge>
      </div>

      {conflicts.map((conflict) => (
        <Card key={conflict.id} className="border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4" />
              {conflict.data.name || 'Arquivo sem nome'}
              <Badge variant="outline">{conflict.type}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {format(new Date(conflict.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Este arquivo foi modificado tanto localmente quanto no servidor. 
              Escolha como resolver o conflito:
            </div>

            {selectedConflict === conflict.id && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Versão Local:</label>
                    <div className="p-2 bg-muted rounded text-xs">
                      {conflict.data.content?.substring(0, 100)}...
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Versão Remota:</label>
                    <div className="p-2 bg-muted rounded text-xs">
                      [Conteúdo do servidor]...
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium">Versão Mesclada (opcional):</label>
                  <Textarea
                    value={mergedContent}
                    onChange={(e) => setMergedContent(e.target.value)}
                    placeholder="Edite aqui uma versão mesclada do conteúdo..."
                    className="text-xs"
                    rows={4}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {selectedConflict === conflict.id ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResolve(conflict.id, 'local')}
                  >
                    Usar Local
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResolve(conflict.id, 'remote')}
                  >
                    Usar Remota
                  </Button>
                  {mergedContent && (
                    <Button
                      size="sm"
                      onClick={() => handleResolve(conflict.id, 'merge')}
                    >
                      Usar Mesclada
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedConflict(null)}
                  >
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setSelectedConflict(conflict.id)}
                >
                  Resolver Conflito
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
