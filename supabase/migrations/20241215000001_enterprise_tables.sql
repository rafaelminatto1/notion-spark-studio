-- Migração: Tabelas Enterprise Avançadas
-- Data: 2024-12-15
-- Descrição: Implementação completa de tabelas para suportar serviços enterprise

-- =====================================================
-- 1. SISTEMA DE TASKS AVANÇADO (TaskService)
-- =====================================================

CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Task content
    title TEXT NOT NULL,
    description TEXT,
    content JSONB DEFAULT '{}',
    
    -- Task status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'blocked')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Assignments
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Dates
    due_date TIMESTAMP WITH TIME ZONE,
    start_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Relationships
    parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    project_id UUID,
    
    -- Metadata
    tags TEXT[],
    labels JSONB DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    attachments JSONB DEFAULT '[]',
    
    -- Performance tracking
    estimated_hours FLOAT,
    actual_hours FLOAT,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    
    -- System
    version INTEGER DEFAULT 1,
    is_archived BOOLEAN DEFAULT FALSE,
    is_template BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_date_range CHECK (due_date IS NULL OR start_date IS NULL OR start_date <= due_date)
);

-- Task Cache System
CREATE TABLE IF NOT EXISTS task_cache_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cache_key TEXT UNIQUE NOT NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Cache data
    cached_data JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    
    -- Cache strategy
    strategy TEXT DEFAULT 'lru' CHECK (strategy IN ('lru', 'lfu', 'ttl', 'fifo')),
    priority INTEGER DEFAULT 1,
    
    -- Timing
    expires_at TIMESTAMP WITH TIME ZONE,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    access_count INTEGER DEFAULT 1,
    
    -- Compression
    is_compressed BOOLEAN DEFAULT FALSE,
    original_size INTEGER,
    compressed_size INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Audit Logs (Compliance)
CREATE TABLE IF NOT EXISTS task_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Audit info
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'view', 'assign', 'complete', 'archive')),
    field_name TEXT,
    old_value JSONB,
    new_value JSONB,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    
    -- Compliance
    compliance_type TEXT CHECK (compliance_type IN ('sox', 'gdpr', 'hipaa', 'iso27001')),
    retention_policy TEXT DEFAULT 'standard',
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. SISTEMA DE ORGANIZAÇÕES (Multi-tenancy)
-- =====================================================

CREATE TABLE IF NOT EXISTS organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Organization info
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    
    -- Contact
    website TEXT,
    email TEXT,
    phone TEXT,
    
    -- Address
    address JSONB DEFAULT '{}',
    timezone TEXT DEFAULT 'UTC',
    locale TEXT DEFAULT 'en',
    
    -- Settings
    settings JSONB DEFAULT '{}',
    features JSONB DEFAULT '{}',
    
    -- Subscription
    plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'starter', 'professional', 'enterprise')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'suspended', 'trial')),
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    
    -- Limits
    max_users INTEGER DEFAULT 5,
    max_storage_gb INTEGER DEFAULT 1,
    max_api_calls INTEGER DEFAULT 1000,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Ownership
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Organizations (Many-to-many)
CREATE TABLE IF NOT EXISTS user_organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Role in organization
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member', 'viewer')),
    permissions JSONB DEFAULT '{}',
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    invited_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Settings
    preferences JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, organization_id)
);

-- =====================================================
-- 3. SISTEMA DE COMPLIANCE E AUDITORIA
-- =====================================================

CREATE TABLE IF NOT EXISTS compliance_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Compliance info
    compliance_type TEXT NOT NULL CHECK (compliance_type IN ('sox', 'gdpr', 'hipaa', 'iso27001', 'ccpa')),
    event_type TEXT NOT NULL,
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Event details
    resource_type TEXT,
    resource_id TEXT,
    action_performed TEXT NOT NULL,
    
    -- Data
    data_before JSONB,
    data_after JSONB,
    affected_fields TEXT[],
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    request_id TEXT,
    
    -- Compliance specific
    data_classification TEXT CHECK (data_classification IN ('public', 'internal', 'confidential', 'restricted')),
    retention_period INTERVAL DEFAULT '7 years',
    legal_hold BOOLEAN DEFAULT FALSE,
    
    -- Geographic
    processing_location TEXT,
    data_residency TEXT,
    
    -- Risk assessment
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    requires_review BOOLEAN DEFAULT FALSE,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    tags TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data Retention Policies
CREATE TABLE IF NOT EXISTS data_retention_policies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Policy info
    policy_name TEXT NOT NULL,
    description TEXT,
    
    -- Scope
    resource_type TEXT NOT NULL,
    data_category TEXT NOT NULL,
    compliance_framework TEXT CHECK (compliance_framework IN ('sox', 'gdpr', 'hipaa', 'iso27001', 'ccpa')),
    
    -- Retention rules
    retention_period INTERVAL NOT NULL,
    auto_delete BOOLEAN DEFAULT FALSE,
    archive_before_delete BOOLEAN DEFAULT TRUE,
    
    -- Conditions
    conditions JSONB DEFAULT '{}',
    exceptions JSONB DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    effective_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expiry_date TIMESTAMP WITH TIME ZONE,
    
    -- Approval
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. SISTEMA DE IA E ANALYTICS AVANÇADOS
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_content_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Content reference
    content_type TEXT NOT NULL CHECK (content_type IN ('document', 'task', 'note', 'comment', 'message')),
    content_id UUID NOT NULL,
    
    -- AI analysis
    insights JSONB NOT NULL,
    sentiment_score FLOAT CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
    complexity_score INTEGER CHECK (complexity_score >= 0 AND complexity_score <= 100),
    readability_score INTEGER CHECK (readability_score >= 0 AND readability_score <= 100),
    
    -- Suggestions
    suggestions JSONB DEFAULT '[]',
    auto_tags TEXT[],
    categories TEXT[],
    
    -- Performance
    processing_time_ms INTEGER,
    model_version TEXT,
    confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- AI model info
    ai_provider TEXT DEFAULT 'openai',
    model_name TEXT,
    tokens_used INTEGER,
    cost_usd DECIMAL(10,6),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT unique_content_analysis UNIQUE(content_type, content_id, model_version)
);

-- Smart Collections (AI-powered)
CREATE TABLE IF NOT EXISTS smart_collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Collection info
    name TEXT NOT NULL,
    description TEXT,
    
    -- AI rules
    ai_rules JSONB NOT NULL,
    auto_update BOOLEAN DEFAULT TRUE,
    update_frequency INTERVAL DEFAULT '1 hour',
    
    -- Content
    items JSONB DEFAULT '[]',
    item_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Performance
    performance_metrics JSONB DEFAULT '{}',
    accuracy_score FLOAT,
    
    -- Settings
    is_public BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. SISTEMA DE AUTENTICAÇÃO ENTERPRISE
-- =====================================================

CREATE TABLE IF NOT EXISTS mfa_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- MFA methods
    totp_enabled BOOLEAN DEFAULT FALSE,
    totp_secret TEXT,
    sms_enabled BOOLEAN DEFAULT FALSE,
    email_enabled BOOLEAN DEFAULT FALSE,
    
    -- Backup codes
    backup_codes TEXT[],
    backup_codes_used INTEGER DEFAULT 0,
    
    -- Settings
    default_method TEXT CHECK (default_method IN ('totp', 'sms', 'email')),
    require_mfa BOOLEAN DEFAULT FALSE,
    
    -- Recovery
    recovery_email TEXT,
    recovery_phone TEXT,
    
    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    last_used TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS magic_link_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Token info
    token TEXT UNIQUE NOT NULL,
    token_hash TEXT NOT NULL,
    
    -- Purpose
    purpose TEXT NOT NULL CHECK (purpose IN ('login', 'password_reset', 'email_verification', 'mfa_setup')),
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    
    -- Timing
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    
    -- Security
    max_uses INTEGER DEFAULT 1,
    use_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. PERFORMANCE E MONITORING MELHORADO
-- =====================================================

CREATE TABLE IF NOT EXISTS resource_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Resource info
    resource_type TEXT NOT NULL CHECK (resource_type IN ('cpu', 'memory', 'storage', 'network', 'database')),
    metric_name TEXT NOT NULL,
    metric_value FLOAT NOT NULL,
    metric_unit TEXT NOT NULL,
    
    -- Context
    server_id TEXT,
    region TEXT,
    environment TEXT DEFAULT 'production',
    
    -- Thresholds
    warning_threshold FLOAT,
    critical_threshold FLOAT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    tags TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scaling_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Event info
    event_type TEXT NOT NULL CHECK (event_type IN ('scale_up', 'scale_down', 'auto_scale', 'manual_scale')),
    triggered_by TEXT,
    
    -- Scaling details
    resource_type TEXT NOT NULL,
    before_count INTEGER,
    after_count INTEGER,
    scaling_reason TEXT,
    
    -- Performance impact
    duration_seconds INTEGER,
    cost_impact_usd DECIMAL(10,4),
    performance_improvement FLOAT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. ÍNDICES OTIMIZADOS PARA PERFORMANCE
-- =====================================================

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_organization_id ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_tags ON tasks USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_tasks_labels ON tasks USING gin(labels);

-- Task cache indexes
CREATE INDEX IF NOT EXISTS idx_task_cache_cache_key ON task_cache_entries(cache_key);
CREATE INDEX IF NOT EXISTS idx_task_cache_task_id ON task_cache_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_task_cache_expires_at ON task_cache_entries(expires_at);
CREATE INDEX IF NOT EXISTS idx_task_cache_last_accessed ON task_cache_entries(last_accessed DESC);
CREATE INDEX IF NOT EXISTS idx_task_cache_strategy ON task_cache_entries(strategy);

-- Organizations indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_plan_type ON organizations(plan_type);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status ON organizations(subscription_status);
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON organizations(is_active);

-- User organizations indexes
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_organization_id ON user_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_role ON user_organizations(role);
CREATE INDEX IF NOT EXISTS idx_user_organizations_status ON user_organizations(status);

-- Compliance indexes
CREATE INDEX IF NOT EXISTS idx_compliance_audit_organization_id ON compliance_audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_compliance_type ON compliance_audit_logs(compliance_type);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_created_at ON compliance_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_severity ON compliance_audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_requires_review ON compliance_audit_logs(requires_review);

-- AI insights indexes
CREATE INDEX IF NOT EXISTS idx_ai_insights_content ON ai_content_insights(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_content_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_organization_id ON ai_content_insights(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created_at ON ai_content_insights(created_at DESC);

-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_resource_metrics_organization_id ON resource_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_resource_metrics_resource_type ON resource_metrics(resource_type);
CREATE INDEX IF NOT EXISTS idx_resource_metrics_created_at ON resource_metrics(created_at DESC);

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_cache_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_content_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_metrics ENABLE ROW LEVEL SECURITY;

-- Tasks RLS policies
CREATE POLICY "Users can view tasks in their organizations" ON tasks
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can create tasks in their organizations" ON tasks
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM user_organizations 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can update tasks they have access to" ON tasks
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Organizations RLS policies
CREATE POLICY "Users can view their organizations" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id FROM user_organizations 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Compliance audit logs RLS (admin only)
CREATE POLICY "Only admins can view compliance logs" ON compliance_audit_logs
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
        )
    );

-- =====================================================
-- 9. FUNÇÕES UTILITÁRIAS E TRIGGERS
-- =====================================================

-- Função para limpeza automática de cache expirado
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM task_cache_entries 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar métricas de organização
CREATE OR REPLACE FUNCTION update_organization_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user count
    UPDATE organizations 
    SET settings = jsonb_set(
        COALESCE(settings, '{}'),
        '{current_users}',
        (SELECT COUNT(*)::text::jsonb FROM user_organizations WHERE organization_id = NEW.organization_id AND status = 'active')
    )
    WHERE id = NEW.organization_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar métricas quando usuário entra/sai da organização
CREATE TRIGGER trigger_update_org_metrics
    AFTER INSERT OR UPDATE OR DELETE ON user_organizations
    FOR EACH ROW EXECUTE FUNCTION update_organization_metrics();

-- Função para auto-tagging com IA
CREATE OR REPLACE FUNCTION auto_tag_content()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert AI analysis request (would be processed by background job)
    INSERT INTO ai_content_insights (
        user_id,
        organization_id,
        content_type,
        content_id,
        insights
    ) VALUES (
        NEW.user_id,
        NEW.organization_id,
        'task',
        NEW.id,
        '{"status": "pending", "auto_generated": true}'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-tagging de tasks
CREATE TRIGGER trigger_auto_tag_tasks
    AFTER INSERT ON tasks
    FOR EACH ROW EXECUTE FUNCTION auto_tag_content();

-- =====================================================
-- 10. FUNÇÕES DE RELATÓRIOS E ANALYTICS
-- =====================================================

-- Função para relatório de performance de organização
CREATE OR REPLACE FUNCTION get_organization_performance_report(org_id UUID, start_date TIMESTAMP WITH TIME ZONE, end_date TIMESTAMP WITH TIME ZONE)
RETURNS TABLE (
    metric_name TEXT,
    metric_value FLOAT,
    trend_percentage FLOAT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'tasks_completed'::TEXT as metric_name,
        COUNT(*)::FLOAT as metric_value,
        0.0::FLOAT as trend_percentage,
        'good'::TEXT as status
    FROM tasks 
    WHERE organization_id = org_id 
        AND status = 'completed'
        AND completed_at BETWEEN start_date AND end_date
    
    UNION ALL
    
    SELECT 
        'active_users'::TEXT,
        COUNT(DISTINCT user_id)::FLOAT,
        0.0::FLOAT,
        'good'::TEXT
    FROM task_audit_logs 
    WHERE organization_id = org_id
        AND created_at BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;

-- Comentário final
COMMENT ON SCHEMA public IS 'Schema principal com tabelas enterprise otimizadas para produção';