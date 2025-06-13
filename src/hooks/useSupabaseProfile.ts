import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  website?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export const useSupabaseProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Simular carregamento do perfil
      const mockProfile: Profile = {
        id: user.id,
        username: user.name,
        full_name: user.name,
        avatar_url: user.avatar,
        website: '',
        bio: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProfile(mockProfile);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return;

    try {
      const updatedProfile = {
        ...profile,
        ...updates,
        updated_at: new Date().toISOString(),
      };
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  return {
    profile,
    loading,
    updateProfile,
    loadProfile,
  };
};
