/**
 * 🔍 Supabase Monitoring Service
 * Integração com MCP para monitoramento em tempo real
 */

import { supabase } from '@/lib/supabase-unified';

export interface AdvisorLint {
  name: string;
  title: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  facing: string;
  categories: string[];
  description: string;
  detail: string;
  remediation?: string;
  metadata?: any;
  cache_key?: string;
}

export interface SupabaseTable {
  name: string;
  schema: string;
  type: 'table' | 'view';
  columns?: number;
  rows?: number;
  size?: string;
}

export interface SupabaseMigration {
  version: string;
  name: string;
  executed_at?: string;
  status: 'applied' | 'pending' | 'reverted';
}

export interface SupabaseStats {
  tables: number;
  indexes: number;
  functions: number;
  policies: number;
  migrations: number;
  connections: number;
  storage_used: string;
  queries_per_day: number;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  service: string;
  message: string;
  metadata?: any;
}

class SupabaseMonitoringService {
  private static instance: SupabaseMonitoringService;
  private advisorsCache: { security: AdvisorLint[]; performance: AdvisorLint[] } = {
    security: [],
    performance: []
  };
  private lastUpdate: Date | null = null;
  private updateInterval: number = 5 * 60 * 1000; // 5 minutos

  static getInstance(): SupabaseMonitoringService {
    if (!SupabaseMonitoringService.instance) {
      SupabaseMonitoringService.instance = new SupabaseMonitoringService();
    }
    return SupabaseMonitoringService.instance;
  }

  /**
   * Obter advisors de segurança
   */
  async getSecurityAdvisors(forceRefresh = false): Promise<AdvisorLint[]> {
    if (!forceRefresh && this.isCacheValid() && this.advisorsCache.security.length > 0) {
      return this.advisorsCache.security;
    }

    try {
      // Em produção, isso seria uma chamada MCP real
      // const response = await mcp_supabase_get_advisors({ type: 'security' });
      
      // Simulação para desenvolvimento
      const mockSecurityAdvisors: AdvisorLint[] = [
        {
          name: 'auth_otp_long_expiry',
          title: 'Auth OTP long expiry',
          level: 'WARN',
          facing: 'EXTERNAL',
          categories: ['SECURITY'],
          description: 'OTP expiry exceeds recommended threshold',
          detail: 'Email provider with OTP expiry set to more than an hour',
          remediation: 'https://supabase.com/docs/guides/platform/going-into-prod#security'
        },
        {
          name: 'auth_leaked_password_protection',
          title: 'Leaked Password Protection Disabled',
          level: 'WARN',
          facing: 'EXTERNAL',
          categories: ['SECURITY'],
          description: 'Leaked password protection is currently disabled',
          detail: 'Supabase Auth prevents use of compromised passwords by checking against HaveIBeenPwned.org',
          remediation: 'https://supabase.com/docs/guides/auth/password-security'
        },
        {
          name: 'function_search_path_mutable',
          title: 'Function Search Path Mutable',
          level: 'WARN',
          facing: 'EXTERNAL',
          categories: ['SECURITY'],
          description: 'Function has mutable search_path parameter',
          detail: 'Function get_current_user_id has a role mutable search_path',
          remediation: 'https://supabase.com/docs/guides/database/database-linter'
        }
      ];

      this.advisorsCache.security = mockSecurityAdvisors;
      this.lastUpdate = new Date();
      
      return mockSecurityAdvisors;
    } catch (error) {
      console.error('Error fetching security advisors:', error);
      return this.advisorsCache.security;
    }
  }

  /**
   * Obter advisors de performance
   */
  async getPerformanceAdvisors(forceRefresh = false): Promise<AdvisorLint[]> {
    if (!forceRefresh && this.isCacheValid() && this.advisorsCache.performance.length > 0) {
      return this.advisorsCache.performance;
    }

    try {
      // Em produção: await mcp_supabase_get_advisors({ type: 'performance' });
      
      const mockPerformanceAdvisors: AdvisorLint[] = [
        {
          name: 'unindexed_foreign_keys',
          title: 'Unindexed foreign keys',
          level: 'INFO',
          facing: 'EXTERNAL',
          categories: ['PERFORMANCE'],
          description: 'Foreign key constraints without covering index',
          detail: 'Resolved: All foreign keys now have proper indexes',
          remediation: 'https://supabase.com/docs/guides/database/database-linter'
        },
        {
          name: 'auth_rls_initplan',
          title: 'Auth RLS Initialization Plan',
          level: 'WARN',
          facing: 'EXTERNAL',
          categories: ['PERFORMANCE'],
          description: 'RLS policies re-evaluate auth functions for each row',
          detail: 'Multiple tables have suboptimal RLS policies that could be optimized',
          remediation: 'https://supabase.com/docs/guides/database/postgres/row-level-security'
        },
        {
          name: 'unused_index',
          title: 'Unused Index',
          level: 'INFO',
          facing: 'EXTERNAL',
          categories: ['PERFORMANCE'],
          description: 'Some indexes have not been used yet',
          detail: '23 indexes created but not yet utilized (normal for new installations)',
          remediation: 'Monitor usage and remove if consistently unused after 30 days'
        },
        {
          name: 'multiple_permissive_policies',
          title: 'Multiple Permissive Policies',
          level: 'WARN',
          facing: 'EXTERNAL',
          categories: ['PERFORMANCE'],
          description: 'Multiple permissive RLS policies on same table',
          detail: 'Tables have multiple policies that could be consolidated for better performance',
          remediation: 'https://supabase.com/docs/guides/database/database-linter'
        }
      ];

      this.advisorsCache.performance = mockPerformanceAdvisors;
      this.lastUpdate = new Date();
      
      return mockPerformanceAdvisors;
    } catch (error) {
      console.error('Error fetching performance advisors:', error);
      return this.advisorsCache.performance;
    }
  }

  /**
   * Obter lista de tabelas
   */
  async getTables(): Promise<SupabaseTable[]> {
    try {
      // Em produção: await mcp_supabase_list_tables({ schemas: ['public'] });
      
      return [
        { name: 'profiles', schema: 'public', type: 'table', columns: 6, rows: 0, size: '8kB' },
        { name: 'files', schema: 'public', type: 'table', columns: 16, rows: 0, size: '8kB' },
        { name: 'activities', schema: 'public', type: 'table', columns: 8, rows: 0, size: '8kB' },
        { name: 'user_roles', schema: 'public', type: 'table', columns: 4, rows: 0, size: '8kB' },
        { name: 'shared_workspaces', schema: 'public', type: 'table', columns: 7, rows: 0, size: '8kB' },
        { name: 'workspace_members', schema: 'public', type: 'table', columns: 6, rows: 0, size: '8kB' },
        { name: 'workspace_settings', schema: 'public', type: 'table', columns: 8, rows: 0, size: '8kB' },
        { name: 'user_preferences', schema: 'public', type: 'table', columns: 12, rows: 0, size: '8kB' },
        { name: 'work_sessions', schema: 'public', type: 'table', columns: 7, rows: 0, size: '8kB' },
        { name: 'backups', schema: 'public', type: 'table', columns: 5, rows: 0, size: '8kB' },
        { name: 'media', schema: 'public', type: 'table', columns: 7, rows: 0, size: '8kB' },
        { name: 'health_reports', schema: 'public', type: 'table', columns: 6, rows: 0, size: '8kB' },
        { name: 'password_reset_tokens', schema: 'public', type: 'table', columns: 8, rows: 0, size: '8kB' }
      ];
    } catch (error) {
      console.error('Error fetching tables:', error);
      return [];
    }
  }

  /**
   * Obter lista de migrações
   */
  async getMigrations(): Promise<SupabaseMigration[]> {
    try {
      // Em produção: await mcp_supabase_list_migrations();
      
      return [
        { 
          version: '001', 
          name: 'enhance_schema_for_production', 
          executed_at: '2025-01-15T10:30:00Z', 
          status: 'applied' 
        },
        { 
          version: '20241213000001', 
          name: 'enhance_schema_for_production', 
          executed_at: '2025-01-15T11:00:00Z', 
          status: 'applied' 
        },
        { 
          version: '20241215000001', 
          name: 'enterprise_tables', 
          executed_at: '2025-01-15T11:30:00Z', 
          status: 'applied' 
        },
        { 
          version: '20241217000001', 
          name: 'fix_rls_policies', 
          executed_at: '2025-01-15T12:00:00Z', 
          status: 'applied' 
        },
        { 
          version: '20241217000002', 
          name: 'add_user_management', 
          executed_at: '2025-01-15T12:30:00Z', 
          status: 'applied' 
        },
        { 
          version: '20250620180804', 
          name: 'optimize_indexes', 
          executed_at: '2025-01-15T13:00:00Z', 
          status: 'applied' 
        },
        { 
          version: '20250620180833', 
          name: 'add_health_monitoring', 
          executed_at: '2025-01-15T13:30:00Z', 
          status: 'applied' 
        },
        { 
          version: '20250625050428', 
          name: 'performance_and_security_optimizations', 
          executed_at: '2025-01-15T14:00:00Z', 
          status: 'applied' 
        }
      ];
    } catch (error) {
      console.error('Error fetching migrations:', error);
      return [];
    }
  }

  /**
   * Obter estatísticas do sistema
   */
  async getStats(): Promise<SupabaseStats> {
    try {
      const tables = await this.getTables();
      const migrations = await this.getMigrations();
      
      return {
        tables: tables.length,
        indexes: 45, // Baseado na migração de otimização
        functions: 8,
        policies: 24,
        migrations: migrations.length,
        connections: 12,
        storage_used: '45MB',
        queries_per_day: 1200
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {
        tables: 0,
        indexes: 0,
        functions: 0,
        policies: 0,
        migrations: 0,
        connections: 0,
        storage_used: '0MB',
        queries_per_day: 0
      };
    }
  }

  /**
   * Obter logs do sistema
   */
  async getLogs(service?: string, limit = 50): Promise<LogEntry[]> {
    try {
      // Em produção: await mcp_supabase_get_logs({ service });
      
      return [
        {
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          level: 'info',
          service: 'migration',
          message: 'Performance optimization migration applied successfully',
          metadata: { migration: '20250625050428', duration: '1.2s' }
        },
        {
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          level: 'info',
          service: 'database',
          message: '23 indexes created for foreign key optimization',
          metadata: { indexes_created: 23, tables_affected: 13 }
        },
        {
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          level: 'info',
          service: 'advisor',
          message: 'Database advisor scan completed',
          metadata: { security_issues: 3, performance_issues: 4 }
        },
        {
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          level: 'warn',
          service: 'auth',
          message: 'OTP expiry configuration exceeds recommended threshold',
          metadata: { current_expiry: '3600s', recommended: '1800s' }
        }
      ];
    } catch (error) {
      console.error('Error fetching logs:', error);
      return [];
    }
  }

  /**
   * Verificar se o cache ainda é válido
   */
  private isCacheValid(): boolean {
    if (!this.lastUpdate) return false;
    return (Date.now() - this.lastUpdate.getTime()) < this.updateInterval;
  }

  /**
   * Limpar cache
   */
  clearCache(): void {
    this.advisorsCache = { security: [], performance: [] };
    this.lastUpdate = null;
  }

  /**
   * Executar verificação completa do sistema
   */
  async runFullSystemCheck(): Promise<{
    security: AdvisorLint[];
    performance: AdvisorLint[];
    stats: SupabaseStats;
    logs: LogEntry[];
  }> {
    try {
      const [security, performance, stats, logs] = await Promise.all([
        this.getSecurityAdvisors(true),
        this.getPerformanceAdvisors(true),
        this.getStats(),
        this.getLogs()
      ]);

      return { security, performance, stats, logs };
    } catch (error) {
      console.error('Error running full system check:', error);
      throw error;
    }
  }
}

export default SupabaseMonitoringService; 