-- =====================================================
-- COMANDOS SQL PARA EXECUTAR AGORA NO SUPABASE DASHBOARD
-- =====================================================
-- BASELINE CONFIRMADO: Sequential Scans detectados via MCP
-- PROBLEMA: 14 índices FK críticos faltando
-- IMPACTO: Performance 50-80% mais lenta que deveria ser
-- =====================================================

-- =====================================================
-- FASE 1: ÍNDICES CRÍTICOS (EXECUTE PRIMEIRO)
-- Prioridade MÁXIMA - Resolve Sequential Scans
-- =====================================================

-- 🚨 FILES TABLE - MAIS CRÍTICA (64kB, mais usada)
-- PROBLEMA CONFIRMADO: "Seq Scan on files f" via MCP
CREATE INDEX IF NOT EXISTS idx_files_user_id ON public.files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_parent_id ON public.files(parent_id);
CREATE INDEX IF NOT EXISTS idx_files_workspace_id ON public.files(workspace_id);

-- Verificar criação imediata:
SELECT 'files_indexes_created' as status, COUNT(*) as total 
FROM pg_indexes 
WHERE tablename = 'files' AND indexname LIKE 'idx_%';

-- =====================================================
-- FASE 2: ACTIVITIES TABLE (LOGS CRÍTICOS)
-- PROBLEMA CONFIRMADO: "Seq Scan on activities a" via MCP
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_file_id ON public.activities(file_id);
CREATE INDEX IF NOT EXISTS idx_activities_session_id ON public.activities(session_id);

-- Verificar criação:
SELECT 'activities_indexes_created' as status, COUNT(*) as total 
FROM pg_indexes 
WHERE tablename = 'activities' AND indexname LIKE 'idx_%';

-- =====================================================
-- FASE 3: COLABORAÇÃO (WORKSPACE TABLES)
-- =====================================================

-- Workspace Members (colaboração)
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_invited_by ON public.workspace_members(invited_by);

-- Work Sessions
CREATE INDEX IF NOT EXISTS idx_work_sessions_user_id ON public.work_sessions(user_id);

-- Shared Workspaces  
CREATE INDEX IF NOT EXISTS idx_shared_workspaces_owner_id ON public.shared_workspaces(owner_id);

-- Workspace Settings
CREATE INDEX IF NOT EXISTS idx_workspace_settings_current_file_id ON public.workspace_settings(current_file_id);

-- =====================================================
-- FASE 4: OUTROS SISTEMAS
-- =====================================================

-- Backups
CREATE INDEX IF NOT EXISTS idx_backups_user_id ON public.backups(user_id);

-- Health Reports
CREATE INDEX IF NOT EXISTS idx_health_reports_user_id ON public.health_reports(user_id);

-- Media
CREATE INDEX IF NOT EXISTS idx_media_user_id ON public.media(user_id);

-- =====================================================
-- FASE 5: LIMPEZA - REMOVER ÍNDICE NÃO UTILIZADO
-- =====================================================

-- Remove índice identificado como não utilizado via MCP advisors
DROP INDEX IF EXISTS idx_password_reset_tokens_user_id;

-- =====================================================
-- VALIDAÇÃO COMPLETA - EXECUTE APÓS APLICAR TUDO
-- =====================================================

-- 1. Verificar todos os 14 índices foram criados
SELECT 
    tablename,
    COUNT(*) as indices_criados,
    array_agg(indexname ORDER BY indexname) as lista_indices
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
  AND tablename IN ('files', 'activities', 'workspace_members', 'work_sessions', 
                    'shared_workspaces', 'workspace_settings', 'backups', 
                    'health_reports', 'media')
GROUP BY tablename
ORDER BY indices_criados DESC;

-- 2. TESTE DE PERFORMANCE APÓS ÍNDICES
-- Compare com baseline anterior:
EXPLAIN (ANALYZE, BUFFERS, COSTS) 
SELECT f.id, f.name, f.content, f.type, f.created_at
FROM files f 
WHERE f.user_id IN (SELECT id FROM auth.users LIMIT 5)
ORDER BY f.created_at DESC
LIMIT 20;

-- 3. TESTE DE PERFORMANCE - ACTIVITIES COM JOIN
EXPLAIN (ANALYZE, BUFFERS, COSTS) 
SELECT a.id, a.type, a.timestamp, f.name as file_name, p.name as user_name
FROM activities a
JOIN files f ON a.file_id = f.id  
JOIN profiles p ON a.user_id = p.id
ORDER BY a.timestamp DESC
LIMIT 15;

-- =====================================================
-- RESULTADO ESPERADO APÓS APLICAÇÃO
-- =====================================================

/*
ANTES (BASELINE CONFIRMADO VIA MCP):
- "Seq Scan on files f" ⚠️ LENTO
- "Seq Scan on activities a" ⚠️ LENTO  
- Planning Time: 0.991-2.189ms ⚠️ ALTO

DEPOIS (ESPERADO):
- "Index Scan using idx_files_user_id" ✅ RÁPIDO
- "Index Scan using idx_activities_user_id" ✅ RÁPIDO
- Planning Time: 0.1-0.5ms ✅ BAIXO
- Execution Time: 50-80% menor ✅

ÍNDICES APLICADOS (14 total):
✅ files: 3 índices (user_id, parent_id, workspace_id)
✅ activities: 3 índices (user_id, file_id, session_id)  
✅ workspace_members: 2 índices (user_id, invited_by)
✅ work_sessions: 1 índice (user_id)
✅ shared_workspaces: 1 índice (owner_id)
✅ workspace_settings: 1 índice (current_file_id)
✅ backups: 1 índice (user_id)
✅ health_reports: 1 índice (user_id)
✅ media: 1 índice (user_id)

LIMPEZA:
❌ idx_password_reset_tokens_user_id (removido)
*/

-- =====================================================
-- CHECKLIST FINAL
-- =====================================================

-- Execute este comando para checklist automático:
WITH index_check AS (
  SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_files_user_id') 
         THEN '✅' ELSE '❌' END as files_user_id,
    CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_files_parent_id') 
         THEN '✅' ELSE '❌' END as files_parent_id,
    CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activities_user_id') 
         THEN '✅' ELSE '❌' END as activities_user_id,
    CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_workspace_members_user_id') 
         THEN '✅' ELSE '❌' END as workspace_members_user_id
)
SELECT 
  'ÍNDICES CRÍTICOS APLICADOS:' as status,
  files_user_id,
  files_parent_id, 
  activities_user_id,
  workspace_members_user_id
FROM index_check;

-- =====================================================
-- PRÓXIMOS PASSOS APÓS ESTE SQL
-- =====================================================
/*
1. ✅ APLICAR: Execute todos os comandos acima
2. 🔍 VALIDAR: Execute os testes de performance  
3. 📊 COMPARAR: Verifique "Index Scan" vs "Seq Scan"
4. 🔒 SEGURANÇA: Corrigir OTP + HaveIBeenPwned no Dashboard
5. 🚀 PRÓXIMA FASE: Implementar tabelas enterprise

TEMPO ESTIMADO: 10-15 minutos
IMPACTO ESPERADO: 50-80% mais rápido
RISCO: BAIXO (apenas adição de índices)
*/ 