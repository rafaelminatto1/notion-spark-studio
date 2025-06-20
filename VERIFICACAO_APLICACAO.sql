-- =====================================================
-- SCRIPT DE VERIFICAÇÃO - APLICAÇÃO DOS ÍNDICES
-- Execute APÓS aplicar os índices via Dashboard
-- =====================================================

-- 1. VERIFICAR TODOS OS ÍNDICES CRIADOS
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 2. CONTAR ÍNDICES POR TABELA
SELECT 
    tablename,
    COUNT(*) as total_indexes
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
GROUP BY tablename
ORDER BY total_indexes DESC;

-- 3. VERIFICAR ÍNDICES ESPECÍFICOS CRÍTICOS
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_files_user_id') 
        THEN '✅ APLICADO' 
        ELSE '❌ FALTANDO' 
    END as idx_files_user_id,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_files_parent_id') 
        THEN '✅ APLICADO' 
        ELSE '❌ FALTANDO' 
    END as idx_files_parent_id,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activities_user_id') 
        THEN '✅ APLICADO' 
        ELSE '❌ FALTANDO' 
    END as idx_activities_user_id;

-- 4. TESTE DE PERFORMANCE - COMPARAR ANTES/DEPOIS
-- Execute esta query e compare com o resultado anterior:
EXPLAIN (ANALYZE, BUFFERS, COSTS) 
SELECT f.id, f.name, f.content, p.name as profile_name
FROM files f 
JOIN profiles p ON f.user_id = p.id 
WHERE f.user_id = (SELECT id FROM auth.users LIMIT 1)
LIMIT 10;

-- 5. VERIFICAR TAMANHO DAS TABELAS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 6. VERIFICAR SE ÍNDICE NÃO UTILIZADO FOI REMOVIDO
SELECT 
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_password_reset_tokens_user_id') 
        THEN '✅ REMOVIDO CORRETAMENTE' 
        ELSE '⚠️ AINDA EXISTE (pode remover)' 
    END as cleanup_status;

-- 7. ESTATÍSTICAS DE USO DOS ÍNDICES (após alguns minutos de uso)
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as "Vezes Usado",
    idx_tup_read as "Linhas Lidas",
    idx_tup_fetch as "Linhas Retornadas"
FROM pg_stat_user_indexes 
WHERE indexname LIKE 'idx_%'
ORDER BY idx_scan DESC;

-- =====================================================
-- RESULTADO ESPERADO APÓS APLICAÇÃO:
-- =====================================================

/*
ÍNDICES QUE DEVEM EXISTIR (14 total):

✅ idx_activities_user_id
✅ idx_activities_file_id  
✅ idx_activities_session_id
✅ idx_backups_user_id
✅ idx_files_user_id              -- CRÍTICO
✅ idx_files_parent_id            -- CRÍTICO  
✅ idx_files_workspace_id         -- CRÍTICO
✅ idx_health_reports_user_id
✅ idx_media_user_id
✅ idx_shared_workspaces_owner_id
✅ idx_work_sessions_user_id
✅ idx_workspace_members_user_id
✅ idx_workspace_members_invited_by
✅ idx_workspace_settings_current_file_id

PERFORMANCE ESPERADA:
- Query Plan: "Index Scan using idx_files_user_id" 
- Execution Time: 50-80% menor
- Buffers: Menos uso de memória

LIMPEZA ESPERADA:
❌ idx_password_reset_tokens_user_id (deve estar removido)
*/ 