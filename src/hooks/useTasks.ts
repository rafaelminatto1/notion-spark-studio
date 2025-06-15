import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { taskService } from '@/services/taskService';
import { Task, TaskFilters } from '@/types/task';
import { useToast } from '@/hooks/use-toast';

export function useTasks(initialFilters?: TaskFilters) {
  const [filters, setFilters] = useState<TaskFilters>(initialFilters || {});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tasks = [], isLoading, error } = useQuery(
    ['tasks', filters],
    () => taskService.getTasks(filters)
  );

  const createTaskMutation = useMutation(
    (newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => taskService.createTask(newTask),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks']);
        toast({
          title: 'Tarefa criada',
          description: 'Sua tarefa foi criada com sucesso!'
        });
      },
      onError: (error: Error) => {
        toast({
          title: 'Erro ao criar tarefa',
          description: error.message,
          variant: 'destructive'
        });
      }
    }
  );

  const updateTaskMutation = useMutation(
    ({ id, updates }: { id: string; updates: Partial<Task> }) => taskService.updateTask(id, updates),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks']);
        toast({
          title: 'Tarefa atualizada',
          description: 'Sua tarefa foi atualizada com sucesso!'
        });
      },
      onError: (error: Error) => {
        toast({
          title: 'Erro ao atualizar tarefa',
          description: error.message,
          variant: 'destructive'
        });
      }
    }
  );

  const deleteTaskMutation = useMutation(
    (id: string) => taskService.deleteTask(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks']);
        toast({
          title: 'Tarefa excluída',
          description: 'Sua tarefa foi excluída com sucesso!'
        });
      },
      onError: (error: Error) => {
        toast({
          title: 'Erro ao excluir tarefa',
          description: error.message,
          variant: 'destructive'
        });
      }
    }
  );

  const updateFilters = useCallback((newFilters: Partial<TaskFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  return {
    tasks,
    isLoading,
    error,
    filters,
    updateFilters,
    createTask: createTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    isCreating: createTaskMutation.isLoading,
    isUpdating: updateTaskMutation.isLoading,
    isDeleting: deleteTaskMutation.isLoading
  };
} 