import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface UserPreferencesContextType {
  preferences: UserPreferences | null;
  loadingPreferences: boolean;
  updateUserPreferences: (updates: Partial<UserPreferences>) => Promise<void>;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

interface UserPreferencesProviderProps {
  children: ReactNode;
}

export const UserPreferencesProvider = ({ children }: UserPreferencesProviderProps) => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const { toast } = useToast();

  const loadUserPreferences = useCallback(async () => {
    setLoadingPreferences(true);
    try {
      const { data: user } = await supabase.auth.getUser();

      if (!user.user) {
        setLoadingPreferences(false);
        return;
      }

      const { data: preferencesData, error: preferencesError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.user.id)
        .single();

      if (preferencesError && preferencesError.code !== 'PGRST116') {
        console.error('Error loading preferences:', preferencesError);
        toast({
          title: "Erro ao carregar preferências",
          description: preferencesError.message,
          variant: "destructive"
        });
      } else {
        setPreferences(preferencesData);
      }

    } catch (error) {
      console.error('Error loading user preferences:', error);
      toast({
        title: "Erro ao carregar preferências",
        description: "Falha ao carregar configurações do usuário",
        variant: "destructive"
      });
    } finally {
      setLoadingPreferences(false);
    }
  }, [toast]);

  useEffect(() => {
    loadUserPreferences();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        loadUserPreferences();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loadUserPreferences]);

  const updateUserPreferences = useCallback(async (updates: Partial<UserPreferences>) => {
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

      // Refresh preferences after update
      loadUserPreferences();
    } catch (error) {
      toast({
        title: "Erro ao atualizar preferências",
        description: "Falha ao salvar configurações",
        variant: "destructive"
      });
    }
  }, [toast, loadUserPreferences]);

  return (
    <UserPreferencesContext.Provider value={{ preferences, loadingPreferences, updateUserPreferences }}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
}; 