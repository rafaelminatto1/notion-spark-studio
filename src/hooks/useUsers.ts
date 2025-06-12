import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

export const useUsers = (searchQuery: string = '') => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { supabase } = useSupabase();

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery) {
        setUsers([]);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email, avatar, role')
          .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
          .limit(10);

        if (error) throw error;
        setUsers(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erro ao buscar usuários'));
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    searchUsers();
  }, [searchQuery, supabase]);

  return {
    users,
    loading,
    error,
  };
}; 