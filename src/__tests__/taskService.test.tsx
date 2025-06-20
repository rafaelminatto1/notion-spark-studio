import { taskService, TaskServiceError } from '@/services/taskService';
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

  describe('createTask', () => {
    it('deve criar uma nova tarefa com sucesso', async () => {
      mockSupabaseQuery.single.mockResolvedValue({
        data: mockTaskDBRow,
        error: null
      });

      const taskData = {
        title: 'Nova Task',
        description: 'Nova descrição',
        status: 'todo' as const,
        priority: 'medium' as const,
        tags: ['nova'],
        userId: 'user1'
      };

      const result = await taskService.createTask(taskData);

      expect(result).toEqual(expect.objectContaining({
        title: 'Teste Task',
        description: 'Descrição de teste',
        status: 'todo',
        priority: 'high'
      }));
    });

    it('deve lançar erro quando falha na criação', async () => {
      mockSupabaseQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Erro do banco' }
      });

      const taskData = {
        title: 'Nova Task',
        description: 'Nova descrição',
        status: 'todo' as const,
        priority: 'medium' as const,
        tags: ['nova'],
        userId: 'user1'
      };

      await expect(taskService.createTask(taskData)).rejects.toThrow(TaskServiceError);
    });
  });

  describe('updateTask', () => {
    it('deve atualizar uma tarefa com sucesso', async () => {
      // Mock para getTaskById (busca atual)
      mockSupabaseQuery.single
        .mockResolvedValueOnce({
          data: mockTaskDBRow,
          error: null
        })
        // Mock para update
        .mockResolvedValueOnce({
          data: { ...mockTaskDBRow, title: 'Task Atualizada' },
          error: null
        });

      const updates = { title: 'Task Atualizada' };
      const result = await taskService.updateTask('1', updates);

      expect(result.title).toBe('Task Atualizada');
    });

    it('deve lançar erro para ID inválido', async () => {
      await expect(taskService.updateTask('', {})).rejects.toThrow(TaskServiceError);
    });
  });

  describe('deleteTask', () => {
    it('deve deletar uma tarefa com sucesso', async () => {
      mockSupabaseQuery.delete.mockResolvedValue({
        error: null
      });

      await expect(taskService.deleteTask('1')).resolves.toBeUndefined();
    });

    it('deve lançar erro para ID inválido', async () => {
      await expect(taskService.deleteTask('')).rejects.toThrow(TaskServiceError);
    });
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

  describe('getTaskById', () => {
    it('deve buscar tarefa por ID com sucesso', async () => {
      mockSupabaseQuery.single.mockResolvedValue({
        data: mockTaskDBRow,
        error: null
      });

      const result = await taskService.getTaskById('1');

      expect(result.id).toBe('1');
      expect(result.title).toBe('Teste Task');
    });

    it('deve lançar erro quando tarefa não é encontrada', async () => {
      mockSupabaseQuery.single.mockResolvedValue({
        data: null,
        error: null
      });

      await expect(taskService.getTaskById('1')).rejects.toThrow(TaskServiceError);
    });

    it('deve lançar erro quando há falha na busca', async () => {
      mockSupabaseQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Erro do banco' }
      });

      await expect(taskService.getTaskById('1')).rejects.toThrow(TaskServiceError);
    });

    it('deve lançar erro para ID inválido', async () => {
      await expect(taskService.getTaskById('')).rejects.toThrow(TaskServiceError);
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
    it('deve retornar estatísticas do cache', () => {
      const stats = taskService.getCacheStats();
      expect(stats).toEqual({
        hits: 0,
        misses: 0,
        size: 0,
        hitRate: 0
      });
    });

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