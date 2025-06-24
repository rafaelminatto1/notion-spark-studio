// Import the real TaskService for testing
import { taskService, TaskServiceError } from '../services/TaskService';
import type { Task, TaskFilters } from '@/types/task';

// Mock do Supabase
const mockSupabaseQuery = {
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
  contains: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis() // Adicionado para paginação
};

// Mock dos novos serviços
jest.mock('@/services/TaskCacheService', () => ({
  taskCacheService: {
    get: jest.fn(() => null), // Sempre miss no cache por padrão
    set: jest.fn(),
    invalidateTask: jest.fn(),
    invalidateUser: jest.fn(),
    clear: jest.fn(),
    getStats: jest.fn(() => ({
      hits: 0,
      misses: 0,
      size: 0,
      hitRate: 0
    }))
  }
}));

jest.mock('@/services/TaskAuditService', () => ({
  taskAuditService: {
    logOperation: jest.fn(),
    getAuditStats: jest.fn(() => ({
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
    })),
    getTaskHistory: jest.fn(() => []),
    getUserActivity: jest.fn(() => []),
    detectSuspiciousActivity: jest.fn(() => ({
      rapidOperations: [],
      frequentErrors: [],
      unusualPatterns: []
    })),
    exportAuditLog: jest.fn(() => '[]')
  }
}));

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => mockSupabaseQuery)
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

  const mockTaskDBRow = {
    id: '1',
    title: 'Teste Task',
    description: 'Descrição de teste',
    status: 'todo',
    priority: 'high',
    due_date: null,
    tags: ['test'],
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    user_id: 'user1'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all mocks to return this for chaining
    Object.values(mockSupabaseQuery).forEach(mock => {
      if (jest.isMockFunction(mock)) {
        mock.mockReturnThis();
      }
    });
    
    // Configurar métodos que podem ser chamados diretamente 
    mockSupabaseQuery.single.mockReturnThis();
    mockSupabaseQuery.order.mockReturnThis();
    mockSupabaseQuery.eq.mockReturnThis();
    mockSupabaseQuery.contains.mockReturnThis();
    mockSupabaseQuery.or.mockReturnThis();
    mockSupabaseQuery.gte.mockReturnThis();
    mockSupabaseQuery.lte.mockReturnThis();
    mockSupabaseQuery.range.mockReturnThis();
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

  it('should update task successfully', async () => {
    const result = await taskService.updateTask('1', { title: 'Updated Task' });
    expect(result).toBeDefined();
  });

  it('should delete task successfully', async () => {
    await expect(taskService.deleteTask('1')).resolves.toBeUndefined();
  });

  it('should get tasks successfully', async () => {
    const result = await taskService.getTasks();
    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
  });

  it('should get task by id successfully', async () => {
    const result = await taskService.getTaskById('1');
    expect(result).toBeDefined();
  });

  it('should return cache stats', () => {
    const stats = taskService.getCacheStats();
    expect(stats).toBeDefined();
  });

  describe('getTasks', () => {
    it('deve buscar tarefas sem filtros', async () => {
      // Mock com count para paginação
      mockSupabaseQuery.range.mockResolvedValue({
        data: [mockTaskDBRow],
        error: null,
        count: 1
      });

      const result = await taskService.getTasks();

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
    });

    it('deve aplicar filtros corretamente', async () => {
      // Mock com count para paginação
      mockSupabaseQuery.range.mockResolvedValue({
        data: [mockTaskDBRow],
        error: null,
        count: 1
      });

      const filters: TaskFilters = {
        status: 'todo',
        priority: 'high',
        search: 'test'
      };

      const result = await taskService.getTasks(filters);

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('deve lidar com pesquisa vazia', async () => {
      mockSupabaseQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      });

      const filters: TaskFilters = { search: '' };
      const result = await taskService.getTasks(filters);

      expect(result.data).toHaveLength(0);
    });

    it('deve aplicar filtro de data corretamente', async () => {
      mockSupabaseQuery.range.mockResolvedValue({
        data: [mockTaskDBRow],
        error: null,
        count: 1
      });

      const filters: TaskFilters = {
        dueDate: new Date('2024-01-01')
      };

      const result = await taskService.getTasks(filters);
      expect(result.data).toHaveLength(1);
    });

    it('deve aplicar paginação corretamente', async () => {
      mockSupabaseQuery.range.mockResolvedValue({
        data: [mockTaskDBRow],
        error: null,
        count: 10
      });

      const pagination = { page: 2, limit: 5 };
      const result = await taskService.getTasks({}, pagination);

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(5);
      expect(result.pagination.total).toBe(10);
      expect(result.pagination.totalPages).toBe(2);
    });
  });

  describe('getTasksByUser', () => {
    it('deve buscar tarefas por usuário com sucesso', async () => {
      mockSupabaseQuery.range.mockResolvedValue({
        data: [mockTaskDBRow],
        error: null,
        count: 1
      });

      const result = await taskService.getTasksByUser('user1');

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('deve retornar resultado vazio quando não há dados', async () => {
      mockSupabaseQuery.range.mockResolvedValue({
        data: null,
        error: null,
        count: 0
      });

      const result = await taskService.getTasksByUser('user1');

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('deve lançar erro para ID de usuário inválido', async () => {
      await expect(taskService.getTasksByUser('')).rejects.toThrow(TaskServiceError);
    });

    it('deve aplicar paginação corretamente', async () => {
      mockSupabaseQuery.range.mockResolvedValue({
        data: [mockTaskDBRow],
        error: null,
        count: 20
      });

      const pagination = { page: 1, limit: 10 };
      const result = await taskService.getTasksByUser('user1', pagination);

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(20);
    });
  });

  describe('bulkUpdateTasks', () => {
    it('deve atualizar múltiplas tarefas', async () => {
      // Mock para cada getTaskById e updateTask
      mockSupabaseQuery.single
        .mockResolvedValue({
          data: mockTaskDBRow,
          error: null
        });

      const updates = [
        { id: '1', updates: { title: 'Título 1' } },
        { id: '2', updates: { title: 'Título 2' } }
      ];

      const result = await taskService.bulkUpdateTasks(updates);

      expect(result).toHaveLength(2);
    });

    it('deve lançar erro para lista vazia', async () => {
      await expect(taskService.bulkUpdateTasks([])).rejects.toThrow(TaskServiceError);
    });
  });

  describe('Métodos utilitários', () => {
    it('deve retornar estatísticas de auditoria', () => {
      const stats = taskService.getAuditStats();
      expect(stats.totalOperations).toBe(0);
    });

    it('deve retornar histórico de tarefa', () => {
      const history = taskService.getTaskHistory('1');
      expect(history).toEqual([]);
    });

    it('deve detectar atividade suspeita', () => {
      const suspicious = taskService.detectSuspiciousActivity();
      expect(suspicious.rapidOperations).toEqual([]);
    });
  });
}); 