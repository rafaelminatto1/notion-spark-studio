
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'editor' | 'viewer';
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  language: 'pt' | 'en';
  auto_save: boolean;
  backup_frequency: number;
  default_view: 'editor' | 'graph' | 'dashboard';
  compact_mode: boolean;
  show_line_numbers: boolean;
  enable_animations: boolean;
  created_at: string;
  updated_at: string;
}

export const useSupabaseProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadProfile = useCallback(async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        setLoading(false);
        return;
      }

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading profile:', profileError);
      } else {
        setProfile(profileData);
      }

      // Load role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.user.id)
        .single();

      if (roleError && roleError.code !== 'PGRST116') {
        console.error('Error loading role:', roleError);
      } else {
        setRole(roleData);
      }

      // Load preferences
      const { data: preferencesData, error: preferencesError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.user.id)
        .single();

      if (preferencesError && preferencesError.code !== 'PGRST116') {
        console.error('Error loading preferences:', preferencesError);
      } else {
        setPreferences(preferencesData);
      }

    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.user.id);

      if (error) {
        toast({
          title: "Erro ao atualizar perfil",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Perfil atualizado",
        description: "Informações salvas com sucesso"
      });

      loadProfile();
    } catch (error) {
      toast({
        title: "Erro ao atualizar perfil",
        description: "Falha ao salvar informações",
        variant: "destructive"
      });
    }
  }, [toast, loadProfile]);

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) return;

      const { error } = await supabase
        .from('user_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.user.id);

      if (error) {
        toast({
          title: "Erro ao atualizar preferências",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Preferências atualizadas",
        description: "Configurações salvas com sucesso"
      });

      loadProfile();
    } catch (error) {
      toast({
        title: "Erro ao atualizar preferências",
        description: "Falha ao salvar configurações",
        variant: "destructive"
      });
    }
  }, [toast, loadProfile]);

  return {
    profile,
    role,
    preferences,
    loading,
    updateProfile,
    updatePreferences,
    loadProfile
  };
};
