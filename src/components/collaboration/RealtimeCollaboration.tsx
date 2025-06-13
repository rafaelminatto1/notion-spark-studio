import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Eye, Edit, MessageCircle, Cursor, Activity, Share2, Clock, Settings } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

// Tipos para colaboração
interface Collaborator {
  id: string;
  name: string;
  avatar: string;
  status: 'active' | 'idle' | 'away';
  lastSeen: Date;
  isTyping: boolean;
  currentDocument?: string;
  permissions: 'admin' | 'editor' | 'viewer';
  cursor?: {
    x: number;
    y: number;
    element?: string;
  };
}

interface CollaborationEvent {
  id: string;
  type: 'join' | 'leave' | 'edit' | 'comment' | 'cursor_move' | 'typing';
  userId: string;
  timestamp: Date;
  data?: any;
}

interface OperationalTransform {
  id: string;
  operation: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
  timestamp: Date;
  userId: string;
}

interface RealtimeCollaborationProps {
  documentId: string;
  currentUser: Collaborator;
  onCollaboratorJoin?: (collaborator: Collaborator) => void;
  onCollaboratorLeave?: (collaboratorId: string) => void;
  onContentChange?: (operations: OperationalTransform[]) => void;
  className?: string;
}

export const RealtimeCollaboration: React.FC<RealtimeCollaborationProps> = ({
  documentId,
  currentUser,
  onCollaboratorJoin,
  onCollaboratorLeave,
  onContentChange,
  className = ''
}) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [events, setEvents] = useState<CollaborationEvent[]>([]);
  const [operations, setOperations] = useState<OperationalTransform[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');
  const [showPresence, setShowPresence] = useState(true);
  const [conflictResolution, setConflictResolution] = useState<'auto' | 'manual'>('auto');
  
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout>();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  // Simulação de colaboradores (em produção viria do WebSocket)
  useEffect(() => {
    const mockCollaborators: Collaborator[] = [
      {
        id: 'user1',
        name: 'Ana Silva',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
        status: 'active',
        lastSeen: new Date(),
        isTyping: false,
        permissions: 'editor',
        cursor: { x: 120, y: 80 }
      },
      {
        id: 'user2',
        name: 'Carlos Santos',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
        status: 'active',
        lastSeen: new Date(Date.now() - 30000),
        isTyping: true,
        permissions: 'admin',
        cursor: { x: 300, y: 150 }
      },
      {
        id: 'user3',
        name: 'Maria Oliveira',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
        status: 'idle',
        lastSeen: new Date(Date.now() - 120000),
        isTyping: false,
        permissions: 'viewer'
      }
    ];

    setCollaborators(mockCollaborators);
    setIsConnected(true);

    // Simular eventos de colaboração
    const interval = setInterval(() => {
      const newEvent: CollaborationEvent = {
        id: `event_${Date.now()}`,
        type: Math.random() > 0.5 ? 'edit' : 'cursor_move',
        userId: mockCollaborators[Math.floor(Math.random() * mockCollaborators.length)].id,
        timestamp: new Date(),
        data: { action: 'typing', position: Math.floor(Math.random() * 100) }
      };

      setEvents(prev => [...prev.slice(-19), newEvent]);
    }, 3000);

    return () => clearInterval(interval);
  }, [documentId]);

  // Monitoramento de qualidade da conexão
  useEffect(() => {
    const checkConnection = () => {
      const latency = Math.random() * 200;
      if (latency < 50) setConnectionQuality('excellent');
      else if (latency < 100) setConnectionQuality('good');
      else setConnectionQuality('poor');
    };

    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  // Transformação operacional para edição colaborativa
  const applyOperation = (operation: OperationalTransform) => {
    setOperations(prev => [...prev, operation]);
    
    // Simular transformação de conflitos
    if (conflictResolution === 'auto') {
      // Implementar algoritmo de transformação operacional
      const transformedOp = {
        ...operation,
        position: operation.position + Math.floor(Math.random() * 5) // Ajuste simulado
      };
      onContentChange?.([transformedOp]);
    }
  };

  // Componente de cursor de colaborador
  const CollaboratorCursor: React.FC<{ collaborator: Collaborator }> = ({ collaborator }) => {
    if (!collaborator.cursor || !showPresence) return null;

    return (
      <motion.div
        className="absolute pointer-events-none z-50"
        style={{
          left: collaborator.cursor.x,
          top: collaborator.cursor.y
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center space-x-1">
          <Cursor className="h-4 w-4 text-blue-500" />
          <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
            {collaborator.name}
          </div>
        </div>
      </motion.div>
    );
  };

  // Status de conexão com indicador visual
  const getConnectionColor = () => {
    if (!isConnected) return 'text-red-500';
    switch (connectionQuality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const activeCollaborators = collaborators.filter(c => c.status === 'active');
  const typingCollaborators = collaborators.filter(c => c.isTyping);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header de status de colaboração */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Colaboração em Tempo Real</span>
              <motion.div
                className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                animate={{ scale: isConnected ? [1, 1.2, 1] : 1 }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPresence(!showPresence)}
              >
                <Eye className="h-4 w-4 mr-1" />
                {showPresence ? 'Ocultar' : 'Mostrar'} Presença
              </Button>
              <Badge variant={isConnected ? 'default' : 'destructive'}>
                {isConnected ? `${activeCollaborators.length} online` : 'Desconectado'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="presence" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="presence">Presença</TabsTrigger>
              <TabsTrigger value="activity">Atividade</TabsTrigger>
              <TabsTrigger value="conflicts">Conflitos</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>

            <TabsContent value="presence" className="space-y-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Colaboradores Ativos ({activeCollaborators.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {collaborators.map((collaborator) => (
                    <motion.div
                      key={collaborator.id}
                      className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.1 }}
                    >
                      <div className="relative">
                        <Avatar
                          src={collaborator.avatar}
                          alt={collaborator.name}
                          size="sm"
                        />
                        <motion.div
                          className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${
                            collaborator.status === 'active' ? 'bg-green-500' :
                            collaborator.status === 'idle' ? 'bg-yellow-500' : 'bg-gray-500'
                          }`}
                          animate={{
                            scale: collaborator.isTyping ? [1, 1.2, 1] : 1
                          }}
                          transition={{ repeat: Infinity, duration: 1 }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {collaborator.name}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {collaborator.permissions}
                          </Badge>
                          {collaborator.isTyping && (
                            <Badge variant="secondary" className="text-xs">
                              <Edit className="h-3 w-3 mr-1" />
                              digitando...
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {collaborator.status === 'active' ? 'agora' : 
                         new Intl.RelativeTimeFormat('pt-BR').format(
                           Math.floor((collaborator.lastSeen.getTime() - Date.now()) / 60000),
                           'minute'
                         )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {typingCollaborators.length > 0 && (
                  <motion.div
                    className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center space-x-2">
                      <Edit className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-800 dark:text-blue-200">
                        {typingCollaborators.map(c => c.name).join(', ')} 
                        {typingCollaborators.length === 1 ? ' está digitando...' : ' estão digitando...'}
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <Activity className="h-4 w-4 mr-2" />
                  Atividade Recente
                </h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  <AnimatePresence>
                    {events.slice(-10).map((event) => {
                      const collaborator = collaborators.find(c => c.id === event.userId);
                      if (!collaborator) return null;

                      return (
                        <motion.div
                          key={event.id}
                          className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-800 rounded"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                        >
                          <Avatar src={collaborator.avatar} alt={collaborator.name} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              <span className="font-medium">{collaborator.name}</span>
                              {event.type === 'edit' && ' editou o documento'}
                              {event.type === 'join' && ' entrou na sessão'}
                              {event.type === 'leave' && ' saiu da sessão'}
                              {event.type === 'comment' && ' adicionou um comentário'}
                              {event.type === 'cursor_move' && ' moveu o cursor'}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Intl.RelativeTimeFormat('pt-BR').format(
                              Math.floor((event.timestamp.getTime() - Date.now()) / 60000),
                              'minute'
                            )}
                          </span>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="conflicts" className="space-y-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Resolução de Conflitos
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-yellow-500" />
                      <span className="text-sm">Modo de resolução: {conflictResolution}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConflictResolution(conflictResolution === 'auto' ? 'manual' : 'auto')}
                    >
                      Alternar para {conflictResolution === 'auto' ? 'manual' : 'automático'}
                    </Button>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>Operações sincronizadas: {operations.length}</p>
                    <Progress value={(operations.length / 100) * 100} className="mt-2" />
                  </div>
                  
                  {operations.slice(-3).map((operation) => (
                    <div key={operation.id} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                      <div className="flex justify-between">
                        <span>{operation.operation} na posição {operation.position}</span>
                        <span className="text-gray-500">
                          {operation.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações de Colaboração
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Mostrar cursores</span>
                    <Button
                      variant={showPresence ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowPresence(!showPresence)}
                    >
                      {showPresence ? 'Ativado' : 'Desativado'}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Qualidade da conexão</span>
                    <Badge className={getConnectionColor()}>
                      {connectionQuality}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auto-salvamento</span>
                    <Badge variant="default">Ativado</Badge>
                  </div>
                  
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Share2 className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Link de Compartilhamento
                      </span>
                    </div>
                    <code className="text-xs bg-white dark:bg-gray-800 p-2 rounded block">
                      https://app.notion-spark.com/doc/{documentId}
                    </code>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Renderizar cursores de colaboradores */}
      <AnimatePresence>
        {collaborators.map((collaborator) => (
          <CollaboratorCursor key={collaborator.id} collaborator={collaborator} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default RealtimeCollaboration; 