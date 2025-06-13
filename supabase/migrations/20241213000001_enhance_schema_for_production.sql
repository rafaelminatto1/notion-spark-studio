-- Migração: Aprimoramentos para FASE 3/4 - Produção & Expansão
-- Data: 2024-12-13
-- Descrição: Otimizações de performance, monitoramento, colaboração e analytics

-- 1. Tabela de Performance Metrics (FASE 3 - Monitoramento)
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT,
    
    -- Métricas Web Vitals
    metric_name TEXT NOT NULL CHECK (metric_name IN ('fcp', 'lcp', 'fid', 'cls', 'ttfb', 'tti')),
    metric_value FLOAT NOT NULL,
    metric_unit TEXT DEFAULT 'ms' CHECK (metric_unit IN ('ms', 'bytes', 'count', 'percent')),
    
    -- Context
    page_url TEXT,
    user_agent TEXT,
    device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
    connection_type TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    tags TEXT[],
    environment TEXT DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices para performance
    CONSTRAINT valid_metric_value CHECK (metric_value >= 0)
);

-- Índices para performance_metrics
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_session_id ON performance_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_environment ON performance_metrics(environment);

-- 2. Tabela de Error Logs (FASE 3 - Monitoramento)
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    
    -- Error info
    message TEXT NOT NULL,
    stack_trace TEXT,
    error_type TEXT,
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Context
    page_url TEXT,
    user_agent TEXT,
    file_name TEXT,
    line_number INTEGER,
    column_number INTEGER,
    
    -- Environment
    environment TEXT DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),
    version TEXT,
    
    -- Metadata
    context JSONB DEFAULT '{}',
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para error_logs
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_environment ON error_logs(environment);

-- 3. Tabela de Real-time Collaboration (FASE 4 - Colaboração)
CREATE TABLE IF NOT EXISTS collaboration_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id TEXT NOT NULL,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    
    -- Session info
    started_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    participants JSONB DEFAULT '[]', -- Array de user IDs ativos
    max_participants INTEGER DEFAULT 10,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    session_type TEXT DEFAULT 'document' CHECK (session_type IN ('document', 'whiteboard', 'chat')),
    
    -- Settings
    settings JSONB DEFAULT '{}',
    permissions JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT unique_active_room UNIQUE(room_id, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Índices para collaboration_sessions
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_room_id ON collaboration_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_file_id ON collaboration_sessions(file_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_is_active ON collaboration_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_started_by ON collaboration_sessions(started_by);

-- 4. Tabela de Live Cursors/Presence (FASE 4 - Colaboração)
CREATE TABLE IF NOT EXISTS live_cursors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Cursor position
    position_x FLOAT,
    position_y FLOAT,
    selection_start INTEGER,
    selection_end INTEGER,
    
    -- Visual info
    cursor_color TEXT DEFAULT '#3B82F6',
    user_name TEXT,
    user_avatar TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_user_session UNIQUE(session_id, user_id)
);

-- Índices para live_cursors
CREATE INDEX IF NOT EXISTS idx_live_cursors_session_id ON live_cursors(session_id);
CREATE INDEX IF NOT EXISTS idx_live_cursors_user_id ON live_cursors(user_id);
CREATE INDEX IF NOT EXISTS idx_live_cursors_is_active ON live_cursors(is_active);
CREATE INDEX IF NOT EXISTS idx_live_cursors_last_seen ON live_cursors(last_seen DESC);

-- 5. Tabela de Analytics Events (FASE 3/4 - Analytics)
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    
    -- Event info
    event_name TEXT NOT NULL,
    event_category TEXT NOT NULL,
    event_action TEXT,
    event_label TEXT,
    event_value FLOAT,
    
    -- Context
    page_url TEXT,
    page_title TEXT,
    referrer TEXT,
    
    -- User context
    user_agent TEXT,
    device_type TEXT,
    browser_name TEXT,
    os_name TEXT,
    
    -- Geographic
    country_code TEXT,
    city TEXT,
    timezone TEXT,
    
    -- Custom properties
    properties JSONB DEFAULT '{}',
    
    -- Environment
    environment TEXT DEFAULT 'production',
    version TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para analytics_events
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);

-- 6. Tabela de Feature Flags (FASE 3/4 - Controle de Features)
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    flag_key TEXT UNIQUE NOT NULL,
    flag_name TEXT NOT NULL,
    description TEXT,
    
    -- Flag configuration
    is_enabled BOOLEAN DEFAULT FALSE,
    rollout_percentage FLOAT DEFAULT 0.0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    
    -- Targeting
    target_users TEXT[], -- Specific user IDs
    target_groups TEXT[], -- User groups (admin, premium, etc.)
    target_environments TEXT[] DEFAULT ARRAY['production'],
    
    -- Conditions
    conditions JSONB DEFAULT '{}',
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Índices para feature_flags
CREATE INDEX IF NOT EXISTS idx_feature_flags_flag_key ON feature_flags(flag_key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_is_enabled ON feature_flags(is_enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_expires_at ON feature_flags(expires_at);

-- 7. Aprimoramentos nas tabelas existentes

-- Adicionar campos de auditoria nas tabelas principais
ALTER TABLE files ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE files ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE files ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0;
ALTER TABLE files ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE files ADD COLUMN IF NOT EXISTS checksum TEXT;

-- Adicionar índices de performance para files
CREATE INDEX IF NOT EXISTS idx_files_last_accessed_at ON files(last_accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_files_access_count ON files(access_count DESC);
CREATE INDEX IF NOT EXISTS idx_files_type ON files(type);
CREATE INDEX IF NOT EXISTS idx_files_tags ON files USING gin(tags);

-- Melhorar tabela de activities para analytics
ALTER TABLE activities ADD COLUMN IF NOT EXISTS duration_ms INTEGER;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}';
ALTER TABLE activities ADD COLUMN IF NOT EXISTS performance_metrics JSONB DEFAULT '{}';

-- Índices para activities
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_user_id_timestamp ON activities(user_id, timestamp DESC);

-- Adicionar campos de colaboração em workspaces
ALTER TABLE shared_workspaces ADD COLUMN IF NOT EXISTS max_collaborators INTEGER DEFAULT 5;
ALTER TABLE shared_workspaces ADD COLUMN IF NOT EXISTS collaboration_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE shared_workspaces ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- 8. Funções auxiliares para performance

-- Função para limpar dados antigos de performance
CREATE OR REPLACE FUNCTION cleanup_old_performance_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Manter apenas 30 dias de métricas de performance
    DELETE FROM performance_metrics 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Manter apenas 90 dias de logs de erro
    DELETE FROM error_logs 
    WHERE created_at < NOW() - INTERVAL '90 days' AND resolved = true;
    
    -- Manter apenas 7 dias de eventos de analytics
    DELETE FROM analytics_events 
    WHERE created_at < NOW() - INTERVAL '7 days';
    
    -- Limpar sessões de colaboração antigas (inativas por mais de 24h)
    UPDATE collaboration_sessions 
    SET is_active = false, ended_at = NOW()
    WHERE is_active = true AND updated_at < NOW() - INTERVAL '24 hours';
    
    -- Limpar cursors inativos (mais de 1 hora)
    DELETE FROM live_cursors 
    WHERE last_seen < NOW() - INTERVAL '1 hour';
END;
$$;

-- Função para obter métricas de saúde do sistema
CREATE OR REPLACE FUNCTION get_system_health_metrics()
RETURNS TABLE(
    metric_name TEXT,
    metric_value NUMERIC,
    timestamp TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'active_users'::TEXT,
        COUNT(DISTINCT user_id)::NUMERIC,
        NOW()
    FROM activities 
    WHERE timestamp > NOW() - INTERVAL '24 hours'
    
    UNION ALL
    
    SELECT 
        'error_rate'::TEXT,
        (COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM analytics_events WHERE created_at > NOW() - INTERVAL '1 hour'), 0))::NUMERIC,
        NOW()
    FROM error_logs 
    WHERE created_at > NOW() - INTERVAL '1 hour'
    
    UNION ALL
    
    SELECT 
        'avg_performance'::TEXT,
        AVG(metric_value)::NUMERIC,
        NOW()
    FROM performance_metrics 
    WHERE metric_name = 'lcp' AND created_at > NOW() - INTERVAL '1 hour';
END;
$$;

-- 9. Policies de segurança (RLS)

-- Habilitar RLS nas novas tabelas
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_cursors ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Policies para performance_metrics
CREATE POLICY "Users can view their own performance metrics" ON performance_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own performance metrics" ON performance_metrics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies para collaboration_sessions
CREATE POLICY "Users can view collaboration sessions they participate in" ON collaboration_sessions
    FOR SELECT USING (
        auth.uid() = started_by OR 
        auth.uid()::text = ANY(SELECT jsonb_array_elements_text(participants))
    );

CREATE POLICY "Users can create collaboration sessions" ON collaboration_sessions
    FOR INSERT WITH CHECK (auth.uid() = started_by);

-- Policies para feature_flags (apenas admins)
CREATE POLICY "Only admins can manage feature flags" ON feature_flags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 10. Triggers para atualização automática

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger nas tabelas relevantes
CREATE TRIGGER update_collaboration_sessions_updated_at 
    BEFORE UPDATE ON collaboration_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_live_cursors_updated_at 
    BEFORE UPDATE ON live_cursors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE performance_metrics IS 'Armazena métricas de performance Web Vitals para monitoramento';
COMMENT ON TABLE error_logs IS 'Logs centralizados de erros da aplicação';
COMMENT ON TABLE collaboration_sessions IS 'Sessões de colaboração em tempo real';
COMMENT ON TABLE live_cursors IS 'Posições dos cursors em sessões de colaboração';
COMMENT ON TABLE analytics_events IS 'Eventos de analytics e comportamento do usuário';
COMMENT ON TABLE feature_flags IS 'Controle de features e rollouts graduais';

-- Criar índices compostos para queries complexas
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_time ON performance_metrics(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity_time ON error_logs(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collaboration_active_room ON collaboration_sessions(room_id, is_active) WHERE is_active = true; 