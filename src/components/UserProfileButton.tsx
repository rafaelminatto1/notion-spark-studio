import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSupabaseProfile } from '@/hooks/useSupabaseProfile';
import { User, Settings, LogOut, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserProfileButtonProps {
  onShowSettings?: () => void;
  className?: string;
}

export const UserProfileButton: React.FC<UserProfileButtonProps> = ({
  onShowSettings,
  className
}) => {
  const { user, signOut } = useSupabaseAuth();
  const { profile, role } = useSupabaseProfile();

  if (!user) return null;

  const getRoleColor = (userRole?: string) => {
    switch (userRole) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'editor':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getRoleIcon = (userRole?: string) => {
    if (userRole === 'admin') {
      return <Shield className="h-3 w-3" />;
    }
    return null;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={cn("relative h-10 w-10 rounded-full", className)}>
          <Avatar className="h-9 w-9">
            <AvatarImage 
              src={profile?.avatar || user?.user_metadata?.avatar_url} 
              alt={profile?.name || user?.email || ''} 
            />
            <AvatarFallback>
              {(profile?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <p className="text-sm font-medium leading-none">
                {profile?.name || user?.user_metadata?.name || 'Usuário'}
              </p>
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
            {role?.role && (
              <Badge 
                variant="secondary" 
                className={`text-xs w-fit ${getRoleColor(role.role)}`}
              >
                {getRoleIcon(role.role)}
                {role.role === 'admin' ? 'Administrador' : 
                 role.role === 'editor' ? 'Editor' : 'Visualizador'}
              </Badge>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onShowSettings}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Configurações</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
