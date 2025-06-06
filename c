afal\TRAE\NOTIONSPARK
otion-spark-studio\src\hooks\useConnectionStatus.ts
// ... existing code ...

const checkSupabaseConnection = async () => {
  try {
    console.log('[useConnectionStatus] Verificando conexão com Supabase...');
    const startTime = Date.now();
    const { error } = await supabase.from('profiles').select('id').limit(1);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`[useConnectionStatus] Tempo de resposta: ${responseTime}ms`);
    
    if (error) {
      console.error('[useConnectionStatus] Erro de conexão:', error);
      console.log('[useConnectionStatus] Detalhes do erro:', JSON.stringify(error));
      
      setIsSupabaseConnected(false);
      toast({
        title: "Erro de conexão",
        description: `Problemas para conectar com o servidor: ${error.message}`,
        variant: "destructive"
      });
    } else if (!isSupabaseConnected) {
      setIsSupabaseConnected(true);
      toast({
        title: "Conexão restaurada",
        description: 

const updateFile = useCallback(async (id: string, updates: Partial<SupabaseFile>) => {
  if (!user) {
    toast({
      title: "Erro de autenticação", 
      description: "Usuário não autenticado",
      variant: "destructive"
    });
    return { success: false, error: "Usuário não autenticado" };
  }

  try {
    console.log('[useSupabaseFiles] Updating file:', id, updates);
    const { error } = await supabase
      .from('files')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('[useSupabaseFiles] Error updating file:', error);
      toast({
        title: "Erro ao atualizar arquivo",
        description: error.message,
        variant: "destructive"
      });
      return { success: false, error: error.message };
    }

    console.log('[useSupabaseFiles] File updated successfully');
    toast({
      title: "Arquivo atualizado",
      description: "Arquivo salvo com sucesso"
    });
    return { success: true };
  } catch (error) {
    console.error('[useSupabaseFiles] Error updating file:', error);
    toast({
      title: "Erro ao atualizar arquivo",
      description: "Falha ao salvar arquivo",
      variant: "destructive"
    });
    return { success: false, error: "Erro desconhecido" };
  }
}, [toast, user]);

const initializeAuth = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erro ao obter sessão:', error);
      // Adicionar mais informações de diagnóstico
      console.log('Detalhes do erro:', JSON.stringify(error));
      
      toast({
        title: "Erro de autenticação",
        description: "Problemas ao verificar sua sessão. Tente fazer login novamente.",
        variant: "destructive"
      });
    }
    
    if (mounted) {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Verificar se o usuário está autenticado
      if (!session?.user) {
        console.log('Usuário não autenticado, redirecionando para login');
        // Você pode adicionar redirecionamento para a página de login aqui
      } else {
        console.log('Usuário autenticado:', session.user.email);
      }
    }
  } catch (error) {
    // ... existing code ...
  }
};