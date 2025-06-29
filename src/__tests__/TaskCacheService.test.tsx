
import { describe, it, expect, beforeEach } from 'vitest';
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
      expect(cached).toBe(null);
    });
  });

  describe('Invalidação de cache', () => {
    it('deve invalidar cache relacionado a uma tarefa específica', () => {
      cacheService.set('getTasks', [mockTask], { filters: {} });
      cacheService.invalidateTask('1');
      
      const cached = cacheService.get('getTasks', { filters: {} });
      expect(cached).toBe(null);
    });

    it('deve limpar todo o cache', () => {
      cacheService.set('test', mockTask);
      cacheService.clear();
      
      const stats = cacheService.getStats();
      expect(stats.size).toBe(0);
    });
  });
});
