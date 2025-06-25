'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Users, 
  Circle, 
  MessageSquare, 
  AtSign, 
  Crown,
  Edit3,
  Eye,
  Plus
} from 'lucide-react';

interface User {
  id: string;
  user_id: string;
  status: 'online' | 'away' | 'offline';
  last_seen: string;
  user?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

interface PresenceIndicatorProps {
  users: User[];
  onlineCount: number;
  onInviteUser?: () => void;
  onMentionUser?: (userId: string) => void;
  onStartChat?: (userId: string) => void;
  className?: string;
}

const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  users,
  onlineCount,
  onInviteUser,
  onMentionUser,
  onStartChat,
  className = ''
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Ausente';
      case 'offline': return 'Offline';
      default: return 'Desconhecido';
    }
  };

  const getRoleIcon = (userId: string) => {
    // Simular diferentes roles
    if (userId === 'user1') return <Crown className="h-3 w-3 text-yellow-600" />;
    if (userId === 'user2') return <Edit3 className="h-3 w-3 text-blue-600" />;
    return <Eye className="h-3 w-3 text-gray-600" />;
  };

  const getRoleText = (userId: string) => {
    if (userId === 'user1') return 'Proprietário';
    if (userId === 'user2') return 'Editor';
    return 'Visualizador';
  };

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'agora mesmo';
    if (diffMins < 60) return `${diffMins}m atrás`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d atrás`;
  };

  // Mostrar até 3 avatares, depois um contador
  const visibleUsers = users.slice(0, 3);
  const remainingCount = Math.max(0, users.length - 3);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Contador de usuários online */}
      <div className="flex items-center space-x-1 text-sm text-gray-600">
        <Circle className="h-3 w-3 text-green-500 fill-current" />
        <span>{onlineCount} online</span>
      </div>

      {/* Avatares dos usuários */}
      <div className="flex items-center -space-x-2">
        <TooltipProvider>
          {visibleUsers.map((user) => (
            <Tooltip key={user.id}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar className="h-8 w-8 border-2 border-white hover:z-10 transition-transform hover:scale-110">
                    <AvatarImage src={user.user?.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {user.user?.full_name?.charAt(0) || user.user?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(user.status)}`} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <p className="font-medium">
                    {user.user?.full_name || user.user?.email}
                  </p>
                  <div className="flex items-center justify-center space-x-1 mt-1">
                    {getRoleIcon(user.user_id)}
                    <span className="text-xs">{getRoleText(user.user_id)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {getStatusText(user.status)} • {formatLastSeen(user.last_seen)}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}

          {/* Contador de usuários restantes */}
          {remainingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-8 w-8 bg-gray-100 border-2 border-white rounded-full flex items-center justify-center text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors">
                  +{remainingCount}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>e mais {remainingCount} usuário{remainingCount > 1 ? 's' : ''}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </div>

      {/* Menu de ações */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Users className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="p-2">
            <h4 className="font-medium text-sm mb-2">
              Usuários Ativos ({onlineCount})
            </h4>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {users.map((user) => (
                <div key={user.id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                  <div className="relative">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.user?.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {user.user?.full_name?.charAt(0) || user.user?.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white ${getStatusColor(user.status)}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1">
                      <p className="text-sm font-medium truncate">
                        {user.user?.full_name || user.user?.email}
                      </p>
                      {getRoleIcon(user.user_id)}
                    </div>
                    <p className="text-xs text-gray-500">
                      {getStatusText(user.status)} • {formatLastSeen(user.last_seen)}
                    </p>
                  </div>

                  <div className="flex space-x-1">
                    {onMentionUser && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onMentionUser(user.user_id)}
                      >
                        <AtSign className="h-3 w-3" />
                      </Button>
                    )}
                    
                    {onStartChat && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onStartChat(user.user_id)}
                      >
                        <MessageSquare className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DropdownMenuSeparator />
          
          {onInviteUser && (
            <DropdownMenuItem onClick={onInviteUser}>
              <Plus className="h-4 w-4 mr-2" />
              Convidar usuário
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem>
            <Users className="h-4 w-4 mr-2" />
            Gerenciar permissões
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default PresenceIndicator; 