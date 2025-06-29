
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { taskService, TaskServiceError } from '../services/TaskService';
import type { Task, TaskFilters } from '@/types/task';

// Mock do Supabase
const mockSupabaseQuery = {
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  contains: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis()
};

vi.mock('@/services/TaskCacheService', () => ({
  taskCacheService: {
    get: vi.fn(() => null),
    set: vi.fn(),
    invalidateTask: vi.fn(),
    invalidateUser: vi.fn(),
    clear: vi.fn(),
    getStats: vi.fn(() => ({
      hits: 0,
      misses: 0,
      size: 0,
      hitRate: 0
    }))
  }
}));

vi.mock('@/services/TaskAuditService', () => ({
  taskAuditService: {
    logOperation: vi.fn(),
    getAuditStats: vi.fn(() => ({
      totalOperations: 0,
      operationsByAction: {
        CREATE: 0,
        UPDATE: 0,
        DELETE: 0,
        READ: 0,
        BULK_UPDATE: 0,
        READ_BY_USER: 0
      },
      averageDuration: 0,
      successRate: 100,
      recentOperations: []
    }))
  }
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => mockSupabaseQuery)
  }
}));

describe('TaskService', () => {
  const mockTask: Task = {
    id: '1',
    title: 'Teste Task',
    description: 'Descrição de teste',
    status: 'todo',
    priority: 'high',
    dueDate: undefined,
    tags: ['test'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    userId: 'user1'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.values(mockSupabaseQuery).forEach(mock => {
      if (vi.isMockFunction(mock)) {
        mock.mockReturnThis();
      }
    });
  });

  it('should create task successfully', async () => {
    const result = await taskService.createTask({
      title: 'Test Task',
      description: 'Test Description',
      status: 'todo',
      priority: 'medium',
      tags: [],
      userId: 'user1'
    });
    
    expect(result).toBeDefined();
    expect(result.id).toBe('1');
  });

  it('should get tasks successfully', async () => {
    mockSupabaseQuery.range.mockResolvedValue({
      data: [mockTask],
      error: null,
      count: 1
    });

    const result = await taskService.getTasks();
    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
  });
});
