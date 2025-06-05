
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSessionManager } from '@/hooks/useSessionManager';
import { 
  Clock, 
  Activity, 
  User, 
  Calendar, 
  BarChart3, 
  Trash2,
  Play,
  Square
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SessionManagerProps {
  userId?: string;
  onSessionStart?: (sessionId: string) => void;
  onSessionEnd?: () => void;
}

export const SessionManager: React.FC<SessionManagerProps> = ({
  userId = 'default-user',
  onSessionStart,
  onSessionEnd
}) => {
  const {
    currentSession,
    allSessions,
    isLoading,
    createSession,
    endSession,
    getSessionStats,
    cleanOldSessions
  } = useSessionManager();

  const stats = getSessionStats();

  const handleStartSession = async () => {
    const sessionId = await createSession(userId);
    if (sessionId && onSessionStart) {
      onSessionStart(sessionId);
    }
  };

  const handleEndSession = async () => {
    await endSession();
    if (onSessionEnd) {
      onSessionEnd();
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sessão Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Sessão Atual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentSession?.isActive ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant="default" className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Ativa
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Duração:</span>
                <span className="text-sm font-medium">
                  {formatDuration(currentSession.duration)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ações:</span>
                <span className="text-sm font-medium">
                  {currentSession.actionsCount}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Iniciada:</span>
                <span className="text-sm">
                  {format(new Date(currentSession.createdAt), 'HH:mm', { locale: ptBR })}
                </span>
              </div>

              <Button 
                onClick={handleEndSession}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Square className="w-4 h-4 mr-2" />
                Finalizar Sessão
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-center text-muted-foreground">
                Nenhuma sessão ativa
              </div>
              <Button 
                onClick={handleStartSession}
                size="sm"
                className="w-full"
              >
                <Play className="w-4 h-4 mr-2" />
                Iniciar Sessão
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Estatísticas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Total de Sessões</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Hoje</div>
              <div className="text-2xl font-bold">{stats.today}</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Tempo Total</div>
              <div className="text-lg font-semibold">
                {formatDuration(stats.totalDuration)}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Ações Totais</div>
              <div className="text-lg font-semibold">{stats.totalActions}</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Duração Média</span>
              <span>{formatDuration(Math.round(stats.avgDuration))}</span>
            </div>
            <Progress value={(stats.avgDuration / 120) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Sessões Recentes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Sessões Recentes
          </CardTitle>
          <Button 
            onClick={() => cleanOldSessions()}
            variant="ghost"
            size="sm"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allSessions.slice(0, 5).map((session) => (
              <div 
                key={session.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm">
                      {format(new Date(session.createdAt), 'dd/MM - HH:mm', { locale: ptBR })}
                    </span>
                    {session.isActive && (
                      <Badge variant="default" className="text-xs">Ativa</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDuration(session.duration)} • {session.actionsCount} ações
                  </div>
                </div>
                
                <div className="text-right text-xs text-muted-foreground">
                  {session.metadata.filesCreated > 0 && (
                    <div>{session.metadata.filesCreated} arquivos criados</div>
                  )}
                  {session.metadata.filesEdited > 0 && (
                    <div>{session.metadata.filesEdited} edições</div>
                  )}
                </div>
              </div>
            ))}
            
            {allSessions.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                Nenhuma sessão encontrada
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
