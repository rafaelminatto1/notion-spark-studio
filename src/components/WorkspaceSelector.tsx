
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useSharedWorkspaces } from '@/hooks/useSharedWorkspaces';
import { ChevronDown, Plus, Users, Globe, Lock } from 'lucide-react';

interface WorkspaceSelectorProps {
  onCreateWorkspace?: () => void;
  onManageWorkspace?: () => void;
}

export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  onCreateWorkspace,
  onManageWorkspace
}) => {
  const { workspaces, currentWorkspace, setCurrentWorkspace } = useSharedWorkspaces();

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'owner':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'editor':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 min-w-48">
          <Users className="h-4 w-4" />
          {currentWorkspace ? (
            <div className="flex items-center gap-2">
              <span className="truncate">{currentWorkspace.name}</span>
              {currentWorkspace.is_public ? (
                <Globe className="h-3 w-3" />
              ) : (
                <Lock className="h-3 w-3" />
              )}
            </div>
          ) : (
            'Workspace Pessoal'
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        
        <DropdownMenuItem onClick={() => { setCurrentWorkspace(null); }}>
          <div className="flex items-center gap-2 w-full">
            <Users className="h-4 w-4" />
            <span>Workspace Pessoal</span>
            <Badge variant="secondary" className="ml-auto text-xs">
              Próprio
            </Badge>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {workspaces.length > 0 ? (
          workspaces.map((workspace) => (
            <DropdownMenuItem 
              key={workspace.id}
              onClick={() => { setCurrentWorkspace(workspace); }}
            >
              <div className="flex items-center gap-2 w-full">
                {workspace.is_public ? (
                  <Globe className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                <span className="truncate flex-1">{workspace.name}</span>
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>
            <span className="text-muted-foreground">Nenhum workspace compartilhado</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onCreateWorkspace}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Workspace
        </DropdownMenuItem>

        {currentWorkspace && (
          <DropdownMenuItem onClick={onManageWorkspace}>
            <Users className="h-4 w-4 mr-2" />
            Gerenciar Membros
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
