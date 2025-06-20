import { TaskCacheService } from '@/services/TaskCacheService';
import type { Task } from '@/types/task';

describe('TaskCacheService', () => {
  let cacheService: TaskCacheService;

  beforeEach(() => {
    cacheService = new TaskCacheService();
  });

  const mockTask: Task = {
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    status: 'todo',
    priority: 'medium',
    tags: ['test'],
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'user1'
  };

  describe('Operações básicas de cache', () => {
    it('deve armazenar e recuperar dados do cache', () => {
      cacheService.set('getTasks', [mockTask], { filters: { status: 'todo' } });
      
      const cached = cacheService.get<Task[]>('getTasks', { filters: { status: 'todo' } });
      
      expect(cached).toEqual([mockTask]);
    });

    it('deve retornar null para chaves não encontradas', () => {
      const cached = cacheService.get('nonexistent');
      expect(cached).toBeNull();
    });

    it('deve retornar null para entradas expiradas', (done) => {
      cacheService.set('shortLived', mockTask, {}, 50); // 50ms TTL
      
      setTimeout(() => {
        const cached = cacheService.get('shortLived');
        expect(cached).toBeNull();
        done();
      }, 100);
    });
  });

  describe('Invalidação de cache', () => {
    beforeEach(() => {
      // Setup cache with multiple entries
      cacheService.set('getTasks', [mockTask], { filters: {} });
      cacheService.set('getTasksByUser', [mockTask], { userId: 'user1' });
      cacheService.set('getById', mockTask, { id: '1' });
    });

    it('deve invalidar cache relacionado a uma tarefa específica', () => {
      cacheService.invalidateTask('1');
      
      const getTasksCached = cacheService.get('getTasks', { filters: {} });
      const getByUserCached = cacheService.get('getTasksByUser', { userId: 'user1' });
      const getByIdCached = cacheService.get('getById', { id: '1' });
      
      expect(getTasksCached).toBeNull();
      expect(getByUserCached).toBeNull();
      expect(getByIdCached).toBeNull();
    });

    it('deve invalidar cache relacionado a um usuário', () => {
      cacheService.invalidateUser('user1');
      
      const getTasksCached = cacheService.get('getTasks', { filters: {} });
      const getByUserCached = cacheService.get('getTasksByUser', { userId: 'user1' });
      
      expect(getTasksCached).toBeNull();
      expect(getByUserCached).toBeNull();
    });

    it('deve limpar todo o cache', () => {
      cacheService.clear();
      
      const stats = cacheService.getStats();
      expect(stats.size).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('Estatísticas do cache', () => {
    it('deve rastrear hits e misses corretamente', () => {
      // Setup
      cacheService.set('test', mockTask);
      
      // Hit
      cacheService.get('test');
      
      // Miss
      cacheService.get('nonexistent');
      
      const stats = cacheService.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(50);
    });

    it('deve calcular hit rate corretamente', () => {
      cacheService.set('test', mockTask);
      
      // 3 hits
      cacheService.get('test');
      cacheService.get('test');
      cacheService.get('test');
      
      // 1 miss
      cacheService.get('nonexistent');
      
      const stats = cacheService.getStats();
      expect(stats.hitRate).toBe(75); // 3/4 = 75%
    });
  });

  describe('Gerenciamento de memória', () => {
    it('deve realizar manutenção e limpeza', () => {
      // Add entries that will expire
      cacheService.set('temp1', mockTask, {}, 1); // 1ms TTL
      cacheService.set('temp2', mockTask, {}, 1);
      cacheService.set('permanent', mockTask, {}, 60000); // 1 minute
      
      // Wait for expiration
      setTimeout(() => {
        cacheService.maintenance();
        
        const temp1 = cacheService.get('temp1');
        const temp2 = cacheService.get('temp2');
        const permanent = cacheService.get('permanent');
        
        expect(temp1).toBeNull();
        expect(temp2).toBeNull();
        expect(permanent).toEqual(mockTask);
      }, 10);
    });
  });

  describe('Geração de chaves de cache', () => {
    it('deve gerar chaves consistentes para os mesmos parâmetros', () => {
      const params1 = { filters: { status: 'todo' }, userId: 'user1' };
      const params2 = { userId: 'user1', filters: { status: 'todo' } }; // Ordem diferente
      
      cacheService.set('test', mockTask, params1);
      const cached = cacheService.get('test', params2);
      
      expect(cached).toEqual(mockTask);
    });

    it('deve gerar chaves diferentes para parâmetros diferentes', () => {
      const params1 = { filters: { status: 'todo' } };
      const params2 = { filters: { status: 'done' } };
      
      // Criar objetos completamente independentes
      const task1: Task = {
        id: '1',
        title: 'Test Task',
        description: 'Test Description',
        status: 'todo',
        priority: 'medium',
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user1'
      };
      
      const task2: Task = {
        id: '2',
        title: 'Test Task 2',
        description: 'Test Description 2',
        status: 'done',
        priority: 'high',
        tags: ['test', 'completed'],
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user1'
      };
      
      // Armazenar primeiro item
      cacheService.set('getTasks', task1, params1);
      
      // Verificar se o primeiro item foi armazenado corretamente
      const cached1Before = cacheService.get('getTasks', params1);
      expect(cached1Before?.status).toBe('todo');
      
      // Armazenar segundo item
      cacheService.set('getTasks', task2, params2);
      
      // Verificar se ambos os itens existem (chaves diferentes)
      const cached1 = cacheService.get<Task>('getTasks', params1);
      const cached2 = cacheService.get<Task>('getTasks', params2);
      
      expect(cached1).toBeDefined();
      expect(cached2).toBeDefined();
      expect(cached1?.status).toBe('todo');
      expect(cached2?.status).toBe('done');
    });
  });
}); 