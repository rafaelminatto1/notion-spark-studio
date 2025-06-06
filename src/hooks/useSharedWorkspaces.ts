import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SharedWorkspace {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joined_at: string;
  invited_by?: string;
  profile?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export const useSharedWorkspaces = () => {
  const [workspaces, setWorkspaces] = useState<SharedWorkspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<SharedWorkspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadWorkspaces = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shared_workspaces')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkspaces(data || []);
    } catch (error) {
      console.error('Error loading workspaces:', error);
      toast({
        title: "Erro ao carregar workspaces",
        description: "Não foi possível carregar os workspaces",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadWorkspaceMembers = useCallback(async (workspaceId: string) => {
    try {
      // First get workspace members
      const { data: membersData, error: membersError } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (membersError) throw membersError;

      // Then get profiles for each member
      const memberIds = membersData?.map(member => member.user_id) || [];
      
      if (memberIds.length === 0) {
        setMembers([]);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email, avatar')
        .in('id', memberIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const transformedMembers: WorkspaceMember[] = (membersData || []).map(member => {
        const profile = profilesData?.find(p => p.id === member.user_id);
        return {
          id: member.id,
          workspace_id: member.workspace_id,
          user_id: member.user_id,
          role: member.role as WorkspaceMember['role'],
          joined_at: member.joined_at,
          invited_by: member.invited_by,
          profile: profile ? {
            name: profile.name,
            email: profile.email,
            avatar: profile.avatar
          } : undefined
        };
      });
      
      setMembers(transformedMembers);
    } catch (error) {
      console.error('Error loading workspace members:', error);
    }
  }, []);

  const createWorkspace = useCallback(async (name: string, description?: string, isPublic = false) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('shared_workspaces')
        .insert({
          name,
          description,
          owner_id: user.user.id,
          is_public: isPublic
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Workspace criado",
        description: `Workspace "${name}" foi criado com sucesso`
      });

      await loadWorkspaces();
      return data;
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast({
        title: "Erro ao criar workspace",
        description: "Não foi possível criar o workspace",
        variant: "destructive"
      });
      return null;
    }
  }, [toast, loadWorkspaces]);

  const updateWorkspace = useCallback(async (workspaceId: string, updates: Partial<SharedWorkspace>) => {
    try {
      const { error } = await supabase
        .from('shared_workspaces')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', workspaceId);

      if (error) throw error;

      toast({
        title: "Workspace atualizado",
        description: "Workspace foi atualizado com sucesso"
      });

      await loadWorkspaces();
      if (currentWorkspace?.id === workspaceId) {
        setCurrentWorkspace(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (error) {
      console.error('Error updating workspace:', error);
      toast({
        title: "Erro ao atualizar workspace",
        description: "Não foi possível atualizar o workspace",
        variant: "destructive"
      });
    }
  }, [toast, loadWorkspaces, currentWorkspace]);

  const deleteWorkspace = useCallback(async (workspaceId: string) => {
    try {
      const { error } = await supabase
        .from('shared_workspaces')
        .delete()
        .eq('id', workspaceId);

      if (error) throw error;

      toast({
        title: "Workspace removido",
        description: "Workspace foi removido com sucesso"
      });

      await loadWorkspaces();
      if (currentWorkspace?.id === workspaceId) {
        setCurrentWorkspace(null);
      }
    } catch (error) {
      console.error('Error deleting workspace:', error);
      toast({
        title: "Erro ao remover workspace",
        description: "Não foi possível remover o workspace",
        variant: "destructive"
      });
    }
  }, [toast, loadWorkspaces, currentWorkspace]);

  const inviteMember = useCallback(async (workspaceId: string, userEmail: string, role: WorkspaceMember['role'] = 'viewer') => {
    try {
      // Primeiro, encontrar o usuário pelo email
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', userEmail)
        .single();

      if (profileError || !profiles) {
        toast({
          title: "Usuário não encontrado",
          description: "Não foi possível encontrar um usuário com este email",
          variant: "destructive"
        });
        return false;
      }

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspaceId,
          user_id: profiles.id,
          role,
          invited_by: user.user.id
        });

      if (error) {
        if (error.code === '23505') { // unique violation
          toast({
            title: "Usuário já é membro",
            description: "Este usuário já faz parte do workspace",
            variant: "destructive"
          });
          return false;
        }
        throw error;
      }

      toast({
        title: "Membro convidado",
        description: `Usuário foi adicionado ao workspace como ${role}`
      });

      await loadWorkspaceMembers(workspaceId);
      return true;
    } catch (error) {
      console.error('Error inviting member:', error);
      toast({
        title: "Erro ao convidar membro",
        description: "Não foi possível convidar o usuário",
        variant: "destructive"
      });
      return false;
    }
  }, [toast, loadWorkspaceMembers]);

  const updateMemberRole = useCallback(async (memberId: string, newRole: WorkspaceMember['role']) => {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Permissão atualizada",
        description: "Permissão do membro foi atualizada com sucesso"
      });

      // Reload members for current workspace
      if (currentWorkspace) {
        await loadWorkspaceMembers(currentWorkspace.id);
      }
    } catch (error) {
      console.error('Error updating member role:', error);
      toast({
        title: "Erro ao atualizar permissão",
        description: "Não foi possível atualizar a permissão do membro",
        variant: "destructive"
      });
    }
  }, [toast, loadWorkspaceMembers, currentWorkspace]);

  const removeMember = useCallback(async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Membro removido",
        description: "Membro foi removido do workspace"
      });

      // Reload members for current workspace
      if (currentWorkspace) {
        await loadWorkspaceMembers(currentWorkspace.id);
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Erro ao remover membro",
        description: "Não foi possível remover o membro",
        variant: "destructive"
      });
    }
  }, [toast, loadWorkspaceMembers, currentWorkspace]);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    if (currentWorkspace) {
      loadWorkspaceMembers(currentWorkspace.id);
    }
  }, [currentWorkspace, loadWorkspaceMembers]);

  return {
    workspaces,
    currentWorkspace,
    setCurrentWorkspace,
    members,
    loading,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    inviteMember,
    updateMemberRole,
    removeMember,
    loadWorkspaces,
    loadWorkspaceMembers
  };
};
