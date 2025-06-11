import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Eye, 
  Edit, 
  User, 
  Circle, 
  Clock,
  MessageCircle,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Tipos para presença de usuários
interface PresenceUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  role?: 'owner' | 'editor' | 'viewer' | 'commenter';
}

interface UserPresence {
  user: PresenceUser;
  status: 'active' | 'idle' | 'away' | 'offline';
  lastSeen: Date;
  currentAction?: 'viewing' | 'editing' | 'commenting' | 'sharing';
  currentLocation?: {
    section?: string;
    elementId?: string;
    lineNumber?: number;
  };
  device?: 'desktop' | 'mobile' | 'tablet';
  joinedAt: Date;
}

interface PresenceAwarenessProps {
  documentId: string;
  currentUser: PresenceUser;
  maxDisplayUsers?: number;
  showDetailed?: boolean;
  className?: string;
  onUserClick?: (user: PresenceUser) => void;
}

// Hook para gerenciar presença de usuários
const usePresenceAwareness = (documentId: string, currentUser: PresenceUser) => {
  const [presences, setPresences] = useState<Map<string, UserPresence>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  // Simular conexão em tempo real
  useEffect(() => {
    // Adicionar usuário atual
    const currentPresence: UserPresence = {
      user: currentUser,
      status: 'active',
      lastSeen: new Date(),
      currentAction: 'viewing',
      device: getDeviceType(),
      joinedAt: new Date()
    };

    setPresences(prev => {
      const newPresences = new Map(prev);
      newPresences.set(currentUser.id, currentPresence);
      return newPresences;
    });

    setIsConnected(true);

    // Simular outros usuários para demonstração
    const simulateOtherUsers = () => {
      const mockUsers = [
        {
          id: 'user-2',
          name: 'Maria Silva',
          email: 'maria@example.com',
          color: '#22c55e',
          role: 'editor' as const
        },
        {
          id: 'user-3', 
          name: 'João Santos',
          email: 'joao@example.com',
          color: '#3b82f6',
          role: 'viewer' as const
        }
      ];

      mockUsers.forEach((user, index) => {
        setTimeout(() => {
          const presence: UserPresence = {
            user,
            status: Math.random() > 0.3 ? 'active' : 'idle',
            lastSeen: new Date(Date.now() - Math.random() * 300000), // Últimos 5 minutos
            currentAction: ['viewing', 'editing', 'commenting'][Math.floor(Math.random() * 3)] as any,
            device: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)] as any,
            joinedAt: new Date(Date.now() - Math.random() * 3600000) // Última hora
          };

          setPresences(prev => {
            const newPresences = new Map(prev);
            newPresences.set(user.id, presence);
            return newPresences;
          });
        }, index * 1000); // Simular entrada gradual
      });
    };

    simulateOtherUsers();

    // Atualizar status periodicamente
    const interval = setInterval(() => {
      setPresences(prev => {
        const newPresences = new Map(prev);
        
        newPresences.forEach((presence, userId) => {
          if (userId !== currentUser.id) {
            // Simular mudanças de status
            const timeSinceLastSeen = Date.now() - presence.lastSeen.getTime();
            let newStatus = presence.status;

            if (timeSinceLastSeen > 60000) { // 1 minuto
              newStatus = 'away';
            } else if (timeSinceLastSeen > 30000) { // 30 segundos
              newStatus = 'idle';
            } else if (Math.random() > 0.7) {
              newStatus = 'active';
            }

            newPresences.set(userId, {
              ...presence,
              status: newStatus,
              lastSeen: newStatus === 'active' ? new Date() : presence.lastSeen
            });
          }
        });

        return newPresences;
      });
    }, 10000); // Atualizar a cada 10 segundos

    return () => {
      clearInterval(interval);
      setIsConnected(false);
    };
  }, [documentId, currentUser]);

  const updateUserAction = useCallback((
    action: UserPresence['currentAction'],
    location?: UserPresence['currentLocation']
  ) => {
    setPresences(prev => {
      const newPresences = new Map(prev);
      const currentPresence = newPresences.get(currentUser.id);
      
      if (currentPresence) {
        newPresences.set(currentUser.id, {
          ...currentPresence,
          currentAction: action,
          currentLocation: location,
          lastSeen: new Date(),
          status: 'active'
        });
      }

      return newPresences;
    });
  }, [currentUser.id]);

  return {
    presences: Array.from(presences.values()),
    isConnected,
    updateUserAction
  };
};

// Utilidade para detectar tipo de dispositivo
const getDeviceType = (): UserPresence['device'] => {
  const userAgent = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
    return 'mobile';
  }
  return 'desktop';
};

// Componente de avatar de usuário
interface UserAvatarProps {
  user: PresenceUser;
  status: UserPresence['status'];
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  onClick?: () => void;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  status,
  size = 'md',
  showStatus = true,
  onClick
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };

  const statusColors = {
    active: 'bg-green-500',
    idle: 'bg-yellow-500',
    away: 'bg-orange-500',
    offline: 'bg-gray-400'
  };

  return (
    <div 
      className={cn(
        "relative",
        onClick && "cursor-pointer hover:scale-105 transition-transform"
      )}
      onClick={onClick}
    >
      {user.avatar ? (
        <img
          src={user.avatar}
          alt={user.name}
          className={cn(
            "rounded-full border-2 border-white shadow-sm",
            sizeClasses[size]
          )}
        />
      ) : (
        <div
          className={cn(
            "rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white font-medium",
            sizeClasses[size]
          )}
          style={{ backgroundColor: user.color }}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
      )}

      {showStatus && (
        <div
          className={cn(
            "absolute -bottom-0.5 -right-0.5 border-2 border-white rounded-full",
            statusColors[status],
            size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-3.5 w-3.5' : 'h-4 w-4'
          )}
        />
      )}
    </div>
  );
};

// Componente principal de presença
export const PresenceAwareness: React.FC<PresenceAwarenessProps> = ({
  documentId,
  currentUser,
  maxDisplayUsers = 5,
  showDetailed = false,
  className,
  onUserClick
}) => {
  const { presences, isConnected, updateUserAction } = usePresenceAwareness(documentId, currentUser);

  // Ordenar por status e última atividade
  const sortedPresences = useMemo(() => {
    return presences
      .filter(p => p.user.id !== currentUser.id) // Excluir usuário atual
      .sort((a, b) => {
        // Priorizar usuários ativos
        if (a.status !== b.status) {
          const statusPriority = { active: 3, idle: 2, away: 1, offline: 0 };
          return statusPriority[b.status] - statusPriority[a.status];
        }
        // Depois por última atividade
        return b.lastSeen.getTime() - a.lastSeen.getTime();
      });
  }, [presences, currentUser.id]);

  const displayUsers = sortedPresences.slice(0, maxDisplayUsers);
  const overflowCount = Math.max(0, sortedPresences.length - maxDisplayUsers);

  const getActionIcon = (action?: UserPresence['currentAction']) => {
    switch (action) {
      case 'editing': return <Edit className="h-3 w-3" />;
      case 'commenting': return <MessageCircle className="h-3 w-3" />;
      case 'sharing': return <Share2 className="h-3 w-3" />;
      default: return <Eye className="h-3 w-3" />;
    }
  };

  const getActionText = (action?: UserPresence['currentAction']) => {
    switch (action) {
      case 'editing': return 'editando';
      case 'commenting': return 'comentando';
      case 'sharing': return 'compartilhando';
      default: return 'visualizando';
    }
  };

  const getRoleColor = (role?: PresenceUser['role']) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-700';
      case 'editor': return 'bg-blue-100 text-blue-700';
      case 'commenter': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!isConnected) return null;

  return (
    <div className={cn("presence-awareness", className)}>
      {/* Visualização compacta */}
      {!showDetailed && (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            <AnimatePresence>
              {displayUsers.map((presence) => (
                <motion.div
                  key={presence.user.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <UserAvatar
                    user={presence.user}
                    status={presence.status}
                    size="md"
                    onClick={() => onUserClick?.(presence.user)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {overflowCount > 0 && (
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
              +{overflowCount}
            </div>
          )}

          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            <span>{presences.length} ativo{presences.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {/* Visualização detalhada */}
      {showDetailed && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
            <Users className="h-5 w-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">
              Usuários Ativos ({presences.length})
            </h3>
          </div>

          <div className="space-y-2">
            <AnimatePresence>
              {presences.map((presence) => (
                <motion.div
                  key={presence.user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                    presence.user.id === currentUser.id
                      ? "bg-blue-50 border-blue-200"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100 cursor-pointer"
                  )}
                  onClick={() => presence.user.id !== currentUser.id && onUserClick?.(presence.user)}
                >
                  <UserAvatar
                    user={presence.user}
                    status={presence.status}
                    size="lg"
                    showStatus={true}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">
                        {presence.user.name}
                        {presence.user.id === currentUser.id && (
                          <span className="text-sm text-gray-500 ml-1">(você)</span>
                        )}
                      </p>
                      {presence.user.role && (
                        <Badge 
                          variant="secondary"
                          className={cn("text-xs", getRoleColor(presence.user.role))}
                        >
                          {presence.user.role}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        {getActionIcon(presence.currentAction)}
                        <span>{getActionText(presence.currentAction)}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {presence.status === 'active' 
                            ? 'agora'
                            : `${Math.round((Date.now() - presence.lastSeen.getTime()) / 60000)}min atrás`
                          }
                        </span>
                      </div>

                      {presence.device && (
                        <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                          {presence.device}
                        </span>
                      )}
                    </div>
                  </div>

                  <div 
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: presence.user.color }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresenceAwareness; 