import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '@/services/TaskService';
import type { Task, TaskFilters } from '@/types/task';
import { useToast } from '@/hooks/use-toast';

export function useTasks(initialFilters?: TaskFilters) {
  const [filters, setFilters] = useState<TaskFilters>(initialFilters || {});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tasksResult, isLoading, error } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => taskService.getTasks(filters),
  });

  const tasks = tasksResult?.data || [];

  const createTask = useMutation({
    mutationFn: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => 
      taskService.createTask(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: "Tarefa criada",
        description: "Tarefa criada com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar tarefa",
        variant: "destructive",
      });
    },
  });

  const updateTask = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) => 
      taskService.updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: "Tarefa atualizada",
        description: "Tarefa atualizada com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar tarefa",
        variant: "destructive",
      });
    },
  });

  const deleteTask = useMutation({
    mutationFn: (id: string) => taskService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: "Tarefa removida",
        description: "Tarefa removida com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro", 
        description: "Erro ao remover tarefa",
        variant: "destructive",
      });
    },
  });

  const updateFilters = useCallback((newFilters: Partial<TaskFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  return {
    tasks,
    isLoading,
    error,
    filters,
    updateFilters,
    createTask: createTask.mutate,
    updateTask: updateTask.mutate,
    deleteTask: deleteTask.mutate,
    isCreating: createTask.isPending,
    isUpdating: updateTask.isPending,
    isDeleting: deleteTask.isPending,
  };
} 