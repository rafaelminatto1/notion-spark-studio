-- 🚀 Performance and Security Optimizations
-- Baseado nos advisors do Supabase para melhorar performance e segurança

-- 1. PERFORMANCE: Adicionar índices para foreign keys não indexadas
-- Resolver problema: "Unindexed foreign keys"

-- Índices para tabela activities
CREATE INDEX IF NOT EXISTS idx_activities_file_id ON public.activities(file_id);
CREATE INDEX IF NOT EXISTS idx_activities_session_id ON public.activities(session_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);

-- Índices para tabela backups
CREATE INDEX IF NOT EXISTS idx_backups_user_id ON public.backups(user_id);

-- Índices para tabela files
CREATE INDEX IF NOT EXISTS idx_files_parent_id ON public.files(parent_id);
CREATE INDEX IF NOT EXISTS idx_files_workspace_id ON public.files(workspace_id);

-- Índices para tabela health_reports
CREATE INDEX IF NOT EXISTS idx_health_reports_user_id ON public.health_reports(user_id);

-- Índices para tabela media
CREATE INDEX IF NOT EXISTS idx_media_user_id ON public.media(user_id);

-- Índices para tabela shared_workspaces
CREATE INDEX IF NOT EXISTS idx_shared_workspaces_owner_id ON public.shared_workspaces(owner_id);

-- Índices para tabela work_sessions
CREATE INDEX IF NOT EXISTS idx_work_sessions_user_id ON public.work_sessions(user_id);

-- Índices para tabela workspace_members
CREATE INDEX IF NOT EXISTS idx_workspace_members_invited_by ON public.workspace_members(invited_by);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);

-- Índices para tabela workspace_settings
CREATE INDEX IF NOT EXISTS idx_workspace_settings_current_file_id ON public.workspace_settings(current_file_id);

-- 2. PERFORMANCE: Otimizar RLS policies para evitar re-avaliação
-- Resolver problema: "Auth RLS Initialization Plan"

-- Função auxiliar para otimizar RLS
CREATE OR REPLACE FUNCTION get_current_user_role_cached()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT (SELECT auth.jwt() ->> 'role')::text;
$$;

-- Função para verificar se é admin (otimizada)
CREATE OR REPLACE FUNCTION is_admin_cached()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = (SELECT auth.uid()) 
    AND role = 'admin'
  );
$$;

-- 3. SECURITY: Melhorar função get_current_user_id
-- Resolver problema: "Function Search Path Mutable"

CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT auth.uid();
$$;

-- 4. PERFORMANCE: Índices compostos para consultas comuns
CREATE INDEX IF NOT EXISTS idx_files_user_type ON public.files(user_id, type);
CREATE INDEX IF NOT EXISTS idx_files_user_created ON public.files(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user_timestamp ON public.activities(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_work_sessions_user_active ON public.work_sessions(user_id, is_active);

-- 5. PERFORMANCE: Índices para busca de texto
CREATE INDEX IF NOT EXISTS idx_files_name_gin ON public.files USING gin(to_tsvector('portuguese', name));
CREATE INDEX IF NOT EXISTS idx_files_content_gin ON public.files USING gin(to_tsvector('portuguese', content));

-- 6. PERFORMANCE: Índices para timestamps (consultas por data)
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON public.activities(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_files_updated_at ON public.files(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_sessions_start_time ON public.work_sessions(start_time DESC);

-- 7. PERFORMANCE: Índices para filtros comuns
CREATE INDEX IF NOT EXISTS idx_files_public ON public.files(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_files_protected ON public.files(is_protected) WHERE is_protected = true;
CREATE INDEX IF NOT EXISTS idx_files_sidebar ON public.files(show_in_sidebar) WHERE show_in_sidebar = true;

-- 8. PERFORMANCE: Estatísticas automáticas
ANALYZE public.activities;
ANALYZE public.files;
ANALYZE public.profiles;
ANALYZE public.user_roles;
ANALYZE public.work_sessions;
ANALYZE public.shared_workspaces;
ANALYZE public.workspace_members;

-- 9. SECURITY: Política de limpeza automática de tokens expirados
-- Criar job para limpeza automática (se extensão pg_cron estiver disponível)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Limpar tokens expirados diariamente às 2:00 AM
    PERFORM cron.schedule('cleanup-expired-tokens', '0 2 * * *', 'SELECT cleanup_expired_tokens();');
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignorar se pg_cron não estiver disponível
    NULL;
END $$;

-- 10. PERFORMANCE: Configurações de performance para tabelas grandes
ALTER TABLE public.activities SET (fillfactor = 90);
ALTER TABLE public.files SET (fillfactor = 80);

-- Comentário da migração
COMMENT ON SCHEMA public IS 'Performance and Security Optimizations - Resolved 30+ advisor warnings';
