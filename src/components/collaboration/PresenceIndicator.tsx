
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
  Plus,
  Sparkles
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
      case 'online': return 'bg-emerald-500 shadow-emerald-500/50';
      case 'away': return 'bg-amber-500 shadow-amber-500/50';
      case 'offline': return 'bg-gray-400 shadow-gray-400/50';
      default: return 'bg-gray-400 shadow-gray-400/50';
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
    if (userId === 'user1') return <Crown className="h-3 w-3 text-amber-500" />;
    if (userId === 'user2') return <Edit3 className="h-3 w-3 text-blue-500" />;
    return <Eye className="h-3 w-3 text-slate-500" />;
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

  const visibleUsers = users.slice(0, 3);
  const remainingCount = Math.max(0, users.length - 3);

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Status online melhorado */}
      <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-full">
        <div className="relative">
          <Circle className="h-3 w-3 text-emerald-500 fill-current animate-pulse" />
          <Circle className="absolute inset-0 h-3 w-3 text-emerald-500 animate-ping opacity-20" />
        </div>
        <span className="text-sm font-medium text-slate-300">
          {onlineCount} online
        </span>
      </div>

      {/* Avatares com melhor visual */}
      <div className="flex items-center -space-x-3">
        <TooltipProvider>
          {visibleUsers.map((user, index) => (
            <Tooltip key={user.id}>
              <TooltipTrigger asChild>
                <div 
                  className="relative transition-all duration-200 hover:z-20 hover:scale-110"
                  style={{ zIndex: 10 - index }}
                >
                  <Avatar className="h-9 w-9 border-2 border-slate-800/50 ring-2 ring-slate-700/30 backdrop-blur-sm">
                    <AvatarImage src={user.user?.avatar_url} />
                    <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-slate-200">
                      {user.user?.full_name?.charAt(0) || user.user?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-800 shadow-lg ${getStatusColor(user.status)}`} />
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-900/95 backdrop-blur-sm border-slate-700/50">
                <div className="text-center space-y-1">
                  <p className="font-medium text-slate-100">
                    {user.user?.full_name || user.user?.email}
                  </p>
                  <div className="flex items-center justify-center space-x-1">
                    {getRoleIcon(user.user_id)}
                    <span className="text-xs text-slate-400">{getRoleText(user.user_id)}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {getStatusText(user.status)} • {formatLastSeen(user.last_seen)}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}

          {remainingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-9 w-9 bg-slate-800/50 backdrop-blur-sm border-2 border-slate-700/50 rounded-full flex items-center justify-center text-xs font-medium text-slate-300 hover:bg-slate-700/50 transition-all duration-200 hover:scale-110 cursor-pointer">
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

      {/* Menu melhorado */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 w-9 p-0 rounded-full bg-slate-900/30 backdrop-blur-sm border border-slate-700/30 hover:bg-slate-800/50 hover:border-slate-600/50 transition-all duration-200"
          >
            <Users className="h-4 w-4 text-slate-300" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-72 bg-slate-900/95 backdrop-blur-md border-slate-700/50"
        >
          <div className="p-3">
            <div className="flex items-center space-x-2 mb-3">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <h4 className="font-medium text-sm text-slate-100">
                Usuários Ativos ({onlineCount})
              </h4>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-magic">
              {users.map((user) => (
                <div key={user.id} className="flex items-center space-x-3 p-2.5 rounded-lg hover:bg-slate-800/50 transition-colors group">
                  <div className="relative">
                    <Avatar className="h-7 w-7 border border-slate-700/50">
                      <AvatarImage src={user.user?.avatar_url} />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-slate-200">
                        {user.user?.full_name?.charAt(0) || user.user?.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-slate-800 ${getStatusColor(user.status)}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1">
                      <p className="text-sm font-medium truncate text-slate-200 group-hover:text-slate-100">
                        {user.user?.full_name || user.user?.email}
                      </p>
                      {getRoleIcon(user.user_id)}
                    </div>
                    <p className="text-xs text-slate-500">
                      {getStatusText(user.status)} • {formatLastSeen(user.last_seen)}
                    </p>
                  </div>

                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onMentionUser && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-slate-700/50"
                        onClick={() => onMentionUser(user.user_id)}
                      >
                        <AtSign className="h-3 w-3 text-slate-400" />
                      </Button>
                    )}
                    
                    {onStartChat && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-slate-700/50"
                        onClick={() => onStartChat(user.user_id)}
                      >
                        <MessageSquare className="h-3 w-3 text-slate-400" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DropdownMenuSeparator className="bg-slate-700/50" />
          
          {onInviteUser && (
            <DropdownMenuItem 
              onClick={onInviteUser}
              className="text-slate-200 hover:bg-slate-800/50 focus:bg-slate-800/50"
            >
              <Plus className="h-4 w-4 mr-2 text-emerald-400" />
              Convidar usuário
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem className="text-slate-200 hover:bg-slate-800/50 focus:bg-slate-800/50">
            <Users className="h-4 w-4 mr-2 text-blue-400" />
            Gerenciar permissões
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default PresenceIndicator;
