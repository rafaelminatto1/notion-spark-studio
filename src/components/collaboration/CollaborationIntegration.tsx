import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Users, 
  MessageCircle, 
  Wifi, 
  WifiOff, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Settings,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePermissions } from '../permissions/PermissionsEngine';
import { LiveCursors } from './LiveCursors';
import { OperationalTransform } from './OperationalTransform';
import { CommentsSystem } from './CommentsSystem';
import { PresenceAwareness } from './PresenceAwareness';
import { ConflictResolver } from './ConflictResolver';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  isOnline: boolean;
  lastActivity: Date;
  permissions: string[];
}

interface CollaborationIntegrationProps {
  documentId: string;
  currentUser: CollaborationUser;
  content: string;
  onContentChange: (content: string) => void;
  className?: string;
  isEnabled?: boolean;
  maxCollaborators?: number;
}

export const CollaborationIntegration: React.FC<CollaborationIntegrationProps> = ({
  documentId,
  currentUser,
  content,
  onContentChange,
  className,
  isEnabled = true,
  maxCollaborators = 10
}) => {
  const { checkPermission, state: permissionsState } = usePermissions();
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState<CollaborationUser[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [latency, setLatency] = useState<number>(0);
  const [showPresence, setShowPresence] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [conflictCount, setConflictCount] = useState(0);

  // Verificar permissões de colaboração
  const canCollaborate = useMemo(() => {
    return checkPermission(currentUser.id, documentId, 'update') || 
           checkPermission(currentUser.id, documentId, 'comment');
  }, [checkPermission, currentUser.id, documentId]);

  const canComment = useMemo(() => {
    return checkPermission(currentUser.id, documentId, 'comment');
  }, [checkPermission, currentUser.id, documentId]);

  const canEdit = useMemo(() => {
    return checkPermission(currentUser.id, documentId, 'update');
  }, [checkPermission, currentUser.id, documentId]);

  // Simular conexão de colaboração
  useEffect(() => {
    if (!isEnabled || !canCollaborate) return;

    const connectToCollaboration = async () => {
      setConnectionStatus('connecting');
      
      try {
        // Simular delay de conexão
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setConnectionStatus('connected');
        setIsConnected(true);
        
        // Simular colaboradores online
        const mockCollaborators: CollaborationUser[] = [
          {
            id: 'user-2',
            name: 'Ana Silva',
            email: 'ana@exemplo.com',
            color: '#10B981',
            isOnline: true,
            lastActivity: new Date(),
            permissions: ['read', 'update', 'comment']
          },
          {
            id: 'user-3',
            name: 'João Santos',
            email: 'joao@exemplo.com',
            color: '#8B5CF6',
            isOnline: true,
            lastActivity: new Date(Date.now() - 2 * 60 * 1000),
            permissions: ['read', 'comment']
          }
        ];
        
        setCollaborators(mockCollaborators);
        
        toast.success('Conectado à colaboração', {
          description: `${mockCollaborators.length} colaboradores online`
        });

      } catch (error) {
        setConnectionStatus('error');
        toast.error('Falha na conexão', {
          description: 'Não foi possível conectar à colaboração em tempo real'
        });
      }
    };

    connectToCollaboration();

    return () => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
      setCollaborators([]);
    };
  }, [isEnabled, canCollaborate, documentId]);

  // Simular latência
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      setLatency(Math.random() * 100 + 20); // 20-120ms
    }, 5000);

    return () => clearInterval(interval);
  }, [isConnected]);

  const handleConflictDetected = useCallback((conflictInfo: any) => {
    setConflictCount(prev => prev + 1);
    toast.warning('Conflito detectado', {
      description: 'Múltiplas edições simultâneas detectadas'
    });
  }, []);

  const handleConflictResolved = useCallback(() => {
    toast.success('Conflito resolvido', {
      description: 'As alterações foram sincronizadas'
    });
  }, []);

  const activeCollaborators = useMemo(() => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return collaborators.filter(c => c.isOnline && c.lastActivity > fiveMinutesAgo);
  }, [collaborators]);

  const getConnectionStatusInfo = () => {
    switch (connectionStatus) {
      case 'connecting':
        return { icon: Clock, color: 'text-yellow-500', label: 'Conectando...' };
      case 'connected':
        return { icon: Wifi, color: 'text-green-500', label: 'Conectado' };
      case 'error':
        return { icon: AlertTriangle, color: 'text-red-500', label: 'Erro de conexão' };
      default:
        return { icon: WifiOff, color: 'text-gray-500', label: 'Desconectado' };
    }
  };

  if (!isEnabled || !canCollaborate) {
    return null;
  }

  const statusInfo = getConnectionStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className={cn("collaboration-integration", className)}>
      {/* Status Bar */}
      <div className="fixed top-4 right-4 z-50">
        <Card className="w-80 shadow-lg border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <StatusIcon className={cn("h-4 w-4", statusInfo.color)} />
                <span>Colaboração</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPresence(!showPresence)}
                className="h-6 w-6 p-0"
              >
                <Eye className="h-3 w-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="space-y-3">
              {/* Connection Status */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className={statusInfo.color}>{statusInfo.label}</span>
              </div>

              {/* Latency */}
              {isConnected && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Latência:</span>
                  <Badge variant={latency < 50 ? 'default' : latency < 100 ? 'secondary' : 'destructive'}>
                    {Math.round(latency)}ms
                  </Badge>
                </div>
              )}

              {/* Active Collaborators */}
              {activeCollaborators.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Colaboradores ativos ({activeCollaborators.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {activeCollaborators.slice(0, 5).map((collaborator) => (
                      <div
                        key={collaborator.id}
                        className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs"
                        title={`${collaborator.name} - ${collaborator.email}`}
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: collaborator.color }}
                        />
                        <span>{collaborator.name.split(' ')[0]}</span>
                      </div>
                    ))}
                    {activeCollaborators.length > 5 && (
                      <Badge variant="secondary" className="text-xs">
                        +{activeCollaborators.length - 5}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Conflicts */}
              {conflictCount > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Conflitos resolvidos:</span>
                  <Badge variant="outline">{conflictCount}</Badge>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                {canComment && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowComments(!showComments)}
                    className="flex-1 h-8 text-xs"
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Comentários
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPresence(!showPresence)}
                  className="flex-1 h-8 text-xs"
                >
                  <Users className="h-3 w-3 mr-1" />
                  Presença
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Cursors */}
      {isConnected && showPresence && (
        <LiveCursors
          currentUser={{
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            avatar: currentUser.avatar,
            color: currentUser.color
          }}
          documentId={documentId}
        />
      )}

      {/* Operational Transform */}
      {isConnected && canEdit && (
        <OperationalTransform
          documentId={documentId}
          initialContent={content}
          currentUserId={currentUser.id}
          onContentChange={onContentChange}
          onConflictDetected={handleConflictDetected}
          onConflictResolved={handleConflictResolved}
        />
      )}

      {/* Presence Awareness */}
      {isConnected && showPresence && (
        <PresenceAwareness
          documentId={documentId}
          currentUser={currentUser}
          collaborators={activeCollaborators}
        />
      )}

      {/* Comments System */}
      {isConnected && showComments && canComment && (
        <div className="fixed right-4 top-24 bottom-4 w-80 z-40">
          <CommentsSystem
            documentId={documentId}
            currentUser={currentUser}
            className="h-full"
          />
        </div>
      )}

      {/* Connection Loss Warning */}
      <AnimatePresence>
        {connectionStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 shadow-lg">
              <div className="flex items-center gap-2 text-red-700">
                <WifiOff className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Conexão perdida - Trabalhando offline
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collaboration Disabled Notice */}
      {!canCollaborate && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 shadow-lg max-w-sm">
            <div className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="h-4 w-4" />
              <div>
                <p className="text-sm font-medium">Colaboração limitada</p>
                <p className="text-xs text-yellow-600">
                  Você tem permissões limitadas neste documento
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborationIntegration; 