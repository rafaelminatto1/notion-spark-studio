import { useState, useEffect, useCallback, useMemo } from 'react';
import { taskService, type PaginationOptions, type PaginatedResult } from '@/services/taskService';
import type { Task, TaskFilters } from '@/types/task';

interface UseTaskServiceOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableCache?: boolean;
}

interface UseTaskServiceReturn {
  // Data state
  tasks: Task[];
  loading: boolean;
  error: string | null;
  pagination: PaginatedResult<Task>['pagination'] | null;
  
  // Operations
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
  
  // Advanced operations
  bulkUpdateTasks: (updates: Array<{ id: string; updates: Partial<Task> }>) => Promise<Task[]>;
  
  // Utility functions
  getCacheStats: () => ReturnType<typeof taskService.getCacheStats>;
  getAuditStats: (timeRange?: { start: Date; end: Date }) => ReturnType<typeof taskService.getAuditStats>;
  getTaskHistory: (taskId: string) => ReturnType<typeof taskService.getTaskHistory>;
  clearCache: () => void;
  
  // State management
  setFilters: (filters: TaskFilters) => void;
  setPagination: (pagination: PaginationOptions) => void;
  filters: TaskFilters;
  paginationOptions: PaginationOptions;
}

export const useTaskService = (
  initialFilters?: TaskFilters,
  initialPagination?: PaginationOptions,
  options: UseTaskServiceOptions = {}
): UseTaskServiceReturn => {
  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    enableCache = true
  } = options;

  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPaginationState] = useState<PaginatedResult<Task>['pagination'] | null>(null);
  const [filters, setFilters] = useState<TaskFilters>(initialFilters || {});
  const [paginationOptions, setPaginationOptions] = useState<PaginationOptions>(initialPagination || {
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Memoized fetch function
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await taskService.getTasks(filters, paginationOptions);
      setTasks(result.data);
      setPaginationState(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar tarefas';
      setError(errorMessage);
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, paginationOptions]);

  // Auto refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchTasks();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchTasks]);

  // Initial fetch
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Operations with optimistic updates
  const createTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
    try {
      setError(null);
      const newTask = await taskService.createTask(taskData);
      
      // Optimistic update - add to beginning of list if it matches current filters
      const shouldAddToList = (
        (!filters.status || newTask.status === filters.status) &&
        (!filters.priority || newTask.priority === filters.priority) &&
        (!filters.tags?.length || filters.tags.some(tag => newTask.tags.includes(tag)))
      );

      if (shouldAddToList && pagination?.page === 1) {
        setTasks(prev => [newTask, ...prev.slice(0, (paginationOptions.limit || 20) - 1)]);
      }
      
      return newTask;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar tarefa';
      setError(errorMessage);
      throw err;
    }
  }, [filters, pagination, paginationOptions]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>): Promise<Task> => {
    try {
      setError(null);
      const updatedTask = await taskService.updateTask(id, updates);
      
      // Optimistic update
      setTasks(prev => prev.map(task => 
        task.id === id ? updatedTask : task
      ));
      
      return updatedTask;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar tarefa';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await taskService.deleteTask(id);
      
      // Optimistic update
      setTasks(prev => prev.filter(task => task.id !== id));
      
      // Update pagination count
      if (pagination) {
        setPaginationState(prev => prev ? {
          ...prev,
          total: prev.total - 1
        } : null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar tarefa';
      setError(errorMessage);
      throw err;
    }
  }, [pagination]);

  const bulkUpdateTasks = useCallback(async (updates: Array<{ id: string; updates: Partial<Task> }>): Promise<Task[]> => {
    try {
      setError(null);
      const updatedTasks = await taskService.bulkUpdateTasks(updates);
      
      // Optimistic update
      const updatedTasksMap = new Map(updatedTasks.map(task => [task.id, task]));
      setTasks(prev => prev.map(task => 
        updatedTasksMap.has(task.id) ? updatedTasksMap.get(task.id)! : task
      ));
      
      return updatedTasks;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na atualização em lote';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Utility functions
  const getCacheStats = useCallback(() => {
    return taskService.getCacheStats();
  }, []);

  const getAuditStats = useCallback((timeRange?: { start: Date; end: Date }) => {
    return taskService.getAuditStats(timeRange);
  }, []);

  const getTaskHistory = useCallback((taskId: string) => {
    return taskService.getTaskHistory(taskId);
  }, []);

  const clearCache = useCallback(() => {
    if (!enableCache) return;
    taskService.clearCache();
    fetchTasks(); // Refresh after clearing cache
  }, [enableCache, fetchTasks]);

  // State setters with auto-refresh
  const setFiltersAndRefresh = useCallback((newFilters: TaskFilters) => {
    setFilters(newFilters);
    setPaginationOptions(prev => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  const setPaginationAndRefresh = useCallback((newPagination: PaginationOptions) => {
    setPaginationOptions(prev => ({ ...prev, ...newPagination }));
  }, []);

  // Refresh function
  const refreshTasks = useCallback(async () => {
    await fetchTasks();
  }, [fetchTasks]);

  // Memoized return value
  return useMemo(() => ({
    // Data state
    tasks,
    loading,
    error,
    pagination,
    
    // Operations
    createTask,
    updateTask,
    deleteTask,
    refreshTasks,
    
    // Advanced operations
    bulkUpdateTasks,
    
    // Utility functions
    getCacheStats,
    getAuditStats,
    getTaskHistory,
    clearCache,
    
    // State management
    setFilters: setFiltersAndRefresh,
    setPagination: setPaginationAndRefresh,
    filters,
    paginationOptions
  }), [
    tasks,
    loading,
    error,
    pagination,
    createTask,
    updateTask,
    deleteTask,
    refreshTasks,
    bulkUpdateTasks,
    getCacheStats,
    getAuditStats,
    getTaskHistory,
    clearCache,
    setFiltersAndRefresh,
    setPaginationAndRefresh,
    filters,
    paginationOptions
  ]);
};

// Hook especializado para tarefas de um usuário específico
export const useUserTasks = (
  userId: string,
  initialPagination?: PaginationOptions,
  options: UseTaskServiceOptions = {}
) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPaginationState] = useState<PaginatedResult<Task>['pagination'] | null>(null);
  const [paginationOptions, setPaginationOptions] = useState<PaginationOptions>(initialPagination || {
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const fetchUserTasks = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await taskService.getTasksByUser(userId, paginationOptions);
      setTasks(result.data);
      setPaginationState(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar tarefas do usuário';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId, paginationOptions]);

  useEffect(() => {
    fetchUserTasks();
  }, [fetchUserTasks]);

  const setPagination = useCallback((newPagination: PaginationOptions) => {
    setPaginationOptions(prev => ({ ...prev, ...newPagination }));
  }, []);

  return {
    tasks,
    loading,
    error,
    pagination,
    refreshTasks: fetchUserTasks,
    setPagination,
    paginationOptions
  };
};

// Hook para estatísticas e monitoramento
export const useTaskServiceStats = () => {
  const [cacheStats, setCacheStats] = useState(taskService.getCacheStats());
  const [auditStats, setAuditStats] = useState(taskService.getAuditStats());

  const refreshStats = useCallback(() => {
    setCacheStats(taskService.getCacheStats());
    setAuditStats(taskService.getAuditStats());
  }, []);

  // Auto refresh stats every 10 seconds
  useEffect(() => {
    const interval = setInterval(refreshStats, 10000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  const detectSuspiciousActivity = useCallback(() => {
    return taskService.detectSuspiciousActivity();
  }, []);

  const getUserActivity = useCallback((userId: string, limit = 50) => {
    return taskService.getUserActivity(userId, limit);
  }, []);

  const exportAuditLog = useCallback((format: 'json' | 'csv' = 'json') => {
    return taskService.exportAuditLog(format);
  }, []);

  return {
    cacheStats,
    auditStats,
    refreshStats,
    detectSuspiciousActivity,
    getUserActivity,
    exportAuditLog
  };
}; 