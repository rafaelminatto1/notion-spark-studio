
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { WorkspaceMember } from '@/hooks/useSharedWorkspaces';
import { useSharedWorkspaces } from '@/hooks/useSharedWorkspaces';
import { UserPlus, MoreHorizontal, Crown, Shield, Edit, Eye, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface WorkspaceMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WorkspaceMembersDialog: React.FC<WorkspaceMembersDialogProps> = ({
  open,
  onOpenChange
}) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceMember['role']>('viewer');
  const [loading, setLoading] = useState(false);
  
  const { 
    currentWorkspace, 
    members, 
    inviteMember, 
    updateMemberRole, 
    removeMember 
  } = useSharedWorkspaces();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !currentWorkspace) return;

    setLoading(true);
    const success = await inviteMember(currentWorkspace.id, inviteEmail.trim(), inviteRole);
    
    if (success) {
      setInviteEmail('');
      setInviteRole('viewer');
    }
    setLoading(false);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3" />;
      case 'admin':
        return <Shield className="h-3 w-3" />;
      case 'editor':
        return <Edit className="h-3 w-3" />;
      default:
        return <Eye className="h-3 w-3" />;
    }
  };

  const getRoleColor = (role: string) => {
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

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Proprietário';
      case 'admin':
        return 'Administrador';
      case 'editor':
        return 'Editor';
      default:
        return 'Visualizador';
    }
  };

  if (!currentWorkspace) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Membros do Workspace</DialogTitle>
          <DialogDescription>
            Gerencie quem tem acesso ao workspace "{currentWorkspace.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulário de convite */}
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Convidar novo membro</Label>
              <Input
                id="email"
                type="email"
                value={inviteEmail}
                onChange={(e) => { setInviteEmail(e.target.value); }}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Permissão</Label>
              <Select value={inviteRole} onValueChange={(value) => { setInviteRole(value as WorkspaceMember['role']); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Visualizador - Pode apenas visualizar</SelectItem>
                  <SelectItem value="editor">Editor - Pode editar arquivos</SelectItem>
                  <SelectItem value="admin">Administrador - Pode gerenciar membros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              disabled={!inviteEmail.trim() || loading}
              className="w-full"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {loading ? 'Convidando...' : 'Convidar Membro'}
            </Button>
          </form>

          {/* Lista de membros */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Membros atuais ({members.length})</h4>
            
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum membro encontrado</p>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.profile?.avatar} />
                        <AvatarFallback>
                          {member.profile?.name?.charAt(0) || member.profile?.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.profile?.name || 'Usuário'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.profile?.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={`text-xs ${getRoleColor(member.role)}`}>
                        {getRoleIcon(member.role)}
                        {getRoleLabel(member.role)}
                      </Badge>

                      {member.role !== 'owner' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'admin')}>
                              Tornar Administrador
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'editor')}>
                              Tornar Editor
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'viewer')}>
                              Tornar Visualizador
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => removeMember(member.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remover Membro
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
