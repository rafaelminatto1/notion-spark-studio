
import { useState, useCallback, useEffect } from 'react';
import { useIndexedDB } from './useIndexedDB';
import { useToast } from '@/hooks/use-toast';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'editor' | 'viewer';
  preferences: UserPreferences;
  createdAt: Date;
  lastActiveAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'pt' | 'en';
  autoSave: boolean;
  backupFrequency: number; // minutos
  defaultView: 'editor' | 'graph' | 'dashboard';
  compactMode: boolean;
  showLineNumbers: boolean;
  enableAnimations: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  language: 'pt',
  autoSave: true,
  backupFrequency: 30,
  defaultView: 'editor',
  compactMode: false,
  showLineNumbers: true,
  enableAnimations: true
};

const DEFAULT_USER: User = {
  id: 'default-user',
  name: 'Usuário Local',
  email: 'local@user.com',
  role: 'admin',
  preferences: DEFAULT_PREFERENCES,
  createdAt: new Date(),
  lastActiveAt: new Date()
};

export const useUserSystem = () => {
  const { isReady, get, set, getAll } = useIndexedDB();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar usuário atual
  useEffect(() => {
    const loadCurrentUser = async () => {
      if (!isReady) return;
      
      try {
        let user = await get<User>('users', 'current');
        
        if (!user) {
          // Criar usuário padrão se não existir
          user = { ...DEFAULT_USER };
          await set('users', { ...user, id: 'current' });
        }
        
        // Atualizar última atividade
        user.lastActiveAt = new Date();
        await set('users', { ...user, id: 'current' });
        
        setCurrentUser(user);
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        setCurrentUser(DEFAULT_USER);
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrentUser();
  }, [isReady, get, set]);

  const updateUserPreferences = useCallback(async (preferences: Partial<UserPreferences>) => {
    if (!currentUser) return;

    const updatedUser = {
      ...currentUser,
      preferences: { ...currentUser.preferences, ...preferences },
      lastActiveAt: new Date()
    };

    try {
      await set('users', { ...updatedUser, id: 'current' });
      setCurrentUser(updatedUser);
      
      toast({
        title: "Preferências atualizadas",
        description: "Suas configurações foram salvas"
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Falha ao atualizar preferências",
        variant: "destructive"
      });
    }
  }, [currentUser, set, toast]);

  const updateUserProfile = useCallback(async (updates: Partial<Pick<User, 'name' | 'email' | 'avatar'>>) => {
    if (!currentUser) return;

    const updatedUser = {
      ...currentUser,
      ...updates,
      lastActiveAt: new Date()
    };

    try {
      await set('users', { ...updatedUser, id: 'current' });
      setCurrentUser(updatedUser);
      
      toast({
        title: "Perfil atualizado",
        description: "Informações do perfil foram salvas"
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Falha ao atualizar perfil",
        variant: "destructive"
      });
    }
  }, [currentUser, set, toast]);

  const resetToDefaults = useCallback(async () => {
    try {
      const resetUser = {
        ...DEFAULT_USER,
        id: 'current',
        name: currentUser?.name || DEFAULT_USER.name,
        email: currentUser?.email || DEFAULT_USER.email
      };
      
      await set('users', resetUser);
      setCurrentUser(resetUser);
      
      toast({
        title: "Configurações restauradas",
        description: "Todas as preferências foram restauradas ao padrão"
      });
    } catch (error) {
      toast({
        title: "Erro ao restaurar",
        description: "Falha ao restaurar configurações",
        variant: "destructive"
      });
    }
  }, [currentUser, set, toast]);

  return {
    currentUser,
    isLoading,
    updateUserPreferences,
    updateUserProfile,
    resetToDefaults
  };
};
