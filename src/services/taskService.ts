import { supabase } from '@/integrations/supabase/client';
import type { Task, TaskFilters, TaskPriority, TaskStatus } from '@/types/task';
import { taskCacheService } from './TaskCacheService';
import { taskAuditService, type AuditAction } from './TaskAuditService';

// Database row interface
interface TaskDBRow {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Database insert interface
interface TaskDBInsert {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  user_id?: string;
}

// Pagination interface
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: keyof Task;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Service error types
export class TaskServiceError extends Error {
  constructor(message: string, public code?: string, public originalError?: unknown) {
    super(message);
    this.name = 'TaskServiceError';
  }
}

// Rate limiting interface
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Main service implementation
class TaskService {
  private readonly tableName = 'tasks' as const;
  private rateLimitMap = new Map<string, RateLimitEntry>();
  private readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
  private readonly RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests por minuto

  /**
   * Verifica rate limiting por usuário
   */
  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userEntry = this.rateLimitMap.get(userId);

    if (!userEntry || now > userEntry.resetTime) {
      // Reset ou primeira tentativa
      this.rateLimitMap.set(userId, {
        count: 1,
        resetTime: now + this.RATE_LIMIT_WINDOW
      });
      return true;
    }

    if (userEntry.count >= this.RATE_LIMIT_MAX_REQUESTS) {
      return false; // Rate limit exceeded
    }

    userEntry.count++;
    return true;
  }

  /**
   * Wrapper para operações com audit, cache e performance tracking
   */
  private async executeWithTracking<T>(
    action: AuditAction,
    entityId: string,
    operation: () => Promise<T>,
    options: {
      userId?: string;
      cacheKey?: string;
      cacheParams?: any;
      changes?: { before?: Partial<Task>; after?: Partial<Task> };
      metadata?: any;
      invalidateCache?: boolean;
    } = {}
  ): Promise<T> {
    const startTime = Date.now();
    let result: T;
    let success = true;
    let error: string | undefined;

    try {
      // Rate limiting check
      if (options.userId && !this.checkRateLimit(options.userId)) {
        throw new TaskServiceError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED');
      }

      // Check cache first for read operations
      if (options.cacheKey && (action === 'READ' || action === 'READ_BY_USER')) {
        const cached = taskCacheService.get<T>(options.cacheKey, options.cacheParams);
        if (cached) {
          taskAuditService.logOperation(action, entityId, {
            userId: options.userId,
            metadata: { ...options.metadata, fromCache: true },
            duration: Date.now() - startTime,
            success: true
          });
          return cached;
        }
      }

      // Execute operation
      result = await operation();

      // Cache result for read operations
      if (options.cacheKey && (action === 'READ' || action === 'READ_BY_USER')) {
        taskCacheService.set(options.cacheKey, result, options.cacheParams);
      }

      // Invalidate cache for write operations
      if (options.invalidateCache) {
        if (action === 'CREATE' || action === 'UPDATE' || action === 'DELETE') {
          taskCacheService.invalidateTask(entityId);
        }
        if (options.userId) {
          taskCacheService.invalidateUser(options.userId);
        }
      }

      return result;
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      // Log operation
      taskAuditService.logOperation(action, entityId, {
        userId: options.userId,
        changes: options.changes,
        metadata: options.metadata,
        duration: Date.now() - startTime,
        success,
        error
      });
    }
  }

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    return this.executeWithTracking(
      'CREATE',
      'new_task',
      async () => {
        try {
          const insertData: TaskDBInsert = {
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            due_date: task.dueDate?.toISOString(),
            tags: task.tags,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: task.userId
          };

          const result = await supabase
            .from(this.tableName)
            .insert([insertData])
            .select()
            .single();

          if (result.error) {
            throw new TaskServiceError('Falha ao criar tarefa', 'CREATE_FAILED', result.error);
          }
          
          if (!result.data) {
            throw new TaskServiceError('Nenhum dado retornado do banco', 'NO_DATA');
          }
          
          return this.mapTaskFromDB(result.data as TaskDBRow);
        } catch (error) {
          if (error instanceof TaskServiceError) throw error;
          throw new TaskServiceError('Erro inesperado ao criar tarefa', 'UNEXPECTED_ERROR', error);
        }
      },
      {
        userId: task.userId,
        changes: { after: task },
        invalidateCache: true
      }
    );
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    // Get current task for audit trail
    const currentTask = await this.getTaskById(id);

    return this.executeWithTracking(
      'UPDATE',
      id,
      async () => {
        try {
          if (!id) {
            throw new TaskServiceError('ID da tarefa é obrigatório', 'INVALID_ID');
          }

          const updateData: Partial<TaskDBInsert> = {
            updated_at: new Date().toISOString()
          };

          // Only update fields that are provided
          if (updates.title !== undefined) updateData.title = updates.title;
          if (updates.description !== undefined) updateData.description = updates.description;
          if (updates.status !== undefined) updateData.status = updates.status;
          if (updates.priority !== undefined) updateData.priority = updates.priority;
          if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate?.toISOString();
          if (updates.tags !== undefined) updateData.tags = updates.tags;
          if (updates.userId !== undefined) updateData.user_id = updates.userId;

          const result = await supabase
            .from(this.tableName)
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

          if (result.error) {
            throw new TaskServiceError('Falha ao atualizar tarefa', 'UPDATE_FAILED', result.error);
          }
          
          if (!result.data) {
            throw new TaskServiceError('Tarefa não encontrada', 'NOT_FOUND');
          }
          
          return this.mapTaskFromDB(result.data as TaskDBRow);
        } catch (error) {
          if (error instanceof TaskServiceError) throw error;
          throw new TaskServiceError('Erro inesperado ao atualizar tarefa', 'UNEXPECTED_ERROR', error);
        }
      },
      {
        userId: updates.userId,
        changes: { before: currentTask, after: updates },
        invalidateCache: true
      }
    );
  }

  async deleteTask(id: string): Promise<void> {
    return this.executeWithTracking(
      'DELETE',
      id,
      async () => {
        try {
          if (!id) {
            throw new TaskServiceError('ID da tarefa é obrigatório', 'INVALID_ID');
          }

          const result = await supabase
            .from(this.tableName)
            .delete()
            .eq('id', id);

          if (result.error) {
            throw new TaskServiceError('Falha ao deletar tarefa', 'DELETE_FAILED', result.error);
          }
        } catch (error) {
          if (error instanceof TaskServiceError) throw error;
          throw new TaskServiceError('Erro inesperado ao deletar tarefa', 'UNEXPECTED_ERROR', error);
        }
      },
      {
        invalidateCache: true
      }
    );
  }

  async getTasks(filters?: TaskFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Task>> {
    const cacheKey = 'getTasks';
    const cacheParams = { filters, pagination };

    return this.executeWithTracking(
      'READ',
      'tasks_list',
      async () => {
        try {
          const page = pagination?.page || 1;
          const limit = pagination?.limit || 50;
          const offset = (page - 1) * limit;

          // Base query
          let query = supabase
            .from(this.tableName)
            .select('*', { count: 'exact' });

          // Apply filters
          if (filters?.status) {
            query = query.eq('status', filters.status);
          }

          if (filters?.priority) {
            query = query.eq('priority', filters.priority);
          }

          if (filters?.tags?.length) {
            query = query.contains('tags', filters.tags);
          }

          if (filters?.search) {
            const searchTerm = filters.search.trim();
            if (searchTerm) {
              query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
            }
          }

          if (filters?.dueDate) {
            const startOfDay = new Date(filters.dueDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(filters.dueDate);
            endOfDay.setHours(23, 59, 59, 999);

            query = query
              .gte('due_date', startOfDay.toISOString())
              .lte('due_date', endOfDay.toISOString());
          }

          // Apply sorting
          const sortBy = pagination?.sortBy || 'created_at';
          const sortOrder = pagination?.sortOrder || 'desc';
          query = query.order(sortBy as string, { ascending: sortOrder === 'asc' });

          // Apply pagination
          query = query.range(offset, offset + limit - 1);

          const result = await query;

          if (result.error) {
            throw new TaskServiceError('Falha ao buscar tarefas', 'FETCH_FAILED', result.error);
          }
          
          const data = result.data ? result.data.map((row) => this.mapTaskFromDB(row as TaskDBRow)) : [];
          const total = result.count || 0;
          const totalPages = Math.ceil(total / limit);

          return {
            data,
            pagination: {
              page,
              limit,
              total,
              totalPages,
              hasNext: page < totalPages,
              hasPrev: page > 1
            }
          };
        } catch (error) {
          if (error instanceof TaskServiceError) throw error;
          throw new TaskServiceError('Erro inesperado ao buscar tarefas', 'UNEXPECTED_ERROR', error);
        }
      },
      {
        cacheKey,
        cacheParams,
        metadata: { filters, pagination }
      }
    );
  }

  async getTaskById(id: string): Promise<Task> {
    const cacheKey = 'getById';
    const cacheParams = { id };

    return this.executeWithTracking(
      'READ',
      id,
      async () => {
        try {
          if (!id) {
            throw new TaskServiceError('ID da tarefa é obrigatório', 'INVALID_ID');
          }

          const result = await supabase
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .single();

          if (result.error) {
            throw new TaskServiceError('Falha ao buscar tarefa', 'FETCH_FAILED', result.error);
          }
          
          if (!result.data) {
            throw new TaskServiceError('Tarefa não encontrada', 'NOT_FOUND');
          }
          
          return this.mapTaskFromDB(result.data as TaskDBRow);
        } catch (error) {
          if (error instanceof TaskServiceError) throw error;
          throw new TaskServiceError('Erro inesperado ao buscar tarefa', 'UNEXPECTED_ERROR', error);
        }
      },
      {
        cacheKey,
        cacheParams
      }
    );
  }

  async getTasksByUser(userId: string, pagination?: PaginationOptions): Promise<PaginatedResult<Task>> {
    const cacheKey = 'getTasksByUser';
    const cacheParams = { userId, pagination };

    return this.executeWithTracking(
      'READ_BY_USER',
      `user_${userId}`,
      async () => {
        try {
          if (!userId) {
            throw new TaskServiceError('ID do usuário é obrigatório', 'INVALID_USER_ID');
          }

          const page = pagination?.page || 1;
          const limit = pagination?.limit || 50;
          const offset = (page - 1) * limit;

          let query = supabase
            .from(this.tableName)
            .select('*', { count: 'exact' })
            .eq('user_id', userId);

          // Apply sorting
          const sortBy = pagination?.sortBy || 'created_at';
          const sortOrder = pagination?.sortOrder || 'desc';
          query = query.order(sortBy as string, { ascending: sortOrder === 'asc' });

          // Apply pagination
          query = query.range(offset, offset + limit - 1);

          const result = await query;

          if (result.error) {
            throw new TaskServiceError('Falha ao buscar tarefas do usuário', 'FETCH_FAILED', result.error);
          }

          const data = result.data ? result.data.map((row) => this.mapTaskFromDB(row as TaskDBRow)) : [];
          const total = result.count || 0;
          const totalPages = Math.ceil(total / limit);

          return {
            data,
            pagination: {
              page,
              limit,
              total,
              totalPages,
              hasNext: page < totalPages,
              hasPrev: page > 1
            }
          };
        } catch (error) {
          if (error instanceof TaskServiceError) throw error;
          throw new TaskServiceError('Erro inesperado ao buscar tarefas do usuário', 'UNEXPECTED_ERROR', error);
        }
      },
      {
        userId,
        cacheKey,
        cacheParams
      }
    );
  }

  async bulkUpdateTasks(updates: Array<{ id: string; updates: Partial<Task> }>): Promise<Task[]> {
    return this.executeWithTracking(
      'BULK_UPDATE',
      `bulk_${updates.length}`,
      async () => {
        try {
          if (!updates.length) {
            throw new TaskServiceError('Lista de atualizações não pode estar vazia', 'EMPTY_UPDATES');
          }

          const promises = updates.map(({ id, updates: taskUpdates }) => 
            this.updateTask(id, taskUpdates)
          );

          return Promise.all(promises);
        } catch (error) {
          if (error instanceof TaskServiceError) throw error;
          throw new TaskServiceError('Erro inesperado na atualização em lote', 'UNEXPECTED_ERROR', error);
        }
      },
      {
        metadata: { bulkCount: updates.length },
        invalidateCache: true
      }
    );
  }

  /**
   * Métodos utilitários para cache e audit
   */
  getCacheStats() {
    return taskCacheService.getStats();
  }

  getAuditStats(timeRange?: { start: Date; end: Date }) {
    return taskAuditService.getAuditStats(timeRange);
  }

  getTaskHistory(taskId: string) {
    return taskAuditService.getTaskHistory(taskId);
  }

  getUserActivity(userId: string, limit = 50) {
    return taskAuditService.getUserActivity(userId, limit);
  }

  detectSuspiciousActivity() {
    return taskAuditService.detectSuspiciousActivity();
  }

  clearCache() {
    taskCacheService.clear();
  }

  exportAuditLog(format: 'json' | 'csv' = 'json') {
    return taskAuditService.exportAuditLog(format);
  }

  private mapTaskFromDB(data: TaskDBRow): Task {
    return {
      id: data.id,
      title: data.title,
      description: data.description ?? undefined,
      status: data.status,
      priority: data.priority,
      dueDate: data.due_date ? new Date(data.due_date) : undefined,
      tags: data.tags ?? [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      userId: data.user_id
    };
  }
}

// Export singleton instance
export const taskService = new TaskService(); 