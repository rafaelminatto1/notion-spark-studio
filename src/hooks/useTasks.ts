import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TaskService, Task } from '@/services/TaskService';
import type { Task, TaskFilters } from '@/types/task';
import { useToast } from '@/hooks/use-toast';

export function useTasks(initialFilters?: TaskFilters) {
  const [filters, setFilters] = useState<TaskFilters>(initialFilters || {});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: TaskService.list,
  });

  const createTask = useMutation({
    mutationFn: (title: string) => TaskService.create(title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const toggleTask = useMutation({
    mutationFn: (id: string) => TaskService.toggle(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const removeTask = useMutation({
    mutationFn: (id: string) => TaskService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
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
    createTask,
    toggleTask,
    removeTask,
  };
} 