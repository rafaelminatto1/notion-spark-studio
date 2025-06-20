import type { Task } from '@/types/task';

export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'READ' 
  | 'BULK_UPDATE'
  | 'READ_BY_USER';

export interface AuditEntry {
  id: string;
  timestamp: number;
  action: AuditAction;
  entityType: 'task';
  entityId: string;
  userId?: string;
  changes?: {
    before?: Partial<Task>;
    after?: Partial<Task>;
  };
  metadata?: {
    userAgent?: string;
    ip?: string;
    source?: string;
    filters?: any;
    bulkCount?: number;
  };
  duration?: number; // Duração da operação em ms
  success: boolean;
  error?: string;
}

interface AuditStats {
  totalOperations: number;
  operationsByAction: Record<AuditAction, number>;
  averageDuration: number;
  successRate: number;
  recentOperations: AuditEntry[];
}

export class TaskAuditService {
  private auditLog: AuditEntry[] = [];
  private readonly MAX_LOG_SIZE = 10000; // Manter últimas 10k operações
  private readonly PERFORMANCE_THRESHOLD = 1000; // 1 segundo

  /**
   * Gera ID único para entrada de audit
   */
  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Registra operação no audit log
   */
  logOperation(
    action: AuditAction,
    entityId: string,
    options: {
      userId?: string;
      changes?: { before?: Partial<Task>; after?: Partial<Task> };
      metadata?: AuditEntry['metadata'];
      duration?: number;
      success: boolean;
      error?: string;
    }
  ): void {
    const entry: AuditEntry = {
      id: this.generateAuditId(),
      timestamp: Date.now(),
      action,
      entityType: 'task',
      entityId,
      userId: options.userId,
      changes: options.changes,
      metadata: options.metadata,
      duration: options.duration,
      success: options.success,
      error: options.error
    };

    this.auditLog.push(entry);

    // Controle de tamanho do log
    if (this.auditLog.length > this.MAX_LOG_SIZE) {
      // Remove 10% das entradas mais antigas
      const toRemove = Math.floor(this.MAX_LOG_SIZE * 0.1);
      this.auditLog.splice(0, toRemove);
    }

    // Log performance warnings
    if (options.duration && options.duration > this.PERFORMANCE_THRESHOLD) {
      console.warn(`[TaskAudit] Slow operation detected: ${action} took ${options.duration}ms`, {
        entityId,
        action,
        duration: options.duration
      });
    }

    // Log errors
    if (!options.success && options.error) {
      console.error(`[TaskAudit] Operation failed: ${action}`, {
        entityId,
        error: options.error,
        userId: options.userId
      });
    }
  }

  /**
   * Busca entradas do audit log por critérios
   */
  getAuditLog(filters?: {
    action?: AuditAction;
    entityId?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    onlyErrors?: boolean;
    limit?: number;
  }): AuditEntry[] {
    let filtered = [...this.auditLog];

    if (filters?.action) {
      filtered = filtered.filter(entry => entry.action === filters.action);
    }

    if (filters?.entityId) {
      filtered = filtered.filter(entry => entry.entityId === filters.entityId);
    }

    if (filters?.userId) {
      filtered = filtered.filter(entry => entry.userId === filters.userId);
    }

    if (filters?.startDate) {
      filtered = filtered.filter(entry => entry.timestamp >= filters.startDate!.getTime());
    }

    if (filters?.endDate) {
      filtered = filtered.filter(entry => entry.timestamp <= filters.endDate!.getTime());
    }

    if (filters?.onlyErrors) {
      filtered = filtered.filter(entry => !entry.success);
    }

    // Ordena por timestamp decrescente (mais recentes primeiro)
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  /**
   * Gera estatísticas do audit log
   */
  getAuditStats(timeRange?: { start: Date; end: Date }): AuditStats {
    let entries = this.auditLog;

    if (timeRange) {
      entries = entries.filter(entry => 
        entry.timestamp >= timeRange.start.getTime() && 
        entry.timestamp <= timeRange.end.getTime()
      );
    }

    const totalOperations = entries.length;
    const operationsByAction: Record<AuditAction, number> = {
      CREATE: 0,
      UPDATE: 0,
      DELETE: 0,
      READ: 0,
      BULK_UPDATE: 0,
      READ_BY_USER: 0
    };

    let totalDuration = 0;
    let successCount = 0;
    let operationsWithDuration = 0;

    entries.forEach(entry => {
      operationsByAction[entry.action]++;
      
      if (entry.success) {
        successCount++;
      }
      
      if (entry.duration) {
        totalDuration += entry.duration;
        operationsWithDuration++;
      }
    });

    return {
      totalOperations,
      operationsByAction,
      averageDuration: operationsWithDuration > 0 ? totalDuration / operationsWithDuration : 0,
      successRate: totalOperations > 0 ? (successCount / totalOperations) * 100 : 0,
      recentOperations: entries.slice(0, 10) // Últimas 10 operações
    };
  }

  /**
   * Busca histórico de uma tarefa específica
   */
  getTaskHistory(taskId: string): AuditEntry[] {
    return this.getAuditLog({ entityId: taskId });
  }

  /**
   * Busca atividade de um usuário específico
   */
  getUserActivity(userId: string, limit = 50): AuditEntry[] {
    return this.getAuditLog({ userId, limit });
  }

  /**
   * Detecta padrões suspeitos de atividade
   */
  detectSuspiciousActivity(): {
    rapidOperations: AuditEntry[];
    frequentErrors: AuditEntry[];
    unusualPatterns: string[];
  } {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const recentEntries = this.auditLog.filter(entry => now - entry.timestamp < oneHour);

    // Operações muito rápidas em sequência
    const rapidOperations = recentEntries.filter((entry, index) => {
      if (index === 0) return false;
      const prevEntry = recentEntries[index - 1];
      return Math.abs(entry.timestamp - prevEntry.timestamp) < 100; // < 100ms entre operações
    });

    // Muitos erros recentes
    const frequentErrors = recentEntries.filter(entry => !entry.success);

    // Padrões incomuns
    const patterns: string[] = [];
    
    // Muitas operações DELETE em pouco tempo
    const recentDeletes = recentEntries.filter(entry => entry.action === 'DELETE');
    if (recentDeletes.length > 10) {
      patterns.push(`Muitas operações DELETE: ${recentDeletes.length} na última hora`);
    }

    // Taxa de erro alta
    const errorRate = recentEntries.length > 0 ? (frequentErrors.length / recentEntries.length) * 100 : 0;
    if (errorRate > 20) {
      patterns.push(`Taxa de erro alta: ${errorRate.toFixed(1)}%`);
    }

    return {
      rapidOperations,
      frequentErrors,
      unusualPatterns: patterns
    };
  }

  /**
   * Exporta audit log para análise externa
   */
  exportAuditLog(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['ID', 'Timestamp', 'Action', 'EntityId', 'UserId', 'Success', 'Duration', 'Error'];
      const rows = this.auditLog.map(entry => [
        entry.id,
        new Date(entry.timestamp).toISOString(),
        entry.action,
        entry.entityId,
        entry.userId || '',
        entry.success,
        entry.duration || '',
        entry.error || ''
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return JSON.stringify(this.auditLog, null, 2);
  }

  /**
   * Limpa logs antigos
   */
  cleanup(olderThanDays = 30): number {
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    const initialLength = this.auditLog.length;
    
    this.auditLog = this.auditLog.filter(entry => entry.timestamp > cutoffTime);
    
    return initialLength - this.auditLog.length;
  }
}

// Singleton instance
export const taskAuditService = new TaskAuditService(); 