interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'data_access' | 'permission_change' | 'export' | 'delete' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id: string;
  organization_id: string;
  timestamp: string;
  details: {
    ip_address?: string;
    user_agent?: string;
    location?: string;
    resource?: string;
    action?: string;
    metadata?: any;
  };
  status: 'detected' | 'investigating' | 'resolved' | 'dismissed';
}

interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  category: 'gdpr' | 'hipaa' | 'sox' | 'iso27001' | 'custom';
  enabled: boolean;
  conditions: {
    eventTypes: string[];
    thresholds: {
      time_window: number; // minutes
      max_occurrences: number;
    };
    users?: string[];
    resources?: string[];
  };
  actions: {
    alert: boolean;
    block: boolean;
    notify_admin: boolean;
    audit_log: boolean;
  };
}

interface AuditLog {
  id: string;
  event_type: string;
  user_id: string;
  organization_id: string;
  resource_type: string;
  resource_id: string;
  action: string;
  timestamp: string;
  ip_address: string;
  user_agent: string;
  result: 'success' | 'failure' | 'blocked';
  details: any;
}

interface PrivacySettings {
  data_retention_days: number;
  auto_delete_enabled: boolean;
  encryption_at_rest: boolean;
  encryption_in_transit: boolean;
  data_anonymization: boolean;
  right_to_be_forgotten: boolean;
  data_portability: boolean;
  consent_management: boolean;
}

interface ComplianceReport {
  organization_id: string;
  period: {
    start: string;
    end: string;
  };
  summary: {
    total_events: number;
    security_incidents: number;
    data_breaches: number;
    compliance_violations: number;
    user_access_requests: number;
  };
  metrics: {
    login_success_rate: number;
    failed_login_attempts: number;
    suspicious_activities: number;
    data_exports: number;
    permission_changes: number;
  };
  gdpr_compliance: {
    data_requests_processed: number;
    data_deletions: number;
    consent_updates: number;
    breach_notifications: number;
  };
  recommendations: string[];
}

class ComplianceMonitoringService {
  private static instance: ComplianceMonitoringService;
  private securityEvents: SecurityEvent[] = [];
  private auditLogs: AuditLog[] = [];
  private complianceRules: ComplianceRule[] = [];
  private privacySettings: PrivacySettings;

  public static getInstance(): ComplianceMonitoringService {
    if (!ComplianceMonitoringService.instance) {
      ComplianceMonitoringService.instance = new ComplianceMonitoringService();
    }
    return ComplianceMonitoringService.instance;
  }

  constructor() {
    this.initializeDefaultRules();
    this.initializePrivacySettings();
    this.startContinuousMonitoring();
  }

  private initializeDefaultRules(): void {
    this.complianceRules = [
      {
        id: 'gdpr-data-access',
        name: 'GDPR Data Access Monitoring',
        description: 'Monitor excessive data access patterns',
        category: 'gdpr',
        enabled: true,
        conditions: {
          eventTypes: ['data_access'],
          thresholds: {
            time_window: 60,
            max_occurrences: 100
          }
        },
        actions: {
          alert: true,
          block: false,
          notify_admin: true,
          audit_log: true
        }
      },
      {
        id: 'suspicious-login',
        name: 'Suspicious Login Detection',
        description: 'Detect unusual login patterns',
        category: 'custom',
        enabled: true,
        conditions: {
          eventTypes: ['login'],
          thresholds: {
            time_window: 30,
            max_occurrences: 10
          }
        },
        actions: {
          alert: true,
          block: true,
          notify_admin: true,
          audit_log: true
        }
      },
      {
        id: 'data-export-monitoring',
        name: 'Data Export Monitoring',
        description: 'Monitor large data exports',
        category: 'iso27001',
        enabled: true,
        conditions: {
          eventTypes: ['export'],
          thresholds: {
            time_window: 1440, // 24 hours
            max_occurrences: 5
          }
        },
        actions: {
          alert: true,
          block: false,
          notify_admin: true,
          audit_log: true
        }
      }
    ];
  }

  private initializePrivacySettings(): void {
    this.privacySettings = {
      data_retention_days: 2555, // 7 years
      auto_delete_enabled: true,
      encryption_at_rest: true,
      encryption_in_transit: true,
      data_anonymization: true,
      right_to_be_forgotten: true,
      data_portability: true,
      consent_management: true
    };
  }

  private startContinuousMonitoring(): void {
    // Monitor every 30 seconds
    setInterval(() => {
      this.analyzeSecurityEvents();
      this.cleanupOldData();
    }, 30000);

    // Generate daily reports
    setInterval(() => {
      this.generateDailyReport();
    }, 24 * 60 * 60 * 1000);
  }

  // Security Event Management
  public async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'status'>): Promise<void> {
    const securityEvent: SecurityEvent = {
      ...event,
      id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      status: 'detected'
    };

    this.securityEvents.push(securityEvent);
    
    // Check against compliance rules
    await this.checkComplianceRules(securityEvent);
    
    // Store in persistent storage (would use real database)
    await this.persistSecurityEvent(securityEvent);
    
    console.log(`[Compliance] Security event logged: ${event.type} - ${event.severity}`);
  }

  private async checkComplianceRules(event: SecurityEvent): Promise<void> {
    for (const rule of this.complianceRules) {
      if (!rule.enabled) continue;
      
      if (rule.conditions.eventTypes.includes(event.type)) {
        const recentEvents = this.getRecentEvents(
          event.type, 
          rule.conditions.thresholds.time_window,
          event.user_id
        );
        
        if (recentEvents.length >= rule.conditions.thresholds.max_occurrences) {
          await this.triggerComplianceAction(rule, event, recentEvents);
        }
      }
    }
  }

  private getRecentEvents(eventType: string, timeWindowMinutes: number, userId: string): SecurityEvent[] {
    const cutoff = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    return this.securityEvents.filter(event => 
      event.type === eventType &&
      event.user_id === userId &&
      new Date(event.timestamp) > cutoff
    );
  }

  private async triggerComplianceAction(rule: ComplianceRule, event: SecurityEvent, recentEvents: SecurityEvent[]): Promise<void> {
    console.warn(`[Compliance] Rule triggered: ${rule.name} for user ${event.user_id}`);
    
    if (rule.actions.alert) {
      await this.createAlert({
        type: 'compliance_violation',
        severity: 'high',
        rule_id: rule.id,
        user_id: event.user_id,
        details: {
          rule_name: rule.name,
          event_count: recentEvents.length,
          time_window: rule.conditions.thresholds.time_window
        }
      });
    }
    
    if (rule.actions.block) {
      await this.blockUser(event.user_id, rule.name);
    }
    
    if (rule.actions.notify_admin) {
      await this.notifyAdmins(rule, event, recentEvents);
    }
    
    if (rule.actions.audit_log) {
      await this.createAuditLog({
        event_type: 'compliance_violation',
        user_id: event.user_id,
        organization_id: event.organization_id,
        resource_type: 'compliance_rule',
        resource_id: rule.id,
        action: 'triggered',
        result: 'success',
        details: { rule, event, recent_events_count: recentEvents.length }
      });
    }
  }

  // Audit Logging
  public async createAuditLog(log: Omit<AuditLog, 'id' | 'timestamp' | 'ip_address' | 'user_agent'>): Promise<void> {
    const auditLog: AuditLog = {
      ...log,
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ip_address: 'hidden', // Would get real IP
      user_agent: navigator.userAgent
    };

    this.auditLogs.push(auditLog);
    await this.persistAuditLog(auditLog);
    
    console.log(`[Compliance] Audit log created: ${log.action} on ${log.resource_type}`);
  }

  // GDPR Compliance
  public async processDataRequest(type: 'access' | 'portability' | 'deletion' | 'rectification', userId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      await this.createAuditLog({
        event_type: 'gdpr_request',
        user_id: userId,
        organization_id: 'system',
        resource_type: 'user_data',
        resource_id: userId,
        action: `gdpr_${type}`,
        result: 'success',
        details: { request_type: type, timestamp: new Date().toISOString() }
      });

      switch (type) {
        case 'access':
          const userData = await this.exportUserData(userId);
          return { success: true, data: userData };
          
        case 'portability':
          const portableData = await this.createPortableData(userId);
          return { success: true, data: portableData };
          
        case 'deletion':
          await this.deleteUserData(userId);
          return { success: true };
          
        case 'rectification':
          // Would implement data correction
          return { success: true };
          
        default:
          return { success: false, error: 'Invalid request type' };
      }
    } catch (error) {
      return { success: false, error: 'Request processing failed' };
    }
  }

  private async exportUserData(userId: string): Promise<any> {
    // Simulate data export
    return {
      user_profile: { /* user data */ },
      documents: { /* user documents */ },
      activity_logs: { /* user activity */ },
      preferences: { /* user preferences */ }
    };
  }

  private async createPortableData(userId: string): Promise<any> {
    const userData = await this.exportUserData(userId);
    return {
      format: 'JSON',
      data: userData,
      generated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };
  }

  private async deleteUserData(userId: string): Promise<void> {
    // Simulate data deletion
    console.log(`[Compliance] Deleting all data for user: ${userId}`);
    
    // Would delete from all systems:
    // - User profile
    // - Documents
    // - Activity logs
    // - Cached data
    // - Backup systems
  }

  // Compliance Reporting
  public async generateComplianceReport(organizationId: string, startDate: string, endDate: string): Promise<ComplianceReport> {
    const events = this.securityEvents.filter(event => 
      event.organization_id === organizationId &&
      event.timestamp >= startDate &&
      event.timestamp <= endDate
    );

    const auditLogs = this.auditLogs.filter(log => 
      log.organization_id === organizationId &&
      log.timestamp >= startDate &&
      log.timestamp <= endDate
    );

    const report: ComplianceReport = {
      organization_id: organizationId,
      period: { start: startDate, end: endDate },
      summary: {
        total_events: events.length,
        security_incidents: events.filter(e => e.severity === 'high' || e.severity === 'critical').length,
        data_breaches: events.filter(e => e.type === 'data_access' && e.severity === 'critical').length,
        compliance_violations: auditLogs.filter(l => l.event_type === 'compliance_violation').length,
        user_access_requests: auditLogs.filter(l => l.event_type === 'gdpr_request').length
      },
      metrics: {
        login_success_rate: this.calculateLoginSuccessRate(events),
        failed_login_attempts: events.filter(e => e.type === 'login' && e.details.action === 'failed').length,
        suspicious_activities: events.filter(e => e.type === 'suspicious_activity').length,
        data_exports: events.filter(e => e.type === 'export').length,
        permission_changes: events.filter(e => e.type === 'permission_change').length
      },
      gdpr_compliance: {
        data_requests_processed: auditLogs.filter(l => l.event_type === 'gdpr_request').length,
        data_deletions: auditLogs.filter(l => l.action === 'gdpr_deletion').length,
        consent_updates: auditLogs.filter(l => l.event_type === 'consent_update').length,
        breach_notifications: events.filter(e => e.type === 'data_access' && e.severity === 'critical').length
      },
      recommendations: this.generateRecommendations(events, auditLogs)
    };

    await this.createAuditLog({
      event_type: 'compliance_report',
      user_id: 'system',
      organization_id: organizationId,
      resource_type: 'compliance_report',
      resource_id: `report_${Date.now()}`,
      action: 'generated',
      result: 'success',
      details: { period: report.period, summary: report.summary }
    });

    return report;
  }

  private calculateLoginSuccessRate(events: SecurityEvent[]): number {
    const loginEvents = events.filter(e => e.type === 'login');
    if (loginEvents.length === 0) return 100;
    
    const successfulLogins = loginEvents.filter(e => e.details.action !== 'failed').length;
    return Math.round((successfulLogins / loginEvents.length) * 100);
  }

  private generateRecommendations(events: SecurityEvent[], auditLogs: AuditLog[]): string[] {
    const recommendations: string[] = [];
    
    const highSeverityEvents = events.filter(e => e.severity === 'high' || e.severity === 'critical');
    if (highSeverityEvents.length > 10) {
      recommendations.push('Consider implementing additional security measures due to high number of security incidents');
    }
    
    const failedLogins = events.filter(e => e.type === 'login' && e.details.action === 'failed');
    if (failedLogins.length > 50) {
      recommendations.push('Implement account lockout policies and multi-factor authentication');
    }
    
    const dataExports = events.filter(e => e.type === 'export');
    if (dataExports.length > 20) {
      recommendations.push('Review data export policies and implement additional approval workflows');
    }
    
    return recommendations;
  }

  // Privacy Management
  public async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<void> {
    this.privacySettings = { ...this.privacySettings, ...settings };
    
    await this.createAuditLog({
      event_type: 'privacy_settings_update',
      user_id: 'admin',
      organization_id: 'system',
      resource_type: 'privacy_settings',
      resource_id: 'global',
      action: 'updated',
      result: 'success',
      details: { updated_settings: settings }
    });
  }

  public getPrivacySettings(): PrivacySettings {
    return { ...this.privacySettings };
  }

  // Data Cleanup
  private async cleanupOldData(): Promise<void> {
    const cutoffDate = new Date(Date.now() - this.privacySettings.data_retention_days * 24 * 60 * 60 * 1000);
    
    if (this.privacySettings.auto_delete_enabled) {
      // Clean up old security events
      this.securityEvents = this.securityEvents.filter(event => 
        new Date(event.timestamp) > cutoffDate
      );
      
      // Clean up old audit logs (keep longer for compliance)
      const auditCutoff = new Date(Date.now() - 7 * 365 * 24 * 60 * 60 * 1000); // 7 years
      this.auditLogs = this.auditLogs.filter(log => 
        new Date(log.timestamp) > auditCutoff
      );
    }
  }

  // Alert System
  private async createAlert(alert: any): Promise<void> {
    console.warn(`[Compliance Alert] ${alert.type}: ${alert.severity}`);
    // Would implement real alert system (email, Slack, etc.)
  }

  private async blockUser(userId: string, reason: string): Promise<void> {
    console.warn(`[Compliance] Blocking user ${userId}: ${reason}`);
    // Would implement real user blocking
  }

  private async notifyAdmins(rule: ComplianceRule, event: SecurityEvent, recentEvents: SecurityEvent[]): Promise<void> {
    console.warn(`[Compliance] Notifying admins about rule violation: ${rule.name}`);
    // Would implement real admin notification
  }

  // Analytics
  private async analyzeSecurityEvents(): Promise<void> {
    // Perform real-time analysis
    const recentEvents = this.securityEvents.filter(event => 
      new Date(event.timestamp) > new Date(Date.now() - 60 * 60 * 1000) // Last hour
    );
    
    // Detect patterns
    if (recentEvents.length > 100) {
      await this.logSecurityEvent({
        type: 'suspicious_activity',
        severity: 'high',
        user_id: 'system',
        organization_id: 'system',
        details: {
          reason: 'High event volume detected',
          event_count: recentEvents.length
        }
      });
    }
  }

  private async generateDailyReport(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Generate report for each organization
    const organizations = [...new Set(this.securityEvents.map(e => e.organization_id))];
    
    for (const orgId of organizations) {
      if (orgId !== 'system') {
        const report = await this.generateComplianceReport(orgId, yesterday, today);
        console.log(`[Compliance] Daily report generated for ${orgId}`);
        // Would send report to administrators
      }
    }
  }

  // Persistence (would use real database)
  private async persistSecurityEvent(event: SecurityEvent): Promise<void> {
    // Simulate database storage
    localStorage.setItem(`security_event_${event.id}`, JSON.stringify(event));
  }

  private async persistAuditLog(log: AuditLog): Promise<void> {
    // Simulate database storage
    localStorage.setItem(`audit_log_${log.id}`, JSON.stringify(log));
  }

  // Public getters
  public getSecurityEvents(): SecurityEvent[] {
    return [...this.securityEvents];
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  public getComplianceRules(): ComplianceRule[] {
    return [...this.complianceRules];
  }
}

export const complianceMonitoringService = ComplianceMonitoringService.getInstance();
export default ComplianceMonitoringService;
export type { SecurityEvent, ComplianceRule, AuditLog, PrivacySettings, ComplianceReport }; 