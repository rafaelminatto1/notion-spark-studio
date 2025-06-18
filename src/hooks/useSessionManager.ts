
import { useState, useEffect, useCallback } from 'react';
import { useIndexedDB } from './useIndexedDB';
import { useToast } from '@/hooks/use-toast';

export interface UserSession {
  id: string;
  userId: string;
  createdAt: Date;
  lastActiveAt: Date;
  endedAt?: Date;
  isActive: boolean;
  duration: number; // em minutos
  actionsCount: number;
  deviceInfo: {
    userAgent: string;
    platform: string;
    language: string;
  };
  metadata: {
    filesCreated: number;
    filesEdited: number;
    viewsChanged: number;
    lastFileId?: string;
    lastView?: string;
  };
}

export const useSessionManager = () => {
  const { isReady, get, set, getAll, query } = useIndexedDB();
  const { toast } = useToast();
  const [currentSession, setCurrentSession] = useState<UserSession | null>(null);
  const [allSessions, setAllSessions] = useState<UserSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Criar nova sessão
  const createSession = useCallback(async (userId = 'default-user'): Promise<string> => {
    if (!isReady) return '';

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newSession: UserSession = {
      id: sessionId,
      userId,
      createdAt: new Date(),
      lastActiveAt: new Date(),
      isActive: true,
      duration: 0,
      actionsCount: 0,
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      },
      metadata: {
        filesCreated: 0,
        filesEdited: 0,
        viewsChanged: 0
      }
    };

    try {
      await set('sessions', newSession);
      setCurrentSession(newSession);
      console.log('Nova sessão criada:', sessionId);
      return sessionId;
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
      return '';
    }
  }, [isReady, set]);

  // Atualizar atividade da sessão
  const updateActivity = useCallback(async (action?: {
    type: 'file_created' | 'file_edited' | 'view_changed';
    fileId?: string;
    view?: string;
  }) => {
    if (!currentSession || !isReady) return;

    const now = new Date();
    const timeDiff = Math.floor((now.getTime() - currentSession.lastActiveAt.getTime()) / (1000 * 60));

    const updatedSession: UserSession = {
      ...currentSession,
      lastActiveAt: now,
      duration: currentSession.duration + (timeDiff > 0 ? timeDiff : 0),
      actionsCount: currentSession.actionsCount + (action ? 1 : 0),
      metadata: {
        ...currentSession.metadata,
        ...(action?.type === 'file_created' && { filesCreated: currentSession.metadata.filesCreated + 1 }),
        ...(action?.type === 'file_edited' && { filesEdited: currentSession.metadata.filesEdited + 1 }),
        ...(action?.type === 'view_changed' && { viewsChanged: currentSession.metadata.viewsChanged + 1 }),
        ...(action?.fileId && { lastFileId: action.fileId }),
        ...(action?.view && { lastView: action.view })
      }
    };

    try {
      await set('sessions', updatedSession);
      setCurrentSession(updatedSession);
    } catch (error) {
      console.error('Erro ao atualizar atividade:', error);
    }
  }, [currentSession, isReady, set]);

  // Finalizar sessão
  const endSession = useCallback(async () => {
    if (!currentSession || !isReady) return;

    const endedSession: UserSession = {
      ...currentSession,
      endedAt: new Date(),
      isActive: false,
      lastActiveAt: new Date()
    };

    try {
      await set('sessions', endedSession);
      setCurrentSession(null);
      console.log('Sessão finalizada:', currentSession.id);
    } catch (error) {
      console.error('Erro ao finalizar sessão:', error);
    }
  }, [currentSession, isReady, set]);

  // Carregar sessões
  const loadSessions = useCallback(async () => {
    if (!isReady) return;

    try {
      const sessions = await getAll<UserSession>('sessions');
      const sortedSessions = sessions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAllSessions(sortedSessions);

      // Verificar se há sessão ativa
      const activeSession = sessions.find(s => s.isActive);
      if (activeSession) {
        setCurrentSession(activeSession);
      }
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isReady, getAll]);

  // Obter estatísticas
  const getSessionStats = useCallback(() => {
    const totalSessions = allSessions.length;
    const totalDuration = allSessions.reduce((sum, session) => sum + session.duration, 0);
    const totalActions = allSessions.reduce((sum, session) => sum + session.actionsCount, 0);
    const avgDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;
    const avgActions = totalSessions > 0 ? totalActions / totalSessions : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySessions = allSessions.filter(s => 
      new Date(s.createdAt) >= today
    );

    return {
      total: totalSessions,
      totalDuration,
      totalActions,
      avgDuration,
      avgActions,
      today: todaySessions.length,
      todayDuration: todaySessions.reduce((sum, session) => sum + session.duration, 0),
      isActive: !!currentSession?.isActive
    };
  }, [allSessions, currentSession]);

  // Limpar sessões antigas
  const cleanOldSessions = useCallback(async (daysOld = 30) => {
    if (!isReady) return;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    try {
      const oldSessions = allSessions.filter(s => 
        new Date(s.createdAt) < cutoffDate && !s.isActive
      );

      for (const session of oldSessions) {
        await set('sessions', { ...session, id: `deleted_${session.id}` });
      }

      await loadSessions();
      
      toast({
        title: "Sessões limpas",
        description: `${oldSessions.length} sessões antigas foram removidas`
      });
    } catch (error) {
      console.error('Erro ao limpar sessões:', error);
      toast({
        title: "Erro",
        description: "Falha ao limpar sessões antigas",
        variant: "destructive"
      });
    }
  }, [isReady, allSessions, set, loadSessions, toast]);

  // Inicializar sistema
  useEffect(() => {
    if (isReady) {
      loadSessions();
    }
  }, [isReady, loadSessions]);

  // Auto-update da atividade a cada minuto
  useEffect(() => {
    if (!currentSession?.isActive) return;

    const interval = setInterval(() => {
      updateActivity();
    }, 60000); // 1 minuto

    return () => { clearInterval(interval); };
  }, [currentSession?.isActive, updateActivity]);

  // Finalizar sessão ao fechar a página
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentSession?.isActive) {
        endSession();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => { window.removeEventListener('beforeunload', handleBeforeUnload); };
  }, [currentSession?.isActive, endSession]);

  return {
    currentSession,
    allSessions,
    isLoading,
    createSession,
    endSession,
    updateActivity,
    loadSessions,
    getSessionStats,
    cleanOldSessions
  };
};
