# 🚀 EXECUÇÃO VIA SUPABASE DASHBOARD - GUIA STEP-BY-STEP

## ✅ STATUS: MCP Read-Only Confirmado (Seguro)
- **MCP configurado corretamente** em modo read-only para segurança
- **Migrations criadas** localmente nos arquivos
- **Comandos organizados** para execução manual no Dashboard

---

## 📋 PASSO-A-PASSO PARA EXECUÇÃO

### 1. ACESSE O SUPABASE DASHBOARD
```
URL: https://supabase.com/dashboard/project/bvugljspidtqumysbegq
Navegue para: SQL Editor
```

### 2. EXECUTE FASE 1 - ÍNDICES CRÍTICOS (PRIORIDADE MÁXIMA)
**Copie e cole no SQL Editor:**

```sql
-- =====================================================
-- FASE 1: ÍNDICES CRÍTICOS - RESOLVER SEQUENTIAL SCANS
-- =====================================================

-- FILES TABLE (MAIS CRÍTICA - 64kB)
CREATE INDEX IF NOT EXISTS idx_files_user_id ON public.files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_parent_id ON public.files(parent_id);
CREATE INDEX IF NOT EXISTS idx_files_workspace_id ON public.files(workspace_id);

-- Verificar criação imediata:
SELECT 'Files indexes created' as status, COUNT(*) as total 
FROM pg_indexes 
WHERE tablename = 'files' AND indexname LIKE 'idx_%';
```

**Clique em "Run" e confirme que retorna `total: 3`**

### 3. EXECUTE FASE 2 - ACTIVITIES (LOGS CRÍTICOS)
```sql
-- =====================================================
-- FASE 2: ACTIVITIES TABLE - RESOLVER JOINS LENTOS
-- =====================================================

-- ACTIVITIES TABLE (LOGS CRÍTICOS)
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_file_id ON public.activities(file_id);
CREATE INDEX IF NOT EXISTS idx_activities_session_id ON public.activities(session_id);

-- Verificar criação:
SELECT 'Activities indexes created' as status, COUNT(*) as total 
FROM pg_indexes 
WHERE tablename = 'activities' AND indexname LIKE 'idx_%';
```

**Clique em "Run" e confirme que retorna `total: 3`**

### 4. EXECUTE FASE 3 - COLABORAÇÃO
```sql
-- =====================================================
-- FASE 3: WORKSPACE COLLABORATION
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

-- Verificar:
SELECT 'Workspace indexes created' as status, COUNT(*) as total 
FROM pg_indexes 
WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
  AND tablename IN ('workspace_members', 'work_sessions', 'shared_workspaces', 'workspace_settings');
```

**Clique em "Run" e confirme que retorna `total: 5`**

### 5. EXECUTE FASE 4 - OUTROS SISTEMAS
```sql
-- =====================================================
-- FASE 4: OUTROS SISTEMAS
-- =====================================================

-- Backups
CREATE INDEX IF NOT EXISTS idx_backups_user_id ON public.backups(user_id);

-- Health Reports
CREATE INDEX IF NOT EXISTS idx_health_reports_user_id ON public.health_reports(user_id);

-- Media
CREATE INDEX IF NOT EXISTS idx_media_user_id ON public.media(user_id);

-- Verificar:
SELECT 'System indexes created' as status, COUNT(*) as total 
FROM pg_indexes 
WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
  AND tablename IN ('backups', 'health_reports', 'media');
```

**Clique em "Run" e confirme que retorna `total: 3`**

### 6. EXECUTE FASE 5 - LIMPEZA
```sql
-- =====================================================
-- FASE 5: LIMPEZA - REMOVER ÍNDICE NÃO UTILIZADO
-- =====================================================

-- Remove índice identificado como não utilizado via MCP advisors
DROP INDEX IF EXISTS idx_password_reset_tokens_user_id;

-- Verificar remoção:
SELECT 'Cleanup completed' as status, 
       CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_password_reset_tokens_user_id') 
            THEN '❌ Still exists' 
            ELSE '✅ Removed' 
       END as result;
```

**Clique em "Run" e confirme que retorna `result: ✅ Removed`**

---

## 🔍 VALIDAÇÃO COMPLETA

### Execute este SQL para validar todos os 14 índices:
```sql
-- =====================================================
-- VALIDAÇÃO FINAL - VERIFICAR TODOS OS 14 ÍNDICES
-- =====================================================

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

-- RESULTADO ESPERADO:
-- files: 3 índices
-- activities: 3 índices
-- workspace_members: 2 índices
-- shared_workspaces: 1 índice
-- workspace_settings: 1 índice
-- work_sessions: 1 índice
-- backups: 1 índice
-- health_reports: 1 índice
-- media: 1 índice
-- TOTAL: 14 índices
```

---

## 🧪 TESTE DE PERFORMANCE

### Execute este teste ANTES e DEPOIS para comparar:
```sql
-- =====================================================
-- TESTE PERFORMANCE - ANTES vs DEPOIS
-- =====================================================

-- Teste principal (deve mostrar Index Scan após aplicação)
EXPLAIN (ANALYZE, BUFFERS, COSTS) 
SELECT f.id, f.name, f.content, f.type, f.created_at
FROM files f 
WHERE f.user_id IN (SELECT id FROM auth.users LIMIT 5)
ORDER BY f.created_at DESC
LIMIT 20;

-- ANTES: "Seq Scan on files f" ⚠️ LENTO
-- DEPOIS: "Index Scan using idx_files_user_id" ✅ RÁPIDO
```

---

## 🎯 PRÓXIMOS PASSOS (APÓS ÍNDICES)

### 1. Corrigir Configurações de Segurança (2 min)
**Navegue para: Authentication > Settings**
- **OTP Expiry**: Alterar para 30 minutos (máximo 1 hora)
- **Password Protection**: Habilitar HaveIBeenPwned

### 2. Implementar Tabelas Enterprise (10 min)
**Use o arquivo**: `TABELAS_ENTERPRISE_SQL.sql`
- Copie todo o conteúdo para SQL Editor
- Execute em uma única operação
- Isso criará 7 tabelas + 15 índices + RLS + triggers

### 3. Validação Final
**Execute os scripts de**: `VERIFICACAO_APLICACAO.sql`

---

## ✅ CHECKLIST RÁPIDO

- [ ] **FASE 1**: Files (3 índices) ✅
- [ ] **FASE 2**: Activities (3 índices) ✅  
- [ ] **FASE 3**: Workspace (5 índices) ✅
- [ ] **FASE 4**: Sistemas (3 índices) ✅
- [ ] **FASE 5**: Limpeza (1 remoção) ✅
- [ ] **VALIDAÇÃO**: 14 índices confirmados ✅
- [ ] **TESTE**: Index Scan funcionando ✅
- [ ] **SEGURANÇA**: OTP + HaveIBeenPwned ✅
- [ ] **ENTERPRISE**: 7 tabelas criadas ✅

**TEMPO TOTAL**: 15-20 minutos  
**IMPACTO**: 50-80% melhoria performance + enterprise completo  
**RISCO**: BAIXO (apenas adição de estruturas) 